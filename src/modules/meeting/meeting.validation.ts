import { z } from 'zod';

export const createMeetingSchema = z.object({
  body: z.object({
    leadId:          z.string().min(1),
    agentId:         z.string().min(1),
    title:           z.string().min(1).max(200),
    scheduledAt:     z.string().datetime(),
    durationMinutes: z.number().int().default(60),
    meetingType:     z.enum(['in_person', 'video', 'phone']),
    location:        z.string().optional(),
    meetingUrl:      z.string().url().optional(),
    notes:           z.string().max(2000).optional(),
  }),
});

export const updateMeetingSchema = z.object({
  body: z.object({
    title:           z.string().min(1).max(200).optional(),
    scheduledAt:     z.string().datetime().optional(),
    durationMinutes: z.number().int().optional(),
    status:          z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
    meetingType:     z.enum(['in_person', 'video', 'phone']).optional(),
    location:        z.string().optional(),
    meetingUrl:      z.string().optional(),
    notes:           z.string().max(2000).optional(),
    outcome:         z.enum(['converted', 'follow_up_required', 'not_interested', 'pending']).optional(),
    outcomeNotes:    z.string().max(2000).optional(),
  }),
});
