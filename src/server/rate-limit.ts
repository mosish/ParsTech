import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './db';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

export const DEFAULT_LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 15 * 60 * 1000, // 15 minutes lockout
};

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
}

/**
 * Deletes expired rate-limit records from PostgreSQL so stale counters do not accumulate.
 */
export async function cleanupExpiredRateLimits(
  now = new Date(),
  db: PrismaClient = defaultPrisma
): Promise<number> {
  const res = await db.loginRateLimit.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });
  return res.count;
}

async function checkSingleKey(
  key: string,
  now: Date,
  config: RateLimitConfig,
  db: PrismaClient
): Promise<RateLimitDecision> {
  const record = await db.loginRateLimit.findUnique({ where: { key } });
  if (!record || record.expiresAt < now) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remainingAttempts: config.maxAttempts,
    };
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000)
    );
    return {
      allowed: false,
      retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  const windowAge = now.getTime() - record.windowStart.getTime();
  if (windowAge > config.windowMs) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remainingAttempts: config.maxAttempts,
    };
  }

  if (record.attempts >= config.maxAttempts) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((record.expiresAt.getTime() - now.getTime()) / 1000)
    );
    return {
      allowed: false,
      retryAfterSeconds,
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, config.maxAttempts - record.attempts),
  };
}

async function incrementSingleKey(
  key: string,
  now: Date,
  config: RateLimitConfig,
  db: PrismaClient
): Promise<void> {
  const existing = await db.loginRateLimit.findUnique({ where: { key } });
  const expiresAt = new Date(now.getTime() + Math.max(config.windowMs, config.blockDurationMs));

  if (!existing || existing.expiresAt < now || now.getTime() - existing.windowStart.getTime() > config.windowMs) {
    const blockedUntil =
      1 >= config.maxAttempts ? new Date(now.getTime() + config.blockDurationMs) : null;
    await db.loginRateLimit.upsert({
      where: { key },
      create: {
        key,
        attempts: 1,
        windowStart: now,
        blockedUntil,
        expiresAt,
      },
      update: {
        attempts: 1,
        windowStart: now,
        blockedUntil,
        expiresAt,
      },
    });
    return;
  }

  const nextAttempts = existing.attempts + 1;
  const blockedUntil =
    nextAttempts >= config.maxAttempts
      ? new Date(now.getTime() + config.blockDurationMs)
      : existing.blockedUntil;

  await db.loginRateLimit.update({
    where: { key },
    data: {
      attempts: nextAttempts,
      blockedUntil,
      expiresAt,
    },
  });
}

export function buildLoginRateKeys(email: string, ipAddress: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ipAddress.trim() || '127.0.0.1';
  return {
    accountKey: `acct:${normalizedEmail}`,
    ipKey: `ip:${normalizedIp}`,
  };
}

/**
 * Checks whether a login request for (email, ipAddress) is currently rate-limited.
 * Cleans up expired counters first.
 */
export async function checkLoginRateLimit(
  email: string,
  ipAddress: string,
  config: RateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT,
  now = new Date(),
  db: PrismaClient = defaultPrisma
): Promise<RateLimitDecision> {
  await cleanupExpiredRateLimits(now, db);
  const { accountKey, ipKey } = buildLoginRateKeys(email, ipAddress);

  const [acctDecision, ipDecision] = await Promise.all([
    checkSingleKey(accountKey, now, config, db),
    checkSingleKey(ipKey, now, config, db),
  ]);

  if (!acctDecision.allowed || !ipDecision.allowed) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(acctDecision.retryAfterSeconds, ipDecision.retryAfterSeconds),
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingAttempts: Math.min(acctDecision.remainingAttempts, ipDecision.remainingAttempts),
  };
}

/**
 * Records a failed login attempt for both the account and IP address in PostgreSQL.
 */
export async function recordFailedLoginAttempt(
  email: string,
  ipAddress: string,
  config: RateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT,
  now = new Date(),
  db: PrismaClient = defaultPrisma
): Promise<void> {
  const { accountKey, ipKey } = buildLoginRateKeys(email, ipAddress);
  await Promise.all([
    incrementSingleKey(accountKey, now, config, db),
    incrementSingleKey(ipKey, now, config, db),
  ]);
}

/**
 * Clears the account rate-limit counter after a successful login.
 */
export async function clearAccountLoginRateLimit(
  email: string,
  db: PrismaClient = defaultPrisma
): Promise<void> {
  const { accountKey } = buildLoginRateKeys(email, '127.0.0.1');
  await db.loginRateLimit.deleteMany({
    where: { key: accountKey },
  });
}
