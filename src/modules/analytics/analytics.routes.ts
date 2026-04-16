import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { AnalyticsController } from './analytics.controller.js';
import { createSnapshotSchema } from './analytics.validation.js';

const router = Router();

router.use(requireAuth());

router.get('/overview', AnalyticsController.overview);
router.get('/snapshots', AnalyticsController.listSnapshots);
router.post('/snapshots', validate(createSnapshotSchema), AnalyticsController.createSnapshot);

export { router as analyticsRouter };
