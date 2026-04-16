import type { IMeeting } from './meeting.model.js';

export interface MeetingDto {
  id: string;
  leadId: string;
  agentId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  meetingType: string;
  location?: string;
  meetingUrl?: string;
  notes?: string;
  outcome?: string;
  outcomeNotes?: string;
  completedAt?: string;
  createdAt: string;
}

export function toMeetingDto(m: IMeeting): MeetingDto {
  return {
    id:              m._id.toString(),
    leadId:          m.leadId.toString(),
    agentId:         m.agentId.toString(),
    title:           m.title,
    scheduledAt:     m.scheduledAt.toISOString(),
    durationMinutes: m.durationMinutes,
    status:          m.status,
    meetingType:     m.meetingType,
    location:        m.location,
    meetingUrl:      m.meetingUrl,
    notes:           m.notes,
    outcome:         m.outcome,
    outcomeNotes:    m.outcomeNotes,
    completedAt:     m.completedAt?.toISOString(),
    createdAt:       m.createdAt.toISOString(),
  };
}
