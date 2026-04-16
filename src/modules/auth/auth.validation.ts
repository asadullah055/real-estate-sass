import { z } from 'zod';

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
});
