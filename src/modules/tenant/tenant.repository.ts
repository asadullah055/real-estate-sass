import { TenantModel, type ITenant, type RetellSettings } from './tenant.model.js';

export const TenantRepository = {
  async findById(id: string): Promise<ITenant | null> {
    return TenantModel.findById(id).lean() as unknown as Promise<ITenant | null>;
  },

  async findBySlug(slug: string): Promise<ITenant | null> {
    return TenantModel.findOne({ slug }).lean() as unknown as Promise<ITenant | null>;
  },

  /** Used by webhook service to resolve workspace from Retell agent_id */
  async findByRetellAgentId(agentId: string): Promise<ITenant | null> {
    return TenantModel.findOne({
      $or: [
        { 'retellSettings.receptionistAgentId': agentId },
        { 'retellSettings.qualifierAgentId':    agentId },
      ],
    }).lean() as unknown as Promise<ITenant | null>;
  },

  async findAll(): Promise<ITenant[]> {
    return TenantModel.find().lean() as unknown as Promise<ITenant[]>;
  },

  async create(data: { name: string; slug: string }): Promise<ITenant> {
    const doc = await TenantModel.create(data);
    return doc.toObject() as unknown as ITenant;
  },

  async updateById(id: string, updates: Partial<ITenant>): Promise<ITenant | null> {
    return TenantModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean() as unknown as Promise<ITenant | null>;
  },

  /** Patch only the provided retellSettings fields — uses dot-notation $set */
  async updateRetellSettings(
    id: string,
    settings: Partial<RetellSettings>,
  ): Promise<ITenant | null> {
    const dotSet: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) dotSet[`retellSettings.${key}`] = value;
    }
    return TenantModel.findByIdAndUpdate(id, { $set: dotSet }, { new: true }).lean() as unknown as Promise<ITenant | null>;
  },

  /** Returns raw unmasked retell credentials — for internal service use only */
  async getRetellSettings(id: string): Promise<RetellSettings | null> {
    const doc = await TenantModel.findById(id).select('retellSettings').lean() as unknown as { retellSettings?: RetellSettings } | null;
    return doc?.retellSettings ?? null;
  },
};
