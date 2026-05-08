---
phase: "03-search"
plan: "03"
subsystem: "ui-components"
tags: [tune-filter, nav, client-component, url-sync]
dependency_graph:
  requires: [03-01]
  provides: [TuneGrid, SiteHeader-v2]
  affects: [/tunes page (Plan 06), all page layouts]
tech_stack:
  added: []
  patterns:
    - useSearchParams + router.replace for shareable client-side filter state
    - usePathname for active-link detection in navigation
key_files:
  created:
    - src/components/TuneGrid.tsx
  modified:
    - src/components/SiteHeader.tsx
decisions:
  - "SiteHeader converted to 'use client' — usePathname() requires client boundary; minimal impact as header is already at the root of every page layout"
  - "TuneGrid initialises meter from useSearchParams on mount — enables sharing filtered tune URLs"
  - "encodeURIComponent applied to meter value in router.replace — defensive encoding for meter strings that may contain slashes or special characters"
metrics:
  duration_minutes: 8
  completed_date: "2026-05-08"
  tasks_completed: 2
  files_created: 1
  files_modified: 1
---

# Phase 03 Plan 03: TuneGrid + SiteHeader Client Upgrade Summary

**One-liner:** TuneGrid client component with shareable URL-synced meter filter, and SiteHeader upgraded to client component with usePathname active-link detection and Search/Explore nav entries.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TuneGrid client component with meter filter and URL sync | 727b271 | src/components/TuneGrid.tsx (created) |
| 2 | Upgrade SiteHeader to 'use client' with active-link detection, add Search and Explore links | 6cfe811 | src/components/SiteHeader.tsx (modified) |

## What Was Built

### TuneGrid.tsx

New `'use client'` component that:
- Accepts `TuneRow[]` props (id, name, meter, scoreJpgUrl) from the parent RSC
- Reads initial `?meter=` param from URL via `useSearchParams` on mount
- Derives distinct sorted meter values via `useMemo`
- Filters tunes client-side via `useMemo` — no server round-trips
- Syncs meter selection to URL via `router.replace('/tunes?meter=...', { scroll: false })`
- Renders a Clear button (ghost Button + X icon 12px) only when a meter filter is active
- Tune card render matches the existing `/tunes/page.tsx` card exactly

### SiteHeader.tsx

Upgraded from RSC to `'use client'`:
- Added `usePathname()` for active-link detection
- `isActive(href)` helper uses `pathname.startsWith(href)`
- navLinks expanded from 3 to 5 entries: Psalms, Tunes, Search, Explore, Daily Plan
- Active link style: `text-foreground bg-muted`; inactive: `text-muted-foreground hover:bg-muted`
- All existing header markup, backdrop-blur, z-index, and dimensions preserved

## Verification Results

```
grep "router.replace" src/components/TuneGrid.tsx  ✓ (2 matches)
grep "useSearchParams" src/components/TuneGrid.tsx  ✓
grep "'use client'" src/components/SiteHeader.tsx   ✓
grep "usePathname" src/components/SiteHeader.tsx    ✓
grep '"/search"' src/components/SiteHeader.tsx      ✓
grep '"/explore"' src/components/SiteHeader.tsx     ✓
npx tsc --noEmit                                    ✓ (0 errors)
npx vitest run tests/tune-grid.test.ts              ✓ 4/4 tests passed
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. TuneGrid receives real data from parent RSC (fetchAllTunes). No hardcoded or placeholder values.

## Threat Flags

None. Threat register threats T-03-05 and T-03-06 accepted as documented:
- T-03-05: ?meter= controls client-side filter only — no server query, no injection risk
- T-03-06: usePathname is internal Next.js value, not user-controlled input

## Self-Check: PASSED

- src/components/TuneGrid.tsx: FOUND
- src/components/SiteHeader.tsx: FOUND (modified)
- commit 727b271: FOUND
- commit 6cfe811: FOUND
