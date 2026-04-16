import mongoose, { Document, Schema, Types } from "mongoose";
import { ROLES, type Role } from "../../common/constants/roles.js";

export interface IUser extends Document {
  _id: Types.ObjectId;
  betterAuthId: string; // links to Better Auth user._id
  email: string;
  name: string;
  role: Role;
  tenantId?: Types.ObjectId;
  status: "active" | "suspended" | "pending";
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    betterAuthId: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", index: true },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    avatarUrl: { type: String },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUser>("UserProfile", userSchema);
