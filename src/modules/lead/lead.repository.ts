import { Types } from 'mongoose';
import { LeadModel, type ILead } from './lead.model.js';
import { type PaginationParams, getSkip } from '../../common/utils/pagination.js';

export interface LeadFilters {
  status?: string;
  statuses?: string[];
  search?: string;
  assignedAgentId?: string;
  talked?: boolean;
}

export const LeadRepository = {
  async findAll(
    tenantId: string,
    pagination: PaginationParams,
    filters: LeadFilters = {},
  ): Promise<{ leads: ILead[]; total: number }> {
    const query: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };

    if (filters.statuses?.length) query.status = { $in: filters.statuses };
    else if (filters.status) query.status = filters.status;
    else if (filters.talked) query.status = { $ne: 'new' };
    if (filters.assignedAgentId) query.assignedAgentId = new Types.ObjectId(filters.assignedAgentId);
    if (filters.search) {
      query.$or = [
        { name:  { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      LeadModel.find(query)
        .sort({ createdAt: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      LeadModel.countDocuments(query),
    ]);

    return { leads: leads as unknown as ILead[], total };
  },

  async findById(id: string, tenantId: string): Promise<ILead | null> {
    return LeadModel.findOne({
      _id:      new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).lean() as unknown as Promise<ILead | null>;
  },

  async findByPhone(phone: string, tenantId: string): Promise<ILead | null> {
    return LeadModel.findOne({ phone, tenantId: new Types.ObjectId(tenantId) }).lean() as unknown as Promise<ILead | null>;
  },

  async findByRetellAgentId(_agentId: string): Promise<{ tenantId: string } | null> {
    // Retained for compatibility; webhook lookup no longer uses tenant mapping.
    return null;
  },

  async create(data: Partial<ILead>): Promise<ILead> {
    const lead = new LeadModel(data);
    return lead.save();
  },

  async updateById(id: string, tenantId: string, data: Partial<ILead>): Promise<ILead | null> {
    return LeadModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) },
      { $set: data },
      { new: true },
    ).lean() as unknown as Promise<ILead | null>;
  },

  async deleteById(id: string, tenantId: string): Promise<boolean> {
    const res = await LeadModel.deleteOne({
      _id:      new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    });
    return res.deletedCount > 0;
  },

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const result = await LeadModel.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return result.reduce((acc: Record<string, number>, item: { _id: string; count: number }) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  },

  async findUnrespondedLeads(tenantId: string, hoursThreshold = 24): Promise<ILead[]> {
    const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
    return LeadModel.find({
      tenantId:        new Types.ObjectId(tenantId),
      status:          { $in: ['new', 'contacted'] },
      lastContactedAt: { $lt: cutoff },
    }).lean() as unknown as Promise<ILead[]>;
  },

  async findColdLeads(tenantId: string, daysThreshold = 30): Promise<ILead[]> {
    const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);
    return LeadModel.find({
      tenantId:        new Types.ObjectId(tenantId),
      scoreCategory:   'cold',
      lastContactedAt: { $lt: cutoff },
    }).lean() as unknown as Promise<ILead[]>;
  },
};
