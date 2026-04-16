import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  leadId: Types.ObjectId;
  agentId: Types.ObjectId;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  meetingType: 'in_person' | 'video' | 'phone';
  location?: string;
  meetingUrl?: string;
  notes?: string;
  outcome?: 'converted' | 'follow_up_required' | 'not_interested' | 'pending';
  outcomeNotes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    tenantId:        { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    leadId:          { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    agentId:         { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
    title:           { type: String, required: true, trim: true },
    scheduledAt:     { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    status:          { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
    meetingType:     { type: String, enum: ['in_person', 'video', 'phone'], required: true },
    location:        { type: String },
    meetingUrl:      { type: String },
    notes:           { type: String },
    outcome:         { type: String, enum: ['converted', 'follow_up_required', 'not_interested', 'pending'] },
    outcomeNotes:    { type: String },
    completedAt:     { type: Date },
  },
  { timestamps: true },
);

meetingSchema.index({ tenantId: 1, scheduledAt: 1, status: 1 });

export const MeetingModel = mongoose.model<IMeeting>('Meeting', meetingSchema);
