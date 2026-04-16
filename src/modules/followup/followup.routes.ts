import { Router } from 'express';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { FollowupController } from './followup.controller.js';
import {
  createFollowupSchema,
  createFromSequenceSchema,
  createSequenceSchema,
  idParamSchema,
  leadIdParamSchema,
  markSentSchema,
  sequenceIdParamSchema,
  updateFollowupSchema,
  updateSequenceSchema,
} from './followup.validation.js';

const router = Router();

router.use(requireAuth());

router.get('/sequences', FollowupController.listSequences);
router.get(
  '/sequences/:sequenceId',
  validate(sequenceIdParamSchema, 'params'),
  FollowupController.getSequenceById,
);
router.post('/sequences', validate(createSequenceSchema), FollowupController.createSequence);
router.patch(
  '/sequences/:sequenceId',
  validate(sequenceIdParamSchema, 'params'),
  validate(updateSequenceSchema),
  FollowupController.updateSequenceById,
);
router.delete(
  '/sequences/:sequenceId',
  validate(sequenceIdParamSchema, 'params'),
  FollowupController.deleteSequenceById,
);

router.get('/due', FollowupController.due);
router.get('/lead/:leadId', validate(leadIdParamSchema, 'params'), FollowupController.listByLead);
router.patch(
  '/lead/:leadId/cancel',
  validate(leadIdParamSchema, 'params'),
  FollowupController.cancelByLead,
);

router.get('/', FollowupController.list);
router.get('/:id', validate(idParamSchema, 'params'), FollowupController.getById);
router.post('/', validate(createFollowupSchema), FollowupController.create);
router.post('/from-sequence', validate(createFromSequenceSchema), FollowupController.createFromSequence);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateFollowupSchema), FollowupController.update);
router.patch('/:id/sent', validate(idParamSchema, 'params'), validate(markSentSchema), FollowupController.markSent);
router.patch('/:id/failed', validate(idParamSchema, 'params'), FollowupController.markFailed);
router.delete('/:id', validate(idParamSchema, 'params'), FollowupController.delete);

export { router as followupsRouter };
