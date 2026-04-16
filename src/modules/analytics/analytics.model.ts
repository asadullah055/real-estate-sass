import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnalyticsSnapshot extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  date: Date;
  metrics: {
    leadsTotal: number;
    leadsNew: number;
    leadsQualified: number;
    callsTotal: number;
    meetingsUpcoming: number;
    followupsDue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    date:        { type: Date, required: true, index: true },
    metrics: {
      leadsTotal:       { type: Number, default: 0 },
      leadsNew:         { type: Number, default: 0 },
      leadsQualified:   { type: Number, default: 0 },
      callsTotal:       { type: Number, default: 0 },
      meetingsUpcoming: { type: Number, default: 0 },
      followupsDue:     { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

analyticsSnapshotSchema.index({ workspaceId: 1, date: -1 }, { unique: true });

export const AnalyticsSnapshotModel = mongoose.model<IAnalyticsSnapshot>(
  'AnalyticsSnapshot',
  analyticsSnapshotSchema,
);
