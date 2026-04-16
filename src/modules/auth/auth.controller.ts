import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/apiResponse.js';
import { AuthService } from './auth.service.js';
import { toUserProfileDto } from '../user/users.dto.js';
import { AUTH_MESSAGES } from './auth.constants.js';

export const AuthController = {
  /** GET /api/profile — returns current profile */
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess({
      res,
      message: AUTH_MESSAGES.PROFILE_FETCHED,
      data: toUserProfileDto(req.user!),
    });
  }),

  /** GET /api/sessions */
  listSessions: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await AuthService.listSessions(
      req.user!.betterAuthId,
      req.betterAuthSession?.id ?? '',
    );
    sendSuccess({ res, message: AUTH_MESSAGES.SESSIONS_FETCHED, data: sessions });
  }),

  /** POST /api/sessions/revoke */
  revokeSession: asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.body as { sessionId: string };
    await AuthService.revokeSession(sessionId, req.user!.betterAuthId);
    sendSuccess({ res, message: AUTH_MESSAGES.SESSION_REVOKED });
  }),

  /** POST /api/sessions/revoke-others */
  revokeOtherSessions: asyncHandler(async (req: Request, res: Response) => {
    const count = await AuthService.revokeOtherSessions(
      req.betterAuthSession?.id ?? '',
      req.user!.betterAuthId,
    );
    sendSuccess({ res, message: `${count} ${AUTH_MESSAGES.OTHER_SESSIONS_REVOKED}` });
  }),
};
