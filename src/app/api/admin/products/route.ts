import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTrustedClientIp } from '../../../../server/ip';
import { deleteProductOperation } from '../../../../server/catalog';
import { SESSION_COOKIE_NAME } from '../../../../server/auth';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
};

export async function DELETE(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON request body.' },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const clientIp = getTrustedClientIp(request.headers);

  const result = await deleteProductOperation({
    rawToken,
    headers: request.headers,
    ipAddress: clientIp,
    body,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { ok: true, deletedId: result.deletedId },
    { status: 200, headers: PRIVATE_NO_STORE_HEADERS }
  );
}
