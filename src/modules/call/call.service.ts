import { CallRepository } from './call.repository.js';
import { toCallDto, type CallDto } from './call.dto.js';
import { buildPaginationMeta, type PaginationParams } from '../../common/utils/pagination.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { retellClient } from '../../infra/retell/index.js';
import { LeadService } from '../lead/lead.service.js';
import { TenantService } from '../tenant/tenant.service.js';
import { logger } from '../../config/logger.js';
import type { ICall } from './call.model.js';

/**
 * Retell's built-in user_sentiment uses Title Case ("Positive", "Negative", "Neutral").
 * Our scoring engine expects lowercase. Map here.
 */
function mapRetellSentiment(
  value?: string,
): 'positive' | 'neutral' | 'negative' | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v === 'positive') return 'positive';
  if (v === 'negative') return 'negative';
  if (v === 'neutral')  return 'neutral';
  return undefined; // "Unknown" or anything else → don't influence score
}

export const CallService = {
  async listCalls(
    tenantId: string,
    pagination: PaginationParams,
    filters: { leadId?: string; direction?: string },
  ) {
    const { calls, total } = await CallRepository.findAll(tenantId, pagination, filters);
    return { calls: calls.map(toCallDto), meta: buildPaginationMeta(total, pagination) };
  },

  async getCallById(id: string, tenantId: string): Promise<CallDto> {
    const c = await CallRepository.findById(id, tenantId);
    if (!c) throw new NotFoundError('Call');
    return toCallDto(c);
  },

  async getCallsByLead(leadId: string, tenantId: string): Promise<CallDto[]> {
    const calls = await CallRepository.findByLeadId(leadId, tenantId);
    return calls.map(toCallDto);
  },

  /** Initiate an outbound call via Retell AI */
  async initiateOutboundCall(params: {
    tenantId: string;
    leadId: string;
    fromNumber: string;
    toNumber: string;
    agentId: string;
    retellApiKey?: string;
    dynamicVariables?: Record<string, string>;
  }): Promise<CallDto> {
    const retellCall = await retellClient.createCall(
      {
        from_number: params.fromNumber,
        to_number:   params.toNumber,
        agent_id:    params.agentId,
        retell_llm_dynamic_variables: params.dynamicVariables,
      },
      params.retellApiKey,
    );

    const call = await CallRepository.create({
      tenantId:     params.tenantId as unknown as ICall['tenantId'],
      leadId:       params.leadId as unknown as ICall['leadId'],
      retellCallId: retellCall.call_id,
      agentId:      params.agentId,
      direction:    'outbound',
      status:       'initiated',
      fromNumber:   params.fromNumber,
      toNumber:     params.toNumber,
    });

    logger.info('[call] outbound initiated', { callId: retellCall.call_id, leadId: params.leadId });
    return toCallDto(call);
  },

  /**
   * Import existing call history from Retell AI and score each lead.
   * Idempotent — skips calls already in the DB (matched by retellCallId).
   */
  async syncFromRetell(
    tenantId: string,
    options?: { limit?: number; agentId?: string },
  ): Promise<{ synced: number; skipped: number }> {
    // Use workspace-specific API key, falling back to global env
    const credentials = await TenantService.getRetellCredentials(tenantId);

    const calls = await retellClient.listCalls(
      {
        limit: options?.limit ?? 100,
        sort_order: 'descending',
        filter_criteria: {
          call_status: ['ended'],
          ...(options?.agentId ? { agent_id: [options.agentId] } : {}),
        },
      },
      credentials.apiKey || undefined,
    );

    let synced = 0;
    let skipped = 0;

    for (const retellCall of calls) {
      // Only process ended calls with a usable phone number
      if (retellCall.call_status !== 'ended') {
        skipped++;
        continue;
      }

      const phone = retellCall.from_number ?? retellCall.to_number;
      if (!phone) {
        skipped++;
        continue;
      }

      // Idempotency — skip if already imported
      const existing = await CallRepository.findByRetellCallId(retellCall.call_id);
      if (existing) {
        skipped++;
        continue;
      }

      // custom_analysis_data = your agent's configured post-call fields
      // call_analysis built-ins = Retell's own user_sentiment / call_successful
      const custom   = retellCall.call_analysis?.custom_analysis_data ?? {};
      const builtin  = retellCall.call_analysis ?? {};

      const retellData = {
        interestLevel:     custom.interest_level,
        isSeriousBuyer:    custom.is_serious_buyer    ?? (builtin.call_successful as boolean | undefined),
        sentiment:         custom.sentiment            ?? mapRetellSentiment(builtin.user_sentiment),
        appointmentBooked: custom.appointment_booked  as boolean | undefined,
        notes:             custom.notes as string | undefined,
      };

      logger.info('[sync] retell call analysis', {
        callId: retellCall.call_id,
        custom_analysis_data: custom,
        builtin_sentiment: builtin.user_sentiment,
        builtin_successful: builtin.call_successful,
        mapped: retellData,
      });

      // Upsert lead + recalculate score
      const lead = await LeadService.upsertFromRetell(tenantId, {
        phone,
        name:      custom.name as string | undefined,
        callId:    retellCall.call_id,
        retellData,
      });

      // Save call record
      await CallRepository.create({
        tenantId:           tenantId as unknown as ICall['tenantId'],
        leadId:             lead.id as unknown as ICall['leadId'],
        retellCallId:       retellCall.call_id,
        agentId:            retellCall.agent_id,
        direction:          retellCall.call_direction === 'outbound' ? 'outbound' : 'inbound',
        status:             'ended',
        fromNumber:         retellCall.from_number,
        toNumber:           retellCall.to_number,
        durationSeconds:    retellCall.duration_ms ? Math.floor(retellCall.duration_ms / 1000) : undefined,
        transcript:         retellCall.transcript,
        recordingUrl:       retellCall.recording_url,
        customAnalysisData: retellCall.call_analysis as Record<string, unknown> | undefined,
        startedAt:          retellCall.start_timestamp ? new Date(retellCall.start_timestamp) : undefined,
        endedAt:            retellCall.end_timestamp   ? new Date(retellCall.end_timestamp)   : new Date(),
      });

      synced++;
    }

    logger.info('[call] retell sync complete', { tenantId, synced, skipped, total: calls.length });
    return { synced, skipped };
  },

  /** Called from webhook service when Retell call ends */
  async saveFromWebhook(data: {
    tenantId: string;
    leadId: string;
    retellCallId: string;
    agentId: string;
    direction: 'inbound' | 'outbound';
    fromNumber?: string;
    toNumber?: string;
    durationSeconds?: number;
    transcript?: string;
    recordingUrl?: string;
    customAnalysisData?: Record<string, unknown>;
    startedAt?: Date;
    endedAt?: Date;
  }): Promise<CallDto> {
    // Upsert by retellCallId
    const existing = await CallRepository.findByRetellCallId(data.retellCallId);
    if (existing) {
      const updated = await CallRepository.updateByRetellCallId(data.retellCallId, {
        status:             'ended',
        durationSeconds:    data.durationSeconds,
        transcript:         data.transcript,
        recordingUrl:       data.recordingUrl,
        customAnalysisData: data.customAnalysisData,
        endedAt:            data.endedAt ?? new Date(),
      });
      return toCallDto(updated!);
    }

    const call = await CallRepository.create({
      ...data,
      tenantId: data.tenantId as unknown as ICall['tenantId'],
      leadId:   data.leadId as unknown as ICall['leadId'],
      status:   'ended',
    });
    return toCallDto(call);
  },
};
