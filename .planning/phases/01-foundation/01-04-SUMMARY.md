---
phase: 01-foundation
plan: 04
subsystem: migration
tags: [airtable, postgresql, migration, drizzle, two-pass]

# Dependency graph
requires:
  - phase: 01-03
    provides: "18-table Drizzle schema pushed to psalter-db"
provides:
  - "scripts/migrate-airtable.ts — two-pass Airtable→PostgreSQL migration, idempotent upserts"
  - "scripts/download-tunes.ts — local JPG download helper (TUNES_DIR, slugify, multi-attachment)"
  - "All 18 tables in psalter-db populated from Airtable base appY3dB1EHtex0fUJ"
  - "SKIP_IMAGES=1 flag for disk-constrained migration runs"
affects: [01-05]

# Tech tracking
tech-stack:
  added:
    - "airtable@0.12.2 — .select().all() pagination"
    - "dotenv/config — .env loading for migration scripts"
  patterns:
    - "Two-pass migration: Pass 1 builds airtableId→postgresId maps; Pass 2 resolves junction FKs"
    - "onConflictDoUpdate on airtable_id for all primary tables (idempotent, re-runnable)"
    - "onConflictDoNothing for junction tables (composite PK prevents duplicates)"
    - "SKIP_IMAGES=1 env var gates JPG downloads (enables DB-only migration runs)"
    - "psalmVersionToPsalmIdMap: Scottish Psalter airtableId → psalm integer PK"

key-files:
  created:
    - scripts/migrate-airtable.ts
    - scripts/download-tunes.ts
    - public/tunes/.gitkeep
    - public/tunes/.gitignore
  modified:
    - docker-compose.yml

key-decisions:
  - "SKIP_IMAGES=1 env flag added — tune JPGs are ~1.1GB total, larger than expected; flag enables DB migration without filling disk"
  - "Airtable field names verified via Meta API — several differed from research assumptions (see deviations)"
  - "psalter_tunes named Docker volume removed from docker-compose — replaced by public/tunes bind mount path"
  - "Verse doctrines routed via Doctrine References table (not Verses.Doctrines which links to deprecated Doctrines Oldf)"
  - "service_items.psalm_id resolved via psalmVersionToPsalmIdMap (Psalm&Tune CPRC.Psalm links to Scottish Psalter not Psalms)"

# Metrics
duration: 49min
completed: 2026-05-07
---

# Phase 01, Plan 04: Airtable Migration Scripts Summary

**Two-pass Airtable→PostgreSQL migration with idempotent upserts; all 18 tables populated (150 psalms, 172 tunes, 2461 verses, 856 service items, 6005 verse-topic links); SKIP_IMAGES=1 flag added for disk-constrained environments**

## Performance

- **Duration:** ~49 min (includes multiple Airtable API field name discovery iterations)
- **Completed:** 2026-05-07
- **Tasks:** 2 of 2 complete
- **Files created:** 4 (migrate-airtable.ts, download-tunes.ts, public/tunes/.gitkeep, public/tunes/.gitignore)
- **Files modified:** 1 (docker-compose.yml)

## Accomplishments

- `scripts/download-tunes.ts` exports `slugifyTuneName`, `downloadToLocal`, `downloadTuneScores` — handles multi-attachment tunes (Pitfall 7), returns `/tunes/{filename}` relative paths
- `scripts/migrate-airtable.ts` implements complete two-pass migration:
  - **Pass 1 (12 functions):** moods, navesTopics, topics, doctrines, psalms, tunes, psalmVersions, verses, events, messianicPsalms, sectionHeadings, dailyReadings
  - **Pass 2 (6 functions):** psalmTopics, psalmVersionTunes, tuneMoods, verseNavesTopics, verseDoctrines, serviceItems
- All primary table inserts use `onConflictDoUpdate` targeting `airtableId` — idempotent, re-runnable for MIGR-04
- All junction inserts use `onConflictDoNothing` — composite PK prevents duplicates
- `normaliseMeter()` extracts abbreviation from Airtable's full-form strings: "Common Meter (CM, 86 86)" → "CM"
- `parsePosition()` converts "1st"/"2nd"/etc ordinals to integers for service_items.position
- `SKIP_IMAGES=1` env var disables attachment downloads (enables DB-only migration when disk is constrained)
- `npx tsc --noEmit` exits 0
- Migration runs idempotently — second run produces identical row counts

## Database Row Counts (verified)

| Table | Count |
|-------|-------|
| moods | 10 |
| naves_topics | 488 |
| topics | 88 |
| doctrines | 40 |
| psalms | 150 |
| tunes | 172 |
| psalm_versions | 184 |
| verses | 2,461 |
| events | 29 |
| messianic_psalms | 18 |
| section_headings | 402 |
| daily_readings | 365 |
| psalm_topics | 882 |
| psalm_version_tunes | 184 |
| tune_moods | 164 |
| verse_naves_topics | 6,005 |
| verse_doctrines | 46 |
| service_items | 856 |

## Task Commits

