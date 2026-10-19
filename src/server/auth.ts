import argon2 from 'argon2';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import type { AdminRole, AdminSession, AdminUser, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './db';
import { recordAuditLog } from './audit';

export const SESSION_COOKIE_NAME = 'parstech_admin_session';
export const ADMIN_SESSION_COOKIE = SESSION_COOKIE_NAME;

export class AuthorizationError extends Error {
  statusCode: 400 | 401 | 403 | 404;
  constructor(message: string, statusCode: 400 | 401 | 403 | 404 = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB (OWASP recommended baseline for Argon2id)
  timeCost: 2,
  parallelism: 1,
};

/**
 * Hashes a plaintext password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 10) {
    throw new Error('Password must be at least 10 characters long.');
  }
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Generates a high-entropy opaque session token using @oslojs/encoding (160-bit CSPRNG).
 */
export function generateOpaqueToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

/**
 * Computes the SHA-256 hex digest of an opaque session token using @oslojs/crypto.
 * Only the SHA-256 hash is stored in PostgreSQL; the raw token lives only in the HttpOnly cookie.
 */
export function hashSessionToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export function getSessionTtlMs(): number {
  const hours = Number(process.env.SESSION_TTL_HOURS || '12');
  const validHours = Number.isFinite(hours) && hours > 0 ? hours : 12;
  return validHours * 60 * 60 * 1000;
}

export function isSecureCookieEnvironment(): boolean {
  const origin = process.env.PRIMARY_ORIGIN || '';
  return process.env.NODE_ENV === 'production' || origin.startsWith('https://');
}

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isSecureCookieEnvironment(),
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

export const buildSessionCookieOptions = getSessionCookieOptions;

export function buildClearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isSecureCookieEnvironment(),
    sameSite: 'lax' as const,
    path: '/',
  };
}

export interface CreatedAdminSession {
  rawToken: string;
  csrfToken: string;
  session: AdminSession;
}

/**
 * Creates a new opaque server-side session in PostgreSQL.
 */
export async function createAdminSession(
  params: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    ttlMs?: number;
    now?: Date;
  },
  db: PrismaClient = defaultPrisma
): Promise<CreatedAdminSession> {
  const now = params.now ?? new Date();
  const ttlMs = params.ttlMs ?? getSessionTtlMs();
  const rawToken = generateOpaqueToken();
  const csrfToken = generateOpaqueToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(now.getTime() + ttlMs);

  const session = await db.adminSession.create({
    data: {
      tokenHash,
      csrfToken,
      userId: params.userId,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ? params.userAgent.slice(0, 255) : null,
      expiresAt,
      createdAt: now,
    },
  });

  return { rawToken, csrfToken, session };
}

export interface AuthenticatedAdminContext {
  session: AdminSession;
  user: Pick<
    AdminUser,
    'id' | 'email' | 'fullName' | 'role' | 'isActive' | 'passwordChangedAt'
  >;
}

/**
 * Validates an opaque session token against PostgreSQL.
 */
export async function validateAdminSessionToken(
  rawToken: string | undefined | null,
  nowOrDb: Date | PrismaClient = new Date(),
  maybeDb?: PrismaClient
): Promise<AuthenticatedAdminContext | null> {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 16) {
    return null;
  }

  const now = nowOrDb instanceof Date ? nowOrDb : new Date();
  const db = nowOrDb instanceof Date ? (maybeDb ?? defaultPrisma) : nowOrDb;

  const tokenHash = hashSessionToken(rawToken);
  const record = await db.adminSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          passwordChangedAt: true,
        },
      },
    },
  });

  if (!record) return null;

  // Check revocation, expiration, active status, and post-password-change validity
  if (
    record.revokedAt !== null ||
    record.expiresAt <= now ||
    !record.user.isActive ||
    record.createdAt < record.user.passwordChangedAt
  ) {
    return null;
  }

  return {
    session: record,
    user: record.user,
  };
}

/**
 * Explicitly revokes a session on logout.
 */
export async function revokeAdminSession(
  rawToken: string | undefined | null,
  now = new Date(),
  db: PrismaClient = defaultPrisma
): Promise<boolean> {
  if (!rawToken) return false;
  const tokenHash = hashSessionToken(rawToken);
  const res = await db.adminSession.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: now,
    },
  });
  return res.count > 0;
}

/**
 * Updates an admin user's password (using Argon2id) and immediately revokes all active sessions
 * for that user in PostgreSQL.
 */
export async function changeAdminPasswordAndRevokeSessions(
  params: {
    userId: string;
    newPlaintextPassword: string;
    ipAddress?: string;
    now?: Date;
  },
  db: PrismaClient = defaultPrisma
): Promise<void> {
  const now = params.now ?? new Date();
  const newPasswordHash = await hashPassword(params.newPlaintextPassword);

  await db.$transaction([
    db.adminUser.update({
      where: { id: params.userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: now,
      },
    }),
    db.adminSession.updateMany({
      where: {
        userId: params.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
      },
    }),
  ]);

  await recordAuditLog(
    {
      actorId: params.userId,
      action: 'AUTH_PASSWORD_CHANGED',
      targetType: 'AdminUser',
      targetId: params.userId,
      ipAddress: params.ipAddress ?? null,
      metadata: { sessionsRevoked: true },
    },
    db
  );
}

