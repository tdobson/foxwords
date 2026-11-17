import { type NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../lib/auth/service';
import { getRuntimeEnv } from '../../../../lib/cloudflare-context';
import { assertSameOrigin } from '../../../../lib/security/request';

export const dynamic = 'force-dynamic';

function appOrigin(raw: string): string {
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

// GET never consumes the token: email link scanners prefetch links and would burn it.
export async function GET(request: NextRequest) {
  const env = await getRuntimeEnv();
  const origin = appOrigin(env.APP_ORIGIN);
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(`${origin}/parent/login?error=invalid-link`, 302);
  }
  const response = NextResponse.redirect(
    `${origin}/auth/verify?token=${encodeURIComponent(token)}`,
    302
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request: NextRequest) {
  const env = await getRuntimeEnv();
  const origin = appOrigin(env.APP_ORIGIN);

  try {
    assertSameOrigin(request, env.APP_ORIGIN);
  } catch {
    return NextResponse.redirect(`${origin}/parent/login?error=invalid-link`, 303);
  }

  let token: string | null = null;
  try {
    const form = await request.formData();
    const value = form.get('token');
    token = typeof value === 'string' ? value : null;
  } catch {
    token = null;
  }

  if (!token) {
    return NextResponse.redirect(`${origin}/parent/login?error=invalid-link`, 303);
  }

  const authService = new AuthService(env);
  const result = await authService.verifyMagicLink(token);

  if (!result.success || !result.setCookieHeader) {
    return NextResponse.redirect(`${origin}/parent/login?error=invalid-link`, 303);
  }

  const response = NextResponse.redirect(`${origin}/parent`, 303);
  response.headers.set('Set-Cookie', result.setCookieHeader);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
