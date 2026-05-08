---
phase: 02-public-browse
plan: 02
subsystem: layout, utilities
tags: [layout, navigation, utilities, daily, youtube]
dependency_graph:
  requires: [02-01]
  provides: [site-header, getDayOfYear, toEmbedUrl]
  affects: [02-03, 02-04, 02-05, 02-06]
tech_stack:
  added: []
  patterns: [RSC-nav, pure-utility-functions, TDD-red-green]
key_files:
  created:
    - src/components/SiteHeader.tsx
    - src/lib/daily.ts
    - src/lib/youtube.ts
    - tests/lib-utilities.test.ts
  modified:
    - src/app/layout.tsx
decisions:
  - "SiteHeader is RSC (no 'use client') — no auth state or active-link detection needed in Phase 2"
  - "getDayOfYear wraps day 366 to day 1 via modulo to keep 365-entry plan bounded on leap years"
  - "toEmbedUrl extracts only [\w-]+ video ID — prevents injection of arbitrary URL segments into iframe src (T-02-04 mitigated)"
metrics:
  duration_minutes: 10
  completed_date: "2026-05-08"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 2 Plan 2: Root Layout + SiteHeader + lib/daily.ts + lib/youtube.ts Summary

Sticky site-wide navigation header (RSC, 56px, z-50) mounted in root layout above all pages, plus two pure utility libraries — deterministic day-of-year computation and YouTube URL-to-embed conversion — backed by 7 passing vitest tests.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create lib/daily.ts and lib/youtube.ts pure utilities | bfade2f | src/lib/daily.ts, src/lib/youtube.ts, tests/lib-utilities.test.ts |
| 2 | Create SiteHeader and mount it in root layout | 1e59a85 | src/components/SiteHeader.tsx, src/app/layout.tsx |

## What Was Built

**src/lib/daily.ts:**
- `getDayOfYear(date?: Date): number` — 1-based day of year (1..365), wraps leap day 366 back to 1
- Pure function, no DOM or React dependency, works in Node and browser

**src/lib/youtube.ts:**
- `toEmbedUrl(url: string | null | undefined): string | null` — converts youtu.be short URLs and youtube.com/watch?v= long URLs to embed URLs; returns null for non-YouTube URLs or null input
- Regex extracts only `[\w-]+` video ID (T-02-04: prevents injection)

**src/components/SiteHeader.tsx:**
- RSC (no `'use client'`) sticky header: `sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border`
- Height h-14 (~56px), max-w-7xl container, responsive padding
- Left: "CPRC Psalter" site name linked to /
- Right nav: Psalms (/psalms) · Tunes (/tunes) · Daily Plan (/daily)

**src/app/layout.tsx:**
- SiteHeader imported and rendered above `<main className="flex-1">`
- Geist Sans + Geist Mono font setup preserved intact

**tests/lib-utilities.test.ts:**
- 7 tests: getDayOfYear Jan 1 = 1, Dec 31 = 365, default in 1..365; toEmbedUrl short/long/null/non-YouTube
- All 7 pass against the TDD GREEN implementation

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — SiteHeader nav links are static hrefs; utility functions are complete implementations.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond the plan's threat model. T-02-04 mitigated as planned: `toEmbedUrl` regex restricts extracted video IDs to `[\w-]+`.

## Self-Check: PASSED

Files exist:
- src/components/SiteHeader.tsx: FOUND
- src/lib/daily.ts: FOUND
- src/lib/youtube.ts: FOUND
- tests/lib-utilities.test.ts: FOUND
- src/app/layout.tsx: MODIFIED (SiteHeader mounted)

Commits verified:
- bfade2f: feat(02-02): add getDayOfYear and toEmbedUrl pure utility libraries
- 1e59a85: feat(02-02): add SiteHeader RSC and mount in root layout
