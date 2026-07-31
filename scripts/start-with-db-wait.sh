#!/bin/bash
set -e

# Load environment variables.
# Order matters: shared VPS secrets first, project .env second, so project-local
# values (DATABASE_URL, BETTER_AUTH_*, TUNES_DIR) override anything shared.
# `set -a` auto-exports and, unlike `export $(... | xargs)`, survives values that
# contain spaces — PSALTER_RESEND_FROM_ADDRESS is "CPRC Psalter <psalter@mail.gsdlabs.dev>".
# Sourcing is wrapped so a malformed shared file can never kill startup under `set -e`
# (see Phase 07 Plan 01 discovered_facts).
set +e
set -a
[ -f /home/services/.env.production ] && . /home/services/.env.production
[ -f /home/services/psalter/.env ] && . /home/services/psalter/.env
set +a
set -e

# Wait for PostgreSQL to be ready, with timeout
TIMEOUT=60
START_TIME=$(date +%s)
until pg_isready -h localhost -p 5435 -U postgres; do
  NOW=$(date +%s)
  if [ $((NOW - START_TIME)) -ge $TIMEOUT ]; then
    echo "Timeout: Database did not become ready within ${TIMEOUT} seconds" >&2
    exit 1
  fi
  echo "Waiting for database connection..."
  sleep 2
done

echo "Database is ready - starting Next.js"
exec npm run start -- --port 3005
