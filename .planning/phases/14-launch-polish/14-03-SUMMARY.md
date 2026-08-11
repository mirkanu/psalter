---
phase: 14
plan: 03
subsystem: skeletons
tags: [polish, loading-states, POLISH-04, nextjs-suspense]
requires: [phase-14-UI-SPEC]
provides: [homepage-skeleton, daily-skeleton]
affects: [src/app/loading.tsx, src/app/daily/loading.tsx]
tech-stack:
  added: []
  patterns: [nextjs-loading.tsx-suspense-fallback, shadcn-skeleton-primitive, raw-div-bg-muted-animate-pulse]
key-files:
  created: [src/app/loading.tsx]
  modified: [src/app/daily/loading.tsx]
decisions:
  - "Homepage skeleton uses shadcn <Skeleton> component (animate-pulse+rounded-md+bg-muted baked in) — sizes specified as className"
  - "Daily skeleton uses raw <div> with bg-muted animate-pulse classes (NOT <Skeleton>) — matches UI-SPEC §3 verbatim class strings for grep verification"
  - "/search intentionally has no loading.tsx — search is a Dialog mounted in <SiteHeader>, not a route. Documented in JSDoc at top of daily/loading.tsx"
  - "explore/loading.tsx verified unchanged — already matches locked pattern (h-9 w-32 H1 + h-5 w-72 subtitle + 6 sections with topic grids)"
metrics:
  duration: "~12 minutes"
  completed_date: 2026-08-11
  tasks: 2
  files: 2
---

# Phase 14 Plan 03: Skeleton Loading States Summary

## One-liner

Added missing homepage skeleton (`src/app/loading.tsx` NEW) and replaced the sparse daily skeleton with the locked richer pattern; verified explore/loading.tsx already correct; documented `/search` no-skeleton decision in JSDoc.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create src/app/loading.tsx — homepage skeleton per UI-SPEC §3 | `b985417` | `src/app/loading.tsx` (NEW, 1319 B) |
| 2 | Replace src/app/daily/loading.tsx with richer skeleton; verify explore unchanged | `1b83c2c` | `src/app/daily/loading.tsx` (MODIFIED, 1026 B) |

## What Was Built

### Task 1: `src/app/loading.tsx` (NEW)

Next.js 15 Suspense fallback for `/` route. Renders during first paint while `force-dynamic` `page.tsx` awaits `fetchAllDailyReadings()`. Eliminates blank flash on cold load.

Structure (mirrors `src/app/page.tsx`):

```
<div max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12>
  // Hero placeholder
  <div bg-muted border border-border rounded-lg border-l-4 border-l-primary p-6 mb-8>
    <Skeleton h-5 w-12 rounded-full />        // "New" badge pill
    <Skeleton h-6 w-64 mt-2 mb-1 />            // "CPRC Psalter v2.0 is here"
    <Skeleton h-4 w-96 />                      // "See what's new..."
    <Skeleton h-9 w-40 mt-4 rounded-md />      // "Read the changelog" button
  </div>
  // 2-col grid
  <div grid lg:grid-cols-2 gap-8 items-start>
    <DailyTodayCard placeholder — 5 Skeletons>
    <PsalmSearchWidget placeholder — 3 Skeletons>
  </div>
</div>
```

### Task 2: `src/app/daily/loading.tsx` (REPLACED)

Replaced 11-line sparse version (H1 + 2 cards) with richer pattern matching the actual page structure:

```
<div max-w-3xl mx-auto ...>
  // H1 block
  <div h-9 w-48 bg-muted animate-pulse rounded mb-1 />
  <div h-5 w-64 bg-muted animate-pulse rounded />

  // Today card
  <div h-40 w-full rounded-lg bg-muted animate-pulse mb-4 />

  // Day list — 30 rows
  <div space-y-1>
    [30x h-10 w-full rounded-md bg-muted animate-pulse]
  </div>
</div>
```

Plus JSDoc comment at top documenting the `/search` no-skeleton rationale.

### Verification

- `src/app/explore/loading.tsx`: working tree clean for that path (verified unchanged — already matches locked pattern)
- `npm run build`: TypeScript compilation passed (`✓ Compiled successfully`); runtime build failure was unrelated `DATABASE_URL` env var missing in worktree context — not a code error
- `git status -- src/app/`: clean working tree with exactly 2 commits touching expected files

## Deviations from Plan

None — plan executed exactly as written.

## Acceptance Criteria Met

- [x] Task 1: `src/app/loading.tsx` exists (NEW); contains `border-l-primary`, `HomeLoading`, `grid lg:grid-cols-2`, `h-9 w-40 mt-4 rounded-md`, `h-11 w-full rounded-md`, `Skeleton` (13 lines, within 10–14 bound); 1319 B (within 1–3 KiB bound)
- [x] Task 2: `src/app/daily/loading.tsx` contains `h-9 w-48`, `h-40 w-full rounded-lg`, `Array.from({ length: 30 })`, `h-10 w-full rounded-md`; 1026 B (within 600–1500 B bound); JSDoc comment present; explore/loading.tsx unchanged
- [x] No text strings in skeleton bodies (only bg-muted animate-pulse rectangles)
- [x] Both tasks committed individually with conventional commit messages
- [x] No modifications to STATE.md or ROADMAP.md (worktree-isolated, orchestrator handles centrally)

## Known Stubs

None — all three skeletons are complete, render no text, and follow the locked UI-SPEC §3 class strings.

## Self-Check: PASSED

- `src/app/loading.tsx` exists (1319 B)
- `src/app/daily/loading.tsx` modified (1026 B)
- `src/app/explore/loading.tsx` exists, untouched (4568 B)
- Commit `b985417` (Task 1) and `1b83c2c` (Task 2) present in `git log`

## Files (absolute paths)

- `/home/services/psalter/.claude/worktrees/agent-a1b7ab55bcabcaed5/src/app/loading.tsx` (NEW)
- `/home/services/psalter/.claude/worktrees/agent-a1b7ab55bcabcaed5/src/app/daily/loading.tsx` (MODIFIED)
- `/home/services/psalter/.claude/worktrees/agent-a1b7ab55bcabcaed5/src/app/explore/loading.tsx` (verified, unchanged)
