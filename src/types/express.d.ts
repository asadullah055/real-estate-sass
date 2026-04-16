import type { IUser } from '../modules/user/users.model.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      betterAuthSession?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
      };
    }
  }
}
