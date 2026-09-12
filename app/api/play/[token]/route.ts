import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../lib/cloudflare-context';
import { MediaRepository } from '../../../../lib/db/repositories/media';
import { ProfileRepository } from '../../../../lib/db/repositories/profiles';
import { buildPublicPlayPayload } from '../../../../lib/profiles/public-payload';
import { sha256Hex } from '../../../../lib/security/crypto';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const env = await getRuntimeEnv();

  if (!token || typeof token !== 'string') {
    return jsonError(404, 'not_found', 'Play profile not found.');
  }

  const profileRepo = new ProfileRepository(env.DB);
  const mediaRepo = new MediaRepository(env.DB);

  // Try finding by token hash first, then by friendly code
  const tokenHash = await sha256Hex(token);
  let profile = await profileRepo.findByPlayTokenHash(tokenHash);
  if (!profile) {
    profile = await profileRepo.findByPlayCode(token);
  }

  if (!profile) {
    return jsonError(404, 'not_found', 'Play profile not found.');
  }

  const customWords = await profileRepo.listWordsForProfile(profile.id);
  const assets = await mediaRepo.listForProfile(profile.id);

  const payload = buildPublicPlayPayload({
    childName: profile.child_name,
    playToken: token,
    customWords,
    assets,
  });

  return jsonSuccess(200, payload);
}
