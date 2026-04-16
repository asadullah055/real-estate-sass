import mongoose, { Document, Schema, Types } from "mongoose";

export type SubscriptionPlan = "free_trial" | "pro";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId; // ref UserProfile
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt?: Date; // set for free_trial
  currentPeriodEnd?: Date; // set when pro billing is active
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
      unique: true,
      index: true,
    },
    stripeCustomerId: { type: String, index: true, sparse: true },
    stripeSubscriptionId: { type: String, index: true, sparse: true },
    plan: { type: String, enum: ["free_trial", "pro"], default: "free_trial" },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "incomplete"],
      default: "trialing",
    },
    trialEndsAt: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const SubscriptionModel = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema,
);
