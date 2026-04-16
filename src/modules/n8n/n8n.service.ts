import { NotFoundError } from '../../common/errors/NotFoundError.js';
import { UserRepository } from '../user/users.repository.js';
import { LeadService } from '../lead/lead.service.js';
import { CallService } from '../call/call.service.js';
import { FollowupService } from '../followup/followup.service.js';
import { MeetingService } from '../meeting/meeting.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

function pickRoundRobin<T>(items: T[], seed = 0): T | null {
  if (!items.length) return null;
  const index = Math.abs(seed) % items.length;
  return items[index] ?? null;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash;
}

export const N8nService = {
  async getAvailableAgents(workspaceId: string, leadId?: string) {
    const agents = await UserRepository.findAssignableAgents(workspaceId);
    const selected = pickRoundRobin(agents, hashString(leadId ?? new Date().toISOString()));

    return {
      selectedAgent: selected
        ? {
            id: selected._id.toString(),
            name: selected.name,
            email: selected.email,
            role: selected.role,
          }
        : null,
      agents: agents.map((agent) => ({
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role,
      })),
    };
  },

  async assignLead(workspaceId: string, leadId: string, agentId?: string) {
    let finalAgentId = agentId;
    if (!finalAgentId) {
      const { selectedAgent } = await this.getAvailableAgents(workspaceId, leadId);
      finalAgentId = selectedAgent?.id;
    }

    if (!finalAgentId) throw new NotFoundError('Assignable agent');

    return LeadService.updateLead(leadId, workspaceId, {
      assignedAgentId: finalAgentId as never,
    });
  },

  async triggerCall(params: {
    workspaceId: string;
    leadId: string;
    fromNumber: string;
    toNumber: string;
    agentId: string;
  }) {
    return CallService.initiateOutboundCall({
      tenantId: params.workspaceId,
      leadId: params.leadId,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      agentId: params.agentId,
    });
  },

  async startFollowup(workspaceId: string, leadId: string, sequenceId: string, startAt?: string) {
    return FollowupService.createFromSequence(workspaceId, leadId, sequenceId, startAt);
  },

  async updateFollowup(params: {
    workspaceId: string;
    followupId: string;
    status: 'sent' | 'failed';
    response?: { opened?: boolean; clicked?: boolean; replied?: boolean };
  }) {
    if (params.status === 'sent') {
      return FollowupService.markSent(params.followupId, params.workspaceId, params.response);
    }
    return FollowupService.markFailed(params.followupId, params.workspaceId);
  },

  async updateMeeting(workspaceId: string, meetingId: string, updates: Record<string, unknown>) {
    return MeetingService.updateMeeting(meetingId, workspaceId, updates as never);
  },

  async logNotification(params: {
    workspaceId: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    metadata?: Record<string, unknown>;
  }) {
    return NotificationService.createNotification(params.workspaceId, params.userId, {
      title: params.title,
      message: params.message,
      type: params.type,
      metadata: params.metadata,
    });
  },

  async updateScore(workspaceId: string, leadId: string, score: number, scoreCategory: 'hot' | 'warm' | 'cold' | 'dead') {
    return LeadService.updateLeadScore(leadId, workspaceId, score, scoreCategory);
  },

  async dueFollowups(workspaceId: string) {
    return FollowupService.getDueFollowups(workspaceId, 200);
  },

  async upcomingMeetings(workspaceId: string) {
    return MeetingService.getUpcomingMeetings(workspaceId);
  },

  async unrespondedLeads(workspaceId: string, hoursThreshold?: number) {
    return LeadService.getUnrespondedLeads(workspaceId, hoursThreshold ?? 24);
  },

  async coldLeads(workspaceId: string, daysThreshold?: number) {
    return LeadService.getColdLeads(workspaceId, daysThreshold ?? 30);
  },

  async analyticsData(workspaceId: string) {
    return AnalyticsService.getOverview(workspaceId);
  },
};
