import express, { Router } from 'express';
import { webhookVerify } from '../../common/middleware/webhookVerify.js';
import { WebhookController } from './webhook.controller.js';

const router = Router();

router.post(
  '/retell',
  express.raw({ type: 'application/json' }),
  webhookVerify,
  WebhookController.handleRetell,
);

export { router as webhooksRouter };
