import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/apiResponse.js';
import { TenantService } from './tenant.service.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';

export const TenantSettingsController = {
  getSettings: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId?.toString();
    if (!tenantId) throw new NotFoundError('Workspace');
    const settings = await TenantService.getSettings(tenantId);
    sendSuccess({ res, data: settings });
  }),

  updateRetellSettings: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId?.toString();
    if (!tenantId) throw new NotFoundError('Workspace');
    const settings = await TenantService.updateRetellSettings(tenantId, req.body);
    sendSuccess({ res, data: settings, message: 'Retell settings updated' });
  }),
};
