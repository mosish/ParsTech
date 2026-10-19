import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './db';
import { loginInputSchema, changePasswordSchema } from './validation';
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearAccountLoginRateLimit,
  DEFAULT_LOGIN_RATE_LIMIT,
  type RateLimitConfig,
} from './rate-limit';
import {
  verifyPassword,
  createAdminSession,
  revokeAdminSession,
  authorizeAdminOperation,
  changeAdminPasswordAndRevokeSessions,
  type CreatedAdminSession,
} from './auth';
import { recordAuditLog } from './audit';

export type LoginServiceResult =
  | {
      ok: true;
      session: CreatedAdminSession;
      user: {
        id: string;
        email: string;
        fullName: string;
        role: 'OWNER' | 'STAFF';
      };
    }
  | {
      ok: false;
      status: 400 | 401 | 429;
      error: string;
      retryAfterSeconds?: number;
    };

/**
 * Handles admin login with:
 * 1. Strict Zod validation (rejecting extra fields)
 * 2. Persistent PostgreSQL rate-limiting by account and IP with expiration cleanup
 * 3. Argon2id password verification
 * 4. Opaque session creation (`AdminSession`) with SHA-256 hashed token and bound CSRF token
 * 5. Sanitized security audit logging (`AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_RATE_LIMITED`)
 */
