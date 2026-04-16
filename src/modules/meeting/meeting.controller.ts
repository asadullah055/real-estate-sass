import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../common/utils/apiResponse.js';
import { MeetingService } from './meeting.service.js';
import { parsePagination } from '../../common/utils/pagination.js';

export const MeetingController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const result = await MeetingService.listMeetings(tenantId, parsePagination(req.query), {
      status:  req.query.status as string | undefined,
      agentId: req.query.agentId as string | undefined,
      leadId:  req.query.leadId as string | undefined,
    });
    sendSuccess({ res, data: result.meetings, meta: result.meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const m = await MeetingService.getMeetingById(req.params.id, req.user!.tenantId!.toString());
    sendSuccess({ res, data: m });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const m = await MeetingService.createMeeting(req.user!.tenantId!.toString(), req.body);
    sendCreated({ res, data: m, message: 'Meeting scheduled' });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const m = await MeetingService.updateMeeting(req.params.id, req.user!.tenantId!.toString(), req.body);
    sendSuccess({ res, data: m, message: 'Meeting updated' });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await MeetingService.deleteMeeting(req.params.id, req.user!.tenantId!.toString());
    sendSuccess({ res, message: 'Meeting cancelled' });
  }),

  upcoming: asyncHandler(async (req: Request, res: Response) => {
    const meetings = await MeetingService.getUpcomingMeetings(req.user!.tenantId!.toString());
    sendSuccess({ res, data: meetings });
  }),
};
