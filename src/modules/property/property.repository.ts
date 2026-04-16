import { Types } from 'mongoose';
import { PropertyModel, type IProperty } from './property.model.js';
import { type PaginationParams, getSkip } from '../../common/utils/pagination.js';

export const PropertyRepository = {
  async findAll(
    tenantId: string,
    pagination: PaginationParams,
    filters: { status?: string; type?: string; search?: string } = {},
  ): Promise<{ properties: IProperty[]; total: number }> {
    const query: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { area:  { $regex: filters.search, $options: 'i' } },
        { city:  { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [properties, total] = await Promise.all([
      PropertyModel.find(query)
        .sort({ createdAt: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      PropertyModel.countDocuments(query),
    ]);
    return { properties: properties as unknown as IProperty[], total };
  },

  async findById(id: string, tenantId: string): Promise<IProperty | null> {
    return PropertyModel.findOne({
      _id:      new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    }).lean() as unknown as Promise<IProperty | null>;
  },

  /** Smart matching: find available properties matching a lead's preferences */
  async findMatchingForLead(
    tenantId: string,
    criteria: { area?: string; type?: string; budget?: { min?: number; max?: number }; bedrooms?: number },
  ): Promise<IProperty[]> {
    const match: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
      status:   'available',
    };

    if (criteria.area) match['matchingTags.area'] = { $regex: criteria.area, $options: 'i' };
    if (criteria.type) match['matchingTags.type'] = criteria.type;
    if (criteria.bedrooms) match.bedrooms = criteria.bedrooms;

    if (criteria.budget?.max) match.price = { $lte: criteria.budget.max };
    if (criteria.budget?.min) {
      const existing = (match.price as { $lte?: number }) ?? {};
      match.price = { ...existing, $gte: criteria.budget.min };
    }

    return PropertyModel.find(match).limit(10).lean() as unknown as Promise<IProperty[]>;
  },

  async create(data: Partial<IProperty>): Promise<IProperty> {
    const p = new PropertyModel(data);
    return p.save();
  },

  async updateById(id: string, tenantId: string, data: Partial<IProperty>): Promise<IProperty | null> {
    return PropertyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) },
      { $set: data },
      { new: true },
    ).lean() as unknown as Promise<IProperty | null>;
  },

  async deleteById(id: string, tenantId: string): Promise<boolean> {
    const res = await PropertyModel.deleteOne({
      _id:      new Types.ObjectId(id),
      tenantId: new Types.ObjectId(tenantId),
    });
    return res.deletedCount > 0;
  },
};