export async function loginAdminWithPassword(
  params: {
    body: unknown;
    ipAddress: string;
    userAgent?: string;
    now?: Date;
    rateLimitConfig?: RateLimitConfig;
    ttlMs?: number;
  },
  db: PrismaClient = defaultPrisma
): Promise<LoginServiceResult> {
  const now = params.now ?? new Date();
  const rateLimitConfig = params.rateLimitConfig ?? DEFAULT_LOGIN_RATE_LIMIT;

  const parsed = loginInputSchema.safeParse(params.body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: 'اطلاعات ورود نامعتبر است / Invalid login request payload.',
    };
  }

  const { email, password } = parsed.data;

  const rateDecision = await checkLoginRateLimit(
    email,
    params.ipAddress,
    rateLimitConfig,
    now,
    db
  );

  if (!rateDecision.allowed) {
    await recordAuditLog(
      {
        actorEmail: email,
        action: 'AUTH_RATE_LIMITED',
        targetType: 'AdminUser',
        ipAddress: params.ipAddress,
        metadata: {
          retryAfterSeconds: rateDecision.retryAfterSeconds,
        },
      },
      db
    );
    return {
      ok: false,
      status: 429,
      error: 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کمی صبر کنید. / Too many login attempts. Please try again later.',
      retryAfterSeconds: rateDecision.retryAfterSeconds,
    };
  }

  const user = await db.adminUser.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    await recordFailedLoginAttempt(email, params.ipAddress, rateLimitConfig, now, db);
    await recordAuditLog(
      {
        actorEmail: email,
        action: 'AUTH_LOGIN_FAILED',
        targetType: 'AdminUser',
        ipAddress: params.ipAddress,
        metadata: { reason: 'user_not_found_or_inactive' },
      },
      db
    );
    return {
      ok: false,
      status: 401,
      error: 'ایمیل یا رمز عبور نادرست است. / Invalid email or password.',
    };
  }

  const validPassword = await verifyPassword(user.passwordHash, password);
  if (!validPassword) {
    await recordFailedLoginAttempt(email, params.ipAddress, rateLimitConfig, now, db);
    await recordAuditLog(
      {
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'AUTH_LOGIN_FAILED',
        targetType: 'AdminUser',
        targetId: user.id,
        ipAddress: params.ipAddress,
        metadata: { reason: 'invalid_password' },
      },
      db
    );
    return {
      ok: false,
      status: 401,
      error: 'ایمیل یا رمز عبور نادرست است. / Invalid email or password.',
    };
  }

  await clearAccountLoginRateLimit(email, db);

  const createdSession = await createAdminSession(
    {
      userId: user.id,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      ttlMs: params.ttlMs,
      now,
    },
    db
  );

  await recordAuditLog(
    {
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_LOGIN_SUCCESS',
      targetType: 'AdminSession',
      targetId: createdSession.session.id,
      ipAddress: params.ipAddress,
    },
    db
  );

  return {
    ok: true,
    session: createdSession,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

/**
 * Handles admin logout with session revocation in PostgreSQL.
 */
export async function logoutAdminSession(
  tokenOrParams:
    | string
    | undefined
    | null
    | {
        rawToken: string | undefined | null;
        headers?: Headers;
        ipAddress?: string;
        now?: Date;
      },
  ipOrDb?: string | null | PrismaClient,
  maybeDb?: PrismaClient
): Promise<{ ok: true } | { ok: false; status: 401 | 403; error: string }> {
  if (typeof tokenOrParams === 'object' && tokenOrParams !== null) {
    const db = (ipOrDb as PrismaClient | undefined) ?? defaultPrisma;
    if (tokenOrParams.headers) {
      const authResult = await authorizeAdminOperation(
        {
          rawToken: tokenOrParams.rawToken,
          headers: tokenOrParams.headers,
          allowedRoles: ['OWNER', 'STAFF'],
          requireCsrf: true,
          ipAddress: tokenOrParams.ipAddress,
          operationName: 'logoutAdmin',
          now: tokenOrParams.now,
        },
        db
      );

      if (!authResult.ok) {
        return authResult;
      }

      await revokeAdminSession(tokenOrParams.rawToken, tokenOrParams.now, db);
      await recordAuditLog(
        {
          actorId: authResult.context.user.id,
          actorEmail: authResult.context.user.email,
          actorRole: authResult.context.user.role,
          action: 'AUTH_LOGOUT',
          targetType: 'AdminSession',
          targetId: authResult.context.session.id,
          ipAddress: tokenOrParams.ipAddress ?? null,
        },
        db
      );
      return { ok: true };
    }
    await revokeAdminSession(tokenOrParams.rawToken, tokenOrParams.now, db);
    return { ok: true };
  }

  const rawToken = tokenOrParams;
  const ipAddress = typeof ipOrDb === 'string' ? ipOrDb : null;
  const db =
    typeof ipOrDb === 'object' && ipOrDb !== null
      ? ipOrDb
      : (maybeDb ?? defaultPrisma);

  await revokeAdminSession(rawToken, new Date(), db);
  await recordAuditLog(
    {
      action: 'AUTH_LOGOUT',
      targetType: 'AdminSession',
      ipAddress,
    },
    db
  );
  return { ok: true };
}

export async function authenticateAdminLogin(
  body: unknown,
  meta: {
    ipAddress: string;
    userAgent?: string | null;
    now?: Date;
    rateLimitConfig?: RateLimitConfig;
    ttlMs?: number;
  },
  db: PrismaClient = defaultPrisma
): Promise<
  | {
      ok: true;
      rawToken: string;
      csrfToken: string;
      expiresAt: Date;
      user: {
        id: string;
        email: string;
        fullName: string;
        role: 'OWNER' | 'STAFF';
      };
    }
  | {
      ok: false;
      status: 400 | 401 | 429;
      error: string;
      retryAfterSeconds?: number;
    }
> {
  const res = await loginAdminWithPassword(
    {
      body,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent ?? undefined,
      now: meta.now,
      rateLimitConfig: meta.rateLimitConfig,
      ttlMs: meta.ttlMs,
    },
    db
  );

  if (!res.ok) return res;

  return {
    ok: true,
    rawToken: res.session.rawToken,
    csrfToken: res.session.csrfToken,
    expiresAt: res.session.session.expiresAt,
    user: res.user,
  };
}

export async function changeAdminPassword(
  auth: {
    user: { id: string; email: string; role: 'OWNER' | 'STAFF' };
  } | null,
  body: unknown,
  ipAddress: string | null = null,
  db: PrismaClient = defaultPrisma
): Promise<
  | { ok: true; revokedSessionsCount: number }
  | { ok: false; status: 400 | 401 | 403; error: string }
> {
  if (!auth) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const fullUser = await db.adminUser.findUnique({
    where: { id: auth.user.id },
  });
  if (!fullUser || !fullUser.isActive) {
    return { ok: false, status: 401, error: 'User not found.' };
  }

  const validCurrent = await verifyPassword(
    fullUser.passwordHash,
    parsed.data.currentPassword
  );
  if (!validCurrent) {
    await recordAuditLog(
      {
        actorId: fullUser.id,
        actorEmail: fullUser.email,
        actorRole: fullUser.role,
        action: 'AUTH_PASSWORD_CHANGE_FAILED',
        targetType: 'AdminUser',
        targetId: fullUser.id,
        ipAddress,
      },
      db
    );
    return { ok: false, status: 401, error: 'Current password is incorrect.' };
  }

  const activeCountBefore = await db.adminSession.count({
    where: {
      userId: fullUser.id,
      revokedAt: null,
    },
  });

  await changeAdminPasswordAndRevokeSessions(
    {
      userId: fullUser.id,
      newPlaintextPassword: parsed.data.newPassword,
      ipAddress: ipAddress ?? undefined,
    },
    db
  );

  return {
    ok: true,
    revokedSessionsCount: activeCountBefore,
  };
}

