import { MeetingRepository } from './meeting.repository.js';
import { toMeetingDto, type MeetingDto } from './meeting.dto.js';
import { buildPaginationMeta, type PaginationParams } from '../../common/utils/pagination.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { n8nClient } from '../../infra/n8n/index.js';
import { logger } from '../../config/logger.js';
import type { IMeeting } from './meeting.model.js';

export const MeetingService = {
  async listMeetings(tenantId: string, pagination: PaginationParams, filters: { status?: string; agentId?: string; leadId?: string }) {
    const { meetings, total } = await MeetingRepository.findAll(tenantId, pagination, filters);
    return { meetings: meetings.map(toMeetingDto), meta: buildPaginationMeta(total, pagination) };
  },

  async getMeetingById(id: string, tenantId: string): Promise<MeetingDto> {
    const m = await MeetingRepository.findById(id, tenantId);
    if (!m) throw new NotFoundError('Meeting');
    return toMeetingDto(m);
  },

  async createMeeting(tenantId: string, data: Partial<IMeeting>): Promise<MeetingDto> {
    const m = await MeetingRepository.create({ ...data, tenantId: tenantId as unknown as IMeeting['tenantId'] });
    logger.info('[meeting] booked', { meetingId: m._id.toString(), leadId: m.leadId.toString() });
    n8nClient.trigger('meeting_booked', { payload: { meetingId: m._id.toString(), tenantId, leadId: m.leadId.toString() } });
    return toMeetingDto(m);
  },

  async updateMeeting(id: string, tenantId: string, data: Partial<IMeeting>): Promise<MeetingDto> {
    if (data.status === 'completed') {
      data.completedAt = new Date();
    }
    const m = await MeetingRepository.updateById(id, tenantId, data);
    if (!m) throw new NotFoundError('Meeting');
    return toMeetingDto(m);
  },

  async deleteMeeting(id: string, tenantId: string): Promise<void> {
    const deleted = await MeetingRepository.deleteById(id, tenantId);
    if (!deleted) throw new NotFoundError('Meeting');
  },

  async getUpcomingMeetings(tenantId: string): Promise<MeetingDto[]> {
    const meetings = await MeetingRepository.findUpcoming(tenantId);
    return meetings.map(toMeetingDto);
  },
};
