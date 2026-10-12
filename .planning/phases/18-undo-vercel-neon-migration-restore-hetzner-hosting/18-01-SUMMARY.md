---
phase: 18
plan: 01
slug: undo-vercel-neon-migration-restore-hetzner-hosting
type: execute
subsystem: infrastructure
tags: [neon, postgres, docker, hibernate, restore, plan-18-01, wave-1]
dependency_graph:
  requires: []
  provides: [psalter-db-online, neon-fresh-dump, env-local-disabled, sept9-fallback-staged]
  affects: [INFRA-12-database-leg, INFRA-14]
tech-stack:
  added: []
  patterns: [wake-up-then-pg-dump, volume-password-wins, fresh-pull-beats-stale-fallback]
key-files:
  created:
    - /home/services/psalter/scripts/capture-neon-fresh-dump.sh
    - /home/services/psalter/scripts/restore-psalter-db.sh
    - /home/services/psalter/backups/daily-2026-09-09.sql.gz
    - /home/services/psalter/.env.production.local.disabled
  modified:
    - /home/services/psalter/.gitignore
    - /home/services/psalter/.env.production.local (renamed)
  renamed:
    - /home/services/psalter/.env.production.local -> /home/services/psalter/.env.production.local.disabled
decisions:
  - Use fresh Neon dump as canonical source (996,416 bytes, 24,451 lines) — Sept 9 fallback staged but not used
  - Add backups/ to .gitignore (plan assumed it was already gitignored; .gitignore lacked the rule)
  - Live with VERCEL_* keys preserved in .env.production.local.disabled for Wave 3 forensic access
  - <see POSTGRES_PASSWORD in /home/services/.env.production> is the live volume password (POSTGRES_PASSWORD in env.production ignored on non-empty volume)
metrics:
  duration: ~10 min
  tasks_completed: 6 (Tasks 1-6)
  files_changed: 6
  commits: 3
  completed_date: 2026-10-12
---

# Phase 18 Plan 01: Neon pre-termination data capture + DB restore — Summary

**One-liner:** Fresh Neon dump succeeded after password rotation, restoring 1 missing changelog post from the Sept 10 → Oct 11 window; psalter-db is online on Hetzner port 5435 with the canonical state.

## Source Decision

**Used:** Fresh Neon pull from `/tmp/psalter-neon-final-20261012.sql.gz` (996,416 bytes compressed, 3,251,764 bytes / 24,451 lines uncompressed).

**Fallback staged but unused:** Sept 9 dump at `/home/services/psalter/backups/daily-2026-09-09.sql.gz` (989,402 bytes) — would have lost the Sept 22 "V2 (Beta)" changelog post.

The fresh pull is **genuinely more recent** than the Sept 9 fallback. It captured 1 changelog_post that was created on 2026-09-22 (after the backup repo silently started failing on Sept 10).

## Row Counts (post-restore)

| Table | Count | Notes |
|-------|-------|-------|
| psalms | 150 | Full Scottish Psalter (matches expected) |
| tunes | 172 | Matches live psalter; **DEVIATION** — plan threshold was 300 (filesystem JPG count, not DB row count) |
| psalm_versions | 184 | — |
| daily_readings | 365 | 365-day reading plan (matches expected) |
| changelog_posts | 1 | **The Sept 22 "V2 (Beta)" post recovered** (was missing from Sept 9 fallback) |
| feedback_submissions | 10 | Plan referenced `feedback` table — actual name is `feedback_submissions` (Better Auth + Phase 8 schema) |

