import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../lib/api-response';
import { getRuntimeEnv } from '../../../lib/cloudflare-context';
import { AuthRepository } from '../../../lib/db/repositories/auth';
import { UserRepository } from '../../../lib/db/repositories/users';
import { getSessionUser } from '../../../lib/security/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const env = await getRuntimeEnv();
  const authRepo = new AuthRepository(env.DB);
  const userRepo = new UserRepository(env.DB);

  const cookieHeader = request.headers.get('cookie') || request.headers.get('Cookie');
  const user = await getSessionUser(authRepo, userRepo, cookieHeader);

  if (!user) {
    return jsonError(401, 'unauthorized', 'Authentication required.');
  }

  return jsonSuccess(200, {
    user: {
      id: user.id,
      email: user.email,
      subscription_status: user.subscription_status,
      created_at: user.created_at,
    },
  });
}
