export const FOLLOWUP_SEQUENCES = {
  WARM_NURTURE: 'warm_nurture',
  COLD_NURTURE: 'cold_nurture',
  POST_MEETING: 'post_meeting',
  RE_ENGAGEMENT: 're_engagement',
  HOT_LEAD: 'hot_lead',
} as const;

export type FollowupSequence = (typeof FOLLOWUP_SEQUENCES)[keyof typeof FOLLOWUP_SEQUENCES];

export const FOLLOWUP_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'skipped',
} as const;

export type FollowupStatus = (typeof FOLLOWUP_STATUS)[keyof typeof FOLLOWUP_STATUS];
