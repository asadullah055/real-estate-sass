import mongoose, { Document, Schema, Types } from 'mongoose';
import type { FollowupStepType } from './sequence.model.js';

export type FollowupStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';

export interface IFollowupContent {
  subject?: string;
  body: string;
}

export interface IFollowupResponse {
  opened: boolean;
  clicked: boolean;
  replied: boolean;
}

export interface IFollowupInquiry {
  name?: string;
  phone?: string;
  email?: string;
  propertyType?: string;
  preferredAreas?: string[];
  budget?: { min?: number; max?: number; currency?: string };
  timeline?: 'urgent' | 'within_3_months' | 'within_6_months' | 'flexible';
  notes?: string;
}

export interface IFollowup extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  leadId?: Types.ObjectId;
  sequenceId: string;
  stepNumber: number;
  type: FollowupStepType;
  content: IFollowupContent;
  inquiry?: IFollowupInquiry;
  scheduledAt: Date;
  sentAt?: Date;
  status: FollowupStatus;
  response: IFollowupResponse;
  createdAt: Date;
  updatedAt: Date;
}

const followupSchema = new Schema<IFollowup>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    leadId:      { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    sequenceId:  { type: String, required: true, trim: true },
    stepNumber:  { type: Number, required: true, min: 1 },
    type:        { type: String, enum: ['email', 'sms', 'whatsapp', 'call'], required: true },
    content: {
      subject: { type: String, trim: true },
      body:    { type: String, required: true, trim: true },
    },
    inquiry: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      propertyType: { type: String, trim: true },
      preferredAreas: [{ type: String, trim: true }],
      budget: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, trim: true },
      },
      timeline: { type: String, enum: ['urgent', 'within_3_months', 'within_6_months', 'flexible'] },
      notes: { type: String, trim: true },
    },
    scheduledAt: { type: Date, required: true },
    sentAt:      { type: Date },
    status:      { type: String, enum: ['scheduled', 'sent', 'failed', 'cancelled'], default: 'scheduled' },
    response: {
      opened:  { type: Boolean, default: false },
      clicked: { type: Boolean, default: false },
      replied: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

followupSchema.index({ workspaceId: 1, status: 1, scheduledAt: 1 });
followupSchema.index({ workspaceId: 1, leadId: 1, scheduledAt: 1 });
followupSchema.index({ workspaceId: 1, sequenceId: 1, stepNumber: 1 });

export const FollowupModel = mongoose.model<IFollowup>('Followup', followupSchema);
