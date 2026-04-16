import mongoose, { Document, Schema, Types } from 'mongoose';

export type FollowupStepType = 'email' | 'sms' | 'whatsapp' | 'call';

export interface ISequenceStep {
  step: number;
  delayMinutes: number;
  type: FollowupStepType;
  template: string;
  subject?: string;
}

export interface ISequence extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  sequenceId: string;
  name: string;
  steps: ISequenceStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sequenceStepSchema = new Schema<ISequenceStep>(
  {
    step:         { type: Number, required: true, min: 1 },
    delayMinutes: { type: Number, required: true, min: 0 },
    type:         { type: String, enum: ['email', 'sms', 'whatsapp', 'call'], required: true },
    template:     { type: String, required: true, trim: true },
    subject:      { type: String, trim: true },
  },
  { _id: false },
);

const sequenceSchema = new Schema<ISequence>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    sequenceId:  { type: String, required: true, trim: true },
    name:        { type: String, required: true, trim: true },
    steps:       { type: [sequenceStepSchema], required: true, default: [] },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true },
);

sequenceSchema.index({ workspaceId: 1, sequenceId: 1 }, { unique: true });

export const SequenceModel = mongoose.model<ISequence>('FollowupSequence', sequenceSchema);
