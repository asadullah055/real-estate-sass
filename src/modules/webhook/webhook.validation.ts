import { z } from 'zod';

export const retellWebhookSchema = z.object({
  event:          z.string().optional(),
  call_id:        z.string().min(1),
  agent_id:       z.string().min(1),
  call_status:    z.string().optional(),
  call_direction: z.enum(['inbound', 'outbound']).optional(),
  from_number:    z.string().optional(),
  to_number:      z.string().optional(),
  duration_ms:    z.number().optional(),
  duration:       z.number().optional(),
  transcript:     z.string().optional(),
  recording_url:  z.string().url().optional(),
  start_timestamp:z.number().optional(),
  end_timestamp:  z.number().optional(),
  custom_analysis_data: z.record(z.unknown()).optional(),
});
