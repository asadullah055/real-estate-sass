import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/apiResponse.js';
import { ValidationError } from '../../common/errors/ValidationError.js';
import { N8nService } from './n8n.service.js';

function readWorkspaceId(req: Request): string {
  const workspaceId =
    (req.body?.workspaceId as string | undefined) ?? (req.query.workspaceId as string | undefined);

  if (!workspaceId) {
    throw new ValidationError({ workspaceId: ['workspaceId is required'] });
  }

  return workspaceId;
}

export const N8nController = {
  availableAgents: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = readWorkspaceId(req);
    const leadId = req.query.leadId as string | undefined;
    const data = await N8nService.getAvailableAgents(workspaceId, leadId);
    sendSuccess({ res, data });
  }),

  assignLead: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.assignLead(req.body.workspaceId, req.body.leadId, req.body.agentId);
    sendSuccess({ res, data, message: 'Lead assigned' });
  }),

  triggerCall: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.triggerCall(req.body);
    sendSuccess({ res, data, message: 'Call triggered' });
  }),

  startFollowup: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.startFollowup(
      req.body.workspaceId,
      req.body.leadId,
      req.body.sequenceId,
      req.body.startAt,
    );
    sendSuccess({ res, data, message: 'Follow-up sequence started' });
  }),

  updateFollowup: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.updateFollowup(req.body);
    sendSuccess({ res, data, message: 'Follow-up updated' });
  }),

  updateMeeting: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.updateMeeting(req.body.workspaceId, req.body.meetingId, req.body.updates);
    sendSuccess({ res, data, message: 'Meeting updated' });
  }),

  logNotification: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.logNotification(req.body);
    sendSuccess({ res, data, message: 'Notification logged' });
  }),

  updateScore: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.updateScore(
      req.body.workspaceId,
      req.body.leadId,
      req.body.score,
      req.body.scoreCategory,
    );
    sendSuccess({ res, data, message: 'Score updated' });
  }),

  dueFollowups: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.dueFollowups(readWorkspaceId(req));
    sendSuccess({ res, data });
  }),

  upcomingMeetings: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.upcomingMeetings(readWorkspaceId(req));
    sendSuccess({ res, data });
  }),

  unrespondedLeads: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = readWorkspaceId(req);
    const hours = req.query.hours ? Number.parseInt(req.query.hours as string, 10) : undefined;
    const data = await N8nService.unrespondedLeads(workspaceId, hours);
    sendSuccess({ res, data });
  }),

  coldLeads: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = readWorkspaceId(req);
    const days = req.query.days ? Number.parseInt(req.query.days as string, 10) : undefined;
    const data = await N8nService.coldLeads(workspaceId, days);
    sendSuccess({ res, data });
  }),

  analyticsData: asyncHandler(async (req: Request, res: Response) => {
    const data = await N8nService.analyticsData(readWorkspaceId(req));
    sendSuccess({ res, data });
  }),
};
