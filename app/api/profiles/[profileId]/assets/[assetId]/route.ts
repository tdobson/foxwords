import type { NextRequest } from 'next/server';
import { jsonError } from '../../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../../../lib/db/repositories/auth';
import { MediaRepository } from '../../../../../../lib/db/repositories/media';
import { ProfileRepository } from '../../../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../../../lib/db/repositories/users';
import { getProfileAssetResponse } from '../../../../../../lib/media/r2';
import { getSessionUser } from '../../../../../../lib/security/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string; assetId: string }> }
) {
  const { profileId, assetId } = await context.params;
  const env = await getRuntimeEnv();

  const authRepo = new AuthRepository(env.DB);
  const userRepo = new UserRepository(env.DB);
  const profileRepo = new ProfileRepository(env.DB);
  const mediaRepo = new MediaRepository(env.DB);

  const user = await getSessionUser(
    authRepo,
    userRepo,
    request.headers.get('cookie') || request.headers.get('Cookie')
  );
  if (!user) {
    return jsonError(401, 'unauthorized', 'Authentication required.');
  }

  const profile = await profileRepo.findOwnedById(user.id, profileId);
  if (!profile) {
    return jsonError(404, 'not_found', 'Profile not found.');
  }

  const asset = await mediaRepo.findOwnedById(profile.id, assetId);
  if (!asset) {
    return jsonError(404, 'not_found', 'Asset not found.');
  }

  return getProfileAssetResponse(env, asset);
}
