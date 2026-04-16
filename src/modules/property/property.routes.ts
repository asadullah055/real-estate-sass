import { Router } from 'express';
import { PropertyController } from './property.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createPropertySchema, updatePropertySchema } from './property.validation.js';

const router = Router();

router.use(requireAuth());

router.get('/',          PropertyController.list);
router.get('/matches',   PropertyController.findMatches);
router.get('/:id',       PropertyController.getById);
router.post('/',         validate(createPropertySchema), PropertyController.create);
router.patch('/:id',     validate(updatePropertySchema), PropertyController.update);
router.delete('/:id',    PropertyController.delete);

export { router as propertiesRouter };
