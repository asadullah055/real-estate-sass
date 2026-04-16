import { Router } from 'express';
import { SubscriptionController } from './subscription.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { checkoutSessionSchema, billingPortalSchema } from './subscription.validation.js';

const router = Router();

// All subscription routes require authentication
router.use(requireAuth());

// GET /api/subscription
router.get('/', SubscriptionController.getSubscription);

// GET /api/subscription/invoices
router.get('/invoices', SubscriptionController.getInvoices);

// POST /api/subscription/checkout
router.post('/checkout', validate(checkoutSessionSchema), SubscriptionController.createCheckout);

// POST /api/subscription/billing-portal
router.post('/billing-portal', validate(billingPortalSchema), SubscriptionController.createBillingPortal);

// POST /api/subscription/cancel
router.post('/cancel', SubscriptionController.cancelSubscription);

// POST /api/subscription/resume
router.post('/resume', SubscriptionController.resumeSubscription);

// GET /api/subscription/billing — billing overview
router.get('/billing', SubscriptionController.getBillingOverview);

export { router as subscriptionRouter };
