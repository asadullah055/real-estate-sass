import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { buildPaginationMeta, type PaginationParams } from '../../common/utils/pagination.js';
import { NotificationRepository } from './notification.repository.js';
import type { INotification } from './notification.model.js';

export const NotificationService = {
  async createNotification(
    workspaceId: string,
    userId: string,
    data: Pick<INotification, 'title' | 'message' | 'type'> & { metadata?: Record<string, unknown> },
  ): Promise<INotification> {
    return NotificationRepository.create({
      workspaceId: workspaceId as unknown as INotification['workspaceId'],
      userId:      userId as unknown as INotification['userId'],
      title:       data.title,
      message:     data.message,
      type:        data.type,
      metadata:    data.metadata,
      read:        false,
    });
  },

  async listMyNotifications(workspaceId: string, userId: string, pagination: PaginationParams) {
    const { notifications, total } = await NotificationRepository.findByUserId(
      workspaceId,
      userId,
      pagination,
    );

    return {
      notifications,
      meta: buildPaginationMeta(total, pagination),
    };
  },

  async getUnreadCount(workspaceId: string, userId: string): Promise<number> {
    return NotificationRepository.unreadCount(workspaceId, userId);
  },

  async markRead(workspaceId: string, userId: string, id: string): Promise<INotification> {
    const notification = await NotificationRepository.markRead(workspaceId, userId, id);
    if (!notification) throw new NotFoundError('Notification');
    return notification;
  },

  async markAllRead(workspaceId: string, userId: string): Promise<number> {
    return NotificationRepository.markAllRead(workspaceId, userId);
  },

  async deleteNotification(workspaceId: string, userId: string, id: string): Promise<void> {
    const deleted = await NotificationRepository.deleteById(workspaceId, userId, id);
    if (!deleted) throw new NotFoundError('Notification');
  },
};
