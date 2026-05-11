---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Phase 4.8 complete — all 3 plans done, verification passed (7/7)
last_updated: "2026-05-10T12:00:00.000Z"
last_activity: 2026-05-10
progress:
  total_phases: 7
  completed_phases: 6
  total_plans: 26
  completed_plans: 25
  percent: 91
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-07)

**Core value:** A precentor during worship can instantly find the psalms chosen for a service and follow live-rendered tune notation with lyrics beneath the notes — without relying on slow Softr or static images.
**Current focus:** Phase 5 — Precentor Portal

## Current Position

Phase: 4.8
Plan: 03 complete
Status: Phase 4.8 complete — all 3 plans done; verification passed 7/7; /search removed, /explore + /tunes overhauled
Last activity: 2026-05-10

Progress: [█████████████████░░░] 83% (Phase 01+02+03+04+04.5 complete; Phase 4.6 next)

## Performance Metrics

**Velocity:**

- Total plans completed: 16
- Average duration: 22 min
- Total execution time: ~1.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 Foundation | 5/5 | ~110 min | 22 min |
| 01 | 5 | - | - |
| 3 | 6 | - | - |

**Recent Trend:**

- Last 5 plans: 01-01 (20 min), 01-02 (36 min), 01-03 (10 min), 01-04 (49 min), 01-05 (15 min)
- Trend: Phase 01 complete

*Updated after each plan completion*
| Phase 01 P04 | 49 | - tasks | - files |
| Phase 01 P05 | 15 | 1 task | 1 file |
| Phase 02 P02 | 10 | 2 tasks | 5 files |
| Phase 02 P03 | 25 | 2 tasks | 6 files |
| Phase 03 P02 | 5 | 2 tasks | 2 files |
| Phase 03 P03 | 8 | 2 tasks | 2 files |
| Phase 04 P01 | 15 | 2 tasks | 4 files |
| Phase 04 P02 | 20 | 2 tasks | 2 files |
| Phase 04 P03 | 5 | 1 task | 1 file |
| Phase 04.5 P03 | 15 | 2 tasks | 3 files |
| Phase 04.5 P04 | 15 | 2 tasks | 1 file |
| Phase 04.7 P02 | 25 | 3 tasks | 4 files |

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
- [02-03]: Schema uses lyrics (not stanzas) and versionLabel (not versionName) on psalmVersions; sectionHeadings has no verseEnd column — components use actual schema field names
- [02-03]: PsalmTabs isTabValue() type guard restricts ?tab= to 4 known values; unknown values fall back to "overview" (T-02-08 mitigated)
- [02-03]: Base UI Select onValueChange wraps setter in arrow function to handle null value and discard eventDetails argument
- [02-04]: YouTubeEmbed kept as RSC — toEmbedUrl runs server-side, no client state needed; iframe sandbox restricts capabilities (T-02-13)
- [02-04]: soundcloudUrl ignored in Phase 2 — all 27 DB values are placeholder text ("missing", "need to upload")
- [02-04]: youtubeUrl field stores both YouTube and non-YouTube media URLs; toEmbedUrl returns null for non-YouTube, enabling plain link fallback
- [02-05]: TodayCard is 'use client' — today detection must run on mount; useState(null) initial avoids static-render mismatch
- [02-05]: DailyPlanClient reveals today-badge by DOM mutation (removes 'hidden'), not React state — avoids hydration race on static /daily page
- [02-05]: dailyReadings.dayNumber is nullable in schema — RSC filters null entries before passing to TodayCard ReadingProp (dayNumber: number)
- [02-05]: data-[today]: Tailwind selector (empty-string attribute set by DailyPlanClient) used for today row highlight — no inline script needed
- [03-03]: SiteHeader converted to 'use client' — usePathname() requires client boundary; minimal impact as header is already at the root of every page layout
- [03-03]: TuneGrid initialises meter from useSearchParams on mount — enables sharing filtered tune URLs
- [03-03]: encodeURIComponent applied to meter value in router.replace — defensive encoding for meter strings with special characters
- [03-06]: /tunes page delegates to TuneGrid client component via Suspense boundary; RSC retains fetchAllTunes data fetch
- [04-02]: "Old 100th" is the exact DB name for Old Hundredth tune; LM meter stored as "LM (long meter, 88 88)" not abbreviated "LM"
- [04-02]: St. Michael absent from DB; Trentham (SM) substituted to maintain CM(3)+LM(1)+SM(1) coverage
- [04-02]: Pre-existing score_jpg_url test failure is out-of-scope disk constraint from Phase 1 — not fixed in Phase 4
- [04.5-04]: Two-effect localStorage pattern used in PsalmNotationPlayer: separate restore-on-mount and persist-on-change effects to avoid race conditions
- [04.5-04]: psalter-db container password mismatch diagnosed and fixed via ALTER USER — db was initialised with stale credentials; production verified via E2E curl tests
- [04.7-02]: renderSnippet uses strong (not b) — Wave 0 Playwright stub selects [data-psalm-box] strong; globals.css updated to target both b and strong
- [04.7-02]: psalter-db password re-fixed via ALTER USER (regressed between sessions); .env password is 'postgres'

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| q01 | Psalm detail layout: split desktop, reversed header, Sing tab on mobile | 2026-05-09 | eebcbbb | [260509-q01-psalm-detail-layout-overhaul](./quick/260509-q01-psalm-detail-layout-overhaul/) |
| q02 | UI fixes batch 3: tune format, mobile sticky score, meter tooltip, search overlay, lyrics search, search bugs (T2,T4-T8) | 2026-05-11 | 133507a | [20260511-ui-fixes-batch3](./quick/20260511-ui-fixes-batch3/) |
| q03 | UI fixes batch 4: T4 gap+progressive sticky, T5 Popover meter, T6 GlobalSearch→Dialog, T7 lyrics snippet, sticky list headers | 2026-05-11 | cb9b448 | [20260511-ui-fixes-batch4](./quick/20260511-ui-fixes-batch4/) |

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

Last session: 2026-05-11T00:00:00.000Z
Stopped at: Quick task q02 complete — UI fixes batch 3 (T2,T4-T8): tune format, mobile sticky score, meter tooltip, search overlay centering, lyrics search, search bug fixes
Resume file: None
