import mongoose, { Document, Schema, Types } from 'mongoose';

export interface RetellSettings {
  apiKey?: string;
  receptionistAgentId?: string;
  qualifierAgentId?: string;
  webhookSecret?: string;
  fromNumber?: string;
}

export interface N8nSettings {
  webhookNewLead?: string;
  webhookLeadQualified?: string;
  webhookMeetingBooked?: string;
  webhookLeadUpdated?: string;
}

export interface ITenant extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  retellSettings: RetellSettings;
  n8nSettings: N8nSettings;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const retellSettingsSchema = new Schema<RetellSettings>(
  {
    apiKey:               { type: String },
    receptionistAgentId: { type: String },
    qualifierAgentId:    { type: String },
    webhookSecret:       { type: String },
    fromNumber:          { type: String },
  },
  { _id: false },
);

const n8nSettingsSchema = new Schema<N8nSettings>(
  {
    webhookNewLead:       { type: String },
    webhookLeadQualified: { type: String },
    webhookMeetingBooked: { type: String },
    webhookLeadUpdated:   { type: String },
  },
  { _id: false },
);

const tenantSchema = new Schema<ITenant>(
  {
    name:           { type: String, required: true },
    slug:           { type: String, required: true, unique: true, index: true },
    retellSettings: { type: retellSettingsSchema, default: {} },
    n8nSettings:    { type: n8nSettingsSchema, default: {} },
    status:         { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true },
);

export const TenantModel = mongoose.model<ITenant>('Tenant', tenantSchema);
