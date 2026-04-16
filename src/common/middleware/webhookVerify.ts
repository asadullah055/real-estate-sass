import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { logger } from '../../config/logger.js';

/**
 * Verifies Retell webhook signature using the global secret.
 * Must run on routes using express.raw({ type: 'application/json' }).
 */
export async function webhookVerify(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const signature = req.headers['x-retell-signature'] as string | undefined;

  if (!signature) {
    logger.warn('[webhook] missing x-retell-signature header');
    next(new UnauthorizedError('Missing webhook signature'));
    return;
  }

  const rawBuffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body ?? {}));

  const secret = env.RETELL_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn('[webhook] no secret configured; skipping signature verification');
    next();
    return;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex');

  if (signature.length !== expected.length) {
    logger.warn('[webhook] invalid signature length');
    next(new UnauthorizedError('Invalid webhook signature'));
    return;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))) {
    logger.warn('[webhook] invalid signature');
    next(new UnauthorizedError('Invalid webhook signature'));
    return;
  }

  next();
}
