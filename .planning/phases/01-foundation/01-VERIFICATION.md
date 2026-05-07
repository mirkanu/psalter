---
phase: 01-foundation
verified: 2026-05-07T00:00:00Z
status: gaps_found
score: 3/4 roadmap success criteria verified
overrides_applied: 0
gaps:
  - truth: "Every tune score sheet JPG is accessible via a permanent storage URL (not an expiring Airtable attachment link)"
    status: failed
    reason: "tunes.score_jpg_url is NULL for all 172 tunes. Migration ran with SKIP_IMAGES=1 due to disk constraints. The public/tunes directory is empty (0 files). No images were downloaded or stored anywhere. Phase 2 SC3 ('Each tune detail page shows name, meter, a score image') cannot be met until images are stored."
    artifacts:
      - path: "public/tunes/"
        issue: "Directory exists but contains 0 image files"
      - path: "scripts/migrate-airtable.ts"
        issue: "SKIP_IMAGES=1 gates all image downloads; was active during the migration run"
    missing:
      - "Expand VPS disk space (recommend +20GB) to accommodate ~1.1GB of tune JPGs"
      - "Run `npx tsx scripts/migrate-airtable.ts` without SKIP_IMAGES=1 to download all tune score sheet JPGs"
      - "Verify tunes.score_jpg_url is populated (non-NULL) for all tunes that have Airtable attachments"
      - "Confirm files are accessible at /tunes/<filename> from the Next.js server"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** All Airtable data lives in PostgreSQL with integrity verified and tune images served from permanent storage
**Verified:** 2026-05-07
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | All 13+ Airtable tables are present in PostgreSQL with FK relationships intact and row counts matching Airtable | VERIFIED | 18 tables confirmed via `\dt`; psalms=150, tunes=172, verses=2461, events=29, messianic_psalms=18, topics=88, daily_readings=365; all junction tables populated |
| 2 | Every tune score sheet JPG is accessible via a permanent storage URL (not an expiring Airtable attachment link) | FAILED | `SELECT COUNT(*) FROM tunes WHERE score_jpg_url IS NOT NULL` = 0; all 172 rows have NULL score_jpg_url; public/tunes/ directory is empty |
| 3 | A spot-check of 10+ records across psalms, tunes, verses, and topics shows data fidelity against Airtable | VERIFIED | Psalm 23 KJV contains "LORD is my shepherd"; Psalm 1 KJV contains "Blessed is the man"; Psalm 119 has 176 verse rows; no airtableusercontent.com URLs stored; junction tables all non-empty |
| 4 | A delta migration script can be re-run immediately before launch without duplicating records (MIGR-04) | VERIFIED | All inserts use `onConflictDoUpdate` on airtable_id (14 occurrences) and `onConflictDoNothing` on junction tables (5 occurrences); idempotency confirmed by orchestrator-run second pass |

