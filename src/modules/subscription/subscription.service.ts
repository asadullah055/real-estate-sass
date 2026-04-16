import Stripe from 'stripe';
import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { SubscriptionRepository } from './subscription.repository.js';
import type { SubscriptionDto, PaymentHistoryItem, CheckoutSessionDto, BillingPortalDto } from './subscription.dto.js';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../config/logger.js';
import type { ISubscription } from './subscription.model.js';

type StripeClient = any;
type StripePaymentMethod = Awaited<ReturnType<StripeClient['paymentMethods']['retrieve']>>;
type StripeInvoiceList = Awaited<ReturnType<StripeClient['invoices']['list']>>;
type StripeWebhookEvent = ReturnType<StripeClient['webhooks']['constructEvent']>;
type StripeSubscriptionLike = {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  customer?: string | { id?: string } | null;
  items?: { data?: Array<{ current_period_end?: number }> };
  current_period_end?: number;
};
type StripeInvoiceLike = {
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
  parent?: { subscription_details?: { subscription?: string | null } | null } | null;
};
type StripeCheckoutSessionLike = {
  id: string;
  mode?: string | null;
  subscription?: string | { id?: string } | null;
  metadata?: Record<string, string> | null;
  customer?: string | { id?: string } | null;
};

function getStripe(): StripeClient {
  const stripeFactory = Stripe as unknown as (
    key: string,
    config?: Record<string, unknown>,
  ) => StripeClient;
  return stripeFactory(env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' });
}

function throwStripeAppError(error: unknown): never {
  if (typeof error === 'object' && error !== null) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      throw new AppError(message, 400);
    }
  }
  if (error instanceof Error) {
    throw new AppError(error.message, 502);
  }
  throw new AppError('Stripe request failed', 502);
}

async function runStripe(action: () => Promise<any>): Promise<any> {
  try {
    return await action();
  } catch (error) {
    throwStripeAppError(error);
  }
}

/**
 * Accepts either:
 * 1) Stripe Price ID (price_...) - preferred
 * 2) Stripe Product ID (prod_...) - resolves to a recurring price
 */
async function resolveProPriceId(stripe: StripeClient): Promise<string> {
  const configured = env.STRIPE_PRO_PRICE_ID.trim();

  if (configured.startsWith('price_')) {
    return configured;
  }

  if (!configured.startsWith('prod_')) {
    throw new AppError(
      'Invalid STRIPE_PRO_PRICE_ID. Use a Stripe Price ID (price_...) or Product ID (prod_...).',
      400,
    );
  }

  const product = await runStripe(() =>
    stripe.products.retrieve(configured, { expand: ['default_price'] }),
  );

  const defaultPriceId =
    typeof product.default_price === 'string'
      ? product.default_price
      : product.default_price?.id;

  if (defaultPriceId) {
    return defaultPriceId;
  }

  const recurringPrices = await runStripe(() =>
    stripe.prices.list({
      product: configured,
      active: true,
      type: 'recurring',
      limit: 1,
    }),
  );

  const fallbackPriceId = recurringPrices.data[0]?.id;
  if (fallbackPriceId) {
    return fallbackPriceId;
  }

  throw new AppError(
    'No active recurring Stripe price found for STRIPE_PRO_PRICE_ID product.',
    400,
  );
}

function toValidDateFromUnixSeconds(value: unknown): Date | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getStripeSubscriptionPeriodEnd(sub: StripeSubscriptionLike): number | undefined {
  const itemPeriodEnd = sub.items?.data?.find((item) => typeof item.current_period_end === 'number')?.current_period_end;
  if (typeof itemPeriodEnd === 'number') return itemPeriodEnd;

  const legacyPeriodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  if (typeof legacyPeriodEnd === 'number') return legacyPeriodEnd;

  return undefined;
}

function getInvoiceSubscriptionId(invoice: StripeInvoiceLike): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id?: string } | null }).subscription;
  if (typeof legacy === 'string') return legacy;
  if (legacy && typeof legacy === 'object' && typeof legacy.id === 'string') return legacy.id;

  const fromParent = (invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string | null } | null } | null;
  }).parent?.subscription_details?.subscription;

  return typeof fromParent === 'string' ? fromParent : null;
}

