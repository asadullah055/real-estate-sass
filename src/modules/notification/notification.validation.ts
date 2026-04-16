import { z } from 'zod';

export const createNotificationSchema = z.object({
  title:    z.string().min(1).max(160),
  message:  z.string().min(1).max(2000),
  type:     z.enum(['info', 'success', 'warning', 'error']).default('info'),
  metadata: z.record(z.unknown()).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});
