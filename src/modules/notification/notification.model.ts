import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId:      { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true, index: true },
    title:       { type: String, required: true, trim: true },
    message:     { type: String, required: true, trim: true },
    type:        { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    read:        { type: Boolean, default: false },
    readAt:      { type: Date },
    metadata:    { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', notificationSchema);
