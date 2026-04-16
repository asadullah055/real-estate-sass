import type { IProperty } from './property.model.js';

export interface PropertyDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  type: string;
  price: number;
  currency: string;
  area: string;
  city: string;
  country: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  images?: string[];
  features?: string[];
  matchingTags?: { area: string; type: string; minBudget?: number; maxBudget?: number };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function toPropertyDto(p: IProperty): PropertyDto {
  return {
    id:          p._id.toString(),
    title:       p.title,
    description: p.description,
    status:      p.status,
    type:        p.type,
    price:       p.price,
    currency:    p.currency,
    area:        p.area,
    city:        p.city,
    country:     p.country,
    address:     p.address,
    bedrooms:    p.bedrooms,
    bathrooms:   p.bathrooms,
    sizeSqm:     p.sizeSqm,
    images:      p.images,
    features:    p.features,
    matchingTags:p.matchingTags,
    createdBy:   p.createdBy.toString(),
    createdAt:   p.createdAt.toISOString(),
    updatedAt:   p.updatedAt.toISOString(),
  };
}
