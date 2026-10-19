#!/usr/bin/env bash
# ==============================================================================
# ParsTech Phase 1 — PostgreSQL Database Restore Script
# Usage:
#   ./scripts/db-restore.sh /var/backups/parstech/postgres/parstech_parstech_prod_20261019T120000Z.dump
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.dump>" >&2
  exit 1
fi

DUMP_PATH="$1"
if [ ! -f "${DUMP_PATH}" ]; then
  echo "Error: Backup file not found: ${DUMP_PATH}" >&2
  exit 1
fi

if [ -f "${DUMP_PATH}.sha256" ]; then
  echo "Verifying SHA-256 checksum..."
  sha256sum -c "${DUMP_PATH}.sha256"
fi

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-parstech-postgres}"
POSTGRES_USER="${POSTGRES_USER:-parstech}"
POSTGRES_DB="${POSTGRES_DB:-parstech_prod}"

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
  read -r -p "WARNING: This will overwrite objects in database '${POSTGRES_DB}'. Type YES to continue: " REPLY
  if [ "${REPLY}" != "YES" ]; then
    echo "Restore aborted."
    exit 1
  fi
fi

echo "Restoring ${DUMP_PATH} into ${POSTGRES_DB}..."

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
  docker exec -i "${POSTGRES_CONTAINER}" pg_restore --clean --if-exists --no-acl --no-owner -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${DUMP_PATH}"
elif [ -n "${DATABASE_URL:-}" ]; then
  pg_restore --clean --if-exists --no-acl --no-owner -d "${DATABASE_URL}" "${DUMP_PATH}"
else
  echo "Error: Neither running container '${POSTGRES_CONTAINER}' nor DATABASE_URL is available." >&2
  exit 1
fi

echo "Database restore completed successfully."
