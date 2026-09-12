import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../../../lib/db/repositories/auth';
import { ProfileRepository } from '../../../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../../../lib/db/repositories/users';
import { assertSameOrigin } from '../../../../../../lib/security/request';
import { getSessionUser } from '../../../../../../lib/security/session';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ profileId: string; itemId: string }> }
) {
  const { profileId, itemId } = await context.params;
  const env = await getRuntimeEnv();

  try {
    assertSameOrigin(request, env.APP_ORIGIN);
  } catch {
    return jsonError(403, 'origin_rejected', 'Cross-origin request rejected.');
  }

  const authRepo = new AuthRepository(env.DB);
  const userRepo = new UserRepository(env.DB);
  const profileRepo = new ProfileRepository(env.DB);

  const user = await getSessionUser(
    authRepo,
    userRepo,
    request.headers.get('cookie') || request.headers.get('Cookie')
  );
  if (!user) {
    return jsonError(401, 'unauthorized', 'Authentication required.');
  }

  const deleted = await profileRepo.deleteWordOwned(user.id, profileId, itemId);
  if (!deleted) {
    return jsonError(404, 'not_found', 'Item not found.');
  }

  return jsonSuccess(200, { ok: true });
}
