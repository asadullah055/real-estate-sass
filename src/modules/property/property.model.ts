import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProperty extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  title: string;
  description?: string;
  status: 'available' | 'under_offer' | 'sold' | 'rented' | 'off_market';
  type: 'apartment' | 'villa' | 'townhouse' | 'land' | 'commercial' | 'other';
  price: number;
  currency: string;
  area: string;
  city: string;
  country: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  images?: string[];
  features?: string[];
  matchingTags?: { area: string; type: string; minBudget?: number; maxBudget?: number };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    tenantId:    { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    status:      { type: String, enum: ['available', 'under_offer', 'sold', 'rented', 'off_market'], default: 'available' },
    type:        { type: String, enum: ['apartment', 'villa', 'townhouse', 'land', 'commercial', 'other'], required: true },
    price:       { type: Number, required: true },
    currency:    { type: String, default: 'USD' },
    area:        { type: String, required: true, trim: true },
    city:        { type: String, required: true, trim: true },
    country:     { type: String, required: true, trim: true },
    address:     { type: String },
    bedrooms:    { type: Number },
    bathrooms:   { type: Number },
    sizeSqm:     { type: Number },
    images:      [{ type: String }],
    features:    [{ type: String }],
    matchingTags: {
      area:      { type: String },
      type:      { type: String },
      minBudget: { type: Number },
      maxBudget: { type: Number },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true },
  },
  { timestamps: true },
);

propertySchema.index({ tenantId: 1, status: 1, 'matchingTags.area': 1 });

export const PropertyModel = mongoose.model<IProperty>('Property', propertySchema);
