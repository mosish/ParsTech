import { NextResponse, type NextRequest } from 'next/server';

const PRIVATE_PATH_PREFIXES = ['/admin', '/account', '/cart', '/checkout', '/api/admin'];

export function buildContentSecurityPolicy(isDev: boolean): string {
  // Functional CSP without broad wildcards (*) or production unsafe-eval
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.apple.com https://images.samsung.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV !== 'production';
  const isStaging =
    process.env.APP_ENV === 'staging' || process.env.STAGING_PROTECTED === 'true';

  // Enforce staging access control if staging protection is enabled
  if (isStaging && process.env.STAGING_BASIC_AUTH) {
    const authHeader = request.headers.get('authorization');
    const expected = `Basic ${Buffer.from(process.env.STAGING_BASIC_AUTH).toString('base64')}`;
    if (authHeader !== expected) {
      return new NextResponse('Staging Area — Authentication Required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="ParsTech Staging", charset="UTF-8"',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      });
    }
  }

  const response = NextResponse.next();

  // Security headers on every route
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(isDev));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  const isPrivateRoute = PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Never cache private account or admin responses
  if (isPrivateRoute) {
    response.headers.set(
      'Cache-Control',
      'private, no-store, no-cache, must-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  } else if (isStaging) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|fonts/).*)'],
};
