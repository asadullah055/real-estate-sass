import type { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/utils/apiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ForbiddenError } from '../../common/errors/AppError.js';
import { AnalyticsService } from './analytics.service.js';
import { resolveDefaultWorkspaceId } from '../../common/utils/workspaceResolver.js';

async function getWorkspaceIdOptional(req: Request): Promise<string | undefined> {
  const workspaceId = req.user?.tenantId?.toString();
  if (workspaceId) return workspaceId;
  return resolveDefaultWorkspaceId();
}

async function getWorkspaceId(req: Request): Promise<string> {
  const workspaceId = await getWorkspaceIdOptional(req);
  if (workspaceId) return workspaceId;
  throw new ForbiddenError('Workspace access required');
}

export const AnalyticsController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    const data = await AnalyticsService.getOverview(await getWorkspaceIdOptional(req));
    sendSuccess({ res, data });
  }),

  createSnapshot: asyncHandler(async (req: Request, res: Response) => {
    const data = await AnalyticsService.snapshot(await getWorkspaceId(req), req.body?.date);
    sendCreated({ res, data, message: 'Analytics snapshot saved' });
  }),

  listSnapshots: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number.parseInt(req.query.limit as string, 10) : undefined;
    const data = await AnalyticsService.listSnapshots(await getWorkspaceId(req), limit);
    sendSuccess({ res, data });
  }),
};
