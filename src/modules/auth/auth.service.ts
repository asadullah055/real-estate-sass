import { AuthRepository } from './auth.repository.js';
import { parseUserAgent } from './auth.utils.js';
import type { SessionDto } from './auth.dto.js';
import { NotFoundError } from '../../common/errors/NotFoundError.js';

export const AuthService = {
  async listSessions(
    betterAuthUserId: string,
    currentSessionId: string,
  ): Promise<SessionDto[]> {
    const sessions = await AuthRepository.getSessionsByUserId(betterAuthUserId);
    return sessions.map((s) => {
      const parsed = parseUserAgent(s.userAgent ?? '');
      return {
        id: s.token,                         // use token as the session identifier
        deviceName: parsed.device,
        browser: parsed.browser,
        os: parsed.os,
        ip: formatIp(s.ipAddress),
        lastActive: new Date(s.updatedAt ?? s.createdAt).toISOString(),
        isCurrent: s.token === currentSessionId,
      };
    });
  },

  async revokeSession(sessionId: string, betterAuthUserId: string): Promise<void> {
    const revoked = await AuthRepository.revokeSession(sessionId, betterAuthUserId);
    if (!revoked) throw new NotFoundError('Session');
  },

  async revokeOtherSessions(
    currentSessionId: string,
    betterAuthUserId: string,
  ): Promise<number> {
    return AuthRepository.revokeOtherSessions(currentSessionId, betterAuthUserId);
  },
};

function formatIp(ip?: string | null): string {
  if (!ip) return 'Unknown';
  // IPv6 loopback or IPv4 loopback → Localhost
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') return 'Localhost';
  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}
