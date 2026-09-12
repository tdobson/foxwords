import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../../../lib/db/repositories/auth';
import { ProfileRepository } from '../../../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../../../lib/db/repositories/users';
import { randomToken, sha256Hex } from '../../../../../../lib/security/crypto';
import { assertSameOrigin } from '../../../../../../lib/security/request';
import { getSessionUser } from '../../../../../../lib/security/session';

export const dynamic = 'force-dynamic';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateFriendlyCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await context.params;
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

  const existing = await profileRepo.findOwnedById(user.id, profileId);
  if (!existing) {
    return jsonError(404, 'not_found', 'Profile not found.');
  }

  const rawPlayToken = randomToken(32);
  const playTokenHash = await sha256Hex(rawPlayToken);
  const playCode = generateFriendlyCode();

  const updated = await profileRepo.updateOwned(user.id, profileId, {
    playTokenHash,
    playCode,
  });

  if (!updated) {
    return jsonError(500, 'internal_error', 'Failed to rotate credentials.');
  }

  return jsonSuccess(200, {
    profile: {
      id: updated.id,
      childName: updated.child_name,
      playCode: updated.play_code,
      playUrl: `/play/${updated.play_code}`,
      rawPlayToken, // Returned once on rotation for display
      updatedAt: updated.updated_at,
    },
  });
}
