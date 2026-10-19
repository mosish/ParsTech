import { NextResponse, type NextRequest } from 'next/server';
import {
  buildClearSessionCookieOptions,
  getCurrentAdminSessionFromCookies,
  validateCsrfRequest,
} from '../../../../server/auth';
import { changeAdminPassword } from '../../../../server/login-service';
import { extractClientIp } from '../../../../server/ip';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(request: NextRequest) {
  const auth = await getCurrentAdminSessionFromCookies();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: 'احراز هویت الزامی است (Authentication required).' },
      { status: 401, headers: PRIVATE_NO_CACHE_HEADERS }
    );
  }

  try {
    validateCsrfRequest({
      session: auth.session,
      csrfHeader: request.headers.get('x-csrf-token'),
      originHeader: request.headers.get('origin'),
      hostHeader: request.headers.get('host'),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'CSRF validation failed.',
      },
      { status: 403, headers: PRIVATE_NO_CACHE_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'فرمت درخواست نامعتبر است (Invalid JSON).' },
      { status: 400, headers: PRIVATE_NO_CACHE_HEADERS }
    );
  }

  const ipAddress = extractClientIp(request.headers);
  const result = await changeAdminPassword(auth, body, ipAddress);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status, headers: PRIVATE_NO_CACHE_HEADERS }
    );
  }

  const clearOpts = buildClearSessionCookieOptions();
  const response = NextResponse.json(
    {
      ok: true,
      revokedSessionsCount: result.revokedSessionsCount,
    },
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
