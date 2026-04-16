import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { NotificationController } from './notification.controller.js';
import { createNotificationSchema, idParamSchema } from './notification.validation.js';

const router = Router();

router.use(requireAuth());

router.get('/', NotificationController.listMine);
router.get('/unread-count', NotificationController.unreadCount);
router.post('/', validate(createNotificationSchema), NotificationController.createMine);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', validate(idParamSchema, 'params'), NotificationController.markRead);
router.delete('/:id', validate(idParamSchema, 'params'), NotificationController.deleteMine);

export { router as notificationsRouter };
