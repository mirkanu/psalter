#!/bin/bash
set -e

# Load environment variables from .env file
if [ -f /home/services/psalter/.env ]; then
  export $(grep -v '^#' /home/services/psalter/.env | xargs)
fi

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
