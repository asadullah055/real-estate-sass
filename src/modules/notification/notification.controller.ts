import type { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../common/utils/apiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { ForbiddenError } from '../../common/errors/AppError.js';
import { NotificationService } from './notification.service.js';

function requireWorkspaceAndUser(req: Request): { workspaceId: string; userId: string } {
  const workspaceId = req.user?.tenantId?.toString();
  const userId = req.user?._id?.toString();

  if (!workspaceId || !userId) {
    throw new ForbiddenError('Workspace and user context required');
  }

  return { workspaceId, userId };
}

export const NotificationController = {
  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, userId } = requireWorkspaceAndUser(req);
    const result = await NotificationService.listMyNotifications(
      workspaceId,
      userId,
      parsePagination(req.query),
    );

    sendSuccess({ res, data: result.notifications, meta: result.meta as unknown as Record<string, unknown> });
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, userId } = requireWorkspaceAndUser(req);
    const count = await NotificationService.getUnreadCount(workspaceId, userId);
    sendSuccess({ res, data: { count } });
  }),

  createMine: asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, userId } = requireWorkspaceAndUser(req);
    const notification = await NotificationService.createNotification(workspaceId, userId, req.body);
    sendCreated({ res, data: notification, message: 'Notification created' });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, userId } = requireWorkspaceAndUser(req);
    const notification = await NotificationService.markRead(workspaceId, userId, req.params.id);
    sendSuccess({ res, data: notification, message: 'Notification marked as read' });
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, userId } = requireWorkspaceAndUser(req);
    const modifiedCount = await NotificationService.markAllRead(workspaceId, userId);
    sendSuccess({ res, data: { modifiedCount }, message: 'All notifications marked as read' });
  }),

  deleteMine: asyncHandler(async (req: Request, res: Response) => {
    const { workspaceId, userId } = requireWorkspaceAndUser(req);
    await NotificationService.deleteNotification(workspaceId, userId, req.params.id);
    sendSuccess({ res, message: 'Notification deleted' });
  }),
};
