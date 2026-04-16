import { PropertyRepository } from './property.repository.js';
import { toPropertyDto, type PropertyDto } from './property.dto.js';
import { buildPaginationMeta, type PaginationParams } from '../../common/utils/pagination.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';
import type { IProperty } from './property.model.js';

export const PropertyService = {
  async listProperties(
    tenantId: string,
    pagination: PaginationParams,
    filters: { status?: string; type?: string; search?: string },
  ) {
    const { properties, total } = await PropertyRepository.findAll(tenantId, pagination, filters);
    return { properties: properties.map(toPropertyDto), meta: buildPaginationMeta(total, pagination) };
  },

  async getPropertyById(id: string, tenantId: string): Promise<PropertyDto> {
    const p = await PropertyRepository.findById(id, tenantId);
    if (!p) throw new NotFoundError('Property');
    return toPropertyDto(p);
  },

  async createProperty(tenantId: string, userId: string, data: Partial<IProperty>): Promise<PropertyDto> {
    const p = await PropertyRepository.create({
      ...data,
      tenantId:  tenantId as unknown as IProperty['tenantId'],
      createdBy: userId as unknown as IProperty['createdBy'],
    });
    return toPropertyDto(p);
  },

  async updateProperty(id: string, tenantId: string, data: Partial<IProperty>): Promise<PropertyDto> {
    const p = await PropertyRepository.updateById(id, tenantId, data);
    if (!p) throw new NotFoundError('Property');
    return toPropertyDto(p);
  },

  async deleteProperty(id: string, tenantId: string): Promise<void> {
    const deleted = await PropertyRepository.deleteById(id, tenantId);
    if (!deleted) throw new NotFoundError('Property');
  },

  async findMatchingProperties(tenantId: string, criteria: {
    area?: string;
    type?: string;
    budget?: { min?: number; max?: number };
    bedrooms?: number;
  }): Promise<PropertyDto[]> {
    const matches = await PropertyRepository.findMatchingForLead(tenantId, criteria);
    return matches.map(toPropertyDto);
  },
};
