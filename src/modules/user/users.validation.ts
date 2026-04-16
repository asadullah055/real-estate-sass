import { z } from 'zod';
import { ROLES } from '../../common/constants/roles.js';

export const updateRoleSchema = z.object({
  role: z.enum([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER]),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending']),
});

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const updateAdminSchema = z.object({
  name:   z.string().min(2).optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});

export const paginationQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
