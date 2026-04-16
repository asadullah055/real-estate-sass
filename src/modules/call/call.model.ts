import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICall extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  leadId: Types.ObjectId;
  retellCallId: string;
  agentId: string;
  direction: 'inbound' | 'outbound';
  status: 'initiated' | 'in_progress' | 'ended' | 'failed';
  fromNumber?: string;
  toNumber?: string;
  durationSeconds?: number;
  transcript?: string;
  recordingUrl?: string;
  customAnalysisData?: Record<string, unknown>;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    tenantId:           { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    leadId:             { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    retellCallId:       { type: String, required: true, unique: true, index: true },
    agentId:            { type: String, required: true },
    direction:          { type: String, enum: ['inbound', 'outbound'], required: true },
    status:             { type: String, enum: ['initiated', 'in_progress', 'ended', 'failed'], default: 'initiated' },
    fromNumber:         { type: String },
    toNumber:           { type: String },
    durationSeconds:    { type: Number },
    transcript:         { type: String },
    recordingUrl:       { type: String },
    customAnalysisData: { type: Schema.Types.Mixed },
    startedAt:          { type: Date },
    endedAt:            { type: Date },
  },
  { timestamps: true },
);

callSchema.index({ tenantId: 1, leadId: 1, createdAt: -1 });

export const CallModel = mongoose.model<ICall>('Call', callSchema);