async function resolveSubscriptionIdByCustomer(
  stripe: StripeClient,
  stripeCustomerId: string,
): Promise<string | null> {
  const stripeSubs = await runStripe(() =>
    stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      limit: 10,
    }),
  );

  if (!stripeSubs.data.length) return null;

  const preferred =
    stripeSubs.data.find((s: StripeSubscriptionLike) => s.status === 'active')
    ?? stripeSubs.data.find((s: StripeSubscriptionLike) => s.status === 'trialing')
    ?? stripeSubs.data.find((s: StripeSubscriptionLike) => s.status === 'past_due')
    ?? stripeSubs.data[0];

  return preferred?.id ?? null;
}

async function getBillingSnapshot(sub: ISubscription): Promise<{
  hasPaymentMethod: boolean;
  billingEmail: string | null;
  paymentMethod: SubscriptionDto['paymentMethod'];
}> {
  if (!sub.stripeCustomerId) {
    return {
      hasPaymentMethod: false,
      billingEmail: null,
      paymentMethod: null,
    };
  }

  try {
    const stripe = getStripe();
    const customer = await runStripe(() =>
      stripe.customers.retrieve(sub.stripeCustomerId!, {
        expand: ['invoice_settings.default_payment_method'],
      }),
    );

    if (typeof customer === 'string' || customer.deleted) {
      return {
        hasPaymentMethod: false,
        billingEmail: null,
        paymentMethod: null,
      };
    }

    const billingEmail = customer.email ?? null;

    let paymentMethod: StripePaymentMethod | null = null;
    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
    if (defaultPaymentMethod) {
      if (typeof defaultPaymentMethod === 'string') {
        paymentMethod = await runStripe(() => stripe.paymentMethods.retrieve(defaultPaymentMethod));
      } else {
        paymentMethod = defaultPaymentMethod as StripePaymentMethod;
      }
    }

    if (!paymentMethod?.card) {
      return {
        hasPaymentMethod: false,
        billingEmail,
        paymentMethod: null,
      };
    }

    return {
      hasPaymentMethod: true,
      billingEmail,
      paymentMethod: {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      },
    };
  } catch (error) {
    logger.warn('Failed to fetch billing snapshot from Stripe', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stripeCustomerId: sub.stripeCustomerId,
    });
    return {
      hasPaymentMethod: false,
      billingEmail: null,
      paymentMethod: null,
    };
  }
}

async function reconcileFromStripeIfNeeded(sub: ISubscription): Promise<ISubscription> {
  // Nothing to reconcile if no Stripe customer exists yet.
  if (!sub.stripeCustomerId) return sub;

  // Already in a Pro state; trust local DB to avoid unnecessary Stripe calls.
  if (sub.plan === 'pro' && (sub.status === 'active' || sub.status === 'past_due')) {
    return sub;
  }

  const stripe = getStripe();
  const stripeSubs = await runStripe(() =>
    stripe.subscriptions.list({
      customer: sub.stripeCustomerId!,
      status: 'all',
      limit: 10,
    }),
  );

  if (!stripeSubs.data.length) return sub;

  const preferred =
    stripeSubs.data.find((s: StripeSubscriptionLike) => s.status === 'active')
    ?? stripeSubs.data.find((s: StripeSubscriptionLike) => s.status === 'trialing')
    ?? stripeSubs.data.find((s: StripeSubscriptionLike) => s.status === 'past_due')
    ?? stripeSubs.data[0];

  const nextStatus = mapStripeStatus(preferred.status);
  const nextPlan: 'free_trial' | 'pro' = 'pro';
  const nextPeriodEnd = toValidDateFromUnixSeconds(getStripeSubscriptionPeriodEnd(preferred));
  const nextCancelAtPeriodEnd = preferred.cancel_at_period_end;
  const nextPeriodEndMs = nextPeriodEnd?.getTime() ?? null;
  const currentPeriodEndMs = sub.currentPeriodEnd?.getTime() ?? null;

  const needsUpdate =
    sub.stripeSubscriptionId !== preferred.id
    || sub.plan !== nextPlan
    || sub.status !== nextStatus
    || sub.cancelAtPeriodEnd !== nextCancelAtPeriodEnd
    || currentPeriodEndMs !== nextPeriodEndMs;

  if (!needsUpdate) return sub;

  const updates: {
    stripeSubscriptionId: string;
    plan: 'pro';
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd?: Date;
  } = {
    stripeSubscriptionId: preferred.id,
    plan: nextPlan,
    status: nextStatus,
    cancelAtPeriodEnd: nextCancelAtPeriodEnd,
  };

  if (nextPeriodEnd) {
    updates.currentPeriodEnd = nextPeriodEnd;
  }

  const updated = await SubscriptionRepository.updateByUserId(sub.userId, updates);

  return updated ?? sub;
}

