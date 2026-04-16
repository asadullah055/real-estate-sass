import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';

/**
 * API key auth middleware for n8n ↔ Express communication.
 * Reads x-api-key header and compares against N8N_API_KEY env var.
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  if (!key || key !== env.N8N_API_KEY) {
    next(new UnauthorizedError('Invalid API key'));
    return;
  }
  next();
}
