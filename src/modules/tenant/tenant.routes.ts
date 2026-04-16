import { Router } from 'express';
import { TenantSettingsController } from './tenant.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { updateRetellSettingsSchema } from './tenant.validation.js';

const router = Router();

router.use(requireAuth());

router.get('/',               TenantSettingsController.getSettings);
router.patch('/retell',
  validate(updateRetellSettingsSchema),
  TenantSettingsController.updateRetellSettings,
);

export { router as settingsRouter };
