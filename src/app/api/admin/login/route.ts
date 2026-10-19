import { NextResponse, type NextRequest } from 'next/server';
import { authenticateAdminLogin } from '../../../../server/login-service';
import { extractClientIp } from '../../../../server/ip';
import { buildSessionCookieOptions } from '../../../../server/auth';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(request: NextRequest) {
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
  const userAgent = request.headers.get('user-agent');

  const result = await authenticateAdminLogin(body, {
    ipAddress,
    userAgent,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        ...(result.retryAfterSeconds
          ? { retryAfterSeconds: result.retryAfterSeconds }
          : {}),
      },
      {
        status: result.status,
        headers: {
          ...PRIVATE_NO_CACHE_HEADERS,
          ...(result.retryAfterSeconds
            ? { 'Retry-After': String(result.retryAfterSeconds) }
            : {}),
        },
      }
    );
  }

  const cookieOpts = buildSessionCookieOptions(result.expiresAt);
  const response = NextResponse.json(
    {
      ok: true,
      user: result.user,
      csrfToken: result.csrfToken,
    },
    { status: 200, headers: PRIVATE_NO_CACHE_HEADERS }
  );

  response.cookies.set(cookieOpts.name, result.rawToken, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    expires: cookieOpts.expires,
  });

  return response;
}
