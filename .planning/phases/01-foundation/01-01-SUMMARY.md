---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [docker, postgresql, postgres, environment, local-storage]

# Dependency graph
requires: []
provides:
  - "psalter-db PostgreSQL 16 container running on host port 5435"
  - "docker-compose.yml with psalter-db service and psalter_tunes volume"
  - ".env.example documenting all required environment variables"
  - ".gitignore covering .env, node_modules, .next, build artifacts"
  - ".env populated with DATABASE_URL, AIRTABLE_PAT, AIRTABLE_BASE_ID, TUNES_DIR"
affects: [01-02, 01-03, 01-04, 01-05]

# Tech tracking
tech-stack:
  added: [postgres:16-alpine, docker-compose]
  patterns: ["psalter-db container on port 5435 (avoids conflict with debates-db/reforma-db/ynab-db on 5432)", "Docker named volume for tune JPG local storage"]

key-files:
  created:
    - docker-compose.yml
    - .env.example
    - .gitignore
    - .env
  modified: []

key-decisions:
  - "Port 5435 for psalter-db to avoid conflict with other DB containers (debates-db, reforma-db, ynab-db all on internal 5432)"
  - "postgres:16-alpine image for minimal footprint matching project spec"
  - "Healthcheck via pg_isready ensures container readiness before downstream tasks run"
  - "psalter_tunes Docker named volume replaces Cloudflare R2 for tune JPG storage — simpler, no external dependency"

patterns-established:
  - "DATABASE_URL pattern: postgresql://postgres:postgres@localhost:5435/psalter"
  - "TUNES_DIR=/app/public/tunes for tune JPG storage in container"
  - ".env excluded from git via standalone .env line in .gitignore"

requirements-completed: [MIGR-01, MIGR-02, MIGR-03, MIGR-04]

# Metrics
duration: 20min
completed: 2026-05-07
---

# Phase 01, Plan 01: Infrastructure Prerequisites Summary

**PostgreSQL 16 container (psalter-db) running on port 5435, psalter_tunes Docker volume declared, .env populated with real credentials — all infrastructure prerequisites complete.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-05-07
- **Tasks:** 3 of 3 complete
- **Files modified:** 4

## Accomplishments

- docker-compose.yml created with psalter-db PostgreSQL 16 container on host port 5435 and psalter_tunes named volume
- psalter-db container running and healthy (pg_isready confirmed)
- .env.example updated: R2 vars removed, TUNES_DIR added for local volume storage
- .gitignore protecting .env, node_modules, .next, build output, and other generated files
- .env created with DATABASE_URL, real AIRTABLE_PAT, AIRTABLE_BASE_ID, TUNES_DIR

## Task Commits

| Task | Description | Hash | Type |
|------|-------------|------|------|
| 1 | Create docker-compose.yml, .env.example, .gitignore | be5eaa5 | chore |
| 2 | Start psalter-db container (runtime — no file changes) | — | — |
| 3 | Add psalter_tunes volume; update .env.example; create .env | e7a803a | chore |

## Files Created/Modified

- `docker-compose.yml` — psalter-db PostgreSQL 16 container + psalter_tunes named volume
- `.env.example` — Template with DATABASE_URL, AIRTABLE_PAT, AIRTABLE_BASE_ID, TUNES_DIR
- `.gitignore` — Git exclusion rules for secrets, build artifacts, OS/editor files
- `.env` — Real credentials (gitignored, not committed)

## Decisions Made

- Port 5435 chosen to avoid conflict with debates-db, reforma-db, ynab-db on this server
- postgres:16-alpine used for minimal image footprint
- Healthcheck uses pg_isready with 5s interval and 5 retries
- R2 replaced with Docker named volume (psalter_tunes) for tune JPG storage

## Deviations from Plan

**1. [Architectural Deviation] R2 replaced with Docker named volume**
- Original plan specified Cloudflare R2 for tune score sheet JPG storage
- Changed to `psalter_tunes` Docker named volume mounted at /app/public/tunes/
- Reason: Simpler deployment, no external API credentials needed, Hetzner VPS has sufficient disk
- Impact: Tune images served as Next.js static files; R2 vars removed from .env.example

**2. [Rule 3 - Auto-fix] AIRTABLE_PAT not found at expected path**
- Plan specified reading AIRTABLE_PAT from /home/services/.env.production
- That file contains no Airtable credentials
- Resolution: AIRTABLE_PAT was already present in /data/home/psalter/.env from prior project setup; used existing value and completed the .env with remaining required vars

## Verification Results

- [x] `grep "psalter_tunes" docker-compose.yml` — found
- [x] `grep "TUNES_DIR" .env.example` — found
- [x] `grep "DATABASE_URL" .env` — found
- [x] `git ls-files .env | wc -l` — returns 0 (not tracked)
- [x] `docker exec psalter-db pg_isready -U postgres -d psalter` — accepting connections

## Next Phase Readiness

- psalter-db is running and accepting connections on port 5435
- psalter_tunes volume declared and ready for use
- .env populated — plan 01-02 (Next.js scaffold + Drizzle schema) can proceed immediately
- DATABASE_URL: `postgresql://postgres:postgres@localhost:5435/psalter`
