import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export type N8nEvent =
  | 'new_lead'
  | 'lead_qualified'
  | 'meeting_booked'
  | 'lead_updated'
  | 'followup_due'
  | 'call_ended';

interface N8nTriggerOptions {
  webhookUrl?: string; // per-workspace override
  payload: Record<string, unknown>;
}

/** Fire-and-forget n8n webhook trigger — never throws, always logs. */
async function triggerWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.N8N_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      logger.warn('[n8n] webhook returned non-OK', { url, status: res.status });
    } else {
      logger.info('[n8n] webhook triggered', { url });
    }
  } catch (err) {
    logger.error('[n8n] webhook trigger failed', { url, error: (err as Error).message });
  }
}

export const n8nClient = {
  trigger(event: N8nEvent, options: N8nTriggerOptions): void {
    const defaultUrls: Record<N8nEvent, string> = {
      new_lead: env.N8N_WEBHOOK_NEW_LEAD,
      lead_qualified: env.N8N_WEBHOOK_LEAD_QUALIFIED,
      meeting_booked: env.N8N_WEBHOOK_MEETING_BOOKED,
      lead_updated: env.N8N_WEBHOOK_LEAD_UPDATED,
      followup_due: '',
      call_ended: '',
    };

    const url = options.webhookUrl || defaultUrls[event];
    if (!url) {
      logger.warn('[n8n] no webhook URL configured for event', { event });
      return;
    }

    // Fire and forget — do NOT await
    void triggerWebhook(url, { event, ...options.payload });
  },
};
