import type { AuthRepository } from '../db/repositories/auth';
import type { UserRepository } from '../db/repositories/users';
import type { UserRow } from '../db/types';
import { randomToken, sha256Hex } from './crypto';

export const SESSION_COOKIE_NAME = '__Host-foxwords_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days (2592000s)

export function serializeSessionCookie(token: string, appEnv: string): string {
  const isSecure = appEnv !== 'local';
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (isSecure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function clearSessionCookie(appEnv: string): string {
  const isSecure = appEnv !== 'local';
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isSecure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export async function createSession(
  authRepo: AuthRepository,
  userId: string,
  appEnv: string
): Promise<{ rawToken: string; setCookieHeader: string }> {
  const rawToken = randomToken(32);
  const sessionHash = await sha256Hex(rawToken);
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;

  await authRepo.createSession(sessionHash, userId, expiresAt);
  const setCookieHeader = serializeSessionCookie(rawToken, appEnv);

  return { rawToken, setCookieHeader };
}

export function parseSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export async function getSessionUser(
  authRepo: AuthRepository,
  userRepo: UserRepository,
  cookieHeader: string | null
): Promise<UserRow | null> {
  const rawToken = parseSessionToken(cookieHeader);
  if (!rawToken) return null;

  const sessionHash = await sha256Hex(rawToken);
  const session = await authRepo.findValidSession(sessionHash);
  if (!session) return null;

  return userRepo.findById(session.user_id);
}
