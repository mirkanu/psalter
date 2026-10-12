#!/bin/bash
# Phase 18 Plan 18-01 — final fresh Neon dump BEFORE Neon project deletion.
# Prevents the silent-failure mode that hit backup-neon.yml for 5 weeks
# (Neon Free tier autoscroll-up hibernation → puma takes >5s on first
# query → Action's `pg_dump` times out → catch-all commits 20-byte placeholder).
set -euo pipefail

set -a
. /home/services/psalter/.planning/phases/18-undo-vercel-neon-migration-restore-hetzner-hosting/18-01-conn.txt
set +a

DUMP_FILE="/tmp/psalter-neon-final-$(date -u +%Y%m%d).sql.gz"

# Step 1 — wake the endpoint (SELECT 1 round-trip; Neon pooler warms compute)
echo "Waking Neon endpoint…"
psql "$DATABASE_URL" -c 'SELECT 1;'
sleep 5

# Step 2 — dump (--no-owner/--no-acl/--clean/--if-exists matches backup repo's
# pg_dump shape so the file is interchangeable with the Sept 9 dump)
echo "Dumping…"
pg_dump --no-owner --no-acl --clean --if-exists "$DATABASE_URL" \
  | gzip > "$DUMP_FILE"

# Step 3 — sanity-check (size + line count). Empty/truncated dumps were the
# Phase 17 silent-failure mode — catch them BEFORE proceeding to Wave 4.
SIZE=$(stat -c%s "$DUMP_FILE")
LINES=$(gunzip -c "$DUMP_FILE" | wc -l)
echo "Dump: $DUMP_FILE — ${SIZE} bytes, ${LINES} lines"
test "$SIZE" -gt 500000 || { echo "ABORT: dump < 500KB (expected ~989KB like Sept 9)" >&2; exit 1; }
test "$LINES" -gt 10000 || { echo "ABORT: dump < 10K lines" >&2; exit 1; }
echo "FRESH_NEON_DUMP_OK"
