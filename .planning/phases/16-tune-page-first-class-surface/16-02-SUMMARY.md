---
phase: 16-tune-page-first-class-surface
plan: 02
subsystem: ui
tags: [nextjs, react-server-components, abcjs, notation]

# Dependency graph
requires:
  - phase: 11-tune-list-selector-overhaul
    provides: TuneScoreSection thin client wrapper + buildNotationRendererProps helper
provides:
  - Documented confirmation that /tunes/[slug]'s ABC path uses the same NotationRendererClient chain as /psalms/[slug]'s Study tab, with showLyrics=false
  - Inline comments marking the abcjs client-only boundary and the JPG-only fallback scope on the tune page
affects: [16-03-tune-page-tabs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TuneScoreSection remains the sole abcjs client boundary on /tunes/[slug]; RSC composes it without owning callback state"

key-files:
  created: []
  modified:
    - "src/app/tunes/[slug]/page.tsx"

key-decisions:
  - "Verified (not modified) the ABC-path wiring: it already routed through TuneScoreSection with showLyrics:false and TuneMiniBarSection inside the same Score section, from prior Phase 16 D-02 work — no functional change was needed for TPAGE-02."
  - "Kept the TuneDetailClient image-only fallback in place per the plan's guidance (buildNotationRendererProps doesn't accept externally-supplied scoreJpgUrl/solfegeJpgUrl for the null-tune case), and documented via comment that TPAGE-02 does not apply to that path."

patterns-established: []

requirements-completed: [TPAGE-02]

# Metrics
duration: 25min
completed: 2026-08-15
---

# Phase 16 Plan 02: Tune Page Score Section Parity Summary

**Confirmed and documented that `/tunes/[slug]`'s ABC-path Score section already routes through the shared `TuneScoreSection` → `NotationRendererClient` → `NotationRenderer` chain with `showLyrics=false`, matching `/psalms/[slug]`'s Study tab exactly — no functional rewiring needed, only clarifying comments added.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-15T14:59:00Z (approx, resumed after session interruption)
- **Completed:** 2026-08-15T15:24:04Z
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- Verified `/tunes/[slug]`'s ABC path already satisfies TPAGE-02: `TuneScoreSection` (with `showLyrics: false`) is the sole notation-rendering surface, `TuneMiniBarSection` sits immediately below it inside the same `<section>`, and the page remains a pure RSC (`export const dynamic = 'force-dynamic'`, `generateStaticParams` intact).
- Confirmed the abcjs client-only rule (CLAUDE.md) is honoured: zero direct `abcjs`/`ABCJS`/`AbcRenderer`/`renderAbc` code references in `page.tsx` (all matches are in explanatory comments); the chain is page (RSC) → `TuneScoreSection` ('use client') → `NotationRendererClient` (dynamic import, `ssr: false`, wrapped in `<Suspense>` with a `Skeleton` fallback) → `NotationRenderer` (calls `ABCJS.renderAbc` inside `useEffect`+`useRef`).
- Confirmed `TuneDetailClient` has no consumers outside `/tunes/[slug]/page.tsx` — kept it in place (per plan guidance, since `buildNotationRendererProps` doesn't accept an externally supplied JPG URL for the null-tune image-only case) and added comments marking both of its call sites as the JPG-only fallback, explicitly out of TPAGE-02's scope.
- Added a documentation comment above `<TuneScoreSection>` recording the full abcjs client-only boundary chain for future readers.

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Confirm/document Score section wiring and abcjs client-only boundary** - `3b79121` (docs)

Both plan tasks were verification-only against already-correct code (from prior Phase 16 D-02 work in commit `bce9a92`), so they were committed together as a single documentation commit rather than split into two functionally-identical commits.

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified
- `src/app/tunes/[slug]/page.tsx` - Added a comment above `<TuneScoreSection>` documenting the abcjs client-only chain (page RSC → TuneScoreSection → NotationRendererClient → NotationRenderer) per CLAUDE.md; added comments to both `TuneDetailClient` fallback blocks clarifying they are the JPG-only path and TPAGE-02 does not apply.

## Decisions Made
- No functional code change was required for the ABC path — Phase 16's earlier D-02 commit (`bce9a92`, "plumb melismaPositions + split showLyrics") had already wired `TuneScoreSection`, `showLyrics: false`, and `TuneMiniBarSection` correctly. This plan's role was to verify and document that wiring per TPAGE-02's acceptance criteria.
- Retained `TuneDetailClient` and its two call sites (image-only fallback, and the ABC+audio-without-JPG-notation-source fallback) unchanged, per the plan's explicit instruction not to regress image-only tunes. Documented via comment why TPAGE-02 doesn't apply there.

## Deviations from Plan

None - plan executed exactly as written. The plan itself anticipated that the ABC-path wiring might already be correct ("The current code at lines 193-196 already does this — keep it") and scoped Task 1/Task 2 as confirm-and-document work.

## Issues Encountered

None. Pre-existing TypeScript errors in unrelated test files (`src/app/api/changelog/**/*.test.ts`, `tests/e2e/abc-player.spec.ts`) were observed via `npx tsc --noEmit` but are out of scope (not touched by this plan, not caused by this plan's changes) — confirmed zero TS errors attributable to `src/app/tunes/[slug]/page.tsx`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `/tunes/[slug]`'s Score section is confirmed at parity with `/psalms/[slug]`'s Study tab and ready for Plan 16-03 (tabs), which will build tab chrome around this already-correct Score section without needing to touch the notation-rendering wiring itself.
- No blockers.

---
*Phase: 16-tune-page-first-class-surface*
*Completed: 2026-08-15*

## Self-Check: PASSED

- FOUND: `.planning/phases/16-tune-page-first-class-surface/16-02-SUMMARY.md`
- FOUND: commit `3b79121`
- FOUND: `src/app/tunes/[slug]/page.tsx`
