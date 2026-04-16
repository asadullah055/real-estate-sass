import { Router } from 'express';
import { CallController } from './call.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth());

router.get('/',                    CallController.list);
router.post('/sync-retell',        CallController.syncFromRetell);
router.get('/lead/:leadId',        CallController.getByLead);
router.get('/:id',                 CallController.getById);

export { router as callsRouter };
