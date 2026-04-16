import { z } from 'zod';

export const workspaceQuerySchema = z.object({
  workspaceId: z.string().min(1),
  leadId: z.string().optional(),
  hours: z.string().optional(),
  days: z.string().optional(),
});

export const assignLeadSchema = z.object({
  workspaceId: z.string().min(1),
  leadId:      z.string().min(1),
  agentId:     z.string().optional(),
});

export const triggerCallSchema = z.object({
  workspaceId: z.string().min(1),
  leadId:      z.string().min(1),
  fromNumber:  z.string().min(1),
  toNumber:    z.string().min(1),
  agentId:     z.string().min(1),
});

export const startFollowupSchema = z.object({
  workspaceId: z.string().min(1),
  leadId:      z.string().min(1),
  sequenceId:  z.string().min(1),
  startAt:     z.string().datetime().optional(),
});

export const updateFollowupSchema = z.object({
  workspaceId: z.string().min(1),
  followupId:  z.string().min(1),
  status:      z.enum(['sent', 'failed']),
  response: z
    .object({
      opened:  z.boolean().optional(),
      clicked: z.boolean().optional(),
      replied: z.boolean().optional(),
    })
    .optional(),
});

export const updateMeetingSchema = z.object({
  workspaceId: z.string().min(1),
  meetingId:   z.string().min(1),
  updates:     z.record(z.unknown()),
});

export const logNotificationSchema = z.object({
  workspaceId: z.string().min(1),
  userId:      z.string().min(1),
  title:       z.string().min(1),
  message:     z.string().min(1),
  type:        z.enum(['info', 'success', 'warning', 'error']).default('info'),
  metadata:    z.record(z.unknown()).optional(),
});

export const updateScoreSchema = z.object({
  workspaceId:  z.string().min(1),
  leadId:       z.string().min(1),
  score:        z.number().min(0).max(100),
  scoreCategory:z.enum(['hot', 'warm', 'cold', 'dead']),
});
