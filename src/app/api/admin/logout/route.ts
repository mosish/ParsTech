import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  buildClearSessionCookieOptions,
  getCurrentAdminSessionFromCookies,
  validateCsrfRequest,
} from '../../../../server/auth';
import { logoutAdminSession } from '../../../../server/login-service';
import { extractClientIp } from '../../../../server/ip';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(request: NextRequest) {
  const auth = await getCurrentAdminSessionFromCookies();

  if (auth) {
    try {
      validateCsrfRequest({
        session: auth.session,
        csrfHeader: request.headers.get('x-csrf-token'),
        originHeader: request.headers.get('origin'),
        hostHeader: request.headers.get('host'),
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: 'توکن امنیتی CSRF نامعتبر است.' },
        { status: 403, headers: PRIVATE_NO_CACHE_HEADERS }
      );
    }
  }

  const rawToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const ipAddress = extractClientIp(request.headers);

  await logoutAdminSession(rawToken, ipAddress);

  const clearOpts = buildClearSessionCookieOptions();
  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: PRIVATE_NO_CACHE_HEADERS }
  );

  response.cookies.set(clearOpts.name, '', {
    httpOnly: clearOpts.httpOnly,
    secure: clearOpts.secure,
    sameSite: clearOpts.sameSite,
    path: clearOpts.path,
    maxAge: 0,
  });

  return response;
}
