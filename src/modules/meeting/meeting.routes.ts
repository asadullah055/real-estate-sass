import { Router } from 'express';
import { MeetingController } from './meeting.controller.js';
import { requireAuth } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { createMeetingSchema, updateMeetingSchema } from './meeting.validation.js';

const router = Router();

router.use(requireAuth());

router.get('/',          MeetingController.list);
router.get('/upcoming',  MeetingController.upcoming);
router.get('/:id',       MeetingController.getById);
router.post('/',         validate(createMeetingSchema), MeetingController.create);
router.patch('/:id',     validate(updateMeetingSchema), MeetingController.update);
router.delete('/:id',    MeetingController.delete);

export { router as meetingsRouter };
