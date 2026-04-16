import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { LeadService } from '../lead/lead.service.js';
import { CallService } from '../call/call.service.js';
import { n8nClient } from '../../infra/n8n/index.js';
import type { RetellWebhookDto } from './webhook.dto.js';
import { resolveDefaultWorkspaceId } from '../../common/utils/workspaceResolver.js';

function extractPhone(payload: RetellWebhookDto): string {
  return payload.from_number ?? payload.to_number ?? 'unknown';
}

export const WebhookService = {
  async processRetellWebhook(payload: RetellWebhookDto) {
    const workspaceId = await resolveDefaultWorkspaceId();
    if (!workspaceId) throw new NotFoundError('Workspace');

    const lead = await LeadService.upsertFromRetell(workspaceId, {
      phone: extractPhone(payload),
      name: payload.custom_analysis_data?.name as string | undefined,
      callId: payload.call_id,
      retellData: {
        interestLevel: payload.custom_analysis_data?.interest_level as
          | 'high'
          | 'medium'
          | 'low'
          | undefined,
        isSeriousBuyer: payload.custom_analysis_data?.is_serious_buyer as boolean | undefined,
        sentiment: payload.custom_analysis_data?.sentiment as
          | 'positive'
          | 'neutral'
          | 'negative'
          | undefined,
        notes: payload.custom_analysis_data?.notes as string | undefined,
      },
    });

    const call = await CallService.saveFromWebhook({
      tenantId: workspaceId,
      leadId: lead.id,
      retellCallId: payload.call_id,
      agentId: payload.agent_id,
      direction: payload.call_direction ?? 'inbound',
      fromNumber: payload.from_number,
      toNumber: payload.to_number,
      durationSeconds: payload.duration
        ?? (typeof payload.duration_ms === 'number'
          ? Math.floor(payload.duration_ms / 1000)
          : undefined),
      transcript: payload.transcript,
      recordingUrl: payload.recording_url,
      customAnalysisData: payload.custom_analysis_data,
      startedAt: payload.start_timestamp ? new Date(payload.start_timestamp) : undefined,
      endedAt: payload.end_timestamp ? new Date(payload.end_timestamp) : new Date(),
    });

    n8nClient.trigger('call_ended', {
      webhookUrl: env.N8N_WEBHOOK_LEAD_UPDATED,
      payload: {
        workspaceId,
        leadId: lead.id,
        callId: call.id,
        retellCallId: payload.call_id,
      },
    });

    logger.info('[webhook] retell processed', {
      workspaceId,
      callId: payload.call_id,
      agentId: payload.agent_id,
    });

    return {
      leadId: lead.id,
      callId: call.id,
    };
  },
};
