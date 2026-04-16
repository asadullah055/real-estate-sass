import { AnalyticsRepository } from './analytics.repository.js';

export const AnalyticsService = {
  async getOverview(workspaceId?: string) {
    return AnalyticsRepository.getOverview(workspaceId);
  },

  async snapshot(workspaceId: string, date?: string) {
    const snapshotDate = date ? new Date(date) : new Date();
    const metrics = await AnalyticsRepository.getOverview(workspaceId);
    return AnalyticsRepository.upsertSnapshot(workspaceId, snapshotDate, metrics);
  },

  async listSnapshots(workspaceId: string, limit?: number) {
    return AnalyticsRepository.listSnapshots(workspaceId, limit);
  },
};
