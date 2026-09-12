import type { NextRequest } from 'next/server';
import { jsonError } from '../../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../../lib/cloudflare-context';
import { MediaRepository } from '../../../../../../lib/db/repositories/media';
import { ProfileRepository } from '../../../../../../lib/db/repositories/profiles';
import { getProfileAssetResponse } from '../../../../../../lib/media/r2';
import { sha256Hex } from '../../../../../../lib/security/crypto';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string; assetId: string }> }
) {
  const { token, assetId } = await context.params;
  const env = await getRuntimeEnv();

  const profileRepo = new ProfileRepository(env.DB);
  const mediaRepo = new MediaRepository(env.DB);

  // Validate play token or friendly code
  const tokenHash = await sha256Hex(token);
  let profile = await profileRepo.findByPlayTokenHash(tokenHash);
  if (!profile) {
    profile = await profileRepo.findByPlayCode(token);
  }

  if (!profile) {
    return jsonError(404, 'not_found', 'Asset not found.');
  }

  // Ensure asset belongs strictly to this profile
  const asset = await mediaRepo.findOwnedById(profile.id, assetId);
  if (!asset) {
    return jsonError(404, 'not_found', 'Asset not found.');
  }

  return getProfileAssetResponse(env, asset);
}
