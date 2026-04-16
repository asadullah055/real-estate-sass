import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    title:       z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    type:        z.enum(['apartment', 'villa', 'townhouse', 'land', 'commercial', 'other']),
    price:       z.number().positive(),
    currency:    z.string().default('USD'),
    area:        z.string().min(1),
    city:        z.string().min(1),
    country:     z.string().min(1),
    address:     z.string().optional(),
    bedrooms:    z.number().int().optional(),
    bathrooms:   z.number().int().optional(),
    sizeSqm:     z.number().optional(),
    images:      z.array(z.string().url()).optional(),
    features:    z.array(z.string()).optional(),
    matchingTags:z.object({
      area:      z.string(),
      type:      z.string(),
      minBudget: z.number().optional(),
      maxBudget: z.number().optional(),
    }).optional(),
  }),
});

export const updatePropertySchema = z.object({
  body: z.object({
    title:       z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    status:      z.enum(['available', 'under_offer', 'sold', 'rented', 'off_market']).optional(),
    type:        z.enum(['apartment', 'villa', 'townhouse', 'land', 'commercial', 'other']).optional(),
    price:       z.number().positive().optional(),
    currency:    z.string().optional(),
    area:        z.string().optional(),
    city:        z.string().optional(),
    country:     z.string().optional(),
    address:     z.string().optional(),
    bedrooms:    z.number().int().optional(),
    bathrooms:   z.number().int().optional(),
    sizeSqm:     z.number().optional(),
    images:      z.array(z.string()).optional(),
    features:    z.array(z.string()).optional(),
    matchingTags:z.object({
      area:      z.string(),
      type:      z.string(),
      minBudget: z.number().optional(),
      maxBudget: z.number().optional(),
    }).optional(),
  }),
});
