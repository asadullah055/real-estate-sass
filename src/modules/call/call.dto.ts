import type { ICall } from './call.model.js';

export interface CallDto {
  id: string;
  leadId: string;
  retellCallId: string;
  agentId: string;
  direction: string;
  status: string;
  fromNumber?: string;
  toNumber?: string;
  durationSeconds?: number;
  transcript?: string;
  recordingUrl?: string;
  customAnalysisData?: Record<string, unknown>;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export function toCallDto(c: ICall): CallDto {
  return {
    id:                 c._id.toString(),
    leadId:             c.leadId.toString(),
    retellCallId:       c.retellCallId,
    agentId:            c.agentId,
    direction:          c.direction,
    status:             c.status,
    fromNumber:         c.fromNumber,
    toNumber:           c.toNumber,
    durationSeconds:    c.durationSeconds,
    transcript:         c.transcript,
    recordingUrl:       c.recordingUrl,
    customAnalysisData: c.customAnalysisData,
    startedAt:          c.startedAt?.toISOString(),
    endedAt:            c.endedAt?.toISOString(),
    createdAt:          c.createdAt.toISOString(),
  };
}