**Score:** 3/4 roadmap success criteria verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `docker-compose.yml` | psalter-db PostgreSQL 16 container, port 5435 | VERIFIED | Container running and accepting connections; `5435:5432` port mapping present |
| `.env.example` | All required env vars documented | VERIFIED | Contains DATABASE_URL, AIRTABLE_PAT, AIRTABLE_BASE_ID, TUNES_DIR |
| `.gitignore` | `.env` excluded | VERIFIED | `.env` present as standalone line; `git ls-files .env` returns 0 |
| `.env` | DATABASE_URL, AIRTABLE_PAT, AIRTABLE_BASE_ID, TUNES_DIR populated | VERIFIED | All four variables set with real values |
| `src/db/schema.ts` | 18 pgTable definitions, airtable_id on every primary table | VERIFIED | 18 pgTable definitions confirmed; all primary tables have `airtable_id TEXT UNIQUE NOT NULL`; psalms.id is integer PK (not serial) |
| `src/db/index.ts` | Drizzle client singleton via postgres.js + DATABASE_URL | VERIFIED | Exports `db` and `sql`; reads `process.env.DATABASE_URL`; passes schema to drizzle() for relational API |
| `drizzle.config.ts` | Drizzle Kit config pointing to src/db/schema.ts | VERIFIED | dialect=postgresql, schema=./src/db/schema.ts, out=./drizzle/migrations |
| `scripts/migrate-airtable.ts` | Two-pass migration with idempotent upserts | VERIFIED | Full 12-function Pass 1 + 6-function Pass 2; onConflictDoUpdate on airtable_id throughout |
| `scripts/download-tunes.ts` | JPG download helper with TUNES_DIR, slug, multi-attachment | VERIFIED | Exports slugifyTuneName, downloadToLocal, downloadTuneScores; returns /tunes/ relative paths; handles multi-attachment |
| `scripts/verify-migration.ts` | Row count assertions + spot-checks | VERIFIED | Row count assertions for all 18 tables; spot-checks Psalm 1/23/119; idempotency re-run |
| `public/tunes/` | Tune score sheet JPG files | FAILED | Directory exists but contains 0 image files (SKIP_IMAGES=1 was active) |
| `package.json` | Exact pinned versions for all deps | VERIFIED | drizzle-orm@0.45.2, postgres@3.4.9, drizzle-kit@0.31.10, tsx@4.21.0, tw-animate-css@1.4.0; no tailwindcss-animate |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `docker-compose.yml` | host port 5435 | ports mapping | VERIFIED | `5435:5432` present; `pg_isready` returns "accepting connections" |
| `src/db/index.ts` | DATABASE_URL | `postgres(process.env.DATABASE_URL)` | VERIFIED | No hardcoded credentials; singleton pool pattern |
| `drizzle.config.ts` | `src/db/schema.ts` | schema path | VERIFIED | `schema: './src/db/schema.ts'` present |
| `verses` table | `psalms` table | `psalm_id` FK | VERIFIED | `FOREIGN KEY (psalm_id) REFERENCES psalms(id)` in live DB |
| `psalm_versions` table | `psalms` table | `psalm_id` FK | VERIFIED | FK constraint confirmed in live DB |
| `scripts/migrate-airtable.ts` | Airtable base `appY3dB1EHtex0fUJ` | `airtable npm .all()` | VERIFIED | `fetchAll()` uses `base(tableName).select().all()`; BASE_ID hardcoded correctly |
| `scripts/migrate-airtable.ts` | `tunes.score_jpg_url` | `downloadTuneScores()` | NOT_WIRED | `downloadTuneScores` is called but `SKIP_IMAGES=1` short-circuits it; returns `{ primaryUrl: null }` for all 172 tunes |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `tunes.score_jpg_url` | score_jpg_url column | `downloadTuneScores()` in migrate-airtable.ts | No — SKIP_IMAGES=1 means all 172 rows are NULL | DISCONNECTED |
| `psalms.kjv_text` | kjv_text column | Airtable 'KJV Text' field via migrate-airtable.ts | Yes — Psalm 23 and 1 verified in live DB | FLOWING |
| `verses.kjv_text` | kjv_text column | Airtable 'KJV' field; 2461 rows | Yes — Psalm 119 has 176 rows | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| psalter-db accepts connections | `docker exec psalter-db pg_isready -U postgres -d psalter` | "accepting connections" | PASS |
| 18 tables exist | `\dt` | 18 rows returned | PASS |
| psalms count = 150 | `SELECT COUNT(*) FROM psalms` | 150 | PASS |
| tunes count = 172 | `SELECT COUNT(*) FROM tunes` | 172 | PASS |
| Psalm 23 KJV data | `SELECT kjv_text FROM psalms WHERE id=23` | Contains "LORD is my shepherd" | PASS |
| Psalm 1 KJV data | `SELECT kjv_text FROM psalms WHERE id=1` | Contains "Blessed is the man" | PASS |
| Psalm 119 verse count | `SELECT COUNT(*) FROM verses WHERE psalm_id=119` | 176 | PASS |
| No Airtable URLs stored | `SELECT COUNT(*) FROM tunes WHERE score_jpg_url LIKE '%airtableusercontent%'` | 0 | PASS |
| Tune images present | `SELECT COUNT(*) FROM tunes WHERE score_jpg_url IS NOT NULL` | 0 (all NULL) | FAIL |
| Files on disk | `ls public/tunes/` | Empty directory | FAIL |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| MIGR-01 | 01-01, 01-02, 01-03, 01-04, 01-05 | All Airtable tables migrated to PostgreSQL with FK relationships intact | SATISFIED | 18 tables, all FKs confirmed live |
| MIGR-02 | 01-01, 01-04, 01-05 | Tune score sheet JPGs downloaded and re-hosted on permanent storage | BLOCKED | All 172 tunes have NULL score_jpg_url; 0 files on disk |
| MIGR-03 | 01-05 | Row counts and spot-check records verified against Airtable | SATISFIED | Automated and manual spot-checks passed (Psalms 1, 23, 119) |
| MIGR-04 | 01-04, 01-05 | Delta migration re-runnable without duplicating records | SATISFIED | onConflictDoUpdate on all primary tables; second-run idempotency confirmed |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `scripts/migrate-airtable.ts` + `public/tunes/` | SKIP_IMAGES=1 produces NULL score_jpg_url for all tunes — the "store" renders empty | BLOCKER | Phase 2 tune detail pages cannot display score images; Phase 4 JPG fallback will show nothing |
| `src/db/schema.ts` line 57 | Comment says "local /tunes/ path (never Airtable URL)" — accurate but the column is empty for all rows | WARNING | Comment is aspirationally correct but the actual data state is NULL |
| `docker-compose.yml` | `psalter_tunes` Docker named volume was declared in the plan but was removed in execution (deviation #4 in 01-04-SUMMARY); no volume declaration remains | INFO | Images are instead expected via a host path bind mount; no bind mount is defined yet since the Next.js app container doesn't exist in docker-compose.yml |

---

### Known Architectural Deviations (Documented, Not Gaps)

1. **R2 replaced with local Docker volume / public/tunes bind mount** — Documented in 01-01-SUMMARY and 01-04-SUMMARY. The ROADMAP still says "R2 URL" but the implementation uses local file storage. This deviation is intentional but the ROADMAP has not been updated to reflect it. The deviation itself is acceptable; the failure is that 0 images exist on disk regardless of which storage mechanism is used.

2. **Meter normalization partially incomplete** — 8 tunes have "LM (long meter, 88 88)" stored instead of "LM"; "66 66 88" and "87 87" appear as non-standard strings. The 01-05-SUMMARY acknowledges this as a non-blocking known stub. Since meter is used for display/filter (Phase 3), this is a WARNING not a BLOCKER for Phase 1.

3. **shadcn Nova preset used instead of new-york** — The `--style new-york` flag was removed from shadcn CLI v4.7.0. Nova is the functional equivalent. This is fully documented and not a gap.

---

### Human Verification Required

None — all verification was completable programmatically.

---

## Gaps Summary

**One blocking gap prevents the phase goal from being fully achieved:**

The phase goal states "tune images served from permanent storage." Zero tune images are stored anywhere — all 172 tunes have NULL `score_jpg_url` and `solfege_jpg_url` columns, and the `public/tunes/` directory contains no files. This is a documented known stub caused by disk space exhaustion during migration (SKIP_IMAGES=1). The migration infrastructure is correct (download-tunes.ts is substantive and wired), but the execution step was skipped.

This gap directly blocks Phase 2 SC3 ("Each tune detail page shows name, meter, a score image") and Phase 4 SC3 ("Tunes without an ABC string still display the R2-hosted JPG score image").

**Resolution path (provided by 01-04-SUMMARY):**
1. Expand VPS disk by 20GB
2. Run `npx tsx scripts/migrate-airtable.ts` without `SKIP_IMAGES=1`
3. The upsert pattern will populate `score_jpg_url` columns without re-migrating other data

---

_Verified: 2026-05-07_
_Verifier: Claude (gsd-verifier)_
