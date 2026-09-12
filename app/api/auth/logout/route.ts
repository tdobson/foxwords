import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../lib/api-response';
import { AuthService } from '../../../../lib/auth/service';
import { getRuntimeEnv } from '../../../../lib/cloudflare-context';
import { assertSameOrigin } from '../../../../lib/security/request';
import { clearSessionCookie, parseSessionToken } from '../../../../lib/security/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const env = await getRuntimeEnv();

  try {
    assertSameOrigin(request, env.APP_ORIGIN);
  } catch {
    return jsonError(403, 'origin_rejected', 'Cross-origin request rejected.');
  }

  const cookieHeader = request.headers.get('cookie');
  const token = parseSessionToken(cookieHeader);

  if (token) {
    const authService = new AuthService(env);
    await authService.logout(token);
  }

  const response = jsonSuccess(200, { ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie(env.APP_ENV));
  return response;
}
