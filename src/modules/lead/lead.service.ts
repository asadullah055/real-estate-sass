import { LeadRepository, type LeadFilters } from './lead.repository.js';
import { toLeadDto, type LeadDto } from './lead.dto.js';
import { calculateLeadScore } from './lead.scoring.js';
import { buildPaginationMeta, type PaginationParams } from '../../common/utils/pagination.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { ConflictError } from '../../common/errors/AppError.js';
import { n8nClient } from '../../infra/n8n/index.js';
import { logger } from '../../config/logger.js';
import type { ILead } from './lead.model.js';

interface CreateLeadOptions {
  triggerN8n?: boolean;
  webhookUrl?: string;
  webhookPayload?: Record<string, unknown>;
}

export const LeadService = {
  async listLeads(tenantId: string, pagination: PaginationParams, filters: LeadFilters) {
    const { leads, total } = await LeadRepository.findAll(tenantId, pagination, filters);
    return {
      leads: leads.map(toLeadDto),
      meta:  buildPaginationMeta(total, pagination),
    };
  },

  async getLeadById(id: string, tenantId: string): Promise<LeadDto> {
    const lead = await LeadRepository.findById(id, tenantId);
    if (!lead) throw new NotFoundError('Lead');
    return toLeadDto(lead);
  },

  async createLead(
    tenantId: string,
    data: Partial<ILead>,
    options: CreateLeadOptions = {},
  ): Promise<LeadDto> {
    // Check duplicate phone within tenant
    const existing = await LeadRepository.findByPhone(data.phone!, tenantId);
    if (existing) throw new ConflictError('A lead with this phone number already exists');

    const { score, scoreCategory } = calculateLeadScore({
      budget:      data.budget,
      timeline:    data.timeline,
      retellData:  data.retellData,
    });

    const lead = await LeadRepository.create({ ...data, tenantId: tenantId as unknown as ILead['tenantId'], score, scoreCategory });

    logger.info('[lead] created', { leadId: lead._id.toString(), score });

    if (options.triggerN8n !== false) {
      n8nClient.trigger('new_lead', {
        webhookUrl: options.webhookUrl,
        payload: {
          leadId: lead._id.toString(),
          tenantId,
          ...(options.webhookPayload ?? {}),
        },
      });
    }

    return toLeadDto(lead);
  },

  async updateLead(id: string, tenantId: string, data: Partial<ILead>): Promise<LeadDto> {
    const existing = await LeadRepository.findById(id, tenantId);
    if (!existing) throw new NotFoundError('Lead');

    // Recalculate score on update
    const scoringInput = {
      retellData:  data.retellData ?? existing.retellData,
      budget:      data.budget ?? existing.budget,
      timeline:    data.timeline ?? existing.timeline,
      meetingBooked: !!(data.meetingBookedAt ?? existing.meetingBookedAt),
    };
    const { score, scoreCategory } = calculateLeadScore(scoringInput);

    const oldScore = existing.score;
    const updated = await LeadRepository.updateById(id, tenantId, { ...data, score, scoreCategory });
    if (!updated) throw new NotFoundError('Lead');

    if (oldScore !== score) {
      logger.info('[lead] score changed', { leadId: id, from: oldScore, to: score });
    }

    n8nClient.trigger('lead_updated', { payload: { leadId: id, tenantId, score } });

    return toLeadDto(updated);
  },

  async deleteLead(id: string, tenantId: string): Promise<void> {
    const deleted = await LeadRepository.deleteById(id, tenantId);
    if (!deleted) throw new NotFoundError('Lead');
  },

  async getLeadStats(tenantId: string) {
    const counts = await LeadRepository.countByStatus(tenantId);
    return { byStatus: counts };
  },

  /** Called from webhook service when Retell call ends. */
  async upsertFromRetell(tenantId: string, data: {
    phone: string;
    name?: string;
    retellData: ILead['retellData'];
    callId: string;
  }): Promise<LeadDto> {
    let lead = await LeadRepository.findByPhone(data.phone, tenantId);

    const appointmentBooked = !!data.retellData?.appointmentBooked;

    if (!lead) {
      // Create new lead from inbound call
      const { score, scoreCategory } = calculateLeadScore({
        retellData:   data.retellData,
        meetingBooked: appointmentBooked,
      });
      lead = await LeadRepository.create({
        tenantId:        tenantId as unknown as ILead['tenantId'],
        name:            data.name ?? 'Unknown Caller',
        phone:           data.phone,
        source:          'inbound_call',
        status:          'contacted',
        score,
        scoreCategory,
        retellData:      { ...data.retellData, lastCallId: data.callId },
        lastContactedAt: new Date(),
        meetingBookedAt: appointmentBooked ? new Date() : undefined,
      });

      n8nClient.trigger('new_lead', { payload: { leadId: lead._id.toString(), tenantId } });
    } else {
      // Update existing lead with latest Retell data
      const bookedBefore = !!lead.meetingBookedAt;
      const { score, scoreCategory } = calculateLeadScore({
        retellData:   data.retellData,
        budget:       lead.budget,
        timeline:     lead.timeline,
        meetingBooked: bookedBefore || appointmentBooked,
      });

      lead = (await LeadRepository.updateById(lead._id.toString(), tenantId, {
        retellData:      { ...data.retellData, lastCallId: data.callId },
        status:          'contacted',
        score,
        scoreCategory,
        lastContactedAt: new Date(),
        // Only set meetingBookedAt if not already set and appointment was booked this call
        ...(!bookedBefore && appointmentBooked ? { meetingBookedAt: new Date() } : {}),
      }))!;

      n8nClient.trigger('lead_qualified', { payload: { leadId: lead._id.toString(), tenantId, score } });
    }

    return toLeadDto(lead);
  },

  async getUnrespondedLeads(tenantId: string, hoursThreshold = 24): Promise<LeadDto[]> {
    const leads = await LeadRepository.findUnrespondedLeads(tenantId, hoursThreshold);
    return leads.map(toLeadDto);
  },

  async getColdLeads(tenantId: string, daysThreshold = 30): Promise<LeadDto[]> {
    const leads = await LeadRepository.findColdLeads(tenantId, daysThreshold);
    return leads.map(toLeadDto);
  },

  async updateLeadScore(
    id: string,
    tenantId: string,
    score: number,
    scoreCategory: ILead['scoreCategory'],
  ): Promise<LeadDto> {
    const updated = await LeadRepository.updateById(id, tenantId, { score, scoreCategory });
    if (!updated) throw new NotFoundError('Lead');
    return toLeadDto(updated);
  },
};