| Task | Description | Hash | Type |
|------|-------------|------|------|
| 1 | Local tune JPG download helper | 69166b4 | feat |
| 2 | Two-pass migration script + docker-compose fix | 3eeb0b8 | feat |
| - | public/tunes dir + gitignore | 8b89b90 | chore |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Airtable field names differed from research assumptions**
- **Found during:** Task 2 execution (migration ran, some tables returned 0 rows)
- **Issue:** Multiple field names in the plan code were incorrect based on live Airtable Meta API:
  - Scottish Psalter: `'Tunes'` → `'CPRC Standard'` (the canonical tune choice field)
  - Solfege score sheet: `'Solfege Score Sheet'` → `'Solfége Score Sheet'` (accent on e)
  - Topics-Verses junction: `'Verse'` → `'References'`, `"Nave's Main Topic"` → `'Main Topic'`
  - Topics-Verses table name: `'Topics - Verses (Naves)'` → `"Topics - Verses (Nave's)"` (403 error)
  - Messianic Psalms: `'Classification'` → `'Christ referred to in the'`, `'NT Verification'` → `'Subject'`, `'Messianic Verses'` → `'Messianic Verses Summarised'`
  - Daily Readings: `'Day'` → `'Day of the Year'`
- **Fix:** All field names verified via Airtable Meta API (`/v0/meta/bases/{id}/tables`) and corrected
- **Files modified:** scripts/migrate-airtable.ts
- **Commit:** 3eeb0b8

**2. [Rule 1 - Bug] Verse doctrines linked to deprecated table**
- **Found during:** Task 2 field name discovery
- **Issue:** `Verses.Doctrines` field links to `Doctrines Oldf` (deprecated), not the live `Doctrines` table
- **Fix:** `migrateVerseDoctrines` now fetches from `Doctrine References` table which links `Doctrine → Doctrines` and `Psalm → Verses` (confusingly named field)
- **Files modified:** scripts/migrate-airtable.ts
- **Commit:** 3eeb0b8

**3. [Rule 1 - Bug] Psalm & Tune CPRC.Psalm links to Scottish Psalter, not Psalms**
- **Found during:** Task 2 field name discovery
- **Issue:** `Psalm & Tune CPRC.Psalm` links to `Scottish Psalter` records, not `Psalms` directly. Using psalmIdMap would always return null.
- **Fix:** `migratePsalmVersions` now returns both `psalmVersionIdMap` and `psalmVersionToPsalmIdMap` (Scottish Psalter airtableId → psalm integer). `migrateServiceItems` uses `psalmVersionToPsalmIdMap` to resolve psalm_id.
- **Files modified:** scripts/migrate-airtable.ts
- **Commit:** 3eeb0b8

**4. [Rule 3 - Blocking] TUNES_DIR=/app/public/tunes not writable outside Docker**
- **Found during:** First migration run
- **Issue:** `.env` had `TUNES_DIR=/app/public/tunes` (the in-container path). Migration script runs on the host and cannot write to `/app/`.
- **Fix:** Updated `.env` to `TUNES_DIR=/data/home/psalter/public/tunes` (host path). Created `public/tunes/` directory with `.gitkeep` and `.gitignore`. Removed `psalter_tunes` named Docker volume from docker-compose.yml (replaced by implicit bind mount — the app container will mount `./public/tunes:/app/public/tunes` when defined in Phase 5).
- **Files modified:** .env (gitignored), docker-compose.yml, public/tunes/
- **Commit:** 3eeb0b8, 8b89b90

**5. [Rule 3 - Blocking] postgres.js auth failure after first successful run**
- **Found during:** Second migration run attempt
- **Issue:** postgres.js couldn't authenticate with `postgres/postgres` — the password had been stored with a different hash (scram-sha-256). First run succeeded because the connection was cached from an earlier successful session.
- **Fix:** Reset password via `docker exec psalter-db psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"` which re-stored the hash in scram-sha-256 format postgres.js could negotiate.
- **Commit:** No file change needed

**6. [Rule 3 - Blocking] Disk space exhausted by tune JPG downloads (1.1GB)**
- **Found during:** Second and third migration run attempts
- **Issue:** 172 tunes with staff+solfege JPGs total ~1.1GB. The 38GB VPS root partition was 97% full, leaving insufficient space. Downloads succeeded partially but ENOSPC errors caused the Node.js process to become unresponsive.
- **Fix:** Added `SKIP_IMAGES=1` env var to skip attachment downloads. Migration now runs in two modes: `SKIP_IMAGES=1` for DB-only population (used for this plan), and without the flag for full image download (deferred until disk space is expanded or separate storage is arranged).
- **Files modified:** scripts/migrate-airtable.ts (SKIP_IMAGES guard), public/tunes/.gitignore
- **Commit:** 3eeb0b8

### Auth Gates

None.

## Known Stubs

**Tune score sheet images not downloaded:** Running with `SKIP_IMAGES=1` means `tunes.score_jpg_url` and `tunes.solfege_jpg_url` are NULL for all 172 tunes. The migration script correctly sets these to NULL when SKIP_IMAGES=1 (via the `downloadTuneScores` returning null for empty attachment arrays). Phase 2 JPG fallback display will show no score images until images are downloaded. Images can be downloaded by:
1. Expanding VPS disk space (recommend adding 20GB for the psalter volume)
2. Running `npx tsx scripts/migrate-airtable.ts` (without SKIP_IMAGES=1) — the upsert will update score_jpg_url columns

## Threat Flags

No new security surface introduced. Migration script:
- Does not expose any web endpoints
- Uses Drizzle parameterised queries (no SQL injection surface)
- AIRTABLE_PAT is read from env, never logged
- Downloaded files written to local filesystem only (not served at request time)

## Self-Check

See below.
