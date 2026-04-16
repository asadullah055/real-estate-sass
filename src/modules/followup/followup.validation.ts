import { z } from 'zod';

const followupTypeSchema = z.enum(['email', 'sms', 'whatsapp', 'call']);
const followupStatusSchema = z.enum(['scheduled', 'sent', 'failed', 'cancelled']);

const responseSchema = z.object({
  opened:  z.boolean().optional(),
  clicked: z.boolean().optional(),
  replied: z.boolean().optional(),
});

const inquirySchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  propertyType: z.string().optional(),
  preferredAreas: z.array(z.string()).optional(),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  timeline: z.enum(['urgent', 'within_3_months', 'within_6_months', 'flexible']).optional(),
  notes: z.string().optional(),
});

const sequenceStepSchema = z.object({
  step:         z.number().int().min(1),
  delayMinutes: z.number().int().min(0),
  type:         followupTypeSchema,
  template:     z.string().min(1),
  subject:      z.string().optional(),
});

export const createSequenceSchema = z.object({
  sequenceId: z.string().min(1).max(100),
  name:       z.string().min(1).max(150),
  steps:      z.array(sequenceStepSchema).min(1),
  isActive:   z.boolean().optional(),
});

export const updateSequenceSchema = z.object({
  name:     z.string().min(1).max(150).optional(),
  steps:    z.array(sequenceStepSchema).min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createFollowupSchema = z.object({
  leadId:      z.string().min(1).optional(),
  sequenceId:  z.string().min(1),
  stepNumber:  z.number().int().min(1),
  type:        followupTypeSchema,
  content:     z.object({ subject: z.string().optional(), body: z.string().min(1) }),
  inquiry:     inquirySchema.optional(),
  scheduledAt: z.string().datetime(),
  status:      followupStatusSchema.optional(),
  response:    responseSchema.optional(),
});

export const updateFollowupSchema = z.object({
  sequenceId:  z.string().min(1).optional(),
  stepNumber:  z.number().int().min(1).optional(),
  type:        followupTypeSchema.optional(),
  content:     z.object({ subject: z.string().optional(), body: z.string().min(1) }).optional(),
  inquiry:     inquirySchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  sentAt:      z.string().datetime().optional(),
  status:      followupStatusSchema.optional(),
  response:    responseSchema.optional(),
});

export const createFromSequenceSchema = z.object({
  leadId:     z.string().min(1),
  sequenceId: z.string().min(1),
  startAt:    z.string().datetime().optional(),
});

export const markSentSchema = z.object({
  response: responseSchema.optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const sequenceIdParamSchema = z.object({
  sequenceId: z.string().min(1),
});

export const leadIdParamSchema = z.object({
  leadId: z.string().min(1),
});