## Tasks Completed (1–6)

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Capture Neon conn string | (no tracked change; conn.txt is gitignored) | `.planning/phases/18-.../18-01-conn.txt` |
| 2 | Fresh Neon dump | `d7cd955` | `scripts/capture-neon-fresh-dump.sh` |
| 3 | Sept 9 fallback | `5e24b39` | `.gitignore` (added `backups/` rule); `backups/daily-2026-09-09.sql.gz` |
| 4 | Rename .env.production.local | (no tracked change; rename is gitignored) | `.env.production.local` → `.env.production.local.disabled` |
| 5 | Bring up psalter-db | (no tracked change; container state isn't tracked) | `psalter-db` Docker container running on `localhost:5435` |
| 6 | Restore from canonical dump | `fc79fa5` | `scripts/restore-psalter-db.sh` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Neon password was rotated — Vercel overlay stale**
- **Found during:** Task 2 (fresh Neon dump attempt)
- **Issue:** The Vercel-generated `.env.production.local` had `DATABASE_URL=postgresql://...:<REDACTED-NEON-PW-OLD>@...` which returned `password authentication failed for user 'neondb_owner'`. Neon rotates passwords automatically.
- **Fix:** Used the Neon API (`/api/v2/projects/{id}/connection_uri`) to fetch a fresh connection URI. Fresh password: `<REDACTED-NEON-PW-NEW>`. The dump then succeeded.
- **Files modified:** `.planning/phases/18-.../18-01-conn.txt` updated with the fresh password.
- **Commit:** (conn.txt is gitignored)
- **Also discovered:** `/home/services/.env.production` had `NEON_PROJECT_ID=small-truth-03722911` which is the **Debates** project in us-east-2, not the psalter project. The actual psalter Neon project is `purple-cherry-92154814` in eu-central-1. The .env.production NEON_PROJECT_ID is wrong; Wave 4 should correct it.

**2. [Rule 2 - Missing] `backups/` not in .gitignore**
- **Found during:** Task 3 (download Sept 9 dump)
- **Issue:** The plan expected `/home/services/psalter/backups/` to be gitignored, but the `.gitignore` had no rule for it. The 989KB SQL binary would have shown as untracked.
- **Fix:** Added `backups/` rule to `.gitignore` (consistent with the `public/tunes-compressed/` etc. pattern for large binaries).
- **Files modified:** `.gitignore`
- **Commit:** `5e24b39`

**3. [Rule 2 - Missing] `feedback` table doesn't exist (renamed to `feedback_submissions`)**
- **Found during:** Task 2 (recent-writes audit)
- **Issue:** Plan referenced `SELECT max(updated_at) FROM changelog_posts` and `SELECT COUNT(*) FROM feedback`. The actual schema has no `updated_at` on `changelog_posts` (only `created_at`), and the `feedback` table is named `feedback_submissions` (Better Auth + Phase 8 schema).
- **Fix:** Used `max(created_at) FROM changelog_posts` and `COUNT(*) FROM feedback_submissions`. The script's row-count parity check was updated to use the actual table name.
- **Files modified:** `scripts/restore-psalter-db.sh` (used `feedback_submissions`)
- **Commit:** `fc79fa5`

**4. [Rule 2 - Plan threshold error] tunes >= 300 (filesystem JPG count, not DB row count)**
- **Found during:** Task 6 (post-restore row count check)
- **Issue:** Plan's acceptance criteria said `tunes >= 300`. The actual fresh Neon dump has 172 tunes (matches live psalter; 326 in the filesystem is the JPG file count, which includes multiple JPGs per tune). The 300 threshold was a plan-side error.
- **Fix:** Documented the deviation. The 172 row count is correct (matches live psalter).
- **Files modified:** (no code change; documented in this SUMMARY)
- **Commit:** (no commit needed)

**5. [Rule 2 - Plan schema error] `tunes`/`psalms` have no `slug` columns**
- **Found during:** Task 7 (spot-check queries)
- **Issue:** Plan's spot-check queries used `slug` columns. The actual schema has no `slug` columns — slugs are URL-routing constructs computed in the Next.js app from the `name`/`airtable_id` fields.
- **Fix:** Spot-checks used `name`, `meter`, `nkjv_title`, `author` instead. Data is correct.
- **Files modified:** (none — spot-check queries are verification, not committed code)
- **Commit:** (no commit needed)

## Key Artifacts

| File | Purpose |
|------|---------|
| `/home/services/psalter/.planning/phases/18-.../18-01-conn.txt` | Captured Neon DATABASE_URL (with fresh password) |
| `/home/services/psalter/.planning/phases/18-.../18-01-neon-fresh-dump.timestamp` | Dump metadata (size, lines, project ID, region) |
| `/home/services/psalter/.planning/phases/18-.../18-01-neon-recent-writes.txt` | Sept 10 → Oct 11 write audit (1 changelog post) |
| `/home/services/psalter/.planning/phases/18-.../18-01-psalter-db-status.txt` | Container health + schema snapshot |
| `/home/services/psalter/.planning/phases/18-.../18-01-row-counts.txt` | Post-restore row counts |
| `/home/services/psalter/.planning/phases/18-.../18-01-source.txt` | Source decision (fresh Neon pull used) + recent-writes context |
| `/home/services/psalter/scripts/capture-neon-fresh-dump.sh` | Wake + dump + sanity-check (committed) |
| `/home/services/psalter/scripts/restore-psalter-db.sh` | Drop + restore + row-count parity (committed) |
| `/home/services/psalter/.env.production.local.disabled` | Vercel overlay neutralised; 15 VERCEL_* keys preserved for Wave 3 forensic access |
| `/home/services/psalter/backups/daily-2026-09-09.sql.gz` | Sept 9 fallback (downloaded, not used) |

## Task 7: Human-Verify Status

**Status:** Awaiting user verification (checkpoint)

**Schema parity** (spot-check from Task 7): all 34 expected tables present (psalms, tunes, psalm_versions, changelog_posts, changelog_subscribers, daily_readings, feedback_submissions, verse_naves_topics, naves_topics, tune_melisma_decisions, etc.).

**Key data spot-check:**
- Tunes id=1 Lancaster CM, id=50 Ebenezer 87 87 (id=200 doesn't exist — only 172 tunes total)
- Psalms id=1 "The Way of the Righteous...", id=23 "The Lord the Shepherd of His People" (David), id=119 "Meditations on the Excellencies of the Word of God"
- changelog_posts id=31 "V2 (Beta)" created 2026-09-22 — **the post that would have been lost on the Sept 9 fallback**
- feedback_submissions=10, changelog_subscribers=1

**The data is the most recent achievable Neon state.** Wave 2 (runtime bring-up), Wave 3 (DNS flip + Vercel teardown), and Wave 4 (Neon termination + housekeeping) can proceed.
