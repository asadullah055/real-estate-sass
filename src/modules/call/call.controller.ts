import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/apiResponse.js';
import { CallService } from './call.service.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { resolveDefaultWorkspaceId } from '../../common/utils/workspaceResolver.js';

export const CallController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const result = await CallService.listCalls(tenantId, parsePagination(req.query), {
      leadId:    req.query.leadId as string | undefined,
      direction: req.query.direction as string | undefined,
    });
    sendSuccess({ res, data: result.calls, meta: result.meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const call = await CallService.getCallById(req.params.id, req.user!.tenantId!.toString());
    sendSuccess({ res, data: call });
  }),

  getByLead: asyncHandler(async (req: Request, res: Response) => {
    const calls = await CallService.getCallsByLead(req.params.leadId, req.user!.tenantId!.toString());
    sendSuccess({ res, data: calls });
  }),

  /**
   * POST /api/calls/sync-retell
   * Imports all ended calls from Retell AI and scores each lead.
   * Idempotent — safe to call multiple times.
   */
  syncFromRetell: asyncHandler(async (req: Request, res: Response) => {
    const tenantId =
      req.user?.tenantId?.toString() ?? (await resolveDefaultWorkspaceId());

    if (!tenantId) {
      res.status(400).json({ success: false, message: 'No workspace found. Set DEFAULT_WORKSPACE_ID in .env or assign a tenantId to your user.' });
      return;
    }

    const limit   = req.body.limit   ? Number(req.body.limit)   : 100;
    const agentId = req.body.agentId ? String(req.body.agentId) : undefined;

    const result = await CallService.syncFromRetell(tenantId, { limit, agentId });
    sendSuccess({ res, data: result, message: `Synced ${result.synced} calls, skipped ${result.skipped}` });
  }),
};
