import { Router } from 'express';
import { apiKeyAuth } from '../../common/middleware/apiKeyAuth.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { N8nController } from './n8n.controller.js';
import {
  assignLeadSchema,
  logNotificationSchema,
  startFollowupSchema,
  triggerCallSchema,
  updateFollowupSchema,
  updateMeetingSchema,
  updateScoreSchema,
  workspaceQuerySchema,
} from './n8n.validation.js';

const router = Router();

router.use(apiKeyAuth);

router.get('/available-agents', validate(workspaceQuerySchema, 'query'), N8nController.availableAgents);
router.post('/assign-lead', validate(assignLeadSchema), N8nController.assignLead);
router.post('/trigger-call', validate(triggerCallSchema), N8nController.triggerCall);
router.post('/start-followup', validate(startFollowupSchema), N8nController.startFollowup);
router.post('/update-followup', validate(updateFollowupSchema), N8nController.updateFollowup);
router.post('/update-meeting', validate(updateMeetingSchema), N8nController.updateMeeting);
router.post('/log-notification', validate(logNotificationSchema), N8nController.logNotification);
router.post('/update-score', validate(updateScoreSchema), N8nController.updateScore);
router.get('/due-followups', validate(workspaceQuerySchema, 'query'), N8nController.dueFollowups);
router.get('/upcoming-meetings', validate(workspaceQuerySchema, 'query'), N8nController.upcomingMeetings);
router.get('/unresponded-leads', validate(workspaceQuerySchema, 'query'), N8nController.unrespondedLeads);
router.get('/cold-leads', validate(workspaceQuerySchema, 'query'), N8nController.coldLeads);
router.get('/analytics-data', validate(workspaceQuerySchema, 'query'), N8nController.analyticsData);

export { router as n8nRouter };
