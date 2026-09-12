import { type NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../lib/auth/service';
import { getRuntimeEnv } from '../../../../lib/cloudflare-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const env = await getRuntimeEnv();
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  const origin = env.APP_ORIGIN.endsWith('/') ? env.APP_ORIGIN.slice(0, -1) : env.APP_ORIGIN;

  if (!token) {
    return NextResponse.redirect(`${origin}/parent/login?error=invalid-link`, 302);
  }

  const authService = new AuthService(env);
  const result = await authService.verifyMagicLink(token);

  if (!result.success || !result.setCookieHeader) {
    return NextResponse.redirect(`${origin}/parent/login?error=invalid-link`, 302);
  }

  const response = NextResponse.redirect(`${origin}/parent`, 302);
  response.headers.set('Set-Cookie', result.setCookieHeader);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
