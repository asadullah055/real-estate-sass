import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { revokeSessionSchema } from './auth.validation.js';

const router = Router();

// GET /api/profile
router.get('/profile', requireAuth(), AuthController.getProfile);

// GET /api/sessions
router.get('/sessions', requireAuth(), AuthController.listSessions);

// POST /api/sessions/revoke
router.post(
  '/sessions/revoke',
  requireAuth(),
  validate(revokeSessionSchema),
  AuthController.revokeSession,
);

// POST /api/sessions/revoke-others
router.post('/sessions/revoke-others', requireAuth(), AuthController.revokeOtherSessions);

export { router as authApiRouter };
