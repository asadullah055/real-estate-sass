import { Types } from 'mongoose';
import { NotificationModel, type INotification } from './notification.model.js';
import { getSkip, type PaginationParams } from '../../common/utils/pagination.js';

export const NotificationRepository = {
  async create(data: Partial<INotification>): Promise<INotification> {
    const notification = new NotificationModel(data);
    return notification.save();
  },

  async findByUserId(
    workspaceId: string,
    userId: string,
    pagination: PaginationParams,
  ): Promise<{ notifications: INotification[]; total: number }> {
    const query = {
      workspaceId: new Types.ObjectId(workspaceId),
      userId:      new Types.ObjectId(userId),
    };

    const [notifications, total] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(getSkip(pagination))
        .limit(pagination.limit)
        .lean(),
      NotificationModel.countDocuments(query),
    ]);

    return { notifications: notifications as unknown as INotification[], total };
  },

  async unreadCount(workspaceId: string, userId: string): Promise<number> {
    return NotificationModel.countDocuments({
      workspaceId: new Types.ObjectId(workspaceId),
      userId:      new Types.ObjectId(userId),
      read:        false,
    });
  },

  async markRead(workspaceId: string, userId: string, id: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      {
        _id:         new Types.ObjectId(id),
        workspaceId: new Types.ObjectId(workspaceId),
        userId:      new Types.ObjectId(userId),
      },
      { $set: { read: true, readAt: new Date() } },
      { new: true },
    ).lean() as unknown as Promise<INotification | null>;
  },

  async markAllRead(workspaceId: string, userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      {
        workspaceId: new Types.ObjectId(workspaceId),
        userId:      new Types.ObjectId(userId),
        read:        false,
      },
      { $set: { read: true, readAt: new Date() } },
    );
    return result.modifiedCount;
  },

  async deleteById(workspaceId: string, userId: string, id: string): Promise<boolean> {
    const result = await NotificationModel.deleteOne({
      _id:         new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
      userId:      new Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  },
};