/** Days for the free trial period. */
const TRIAL_DAYS = 30;

export const SubscriptionService = {
  /** Get or lazy-create a subscription for the given user. */
  async getOrCreate(userId: Types.ObjectId): Promise<SubscriptionDto> {
    let sub = await SubscriptionRepository.findByUserId(userId);

    if (!sub) {
      const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      sub = await SubscriptionRepository.create({
        userId,
        plan: 'free_trial',
        status: 'trialing',
        trialEndsAt,
      });
    }

    sub = await reconcileFromStripeIfNeeded(sub);
    const billing = await getBillingSnapshot(sub);

    return mapToDto(sub, billing);
  },

  /** Create a Stripe Checkout Session for upgrading to Pro. */
  async createCheckoutSession(
    userId: Types.ObjectId,
    userEmail: string,
    returnUrl: string,
  ): Promise<CheckoutSessionDto> {
    const stripe = getStripe();
    let sub = await SubscriptionRepository.findByUserId(userId);

    if (!sub) {
      const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      sub = await SubscriptionRepository.create({
        userId,
        plan: 'free_trial',
        status: 'trialing',
        trialEndsAt,
      });
    }

    if (sub.plan === 'pro' && sub.status === 'active') {
      throw new AppError('Already subscribed to Pro plan', 400);
    }

    const priceId = await resolveProPriceId(stripe);

    // Ensure Stripe customer exists
    let customerId = sub.stripeCustomerId;
    if (!customerId) {
      const customer = await runStripe(() =>
        stripe.customers.create({
          email: userEmail,
          metadata: { userId: userId.toString() },
        }),
      );
      customerId = customer.id;
      await SubscriptionRepository.updateByUserId(userId, { stripeCustomerId: customerId });
    }

    const session = await runStripe(() =>
      stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${returnUrl}/dashboard/subscription?success=1`,
        cancel_url: `${returnUrl}/dashboard/subscription?canceled=1`,
        metadata: { userId: userId.toString() },
      }),
    );

    return { url: session.url! };
  },

  /** Create a Stripe Billing Portal session for managing subscription. */
  async createBillingPortalSession(
    userId: Types.ObjectId,
    returnUrl: string,
  ): Promise<BillingPortalDto> {
    const stripe = getStripe();
    const sub = await SubscriptionRepository.findByUserId(userId);

    if (!sub?.stripeCustomerId) {
      throw new AppError('No billing account found. Please upgrade to Pro first.', 400);
    }

    const session = await runStripe(() =>
      stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${returnUrl}/dashboard/subscription`,
      }),
    );

    return { url: session.url };
  },

  /** Cancel Pro subscription at period end from the app (no Stripe portal redirect required). */
  async cancelAtPeriodEnd(userId: Types.ObjectId): Promise<SubscriptionDto> {
    const sub = await SubscriptionRepository.findByUserId(userId);
    if (!sub?.stripeCustomerId) {
      throw new AppError('No billing account found.', 400);
    }

    const stripe = getStripe();
    const stripeSubscriptionId = sub.stripeSubscriptionId
      ?? await resolveSubscriptionIdByCustomer(stripe, sub.stripeCustomerId);

    if (!stripeSubscriptionId) {
      throw new AppError('No active Stripe subscription found to cancel.', 400);
    }

    const stripeSub = await runStripe(() =>
      stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true,
      }),
    ) as StripeSubscriptionLike;

    const currentPeriodEnd = toValidDateFromUnixSeconds(getStripeSubscriptionPeriodEnd(stripeSub));
    const updated = await SubscriptionRepository.updateByUserId(userId, {
      stripeSubscriptionId: stripeSub.id,
      plan: 'pro',
      status: mapStripeStatus(stripeSub.status),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    });

    if (!updated) throw new AppError('Subscription not found', 404);

    const billing = await getBillingSnapshot(updated);
    return mapToDto(updated, billing);
  },

  /** Resume subscription by removing cancel_at_period_end flag from the app. */
  async resumeSubscription(userId: Types.ObjectId): Promise<SubscriptionDto> {
    const sub = await SubscriptionRepository.findByUserId(userId);
    if (!sub?.stripeCustomerId) {
      throw new AppError('No billing account found.', 400);
    }

    const stripe = getStripe();
    const stripeSubscriptionId = sub.stripeSubscriptionId
      ?? await resolveSubscriptionIdByCustomer(stripe, sub.stripeCustomerId);

    if (!stripeSubscriptionId) {
      throw new AppError('No Stripe subscription found to resume.', 400);
    }

    const stripeSub = await runStripe(() =>
      stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: false,
      }),
    ) as StripeSubscriptionLike;

    const currentPeriodEnd = toValidDateFromUnixSeconds(getStripeSubscriptionPeriodEnd(stripeSub));
    const updated = await SubscriptionRepository.updateByUserId(userId, {
      stripeSubscriptionId: stripeSub.id,
      plan: 'pro',
      status: mapStripeStatus(stripeSub.status),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    });

    if (!updated) throw new AppError('Subscription not found', 404);

    const billing = await getBillingSnapshot(updated);
    return mapToDto(updated, billing);
  },

  /** Get payment history (invoices) from Stripe. */
  async getPaymentHistory(userId: Types.ObjectId): Promise<PaymentHistoryItem[]> {
    const sub = await SubscriptionRepository.findByUserId(userId);
    if (!sub?.stripeCustomerId) return [];

    const stripe = getStripe();
    const invoices = await runStripe(() =>
      stripe.invoices.list({
        customer: sub.stripeCustomerId,
        limit: 24,
      }),
    ) as StripeInvoiceList;

    return invoices.data.map((inv: StripeInvoiceList['data'][number]) => ({
      id: inv.id,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? 'unknown',
      created: new Date(inv.created * 1000).toISOString(),
      invoicePdf: inv.invoice_pdf ?? null,
      description: inv.description ?? (inv.lines.data[0]?.description ?? null),
    }));
  },

  /** Handle incoming Stripe webhook event. */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const stripe = getStripe();
    let event: StripeWebhookEvent;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new AppError('Invalid webhook signature', 400);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeCheckoutSessionLike;
        if (session.mode !== 'subscription' || !session.subscription) break;
        const stripeSubId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        if (!stripeSubId) break;

        const stripeSub = await runStripe(() => stripe.subscriptions.retrieve(stripeSubId)) as StripeSubscriptionLike;

        let targetUserId = session.metadata?.userId ?? null;
        if (!targetUserId && typeof session.customer === 'string') {
          const byCustomer = await SubscriptionRepository.findByStripeCustomerId(session.customer);
          targetUserId = byCustomer?.userId?.toString() ?? null;
        }
        if (!targetUserId) {
          logger.warn('Stripe checkout.session.completed received without resolvable user', {
            checkoutSessionId: session.id,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          });
          break;
        }

        const currentPeriodEnd = toValidDateFromUnixSeconds(getStripeSubscriptionPeriodEnd(stripeSub));
        await SubscriptionRepository.updateByUserId(new Types.ObjectId(targetUserId), {
          stripeSubscriptionId: stripeSubId,
          plan: 'pro',
          status: 'active',
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as StripeSubscriptionLike;
        const currentPeriodEnd = toValidDateFromUnixSeconds(getStripeSubscriptionPeriodEnd(stripeSub));
        const updates = {
          stripeSubscriptionId: stripeSub.id,
          plan: 'pro',
          status: mapStripeStatus(stripeSub.status),
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        } as const;

        const bySubId = await SubscriptionRepository.updateByStripeSubscriptionId(
          stripeSub.id,
          updates,
        );

        // Fallback for first-time events when stripeSubscriptionId isn't saved yet.
        if (!bySubId && typeof stripeSub.customer === 'string') {
          const byCustomer = await SubscriptionRepository.findByStripeCustomerId(stripeSub.customer);
          if (byCustomer) {
            await SubscriptionRepository.updateByUserId(byCustomer.userId, updates);
          } else {
            logger.warn('Stripe subscription event could not match local subscription', {
              eventType: event.type,
              stripeSubscriptionId: stripeSub.id,
              stripeCustomerId: stripeSub.customer,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as StripeSubscriptionLike;
        const updates = {
          stripeSubscriptionId: stripeSub.id,
          status: 'canceled',
          cancelAtPeriodEnd: false,
        } as const;

        const bySubId = await SubscriptionRepository.updateByStripeSubscriptionId(
          stripeSub.id,
          updates,
        );

        if (!bySubId && typeof stripeSub.customer === 'string') {
          const byCustomer = await SubscriptionRepository.findByStripeCustomerId(stripeSub.customer);
          if (byCustomer) {
            await SubscriptionRepository.updateByUserId(byCustomer.userId, updates);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as StripeInvoiceLike;
        const subId = getInvoiceSubscriptionId(invoice);
        if (!subId) break;
        const bySubId = await SubscriptionRepository.updateByStripeSubscriptionId(subId, {
          status: 'past_due',
        });

        if (!bySubId && typeof invoice.customer === 'string') {
          const byCustomer = await SubscriptionRepository.findByStripeCustomerId(invoice.customer);
          if (byCustomer) {
            await SubscriptionRepository.updateByUserId(byCustomer.userId, {
              status: 'past_due',
              stripeSubscriptionId: subId,
            });
          }
        }
        break;
      }

      default:
        break;
    }
  },

  /** Super-admin: list all subscriptions with pagination. */
  async listAllSubscriptions(page: number, limit: number, plan?: string) {
    const filter: Record<string, unknown> = {};
    if (plan) filter.plan = plan;
    const { subscriptions, total } = await SubscriptionRepository.findAllWithPagination(page, limit, filter);
    const totalPages = Math.ceil(total / limit);

    // Batch-fetch user profiles to get names/emails
    const { UserRepository } = await import('../user/users.repository.js');
    const userIds = subscriptions.map((s) => s.userId);
    const users = await Promise.all(userIds.map((id) => UserRepository.findById(id).catch(() => null)));
    const userMap = new Map(
      users
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map((u) => [u._id.toString(), u]),
    );

    return {
      data: subscriptions.map((s) => {
        const user = userMap.get(s.userId.toString());
        return {
          id: (s._id as Types.ObjectId).toString(),
          userId: s.userId.toString(),
          userName: user?.name ?? 'Unknown',
          userEmail: user?.email ?? '',
          plan: s.plan,
          status: s.status,
          trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
          currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
          stripeCustomerId: s.stripeCustomerId ?? null,
          cancelAtPeriodEnd: s.cancelAtPeriodEnd,
          createdAt: (s.createdAt as Date).toISOString(),
        };
      }),
      meta: { total, page, limit, totalPages, hasPrev: page > 1, hasNext: page < totalPages },
    };
  },

  /** Super-admin: billing summary counts. */
  async getBillingSummary() {
    const counts = await SubscriptionRepository.countByPlan();
    return {
      totalFreeTrials: counts.free_trial,
      totalPro: counts.pro,
      total: counts.free_trial + counts.pro,
    };
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapStripeStatus(
  stripeStatus: string,
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' {
  switch (stripeStatus) {
    case 'trialing':   return 'trialing';
    case 'active':     return 'active';
    case 'past_due':   return 'past_due';
    case 'canceled':   return 'canceled';
    default:           return 'incomplete';
  }
}

function mapToDto(
  sub: { plan: string; status: string; trialEndsAt?: Date | null; currentPeriodEnd?: Date | null; cancelAtPeriodEnd: boolean; stripeCustomerId?: string | null },
  billing: {
    hasPaymentMethod: boolean;
    billingEmail: string | null;
    paymentMethod: SubscriptionDto['paymentMethod'];
  },
): SubscriptionDto {
  return {
    plan: sub.plan as SubscriptionDto['plan'],
    status: sub.status as SubscriptionDto['status'],
    trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
    currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    stripeCustomerId: sub.stripeCustomerId ?? null,
    hasPaymentMethod: billing.hasPaymentMethod,
    billingEmail: billing.billingEmail,
    paymentMethod: billing.paymentMethod,
  };
}
