import { Types } from 'mongoose';
import { CallModel, type ICall } from './call.model.js';
import { type PaginationParams, getSkip } from '../../common/utils/pagination.js';

export const CallRepository = {
  async findAll(
    tenantId: string,
    pagination: PaginationParams,
    filters: { leadId?: string; direction?: string } = {},
  ): Promise<{ calls: ICall[]; total: number }> {
    const query: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };
    if (filters.leadId) query.leadId = new Types.ObjectId(filters.leadId);
    if (filters.direction) query.direction = filters.direction;

    const [calls, total] = await Promise.all([
      CallModel.find(query).sort({ createdAt: -1 }).skip(getSkip(pagination)).limit(pagination.limit).lean(),
      CallModel.countDocuments(query),
    ]);
    return { calls: calls as unknown as ICall[], total };
  },

  async findById(id: string, tenantId: string): Promise<ICall | null> {
    return CallModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) }).lean() as unknown as Promise<ICall | null>;
  },

  async findByRetellCallId(retellCallId: string): Promise<ICall | null> {
    return CallModel.findOne({ retellCallId }).lean() as unknown as Promise<ICall | null>;
  },

  async findByLeadId(leadId: string, tenantId: string): Promise<ICall[]> {
    return CallModel.find({ leadId: new Types.ObjectId(leadId), tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<ICall[]>;
  },

  async create(data: Partial<ICall>): Promise<ICall> {
    const c = new CallModel(data);
    return c.save();
  },

  async updateByRetellCallId(retellCallId: string, data: Partial<ICall>): Promise<ICall | null> {
    return CallModel.findOneAndUpdate({ retellCallId }, { $set: data }, { new: true }).lean() as unknown as Promise<ICall | null>;
  },

  async countByTenant(tenantId: string): Promise<number> {
    return CallModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) });
  },
};
