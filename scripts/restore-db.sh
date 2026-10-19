#!/usr/bin/env bash
# ==============================================================================
# ParsTech PostgreSQL Restore Script (scripts/restore-db.sh)
# Usage: ./scripts/restore-db.sh /path/to/parstech_YYYYMMDDTHHMMSSZ.dump
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.dump>" >&2
  exit 1
fi

DUMP_FILE="$1"
if [ ! -f "${DUMP_FILE}" ]; then
  echo "[restore] ERROR: Backup file not found: ${DUMP_FILE}" >&2
  exit 1
fi

echo "[restore] Restoring PostgreSQL database from ${DUMP_FILE}..."

if [ -n "${DATABASE_URL:-}" ]; then
  pg_restore --clean --if-exists --no-owner --no-privileges --dbname="${DATABASE_URL}" "${DUMP_FILE}"
elif command -v docker >/dev/null 2>&1 && docker compose ps postgres >/dev/null 2>&1; then
  docker compose exec -T postgres pg_restore \
    -U "${POSTGRES_USER:-parstech_app}" \
    -d "${POSTGRES_DB:-parstech_prod}" \
    --clean --if-exists --no-owner --no-privileges < "${DUMP_FILE}"
else
  echo "[restore] ERROR: Neither DATABASE_URL nor running postgres container found." >&2
  exit 1
fi

echo "[restore] Database restore completed successfully."
