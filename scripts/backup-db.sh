#!/usr/bin/env bash
# ==============================================================================
# ParsTech PostgreSQL Automated Backup Script (scripts/backup-db.sh)
# - Creates a compressed custom-format dump (`pg_dump --format=custom`)
# - Enforces local retention cleanup (`BACKUP_RETENTION_DAYS`, default 14 days)
# - Syncs to an optional off-server destination (`OFFSITE_BACKUP_TARGET`)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/parstech-postgres}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
OFFSITE_BACKUP_TARGET="${OFFSITE_BACKUP_TARGET:-}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="${BACKUP_DIR}/parstech_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[backup] Starting PostgreSQL backup at ${TIMESTAMP}..."

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump --format=custom --no-owner --no-privileges --file="${BACKUP_FILE}" "${DATABASE_URL}"
elif command -v docker >/dev/null 2>&1 && docker compose ps postgres >/dev/null 2>&1; then
  docker compose exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-parstech_app}" \
    -d "${POSTGRES_DB:-parstech_prod}" \
    --format=custom --no-owner --no-privileges > "${BACKUP_FILE}"
else
  echo "[backup] ERROR: Neither DATABASE_URL nor running postgres container found." >&2
  exit 1
fi

chmod 600 "${BACKUP_FILE}"
echo "[backup] Created dump: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Prune local backups older than BACKUP_RETENTION_DAYS
find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'parstech_*.dump' -mtime +"${BACKUP_RETENTION_DAYS}" -delete
echo "[backup] Pruned local dumps older than ${BACKUP_RETENTION_DAYS} days."

# Optional off-server replication (e.g., rclone remote or rsync user@host:/path)
if [ -n "${OFFSITE_BACKUP_TARGET}" ]; then
  echo "[backup] Replicating backup to off-server destination: ${OFFSITE_BACKUP_TARGET}"
  if command -v rclone >/dev/null 2>&1 && [[ "${OFFSITE_BACKUP_TARGET}" == *":"* ]]; then
    rclone copy "${BACKUP_FILE}" "${OFFSITE_BACKUP_TARGET}"
  else
    rsync -az --chmod=F600 "${BACKUP_FILE}" "${OFFSITE_BACKUP_TARGET}"
  fi
  echo "[backup] Off-server replication complete."
fi

echo "[backup] Done."
