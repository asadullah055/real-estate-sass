import { z } from 'zod';

export const checkoutSessionSchema = z.object({
  returnUrl: z.string().url('returnUrl must be a valid URL'),
});

export const billingPortalSchema = z.object({
  returnUrl: z.string().url('returnUrl must be a valid URL'),
});
