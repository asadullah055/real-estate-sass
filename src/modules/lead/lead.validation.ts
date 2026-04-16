import { z } from 'zod';

export const createLeadSchema = z.object({
  name:  z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20),
  source: z.enum(['website_form', 'inbound_call', 'outbound_call', 'manual', 'referral']).optional(),
  budget: z.object({
    min:      z.number().optional(),
    max:      z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  preferredAreas: z.array(z.string()).optional(),
  propertyType:   z.string().optional(),
  bedrooms:       z.number().int().optional(),
  timeline:       z.enum(['urgent', 'within_3_months', 'within_6_months', 'flexible']).optional(),
  notes:          z.string().max(2000).optional(),
  tags:           z.array(z.string()).optional(),
});

export const updateLeadSchema = z.object({
  name:   z.string().min(1).max(100).optional(),
  email:  z.string().email().optional(),
  phone:  z.string().min(7).max(20).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'meeting_scheduled', 'negotiating', 'converted', 'lost', 'dead']).optional(),
  assignedAgentId: z.string().optional(),
  budget: z.object({
    min:      z.number().optional(),
    max:      z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  preferredAreas: z.array(z.string()).optional(),
  propertyType:   z.string().optional(),
  bedrooms:       z.number().int().optional(),
  timeline:       z.enum(['urgent', 'within_3_months', 'within_6_months', 'flexible']).optional(),
  notes:          z.string().max(2000).optional(),
  tags:           z.array(z.string()).optional(),
});

export const leadFormSchema = z.object({
  name:           z.string().min(1).max(100),
  email:          z.string().email().optional(),
  phone:          z.string().min(7).max(20),
  budget:         z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  preferredAreas: z.array(z.string()).optional(),
  propertyType:   z.string().optional(),
  bedrooms:       z.number().int().optional(),
  timeline:       z.enum(['urgent', 'within_3_months', 'within_6_months', 'flexible']).optional(),
  notes:          z.string().max(2000).optional(),
});

export const listLeadsSchema = z.object({
  page:   z.string().optional(),
  limit:  z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sort:   z.string().optional(),
});
