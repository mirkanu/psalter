---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 02 Plan 02 complete — SiteHeader, lib/daily.ts, lib/youtube.ts done
last_updated: "2026-05-08T06:36:00.000Z"
last_activity: 2026-05-08 -- Phase 2 Plan 02 complete
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 10
  completed_plans: 5
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** A precentor during worship can instantly find the psalms chosen for a service and follow live-rendered tune notation with lyrics beneath the notes — without relying on slow Softr or static images.
**Current focus:** Phase 01 — Foundation

## Current Position

Phase: 2
Plan: 03 (next)
Status: Executing
Last activity: 2026-05-08 -- Phase 2 Plan 02 complete

Progress: [████████████] 20% (Phase 01 complete; 02-02 done; 6/10 plans done)

## Performance Metrics

**Velocity:**

- Total plans completed: 10
- Average duration: 22 min
- Total execution time: ~1.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 Foundation | 5/5 | ~110 min | 22 min |
| 01 | 5 | - | - |

**Recent Trend:**

- Last 5 plans: 01-01 (20 min), 01-02 (36 min), 01-03 (10 min), 01-04 (49 min), 01-05 (15 min)
- Trend: Phase 01 complete

*Updated after each plan completion*
| Phase 01 P04 | 49 | - tasks | - files |
| Phase 01 P05 | 15 | 1 task | 1 file |
| Phase 02 P02 | 10 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: TUNE-02/03/04 (abcjs rendering) scoped to Phase 4; Phase 2 uses JPG fallback only
- [Init]: PERF-01/PERF-02 deferred to Phase 6 Polish (applied consistently across all routes after portal is complete)
- [Init]: Four-part SATB harmonisation out of scope — copyright check required
- [Init]: Admin UI (Directus/NocoDB) deferred post-launch; Airtable continues editorial role
- [01-01]: psalter_tunes Docker named volume replaces Cloudflare R2 for tune JPG storage — simpler, no external dependency
- [01-01]: Port 5435 for psalter-db to avoid conflict with other DB containers on this server
- [01-02]: shadcn Nova preset used (--style new-york flag removed from shadcn v4.7.0 CLI; Nova is equivalent)
- [01-02]: DATABASE_URL never hardcoded — always via process.env in src/db/index.ts
- [01-02]: tw-animate-css@1.4.0 replaces deprecated tailwindcss-animate for Tailwind CSS 4 compatibility
- [01-03]: psalms.id = integer PK (actual psalm number 1-150) — stable URL slugs, meaningful FK references
- [01-03]: tunes.score_jpg_url stores local Docker volume paths (not R2 URLs) per Plan 01-01 decision
- [01-03]: additional_score_urls as jsonb on tunes handles multi-attachment tune records
- [Phase ?]: SKIP_IMAGES=1 env flag added to migration — tune JPGs total ~1.1GB, larger than 38GB VPS root partition can accommodate; disk must be expanded before full image download
- [Phase ?]: Airtable field names must be verified via Meta API before migration — research-phase assumptions were incorrect for 6 fields across 4 tables
- [02-01]: vitest.config.mts (not .ts) required — vite-tsconfig-paths is ESM-only; .mts extension forces ESM module resolution
- [02-01]: Three reverse relations (sectionHeadingsRelations, messianicPsalmsRelations, dailyReadingsRelations) were missing from schema — added as part of plan execution
- [02-01]: psalter-db postgres password was out of sync with .env; reset via ALTER USER to restore test connectivity
- [02-02]: SiteHeader is RSC (no 'use client') — no auth state or active-link detection needed in Phase 2
- [02-02]: getDayOfYear wraps day 366 to day 1 via modulo to keep 365-entry plan bounded on leap years
- [02-02]: toEmbedUrl regex restricts extracted video IDs to [\w-]+ — mitigates T-02-04 injection risk

### Pending Todos

None yet.

### Blockers/Concerns

- ABC notation source: No existing ABC files for Scottish Psalter tunes. Phase 4 requires sourcing public-domain ABC or encoding from printed editions. The Session API lookup spike is the first plan in Phase 4.
- Tune JPG download incomplete — 172 tunes have NULL score_jpg_url. VPS root filesystem is 97% full (38GB). Expand disk before running migrate-airtable.ts without SKIP_IMAGES=1.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | User accounts / congregation favourites | Deferred | Init |
| v2 | Admin UI (Directus/NocoDB) | Deferred | Init |
| v2 | abcjs audio on public tune pages | Deferred | Init |
| v2 | Dark mode | Deferred | Init |
| Out of scope | Four-part SATB rendering | Out of scope | Init |

## Session Continuity

Last session: 2026-05-08T06:36:00.000Z
Stopped at: Phase 02 Plan 02 complete — SiteHeader, lib/daily.ts, lib/youtube.ts done
Resume file: None
