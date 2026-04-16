import { Types } from 'mongoose';
import { LeadModel } from '../lead/lead.model.js';
import { CallModel } from '../call/call.model.js';
import { MeetingModel } from '../meeting/meeting.model.js';
import { FollowupModel } from '../followup/followup.model.js';
import { AnalyticsSnapshotModel, type IAnalyticsSnapshot } from './analytics.model.js';

export interface WorkspaceAnalyticsOverview {
  leadsTotal: number;
  leadsNew: number;
  leadsQualified: number;
  callsTotal: number;
  meetingsUpcoming: number;
  followupsDue: number;
}

export const AnalyticsRepository = {
  async getOverview(workspaceId?: string): Promise<WorkspaceAnalyticsOverview> {
    const wid = workspaceId ? new Types.ObjectId(workspaceId) : null;
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const leadQuery = wid ? { tenantId: wid } : {};
    const leadNewQuery = wid
      ? { tenantId: wid, createdAt: { $gte: sevenDaysAgo } }
      : { createdAt: { $gte: sevenDaysAgo } };
    const leadQualifiedQuery = wid
      ? { tenantId: wid, status: { $in: ['qualified', 'converted'] } }
      : { status: { $in: ['qualified', 'converted'] } };

    const callQuery = wid ? { tenantId: wid } : {};
    const meetingQuery = wid
      ? {
          tenantId: wid,
          scheduledAt: { $gte: now },
          status: { $in: ['scheduled', 'confirmed'] },
        }
      : {
          scheduledAt: { $gte: now },
          status: { $in: ['scheduled', 'confirmed'] },
        };
    const followupQuery = wid
      ? {
          workspaceId: wid,
          status: 'scheduled',
          scheduledAt: { $lte: now },
        }
      : {
          status: 'scheduled',
          scheduledAt: { $lte: now },
        };

    const [
      leadsTotal,
      leadsNew,
      leadsQualified,
      callsTotal,
      meetingsUpcoming,
      followupsDue,
    ] = await Promise.all([
      LeadModel.countDocuments(leadQuery),
      LeadModel.countDocuments(leadNewQuery),
      LeadModel.countDocuments(leadQualifiedQuery),
      CallModel.countDocuments(callQuery),
      MeetingModel.countDocuments(meetingQuery),
      FollowupModel.countDocuments(followupQuery),
    ]);

    return {
      leadsTotal,
      leadsNew,
      leadsQualified,
      callsTotal,
      meetingsUpcoming,
      followupsDue,
    };
  },

  async upsertSnapshot(
    workspaceId: string,
    date: Date,
    metrics: WorkspaceAnalyticsOverview,
  ): Promise<IAnalyticsSnapshot> {
    return AnalyticsSnapshotModel.findOneAndUpdate(
      { workspaceId: new Types.ObjectId(workspaceId), date },
      { $set: { metrics } },
      { new: true, upsert: true },
    ) as Promise<IAnalyticsSnapshot>;
  },

  async listSnapshots(workspaceId: string, limit = 30): Promise<IAnalyticsSnapshot[]> {
    return AnalyticsSnapshotModel.find({ workspaceId: new Types.ObjectId(workspaceId) })
      .sort({ date: -1 })
      .limit(limit)
      .lean() as unknown as Promise<IAnalyticsSnapshot[]>;
  },
};
