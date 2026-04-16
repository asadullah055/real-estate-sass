import type { IFollowup } from './followup.model.js';

export interface FollowupDto {
  id: string;
  workspaceId: string;
  leadId?: string;
  sequenceId: string;
  stepNumber: number;
  type: string;
  content: { subject?: string; body: string };
  inquiry?: {
    name?: string;
    phone?: string;
    email?: string;
    propertyType?: string;
    preferredAreas?: string[];
    budget?: { min?: number; max?: number; currency?: string };
    timeline?: string;
    notes?: string;
  };
  response: { opened: boolean; clicked: boolean; replied: boolean };
  status: string;
  scheduledAt: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function toFollowupDto(f: IFollowup): FollowupDto {
  return {
    id:          f._id.toString(),
    workspaceId: f.workspaceId.toString(),
    leadId:      f.leadId?.toString(),
    sequenceId:  f.sequenceId,
    stepNumber:  f.stepNumber,
    type:        f.type,
    content:     f.content,
    inquiry:     f.inquiry,
    response:    f.response,
    status:      f.status,
    scheduledAt: f.scheduledAt.toISOString(),
    sentAt:      f.sentAt?.toISOString(),
    createdAt:   f.createdAt.toISOString(),
    updatedAt:   f.updatedAt.toISOString(),
  };
}
