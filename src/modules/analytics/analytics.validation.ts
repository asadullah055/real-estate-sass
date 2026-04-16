import { z } from 'zod';

export const createSnapshotSchema = z.object({
  date: z.string().datetime().optional(),
});
