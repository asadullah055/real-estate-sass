import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import {
  updateStatusSchema,
  createAdminSchema,
  updateAdminSchema,
} from './users.validation.js';

const router = Router();

// ── Users ────────────────────────────────────────────────────────────────────

router.get('/users', requireAuth(), UsersController.listUsers);
router.get('/users/:id', requireAuth(), UsersController.getUserById);
router.patch('/users/:id/status', requireAuth(), validate(updateStatusSchema), UsersController.updateUserStatus);

// ── Admins ───────────────────────────────────────────────────────────────────

router.get('/admin', requireAuth(), UsersController.listAdmins);
router.post('/admin', requireAuth(), validate(createAdminSchema), UsersController.createAdmin);
router.patch('/admin/:id', requireAuth(), validate(updateAdminSchema), UsersController.updateAdmin);
router.delete('/admin/:id', requireAuth(), UsersController.deleteAdmin);

// ── Analytics ────────────────────────────────────────────────────────────────

router.get('/analytics', requireAuth(), UsersController.getAnalytics);

// ── Stats (dashboard) ────────────────────────────────────────────────────────

router.get('/stats', requireAuth(), UsersController.getDashboardStats);

export { router as usersRouter };
