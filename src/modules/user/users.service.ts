import { UserRepository } from './users.repository.js';
import type { IUser } from './users.model.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { ForbiddenError } from '../../common/errors/AppError.js';
import { type PaginationParams, buildPaginationMeta } from '../../common/utils/pagination.js';
import type { Role } from '../../common/constants/roles.js';

export const UserService = {
  async getProfile(userId: string): Promise<IUser> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async listUsers(requestingUser: IUser, pagination: PaginationParams, search?: string) {
    let result: { users: IUser[]; total: number };

    if (requestingUser.role === 'super-admin') {
      result = await UserRepository.findAll(pagination, {}, search);
    } else if (requestingUser.role === 'admin') {
      // Admin sees all regular users (role: user); tenant-scoped if they have one
      const filter: Record<string, unknown> = { role: 'user' };
      if (requestingUser.tenantId) {
        filter.tenantId = requestingUser.tenantId;
      }
      result = await UserRepository.findAll(pagination, filter, search);
    } else if (requestingUser.tenantId) {
      result = await UserRepository.findByTenant(
        requestingUser.tenantId.toString(),
        pagination,
        search,
      );
    } else {
      result = { users: [], total: 0 };
    }

    return { users: result.users, meta: buildPaginationMeta(result.total, pagination) };
  },

  async listAdmins(pagination: PaginationParams, search?: string) {
    const result = await UserRepository.findAll(
      pagination,
      { role: { $in: ['admin', 'super-admin'] } },
      search,
    );
    return { users: result.users, meta: buildPaginationMeta(result.total, pagination) };
  },

  async updateUserRole(
    targetUserId: string,
    role: Role,
    requestingUser: IUser,
  ): Promise<IUser> {
    if (role === 'super-admin' && requestingUser.role !== 'super-admin') {
      throw new ForbiddenError('Only super-admins can assign the super-admin role');
    }
    const updated = await UserRepository.updateById(targetUserId, { role });
    if (!updated) throw new NotFoundError('User');
    return updated;
  },

  async getUserById(targetId: string): Promise<IUser> {
    const user = await UserRepository.findById(targetId);
    if (!user) throw new NotFoundError('User');
    return user;
  },

  async updateUserStatus(
    targetUserId: string,
    status: 'active' | 'suspended' | 'pending',
    requestingUser: IUser,
  ): Promise<IUser> {
    // Prevent self-suspend
    if (targetUserId === requestingUser._id.toString() && status === 'suspended') {
      throw new ForbiddenError('You cannot suspend your own account');
    }
    const updated = await UserRepository.updateById(targetUserId, { status });
    if (!updated) throw new NotFoundError('User');
    return updated;
  },

  async createAdmin(data: { email: string; name: string }): Promise<IUser> {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) {
      // Promote existing user to admin
      if (existing.role === 'admin' || existing.role === 'super-admin') {
        throw new ForbiddenError('User is already an admin');
      }
      const updated = await UserRepository.updateById(existing._id, { role: 'admin' });
      if (!updated) throw new NotFoundError('User');
      return updated;
    }
    // Create placeholder — betterAuthId will be set on first login
    return UserRepository.create({
      betterAuthId: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      email: data.email,
      name: data.name,
      role: 'admin',
      status: 'pending',
    });
  },

  async updateAdmin(
    targetUserId: string,
    updates: { name?: string; status?: 'active' | 'suspended' | 'pending' },
    requestingUser: IUser,
  ): Promise<IUser> {
    const target = await UserRepository.findById(targetUserId);
    if (!target) throw new NotFoundError('User');
    if (target.role === 'super-admin' && requestingUser.role !== 'super-admin') {
      throw new ForbiddenError('Cannot modify a super-admin');
    }
    const updated = await UserRepository.updateById(targetUserId, updates);
    if (!updated) throw new NotFoundError('User');
    return updated;
  },

  async deleteAdmin(targetUserId: string, requestingUser: IUser): Promise<void> {
    const target = await UserRepository.findById(targetUserId);
    if (!target) throw new NotFoundError('User');
    if (target.role === 'super-admin') {
      throw new ForbiddenError('Cannot delete a super-admin account');
    }
    if (targetUserId === requestingUser._id.toString()) {
      throw new ForbiddenError('Cannot delete your own account');
    }
    const deleted = await UserRepository.deleteById(targetUserId);
    if (!deleted) throw new NotFoundError('User');
  },

  async getAnalytics() {
    const [totalUsers, totalAdmins, activeUsers, suspendedUsers, growth] = await Promise.all([
      UserRepository.countByRole('user'),
      UserRepository.countByRole('admin'),
      UserRepository.countByStatus('active'),
      UserRepository.countByStatus('suspended'),
      UserRepository.userGrowthLastDays(30),
    ]);
    return { totalUsers, totalAdmins, activeUsers, suspendedUsers, growth };
  },

  async getDashboardStats() {
    const [totalUsers, totalAdmins] = await Promise.all([
      UserRepository.countByRole('user'),
      UserRepository.countByRole('admin'),
    ]);
    return { totalUsers, totalAdmins };
  },
};
