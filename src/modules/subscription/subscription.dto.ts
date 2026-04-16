export interface SubscriptionDto {
  plan: 'free_trial' | 'pro';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  hasPaymentMethod: boolean;
  billingEmail: string | null;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;           // in cents
  currency: string;
  status: string;
  created: string;          // ISO date
  invoicePdf: string | null;
  description: string | null;
}

export interface CheckoutSessionDto {
  url: string;
}

export interface BillingPortalDto {
  url: string;
}
