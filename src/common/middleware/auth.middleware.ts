import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '../../config/auth.js';
import { UserRepository } from '../../modules/user/users.repository.js';
import { UnauthorizedError } from '../errors/AppError.js';
import { logger } from '../../config/logger.js';
import { getOrCreateDefaultWorkspace } from '../utils/workspaceResolver.js';

interface BetterAuthSession {
  id?: string;
  userId?: string;
  token?: string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  updatedAt?: Date | string;
}

interface BetterAuthUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
}

/** Parse all cookies from the Cookie header into a key->value map. */
function parseCookies(cookieHeader: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const [rawKey, ...rawVal] = trimmed.split('=');
    const key = rawKey?.trim();
    if (!key) continue;

    map[key] = decodeURIComponent(rawVal.join('=').trim());
  }
  return map;
}

/** Convert Express headers to WHATWG Headers for Better Auth API calls. */
function buildHeaders(req: Request): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    }
  }

  return headers;
}

/** Resolve active session using Better Auth's official getSession API. */
async function resolveSession(
  req: Request,
): Promise<{ user: BetterAuthUser; session: BetterAuthSession } | null> {
  const cookieHeader = req.headers.cookie ?? '';
  const cookies = parseCookies(cookieHeader);

  // Keep this log to debug cookie propagation issues.
  logger.info('[auth] cookie keys: ' + Object.keys(cookies).join(', '));

  if (!cookieHeader) return null;

  const resolved = await getAuth().api.getSession({
    headers: buildHeaders(req),
    asResponse: false,
  });

  if (!resolved?.session || !resolved?.user) return null;

  return {
    user: resolved.user as BetterAuthUser,
    session: resolved.session as BetterAuthSession,
  };
}

/** Validates the Better Auth session cookie, loads user profile into req.user. */
export function requireAuth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const resolved = await resolveSession(req);

      if (!resolved) {
        next(new UnauthorizedError());
        return;
      }

      const { user: authUser, session } = resolved;
      if (!authUser.email) {
        next(new UnauthorizedError());
        return;
      }

      // Lazy-create profile if not yet seeded (handles existing Better Auth users)
      let profile = await UserRepository.findByBetterAuthId(authUser.id);
      if (!profile) {
        // Profile may already exist under this email (e.g. Google + password same account)
        const existing = await UserRepository.findByEmail(authUser.email);
        if (existing) {
          // Patch betterAuthId so future lookups are fast
          profile =
            (await UserRepository.updateById(existing._id, {
              betterAuthId: authUser.id,
            })) ?? existing;
        } else {
          try {
            profile = await UserRepository.create({
              betterAuthId: authUser.id,
              email: authUser.email,
              name: authUser.name ?? authUser.email.split('@')[0],
              role: 'user',
              status: 'active',
            });
          } catch (createErr: unknown) {
            // Race condition: another request already created it. Fetch and continue.
            if ((createErr as { code?: number }).code === 11000) {
              profile = await UserRepository.findByEmail(authUser.email);
            }
            if (!profile) throw createErr;
          }
        }
      }

      // Auto-assign workspace on first login if user has none
      if (!profile.tenantId) {
        const workspaceId = await getOrCreateDefaultWorkspace();
        profile =
          (await UserRepository.updateById(profile._id, {
            tenantId: workspaceId as unknown as typeof profile.tenantId,
          })) ?? profile;
        logger.info('[auth] assigned workspace to user', {
          userId: profile._id.toString(),
          workspaceId,
        });
      }

      if (profile.status === 'suspended') {
        next(new UnauthorizedError('Your account has been suspended'));
        return;
      }

      req.user = profile;
      // Better Auth stores sessions with `token` as the identifier (no `id` field in MongoDB)
      const sessionToken = session.token ?? session.id ?? '';
      req.betterAuthSession = {
        id: sessionToken,
        userId: session.userId ?? authUser.id,
        token: sessionToken,
        expiresAt: new Date(session.expiresAt),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      };
      next();
    } catch (err) {
      logger.error('requireAuth failed', { message: (err as Error).message });
      next(new UnauthorizedError());
    }
  };
}
