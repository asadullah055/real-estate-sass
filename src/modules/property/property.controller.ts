import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../../common/utils/apiResponse.js';
import { PropertyService } from './property.service.js';
import { parsePagination } from '../../common/utils/pagination.js';

export const PropertyController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const result = await PropertyService.listProperties(
      tenantId,
      parsePagination(req.query),
      {
        status: req.query.status as string | undefined,
        type:   req.query.type as string | undefined,
        search: req.query.search as string | undefined,
      },
    );
    sendSuccess({ res, data: result.properties, meta: result.meta });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const p = await PropertyService.getPropertyById(req.params.id, req.user!.tenantId!.toString());
    sendSuccess({ res, data: p });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const p = await PropertyService.createProperty(
      req.user!.tenantId!.toString(),
      req.user!._id.toString(),
      req.body,
    );
    sendCreated({ res, data: p, message: 'Property created' });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const p = await PropertyService.updateProperty(req.params.id, req.user!.tenantId!.toString(), req.body);
    sendSuccess({ res, data: p, message: 'Property updated' });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await PropertyService.deleteProperty(req.params.id, req.user!.tenantId!.toString());
    sendSuccess({ res, message: 'Property deleted' });
  }),

  findMatches: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user!.tenantId!.toString();
    const criteria = {
      area:     req.query.area as string | undefined,
      type:     req.query.type as string | undefined,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
      budget:   req.query.maxBudget
        ? { max: parseInt(req.query.maxBudget as string) }
        : undefined,
    };
    const matches = await PropertyService.findMatchingProperties(tenantId, criteria);
    sendSuccess({ res, data: matches });
  }),
};
