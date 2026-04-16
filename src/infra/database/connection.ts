import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

export async function connectDB(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");
}

/**
 * Returns the native MongoDB Db instance from the Mongoose connection.
 * Used by Better Auth's mongodbAdapter — must be called after connectDB().
 */
export function getNativeDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB is not connected. Call connectDB() first.");
  return db;
}
