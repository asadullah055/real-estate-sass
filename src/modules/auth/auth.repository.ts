import { ObjectId } from 'mongodb';
import { getNativeDb } from '../../infra/database/connection.js';

interface BetterAuthSession {
  _id: ObjectId;
  token: string;
  userId: ObjectId | string;  // Better Auth stores userId as ObjectId in MongoDB
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/** Better Auth stores userId as ObjectId — try both ObjectId and string to be safe. */
function userIdFilter(betterAuthUserId: string) {
  try {
    return { $or: [{ userId: new ObjectId(betterAuthUserId) }, { userId: betterAuthUserId }] };
  } catch {
    return { userId: betterAuthUserId };
  }
}

export const AuthRepository = {
  async getSessionsByUserId(betterAuthUserId: string): Promise<BetterAuthSession[]> {
    const db = getNativeDb();
    return db
      .collection<BetterAuthSession>('session')
      .find(userIdFilter(betterAuthUserId))
      .sort({ updatedAt: -1 })
      .toArray();
  },

  async revokeSession(sessionToken: string, betterAuthUserId: string): Promise<boolean> {
    const db = getNativeDb();
    const result = await db.collection('session').deleteOne({
      $and: [{ token: sessionToken }, userIdFilter(betterAuthUserId)],
    });
    return result.deletedCount > 0;
  },

  async revokeOtherSessions(
    currentSessionToken: string,
    betterAuthUserId: string,
  ): Promise<number> {
    const db = getNativeDb();
    const result = await db.collection('session').deleteMany({
      $and: [{ token: { $ne: currentSessionToken } }, userIdFilter(betterAuthUserId)],
    });
    return result.deletedCount;
  },
};
