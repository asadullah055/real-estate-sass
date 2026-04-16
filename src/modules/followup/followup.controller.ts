import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../common/utils/apiResponse.js';
import { FollowupService } from './followup.service.js';
import { ForbiddenError } from '../../common/errors/AppError.js';

function getWorkspaceId(req: Request): string {
  const workspaceId = req.user?.tenantId?.toString();
  if (!workspaceId) throw new ForbiddenError('Workspace access required');
  return workspaceId;
}

export const FollowupController = {
  createSequence: asyncHandler(async (req: Request, res: Response) => {
    const sequence = await FollowupService.createSequence(getWorkspaceId(req), req.body);
    sendCreated({ res, data: sequence, message: 'Sequence created' });
  }),

  listSequences: asyncHandler(async (req: Request, res: Response) => {
    const sequences = await FollowupService.listSequences(getWorkspaceId(req));
    sendSuccess({ res, data: sequences });
  }),

  getSequenceById: asyncHandler(async (req: Request, res: Response) => {
    const sequence = await FollowupService.getSequenceById(
      getWorkspaceId(req),
      req.params.sequenceId,
    );
    sendSuccess({ res, data: sequence });
  }),

  updateSequenceById: asyncHandler(async (req: Request, res: Response) => {
    const sequence = await FollowupService.updateSequenceById(
      getWorkspaceId(req),
      req.params.sequenceId,
      req.body,
    );
    sendSuccess({ res, data: sequence, message: 'Sequence updated' });
  }),

  deleteSequenceById: asyncHandler(async (req: Request, res: Response) => {
    await FollowupService.deleteSequenceById(getWorkspaceId(req), req.params.sequenceId);
    sendSuccess({ res, message: 'Sequence deleted' });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const followup = await FollowupService.createFollowup(getWorkspaceId(req), req.body);
    sendCreated({ res, data: followup, message: 'Follow-up created' });
  }),

  createFromSequence: asyncHandler(async (req: Request, res: Response) => {
    const followups = await FollowupService.createFromSequence(
      getWorkspaceId(req),
      req.body.leadId,
      req.body.sequenceId,
      req.body.startAt,
    );
    sendCreated({ res, data: followups, message: 'Follow-ups scheduled from sequence' });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const leadId = req.query.leadId as string | undefined;
    const followups = await FollowupService.listFollowups(getWorkspaceId(req), leadId);
    sendSuccess({ res, data: followups });
  }),

  listByLead: asyncHandler(async (req: Request, res: Response) => {
    const followups = await FollowupService.listFollowups(
      getWorkspaceId(req),
      req.params.leadId,
    );
    sendSuccess({ res, data: followups });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const followup = await FollowupService.getFollowupById(req.params.id, getWorkspaceId(req));
    sendSuccess({ res, data: followup });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const followup = await FollowupService.updateFollowupById(
      req.params.id,
      getWorkspaceId(req),
      req.body,
    );
    sendSuccess({ res, data: followup, message: 'Follow-up updated' });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await FollowupService.deleteFollowupById(req.params.id, getWorkspaceId(req));
    sendSuccess({ res, message: 'Follow-up deleted' });
  }),

  due: asyncHandler(async (req: Request, res: Response) => {
    const rawLimit = req.query.limit as string | undefined;
    const limit = rawLimit ? Number.parseInt(rawLimit, 10) : undefined;
    const followups = await FollowupService.getDueFollowups(getWorkspaceId(req), limit);
    sendSuccess({ res, data: followups });
  }),

  markSent: asyncHandler(async (req: Request, res: Response) => {
    const followup = await FollowupService.markSent(
      req.params.id,
      getWorkspaceId(req),
      req.body.response,
    );
    sendSuccess({ res, data: followup, message: 'Follow-up marked as sent' });
  }),

  markFailed: asyncHandler(async (req: Request, res: Response) => {
    const followup = await FollowupService.markFailed(req.params.id, getWorkspaceId(req));
    sendSuccess({ res, data: followup, message: 'Follow-up marked as failed' });
  }),

  cancelByLead: asyncHandler(async (req: Request, res: Response) => {
    const cancelledCount = await FollowupService.cancelSequence(
      getWorkspaceId(req),
      req.params.leadId,
    );
    sendSuccess({
      res,
      data: { cancelledCount },
      message: 'Sequence cancelled for lead',
    });
  }),
};
