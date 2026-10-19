#!/usr/bin/env bash
# ==============================================================================
# ParsTech Phase 1 — PostgreSQL Database Backup Script
# Features:
# - Creates compressed custom-format dump (`pg_dump -Fc`) with restrictive `0600` permissions
# - Enforces configurable local retention (`BACKUP_RETENTION_DAYS`, default: 14)
# - Supports configurable off-server destination (`OFFSITE_BACKUP_TARGET`) via rclone or rsync
# ==============================================================================

set -euo pipefail

umask 0077

BACKUP_DIR="${BACKUP_DIR:-/var/backups/parstech/postgres}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
OFFSITE_BACKUP_TARGET="${OFFSITE_BACKUP_TARGET:-}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-parstech-postgres}"
POSTGRES_USER="${POSTGRES_USER:-parstech}"
POSTGRES_DB="${POSTGRES_DB:-parstech_prod}"

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
DUMP_FILENAME="parstech_${POSTGRES_DB}_${TIMESTAMP}.dump"
DUMP_PATH="${BACKUP_DIR}/${DUMP_FILENAME}"

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting PostgreSQL backup for ${POSTGRES_DB}..."

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
  docker exec -i "${POSTGRES_CONTAINER}" pg_dump -Fc --no-acl --no-owner -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "${DUMP_PATH}"
elif [ -n "${DATABASE_URL:-}" ]; then
  pg_dump -Fc --no-acl --no-owner "${DATABASE_URL}" > "${DUMP_PATH}"
else
  echo "Error: Neither running container '${POSTGRES_CONTAINER}' nor DATABASE_URL is available." >&2
  exit 1
fi

chmod 600 "${DUMP_PATH}"
sha256sum "${DUMP_PATH}" > "${DUMP_PATH}.sha256"
chmod 600 "${DUMP_PATH}.sha256"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup created: ${DUMP_PATH}"

# Prune local backups older than BACKUP_RETENTION_DAYS
find "${BACKUP_DIR}" -maxdepth 1 -type f \( -name "parstech_*.dump" -o -name "parstech_*.dump.sha256" \) -mtime +"${BACKUP_RETENTION_DAYS}" -delete
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Local backups older than ${BACKUP_RETENTION_DAYS} days pruned."

# Optional off-server backup replication
if [ -n "${OFFSITE_BACKUP_TARGET}" ]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Syncing backup to off-server target: ${OFFSITE_BACKUP_TARGET}"
  if command -v rclone >/dev/null 2>&1 && [[ "${OFFSITE_BACKUP_TARGET}" == *":"* ]] && [[ "${OFFSITE_BACKUP_TARGET}" != *"@"* ]]; then
    rclone copy "${DUMP_PATH}" "${OFFSITE_BACKUP_TARGET}"
    rclone copy "${DUMP_PATH}.sha256" "${OFFSITE_BACKUP_TARGET}"
  else
    rsync -az --chmod=F600 "${DUMP_PATH}" "${DUMP_PATH}.sha256" "${OFFSITE_BACKUP_TARGET}/"
  fi
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Off-server backup replication finished."
fi
