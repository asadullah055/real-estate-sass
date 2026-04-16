import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { SubscriptionService } from "./subscription.service.js";

export const SubscriptionController = {
  /** GET /api/subscription */
  getSubscription: asyncHandler(async (req: Request, res: Response) => {
    const sub = await SubscriptionService.getOrCreate(req.user!._id);
    res.json({ success: true, message: "Subscription retrieved", data: sub });
  }),

  /** GET /api/subscription/invoices */
  getInvoices: asyncHandler(async (req: Request, res: Response) => {
    const invoices = await SubscriptionService.getPaymentHistory(req.user!._id);
    res.json({ success: true, message: "Invoices retrieved", data: invoices });
  }),

  /** POST /api/subscription/checkout */
  createCheckout: asyncHandler(async (req: Request, res: Response) => {
    const { returnUrl } = req.body as { returnUrl: string };
    const result = await SubscriptionService.createCheckoutSession(
      req.user!._id,
      req.user!.email,
      returnUrl,
    );
    res.json({
      success: true,
      message: "Checkout session created",
      data: result,
    });
  }),

  /** POST /api/subscription/billing-portal */
  createBillingPortal: asyncHandler(async (req: Request, res: Response) => {
    const { returnUrl } = req.body as { returnUrl: string };
    const result = await SubscriptionService.createBillingPortalSession(
      req.user!._id,
      returnUrl,
    );
    res.json({
      success: true,
      message: "Billing portal session created",
      data: result,
    });
  }),

  /** POST /api/subscription/cancel */
  cancelSubscription: asyncHandler(async (req: Request, res: Response) => {
    const sub = await SubscriptionService.cancelAtPeriodEnd(req.user!._id);
    res.json({
      success: true,
      message: "Subscription will cancel at period end",
      data: sub,
    });
  }),

  /** POST /api/subscription/resume */
  resumeSubscription: asyncHandler(async (req: Request, res: Response) => {
    const sub = await SubscriptionService.resumeSubscription(req.user!._id);
    res.json({ success: true, message: "Subscription resumed", data: sub });
  }),

  /** GET /api/billing — super-admin billing summary + list */
  getBillingOverview: asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const plan = req.query.plan as string | undefined;
    const [summary, list] = await Promise.all([
      SubscriptionService.getBillingSummary(),
      SubscriptionService.listAllSubscriptions(page, limit, plan),
    ]);
    res.json({ success: true, message: "Billing overview", data: { summary, ...list } });
  }),

  /** POST /api/webhooks/stripe — raw body, no auth */
  handleWebhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;
    await SubscriptionService.handleWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  }),
};
