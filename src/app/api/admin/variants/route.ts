import { NextResponse, type NextRequest } from 'next/server';
import {
  AuthorizationError,
  getCurrentAdminSessionFromCookies,
  validateCsrfRequest,
} from '../../../../server/auth';
import {
  getPublicCatalogProducts,
  getRecentAuditLogs,
  updateVariantInventoryAndPrice,
} from '../../../../server/catalog';
import { extractClientIp } from '../../../../server/ip';
import { serializeBigIntSafe } from '../../../../server/serialization';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function PATCH(request: NextRequest) {
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

  try {
    const updatedVariant = await updateVariantInventoryAndPrice(auth, body, ipAddress);
    const products = await getPublicCatalogProducts();
    const rawLogs = await getRecentAuditLogs(40);
    const auditLogs = rawLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      actorEmail: log.actor?.email ?? null,
      actorRole: log.actor?.role ?? null,
      createdAt: log.createdAt.toISOString(),
      metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    }));

    return NextResponse.json(
      serializeBigIntSafe({
        ok: true,
        variant: updatedVariant,
        products,
        auditLogs,
      }),
      { status: 200, headers: PRIVATE_NO_CACHE_HEADERS }
    );
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.statusCode, headers: PRIVATE_NO_CACHE_HEADERS }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'خطا در بروزرسانی تنوع محصول.',
      },
      { status: 500, headers: PRIVATE_NO_CACHE_HEADERS }
    );
  }
}
