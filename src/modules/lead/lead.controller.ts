import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../common/utils/apiResponse.js';
import { LeadService } from './lead.service.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { resolveDefaultWorkspaceId } from '../../common/utils/workspaceResolver.js';
import { ForbiddenError } from '../../common/errors/AppError.js';
import { n8nClient } from '../../infra/n8n/index.js';
import { FollowupService } from '../followup/followup.service.js';

export const LeadController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const pagination = parsePagination(req.query);
    const talked = req.query.talked === 'true';
    const statuses = typeof req.query.statuses === 'string'
      ? req.query.statuses.split(',').map((item) => item.trim()).filter(Boolean)
      : undefined;
    const filters = {
      status:          req.query.status as string | undefined,
      statuses,
      search:          req.query.search as string | undefined,
      assignedAgentId: req.query.assignedAgentId as string | undefined,
      talked,
    };
    const result = await LeadService.listLeads(tenantId, pagination, filters);
    sendSuccess({ res, data: result.leads, meta: result.meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const lead = await LeadService.getLeadById(req.params.id, tenantId);
    sendSuccess({ res, data: lead });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const lead = await LeadService.createLead(tenantId, req.body);
    sendCreated({ res, data: lead, message: 'Lead created' });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const lead = await LeadService.updateLead(req.params.id, tenantId, req.body);
    sendSuccess({ res, data: lead, message: 'Lead updated' });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    await LeadService.deleteLead(req.params.id, tenantId);
    sendSuccess({ res, message: 'Lead deleted' });
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const stats = await LeadService.getLeadStats(tenantId);
    sendSuccess({ res, data: stats });
  }),

  /** POST /api/leads/form — public endpoint */
  submitForm: asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = await resolveDefaultWorkspaceId();
    if (!workspaceId) {
      throw new ForbiddenError('Workspace access required');
    }

    const followup = await FollowupService.createFollowup(workspaceId, {
      sequenceId: 'website_inquiry',
      stepNumber: 1,
      type: 'call',
      content: {
        subject: 'Initial inquiry follow-up',
        body: `Call back ${req.body?.name ?? 'the customer'} regarding the new website inquiry.`,
      },
      scheduledAt: new Date(),
      status: 'scheduled',
      response: {
        opened: false,
        clicked: false,
        replied: false,
      },
      inquiry: {
        name: req.body?.name,
        phone: req.body?.phone,
        email: req.body?.email,
        propertyType: req.body?.propertyType,
        preferredAreas: req.body?.preferredAreas,
        budget: req.body?.budget,
        timeline: req.body?.timeline,
        notes: req.body?.notes,
      },
    });

    n8nClient.trigger('new_lead', {
      payload: {
        followupId: followup._id.toString(),
        source: 'website_form',
        name: req.body?.name,
        phone: req.body?.phone,
        email: req.body?.email,
        propertyType: req.body?.propertyType,
        preferredAreas: req.body?.preferredAreas,
        budget: req.body?.budget,
        timeline: req.body?.timeline,
        notes: req.body?.notes,
      },
    });

    sendCreated({ res, data: { followupId: followup._id.toString() }, message: 'Thank you! We will be in touch.' });
  }),
};
