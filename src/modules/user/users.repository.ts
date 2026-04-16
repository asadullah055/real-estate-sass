import { Types } from 'mongoose';
import { UserModel, type IUser } from './users.model.js';
import { type PaginationParams, getSkip } from '../../common/utils/pagination.js';

export const UserRepository = {
  async findByBetterAuthId(betterAuthId: string): Promise<IUser | null> {
    return UserModel.findOne({ betterAuthId }).lean() as unknown as Promise<IUser | null>;
  },

  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return UserModel.findById(id).lean() as unknown as Promise<IUser | null>;
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).lean() as unknown as Promise<IUser | null>;
  },

  async findFirstTenantId(): Promise<string | undefined> {
    const row = await UserModel.findOne({
      tenantId: { $exists: true, $ne: null },
    })
      .select('tenantId')
      .lean();
    return row?.tenantId ? row.tenantId.toString() : undefined;
  },

  async create(data: Partial<IUser>): Promise<IUser> {
    const doc = new UserModel(data);
    return doc.save();
  },

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<IUser>,
  ): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as Promise<IUser | null>;
  },

  async findByTenant(
    tenantId: string,
    pagination: PaginationParams,
    search?: string,
  ): Promise<{ users: IUser[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);
    return { users: users as unknown as IUser[], total };
  },

  async findAll(
    pagination: PaginationParams,
    filters: Record<string, unknown> = {},
    search?: string,
  ): Promise<{ users: IUser[]; total: number }> {
    const query = { ...filters };
    if (search) (query as Record<string, unknown>).name = { $regex: search, $options: 'i' };

    const [users, total] = await Promise.all([
      UserModel.find(query)
        .sort({ createdAt: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);
    return { users: users as unknown as IUser[], total };
  },

  async countByRole(role: string): Promise<number> {
    return UserModel.countDocuments({ role });
  },

  async countByStatus(status: string): Promise<number> {
    return UserModel.countDocuments({ status });
  },

  async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  /** Count new users registered in the last N days, grouped by day. */
  async userGrowthLastDays(days: number): Promise<{ date: string; count: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const pipeline = [
      { $match: { createdAt: { $gte: since }, role: 'user' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 as 1 } },
    ];
    const raw = await UserModel.aggregate(pipeline);
    return raw.map((r) => ({ date: r._id as string, count: r.count as number }));
  },

  async findAssignableAgents(tenantId: string): Promise<IUser[]> {
    const users = await UserModel.find({
      tenantId: new Types.ObjectId(tenantId),
      role:     { $in: ['admin', 'user'] },
      status:   'active',
    })
      .select('_id name email role status tenantId')
      .sort({ createdAt: 1 })
      .lean();

    return users as unknown as unknown as IUser[];
  },
};