/**
 * Verifies CSRF protection for cookie-authenticated state-changing requests:
 * 1. Validates `X-CSRF-Token` header matches the active session's bound `csrfToken`.
 * 2. If `Origin` header is present, verifies it matches `PRIMARY_ORIGIN` or the request Host.
 */
export function verifyCsrfProtection(
  headers: Headers,
  expectedCsrfToken: string,
  primaryOrigin = process.env.PRIMARY_ORIGIN
): { valid: boolean; reason?: string } {
  const providedCsrf = headers.get('x-csrf-token');
  if (!providedCsrf || providedCsrf !== expectedCsrfToken) {
    return { valid: false, reason: 'Invalid or missing CSRF token' };
  }

  const originHeader = headers.get('origin');
  if (originHeader && primaryOrigin) {
    try {
      const parsedOrigin = new URL(originHeader).origin;
      const parsedPrimary = new URL(primaryOrigin).origin;
      const hostHeader = headers.get('host');
      const hostMatches = hostHeader ? new URL(originHeader).host === hostHeader : false;
      if (parsedOrigin !== parsedPrimary && !hostMatches) {
        return { valid: false, reason: 'Cross-origin request rejected by Origin policy' };
      }
    } catch {
      return { valid: false, reason: 'Malformed Origin header' };
    }
  }

  return { valid: true };
}

/**
 * Enforces server-side authentication, role-based authorization (`OWNER` vs `STAFF`),
 * and optional CSRF verification inside privileged server operations.
 */
export async function authorizeAdminOperation(
  params: {
    rawToken: string | undefined | null;
    headers: Headers;
    allowedRoles: AdminRole[];
    requireCsrf: boolean;
    ipAddress?: string;
    operationName: string;
    now?: Date;
  },
  db: PrismaClient = defaultPrisma
): Promise<
  | { ok: true; context: AuthenticatedAdminContext }
  | { ok: false; status: 401 | 403; error: string }
> {
  const context = await validateAdminSessionToken(params.rawToken, params.now, db);
  if (!context) {
    await recordAuditLog(
      {
        action: 'AUTH_UNAUTHORIZED_ACCESS',
        targetType: 'AdminOperation',
        targetId: params.operationName,
        ipAddress: params.ipAddress ?? null,
        metadata: { reason: 'unauthenticated' },
      },
      db
    );
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  if (!params.allowedRoles.includes(context.user.role)) {
    await recordAuditLog(
      {
        actorId: context.user.id,
        actorEmail: context.user.email,
        actorRole: context.user.role,
        action: 'AUTH_FORBIDDEN_ROLE',
        targetType: 'AdminOperation',
        targetId: params.operationName,
        ipAddress: params.ipAddress ?? null,
        metadata: {
          requiredRoles: params.allowedRoles,
          actualRole: context.user.role,
        },
      },
      db
    );
    return {
      ok: false,
      status: 403,
      error: 'Insufficient role permissions for this operation.',
    };
  }

  if (params.requireCsrf) {
    const csrfCheck = verifyCsrfProtection(params.headers, context.session.csrfToken);
    if (!csrfCheck.valid) {
      await recordAuditLog(
        {
          actorId: context.user.id,
          actorEmail: context.user.email,
          actorRole: context.user.role,
          action: 'AUTH_CSRF_REJECTED',
          targetType: 'AdminOperation',
          targetId: params.operationName,
          ipAddress: params.ipAddress ?? null,
          metadata: { reason: csrfCheck.reason },
        },
        db
      );
      return { ok: false, status: 403, error: csrfCheck.reason || 'CSRF validation failed.' };
    }
  }

  return { ok: true, context };
}

export function validateCsrfRequest(params: {
  session: AdminSession;
  csrfHeader: string | null | undefined;
  originHeader?: string | null;
  hostHeader?: string | null;
}): void {
  const headers = new Headers();
  if (params.csrfHeader) headers.set('x-csrf-token', params.csrfHeader);
  if (params.originHeader) headers.set('origin', params.originHeader);
  if (params.hostHeader) headers.set('host', params.hostHeader);

  const check = verifyCsrfProtection(headers, params.session.csrfToken);
  if (!check.valid) {
    throw new AuthorizationError(check.reason || 'CSRF validation failed.', 403);
  }
}

export async function getCurrentAdminSessionFromCookies(
  db: PrismaClient = defaultPrisma
): Promise<AuthenticatedAdminContext | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return validateAdminSessionToken(rawToken, new Date(), db);
}

