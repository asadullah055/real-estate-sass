export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  MEETING_SCHEDULED: 'meeting_scheduled',
  NEGOTIATING: 'negotiating',
  CONVERTED: 'converted',
  LOST: 'lost',
  DEAD: 'dead',
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const LEAD_SOURCE = {
  WEBSITE_FORM: 'website_form',
  INBOUND_CALL: 'inbound_call',
  OUTBOUND_CALL: 'outbound_call',
  MANUAL: 'manual',
  REFERRAL: 'referral',
} as const;

export type LeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];
