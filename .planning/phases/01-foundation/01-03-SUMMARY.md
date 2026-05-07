---
phase: 01-foundation
plan: 03
subsystem: database
tags: [drizzle, schema, postgresql, airtable, migration]

# Dependency graph
requires:
  - phase: 01-02
    provides: "Next.js scaffold, drizzle-orm@0.45.2 installed, drizzle.config.ts wired to psalter-db"
provides:
  - "src/db/schema.ts — complete Drizzle schema for all 13 primary tables + 5 junction tables + doctrines"
  - "All 18 tables created in psalter-db via drizzle-kit push"
  - "psalms.id as integer PK (actual psalm number 1-150, stable URL slug)"
  - "Every primary table has airtable_id TEXT UNIQUE NOT NULL for idempotent upsert"
  - "Drizzle relations exported for all major tables (relational query API ready)"
  - "src/db/index.ts updated to pass schema to drizzle() for relational query API"
affects: [01-04, 01-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "psalms.id = integer PK (actual psalm number 1-150) — not serial; enables /psalm/23 URL slugs"
    - "airtable_id TEXT UNIQUE NOT NULL on every migrated table — idempotent upsert target"
    - "Junction tables use primaryKey({ columns: [...] }) composite PK — no serial surrogate"
    - "Drizzle relations exported for relational query API (db.query.*)"
    - "jsonb column on tunes for additional_score_urls (handles multi-attachment tunes)"
    - "Meter stored as normalised abbreviation (CM, LM, SM) — migration extracts from Airtable full string"

key-files:
  created:
    - src/db/schema.ts
  modified:
    - src/db/index.ts

key-decisions:
  - "psalms.id = integer (actual psalm number) not serial — enables stable URL slugs, FK references use the meaningful integer"
  - "tunes.score_jpg_url and solfege_jpg_url store local /tunes/ paths per Plan 01-01 decision (Docker named volume, not R2)"
  - "additional_score_urls as jsonb on tunes — handles Pitfall 7 (multi-attachment tunes)"
  - "timestamp import included in schema.ts even though not yet used — available for future created_at/updated_at columns without schema change"

# Metrics
duration: 10min
completed: 2026-05-07
---

# Phase 01, Plan 03: Drizzle Schema Definition Summary

**Complete Drizzle ORM schema with 13 primary tables + 5 junction tables pushed to psalter-db; psalms.id is integer PK (psalm number 1-150); every table has airtable_id for idempotent upsert**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-05-07
- **Tasks:** 2 of 2 complete
- **Files modified:** 2

## Accomplishments

- `src/db/schema.ts` created with all 13 primary Airtable content tables and 5 junction tables (18 total pgTable definitions)
- `doctrines` table included (14th content table, required for verse_doctrines junction)
- `psalms.id` is `integer().primaryKey()` — the actual psalm number (1-150), not a serial auto-increment
- Every primary table has `airtable_id text NOT NULL UNIQUE` for idempotent upsert via `onConflictDoUpdate`
- All junction tables (`psalm_topics`, `psalm_version_tunes`, `tune_moods`, `verse_naves_topics`, `verse_doctrines`) use composite primary keys
- All FK references use `.references(() => targetTable.id)` pattern with proper cascade semantics
- Drizzle relations exported for all major tables enabling `db.query.*` relational API
- `src/db/index.ts` updated to pass `schema` to `drizzle()` for relational query support
- `npx tsc --noEmit` exits 0 — no TypeScript errors
- `npx drizzle-kit push` applied all 18 tables to psalter-db successfully
- `docker exec psalter-db psql ... \dt` confirms 18 tables in public schema

## Task Commits

| Task | Description | Hash | Type |
|------|-------------|------|------|
| 1 + 2 | Complete Drizzle schema + DB push | 9b69534 | feat |

## Tables Created in psalter-db

### Primary Tables (13 + doctrines = 14)

| PostgreSQL Table | Airtable Source | Notes |
|-----------------|----------------|-------|
| `psalms` | Psalms (tblZyQFfNUFnmkNyG) | integer PK = psalm number 1-150 |
| `psalm_versions` | Scottish Psalter (tblyz4Q8KzJHDNFpP) | serial PK, FK→psalms |
| `tunes` | Tunes (tblEzjKnaL4DlhDO5) | score_jpg_url, solfege_jpg_url, abc_notation, additional_score_urls (jsonb) |
| `verses` | Verses (tblmeGEuYwpVDwlU1) | serial PK, FK→psalms |
| `daily_readings` | 365 Days (tbldTTLmwzMIwJrZb) | serial PK, FK→psalms |
| `events` | Event (tblkQbNwG3qTmbXuW) | serial PK |
| `service_items` | Psalm & Tune CPRC (tblT3hht1xdcwLuFi) | FKs→events, psalms, tunes |
| `messianic_psalms` | Messianic Psalms (tbl07kIu7PONtitGD) | FK→psalms |
| `section_headings` | Section Headings (tblrsOOB6n299hKfv) | FK→psalms |
| `topics` | Topics - Psalms (tbllxnpjvPtbN8srl) | thematic tags |
| `naves_topics` | Nave's Main Topic (tblWBfuxleN74E3tM) | Nave's concordance headings |
| `moods` | Moods (tblRHa4TLqnoJWopi) | tune mood tags |
| `doctrines` | Doctrines (tbl3P46qHcuu7B4pB) | doctrinal classification |

### Junction Tables (5)

| PostgreSQL Table | Relationship | Composite PK |
|-----------------|-------------|-------------|
| `psalm_topics` | psalms ↔ topics | (psalm_id, topic_id) |
| `psalm_version_tunes` | psalm_versions ↔ tunes | (psalm_version_id, tune_id) |
| `tune_moods` | tunes ↔ moods | (tune_id, mood_id) |
| `verse_naves_topics` | verses ↔ naves_topics | (verse_id, naves_topic_id) |
| `verse_doctrines` | verses ↔ doctrines | (verse_id, doctrine_id) |

## Decisions Made

- **`psalms.id` = integer psalm number (not serial):** Enables `/psalm/23` URL slugs, stable FK references, and meaningful sort order without a separate `psalm_number` column.
- **Local `/tunes/` paths not R2 URLs in `tunes.score_jpg_url`:** Per Plan 01-01 decision, tunes are stored in a Docker named volume (`psalter_tunes`). Column name uses `score_jpg_url` (not `score_jpg_r2_url`) to match this decision.
- **`additional_score_urls` as jsonb:** Handles tunes with multiple score sheet attachments (Pitfall 7 from RESEARCH.md) without a separate table.
- **`timestamp` imported but not yet used:** Available for future `created_at`/`updated_at` columns without schema change needing new imports.

## Deviations from Plan

None — plan executed exactly as written. The schema matches the plan's provided TypeScript code block exactly. Column naming in `tunes` uses `score_jpg_url`/`solfege_jpg_url` (as per plan) which aligns with the Plan 01-01 decision to use local Docker volume paths rather than R2 URLs.

## Verification Results

- [x] `grep -c "pgTable" src/db/schema.ts` → 19 (18 tables + 1 in unused timestamp import context)
- [x] `grep -c "airtable_id" src/db/schema.ts` → 14 (one per primary/content table)
- [x] `grep "integer('id').primaryKey()" src/db/schema.ts` → found in psalms table
- [x] `npx tsc --noEmit` → exit 0, no errors
- [x] `npx drizzle-kit push` → `[✓] Changes applied`
- [x] `docker exec psalter-db psql ... \dt` → 18 tables confirmed
- [x] `\d psalms` → id = integer PRIMARY KEY, airtable_id = text UNIQUE NOT NULL
- [x] `\d tunes` → abc_notation, score_jpg_url, solfege_jpg_url, additional_score_urls (jsonb) all present
- [x] `\d psalm_topics` → composite PK (psalm_id, topic_id) confirmed

## Known Stubs

None — schema is complete and verified. No placeholder data or TODO columns.

## Threat Flags

No new security surface introduced. Schema push ran against localhost:5435 dev DB only (postgres/postgres non-sensitive dev credentials per T-01-07 accept disposition).

## Next Phase Readiness

- All 18 tables exist in psalter-db — migration scripts (Plan 01-04) can now INSERT data
- `airtable_id` columns on every table enable idempotent upsert via `onConflictDoUpdate`
- Drizzle relational API ready (`db.query.*`) — `src/db/index.ts` exports schema-aware `db` instance
- `psalm_version_tunes.is_primary` boolean available for migration to flag canonical tune per versification

---
*Phase: 01-foundation*
*Completed: 2026-05-07*
