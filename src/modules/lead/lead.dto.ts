import type { ILead } from './lead.model.js';

export interface LeadDto {
  id: string;
  name: string;
  email?: string;
  phone: string;
  source: string;
  status: string;
  score: number;
  scoreCategory: string;
  assignedAgentId?: string;
  budget?: { min?: number; max?: number; currency?: string };
  preferredAreas?: string[];
  propertyType?: string;
  bedrooms?: number;
  timeline?: string;
  retellData?: {
    interestLevel?: string;
    isSeriousBuyer?: boolean;
    sentiment?: string;
    notes?: string;
    lastCallId?: string;
  };
  lastContactedAt?: string;
  meetingBookedAt?: string;
  convertedAt?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export function toLeadDto(lead: ILead): LeadDto {
  return {
    id:              lead._id.toString(),
    name:            lead.name,
    email:           lead.email,
    phone:           lead.phone,
    source:          lead.source,
    status:          lead.status,
    score:           lead.score,
    scoreCategory:   lead.scoreCategory,
    assignedAgentId: lead.assignedAgentId?.toString(),
    budget:          lead.budget,
    preferredAreas:  lead.preferredAreas,
    propertyType:    lead.propertyType,
    bedrooms:        lead.bedrooms,
    timeline:        lead.timeline,
    retellData:      lead.retellData,
    lastContactedAt: lead.lastContactedAt?.toISOString(),
    meetingBookedAt: lead.meetingBookedAt?.toISOString(),
    convertedAt:     lead.convertedAt?.toISOString(),
    notes:           lead.notes,
    tags:            lead.tags,
    createdAt:       lead.createdAt.toISOString(),
    updatedAt:       lead.updatedAt.toISOString(),
  };
}
