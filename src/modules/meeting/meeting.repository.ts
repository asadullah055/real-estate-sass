import { Types } from 'mongoose';
import { MeetingModel, type IMeeting } from './meeting.model.js';
import { type PaginationParams, getSkip } from '../../common/utils/pagination.js';

export const MeetingRepository = {
  async findAll(
    tenantId: string,
    pagination: PaginationParams,
    filters: { status?: string; agentId?: string; leadId?: string } = {},
  ): Promise<{ meetings: IMeeting[]; total: number }> {
    const query: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };
    if (filters.status)  query.status  = filters.status;
    if (filters.agentId) query.agentId = new Types.ObjectId(filters.agentId);
    if (filters.leadId)  query.leadId  = new Types.ObjectId(filters.leadId);

    const [meetings, total] = await Promise.all([
      MeetingModel.find(query).sort({ scheduledAt: 1 }).skip(getSkip(pagination)).limit(pagination.limit).lean(),
      MeetingModel.countDocuments(query),
    ]);
    return { meetings: meetings as unknown as IMeeting[], total };
  },

  async findById(id: string, tenantId: string): Promise<IMeeting | null> {
    return MeetingModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) }).lean() as unknown as Promise<IMeeting | null>;
  },

  async findUpcoming(tenantId: string, hoursAhead = 24): Promise<IMeeting[]> {
    const now = new Date();
    const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    return MeetingModel.find({
      tenantId:    new Types.ObjectId(tenantId),
      scheduledAt: { $gte: now, $lte: future },
      status:      { $in: ['scheduled', 'confirmed'] },
    }).sort({ scheduledAt: 1 }).lean() as unknown as Promise<IMeeting[]>;
  },

  async create(data: Partial<IMeeting>): Promise<IMeeting> {
    const m = new MeetingModel(data);
    return m.save();
  },

  async updateById(id: string, tenantId: string, data: Partial<IMeeting>): Promise<IMeeting | null> {
    return MeetingModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) },
      { $set: data },
      { new: true },
    ).lean() as unknown as Promise<IMeeting | null>;
  },

  async deleteById(id: string, tenantId: string): Promise<boolean> {
    const res = await MeetingModel.deleteOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    return res.deletedCount > 0;
  },
};
