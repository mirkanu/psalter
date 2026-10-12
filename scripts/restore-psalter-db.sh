#!/bin/bash
# Phase 18 Plan 18-01 — restore psalter DB from canonical dump into the
# local psalter-db container. Reads the postgres password from
# /home/services/.env.production (POSTGRES_PASSWORD); do not hardcode.
set -euo pipefail

# Load only valid env lines from .env.production (skip lines with - in
# identifier names like LAUNCH-TEST_UMAMI_WEBSITE_ID; bash refuses to
# source those and the bare . would otherwise fail under set -e).
if [ -f /home/services/.env.production ]; then
  while IFS="=" read -r key value; do
    if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && [ -n "$value" ]; then
      export "$key=$value"
    fi
  done < <(grep -E "^[A-Za-z_][A-Za-z0-9_]*=" /home/services/.env.production)
fi
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set in /home/services/.env.production}"
export PGPASSWORD="$POSTGRES_PASSWORD"

LOCAL_PORT=${PSALTER_DB_PORT:-5435}

# Step 1 — wait for psalter-db to accept connections
until pg_isready -h localhost -p "$LOCAL_PORT" -U postgres; do
  echo "Waiting for psalter-db…"
  sleep 2
done

# Step 2 — pick the canonical source.
# Priority: freshest dated Neon pull (if any) → Sept 9 backup-repo dump.
SRC_SQL=/tmp/psalter-restore.sql
FRESH=$(ls -t /tmp/psalter-neon-final-*.sql.gz 2>/dev/null | head -1 || true)
if [ -n "$FRESH" ] && [ -f "$FRESH" ]; then
  SIZE=$(stat -c%s "$FRESH")
  if [ "$SIZE" -gt 500000 ]; then
    gunzip -c "$FRESH" > "$SRC_SQL"
    echo "Source: fresh Neon dump ($FRESH, ${SIZE} bytes)"
  else
    gunzip -c /home/services/psalter/backups/daily-2026-09-09.sql.gz > "$SRC_SQL"
    echo "Source: Sept 9 dump (fresh Neon dump too small: ${SIZE} bytes)"
  fi
elif [ -f /home/services/psalter/backups/daily-2026-09-09.sql.gz ]; then
  gunzip -c /home/services/psalter/backups/daily-2026-09-09.sql.gz > "$SRC_SQL"
  echo "Source: Sept 9 dump (no fresh Neon pull available)"
else
  echo "ABORT: no canonical dump found" >&2
  exit 1
fi

SRC_SIZE=$(stat -c%s "$SRC_SQL")
SRC_LINES=$(wc -l < "$SRC_SQL")
echo "Unzipped: ${SRC_SIZE} bytes, ${SRC_LINES} lines"
test "$SRC_SIZE" -gt 1000000 || { echo "ABORT: <1MB unzipped" >&2; exit 1; }
test "$SRC_LINES" -gt 10000 || { echo "ABORT: <10K lines" >&2; exit 1; }

# Step 3 — drop + recreate the psalter database.
# The persistent volume holds the pre-Phase-17 schema + data; dropping
# the database inside the cluster wipes the FEATURED SCHEMA but keeps
# the cluster + WAL. Acceptable — the canonical dump is being restored.
psql -h localhost -p "$LOCAL_PORT" -U postgres -c "DROP DATABASE IF EXISTS psalter;"
psql -h localhost -p "$LOCAL_PORT" -U postgres -c "CREATE DATABASE psalter;"

# Step 4 — restore
psql -h localhost -p "$LOCAL_PORT" -U postgres -d psalter -f "$SRC_SQL" \
  > /tmp/psalter-restore.log 2>&1
RESTORE_EXIT=$?
if [ "$RESTORE_EXIT" -ne 0 ]; then
  echo "ABORT: psql -f exited $RESTORE_EXIT. Last 30 lines:"
  tail -30 /tmp/psalter-restore.log
  exit 1
fi

# Step 5 — row-count parity check (RESEARCH.md Validation Architecture INFRA-14)
psql -h localhost -p "$LOCAL_PORT" -U postgres -d psalter -c \
  "SELECT 'psalms', COUNT(*) FROM psalms
   UNION ALL SELECT 'tunes', COUNT(*) FROM tunes
   UNION ALL SELECT 'psalm_versions', COUNT(*) FROM psalm_versions
   UNION ALL SELECT 'daily_readings', COUNT(*) FROM daily_readings
   UNION ALL SELECT 'changelog_posts', COUNT(*) FROM changelog_posts
   UNION ALL SELECT 'feedback_submissions', COUNT(*) FROM feedback_submissions;"

# Cleanup the unzipped file
rm -f "$SRC_SQL"
echo "RESTORE_OK"
