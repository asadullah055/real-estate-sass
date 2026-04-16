import type { Request, Response } from 'express';
import { sendSuccess } from '../../common/utils/apiResponse.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { ValidationError } from '../../common/errors/ValidationError.js';
import { retellWebhookSchema } from './webhook.validation.js';
import { WebhookService } from './webhook.service.js';
import type { RetellWebhookDto } from './webhook.dto.js';

function parseRetellPayload(req: Request): RetellWebhookDto {
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body ?? {});
  let payload: unknown;

  try {
    payload = JSON.parse(raw);
  } catch {
    throw new ValidationError({ body: ['Invalid JSON body'] });
  }

  const parsed = retellWebhookSchema.safeParse(payload);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'body';
      (errors[key] ??= []).push(issue.message);
    }
    throw new ValidationError(errors);
  }

  return parsed.data;
}

export const WebhookController = {
  handleRetell: asyncHandler(async (req: Request, res: Response) => {
    const payload = parseRetellPayload(req);
    const data = await WebhookService.processRetellWebhook(payload);
    sendSuccess({ res, data, message: 'Retell webhook processed' });
  }),
};
