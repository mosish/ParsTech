import type { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from './db';

const FORBIDDEN_METADATA_KEYS = new Set([
  'password',
  'passwordhash',
  'currentpassword',
  'newpassword',
  'token',
  'tokenhash',
  'sessiontoken',
  'csrftoken',
  'cookie',
  'set-cookie',
  'authorization',
  'secret',
  'nationalid',
  'shebaiban',
  'mobile',
  'phone',
  'address',
]);

/**
 * Recursively strips any passwords, session tokens, cookies, or sensitive personal data
 * before persisting audit metadata to PostgreSQL.
 */
export function sanitizeAuditMetadata(
  input: Record<string, unknown> | undefined | null
): Prisma.InputJsonObject | undefined {
  if (!input || typeof input !== 'object') return undefined;

  const clean: Record<string, Prisma.InputJsonValue | null> = {};
  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
    if (FORBIDDEN_METADATA_KEYS.has(normalizedKey)) {
      continue;
    }
    if (value === undefined) continue;
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (typeof value === 'bigint') {
      clean[key] = value.toString();
    } else if (Array.isArray(value)) {
      clean[key] = value.map((item) =>
        typeof item === 'bigint' ? item.toString() : String(item)
      );
    } else if (typeof value === 'object') {
      const nested = sanitizeAuditMetadata(value as Record<string, unknown>);
      if (nested) clean[key] = nested;
    }
  }
  return clean;
}

export interface AuditLogInput {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string;
  targetId?: string | null;
  entityType?: string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordAuditLog(
  entry: AuditLogInput,
  db: PrismaClient = defaultPrisma
) {
  const metadataJson = sanitizeAuditMetadata(entry.metadata);
  const resolvedTargetType = entry.targetType ?? entry.entityType ?? 'System';
  const resolvedTargetId = entry.targetId ?? entry.entityId ?? null;

  return db.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      actorEmail: entry.actorEmail ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      targetType: resolvedTargetType,
      targetId: resolvedTargetId,
      ipAddress: entry.ipAddress ?? null,
      metadataJson: metadataJson ?? undefined,
    },
  });
}

