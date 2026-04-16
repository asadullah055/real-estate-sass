import { Router } from 'express';
import { LeadController } from './lead.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createLeadSchema, updateLeadSchema, leadFormSchema } from './lead.validation.js';
import { generalRateLimiter } from '../../common/middleware/rateLimiter.middleware.js';

const router = Router();

// Public — website lead capture form (rate-limited)
router.post('/form', generalRateLimiter, validate(leadFormSchema), LeadController.submitForm);

// Protected routes
router.use(requireAuth());

router.get('/',          LeadController.list);
router.get('/stats',     LeadController.stats);
router.get('/:id',       LeadController.getById);
router.post('/',         validate(createLeadSchema), LeadController.create);
router.patch('/:id',     validate(updateLeadSchema), LeadController.update);
router.delete('/:id',    LeadController.delete);

export { router as leadsRouter };
