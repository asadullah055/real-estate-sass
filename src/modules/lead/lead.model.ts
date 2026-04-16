import mongoose, { Document, Schema, Types } from 'mongoose';
import { LEAD_STATUS, LEAD_SOURCE, type LeadStatus, type LeadSource } from '../../common/constants/leadStatus.js';

export interface ILead extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  name: string;
  email?: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  scoreCategory: 'hot' | 'warm' | 'cold' | 'dead';
  assignedAgentId?: Types.ObjectId;

  // Property preferences
  budget?: { min?: number; max?: number; currency?: string };
  preferredAreas?: string[];
  propertyType?: string;
  bedrooms?: number;
  timeline?: 'urgent' | 'within_3_months' | 'within_6_months' | 'flexible';

  // Retell AI extracted data
  retellData?: {
    interestLevel?: 'high' | 'medium' | 'low';
    isSeriousBuyer?: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
    appointmentBooked?: boolean;
    notes?: string;
    lastCallId?: string;
  };

  // Tracking
  lastContactedAt?: Date;
  meetingBookedAt?: Date;
  convertedAt?: Date;
  notes?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    tenantId:        { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name:            { type: String, required: true, trim: true },
    email:           { type: String, trim: true, lowercase: true },
    phone:           { type: String, required: true, trim: true },
    source:          { type: String, enum: Object.values(LEAD_SOURCE), default: LEAD_SOURCE.MANUAL },
    status:          { type: String, enum: Object.values(LEAD_STATUS), default: LEAD_STATUS.NEW },
    score:           { type: Number, default: 0, min: 0, max: 100 },
    scoreCategory:   { type: String, enum: ['hot', 'warm', 'cold', 'dead'], default: 'dead' },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'UserProfile' },

    budget: {
      min:      { type: Number },
      max:      { type: Number },
      currency: { type: String, default: 'USD' },
    },
    preferredAreas: [{ type: String }],
    propertyType:   { type: String },
    bedrooms:       { type: Number },
    timeline:       { type: String, enum: ['urgent', 'within_3_months', 'within_6_months', 'flexible'] },

    retellData: {
      interestLevel:     { type: String, enum: ['high', 'medium', 'low'] },
      isSeriousBuyer:    { type: Boolean },
      sentiment:         { type: String, enum: ['positive', 'neutral', 'negative'] },
      appointmentBooked: { type: Boolean },
      notes:             { type: String },
      lastCallId:        { type: String },
    },

    lastContactedAt: { type: Date },
    meetingBookedAt: { type: Date },
    convertedAt:     { type: Date },
    notes:           { type: String },
    tags:            [{ type: String }],
  },
  { timestamps: true },
);

// Indexes
leadSchema.index({ tenantId: 1, status: 1 });
leadSchema.index({ tenantId: 1, score: -1 });
leadSchema.index({ tenantId: 1, assignedAgentId: 1, status: 1 });
leadSchema.index({ tenantId: 1, createdAt: -1 });
leadSchema.index({ phone: 1 });

export const LeadModel = mongoose.model<ILead>('Lead', leadSchema);
