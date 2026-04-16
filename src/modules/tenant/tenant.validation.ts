import { z } from 'zod';

export const updateRetellSettingsSchema = z.object({
  apiKey:               z.string().min(1).optional(),
  receptionistAgentId: z.string().min(1).optional(),
  qualifierAgentId:    z.string().min(1).optional(),
  webhookSecret:       z.string().min(1).optional(),
  fromNumber:          z.string().min(1).optional(),
});

export type UpdateRetellSettingsInput = z.infer<typeof updateRetellSettingsSchema>;
