---
phase: 02-public-browse
plan: 03
subsystem: routes, psalm-list, psalm-detail, tabs, static-rendering
tags: [routes, psalm-list, psalm-detail, tabs, static-rendering, RSC, generateStaticParams]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [psalms-list-route, psalms-detail-route, PsalmCard, PsalmGrid, PsalmTabs]
  affects: [02-04, 02-05, 02-06]
tech_stack:
  added: []
  patterns: [generateStaticParams, useSearchParams-with-Suspense, client-side-filter, RSC-data-fetch]
key_files:
  created:
    - src/components/PsalmCard.tsx
    - src/components/PsalmGrid.tsx
    - src/app/psalms/page.tsx
    - src/components/PsalmTabs.tsx
    - src/app/psalms/[id]/page.tsx
    - tests/psalm-detail.test.ts
  modified: []
decisions:
  - "PsalmTabs uses lyrics (not stanzas) and versionLabel (not versionName) — actual schema.ts field names differ from plan interface spec; code matches schema"
  - "sectionHeadings has no verseEnd column — removed verseEnd reference from PsalmTabs; verseStart-only display used"
  - "Base UI Select onValueChange callback receives (value | null, eventDetails) — used arrow function wrapper to handle null and discard eventDetails"
  - "Build output shows /psalms/[id] as SSG (●) not dynamic (ƒ) — Suspense wrapper around PsalmTabs preserves static shell"
metrics:
  duration_minutes: 25
  completed_date: "2026-05-08"
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 2 Plan 3: /psalms List + /psalms/[id] Detail (4 Tabs) Summary

Psalm browse experience fully implemented: /psalms renders 150 static psalm cards with composable book+meter filter dropdowns; /psalms/[id] serves 150 statically pre-rendered detail pages with Overview/Lyrics/Study/Messianic tabs driven by ?tab= URL param.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Build /psalms list — PsalmCard, PsalmGrid, and static route | a18b9e3 | src/components/PsalmCard.tsx, src/components/PsalmGrid.tsx, src/app/psalms/page.tsx |
| 2 | Build /psalms/[id] detail page with PsalmTabs | 87089e1 | src/components/PsalmTabs.tsx, src/app/psalms/[id]/page.tsx, tests/psalm-detail.test.ts |

## What Was Built

**src/components/PsalmCard.tsx (RSC):**
- No `'use client'` — pure server component
- Displays psalm number (font-mono), bible title, first metrical line (italic), meter badge (shadcn Badge)
- Links to /psalms/[id], active:scale-[0.98] click feedback, group-hover colour transitions

**src/components/PsalmGrid.tsx (`'use client'`):**
- Two independent dropdown filters: book and meter (Base UI Select via shadcn wrapper)
- Both compose with AND logic — selecting book + meter narrows to intersection
- `useMemo` for derived books/meters lists and filtered psalms array
- Responsive grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4`

**src/app/psalms/page.tsx (RSC, static):**
- Left-joins psalms → psalmVersions, deduplicates by psalm.id (first version row kept)
- Passes 150 unique rows to PsalmGrid
- Build output: `○ /psalms` (static pre-rendered)

**src/components/PsalmTabs.tsx (`'use client'`):**
- 4 tabs: Overview, Lyrics, Study, Messianic
- Tab state via useSearchParams() reading `?tab=` param; default "overview" for unknown values
- `isTabValue()` type guard — unknown values silently fall back to overview (T-02-08 mitigated)
- Tab switching via router.replace() — no full navigation, preserves scroll
- Overview: iterates psalm.verses as individually numbered paragraphs (verseNumber prefix per <p>); falls back to psalm.kjvText if no per-verse data
- Lyrics: primary version lyrics (whitespace-pre-line), additional versions in `<details>`, tune chips linking to /tunes/[id]
- Study: section headings, Nave's topics (aggregated/deduped across all verses), doctrines; or empty state
- Messianic: classification, NT verification, messianic verses; or "No Messianic notes recorded" empty state

**src/app/psalms/[id]/page.tsx (RSC, SSG):**
- `generateStaticParams()` calls fetchPsalmIds() → 150 params
- `params` awaited as Promise<{id: string}> (Next.js 15+ pattern)
- Explicit bounds check: psalmId < 1 || psalmId > 150 → notFound() before DB query (T-02-07 mitigated)
- PsalmTabs wrapped in `<Suspense fallback={skeleton}>` — preserves static shell
- Build output: `● /psalms/[id]` (SSG, 150 paths generated)

**tests/psalm-detail.test.ts:**
- 5 vitest tests: all pass (5/5)
- Covers PSALM-02..05: field presence, psalmVersions shape, verses+topics relations, messianic array, messianic record existence

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Schema field names differ from plan's PsalmDetail interface**
- **Found during:** Task 2 implementation
- **Issue:** Plan's interface spec used `stanzas` and `versionName` but schema.ts declares these fields as `lyrics` and `versionLabel` respectively. Plan also referenced `sectionHeadings[].verseEnd` which does not exist in the schema.
- **Fix:** PsalmTabs.tsx uses `primaryVersion.lyrics` (not `.stanzas`), `v.versionLabel` (not `.versionName`), and removed `verseEnd` reference from section headings display. Test file updated to check `lyrics` instead of `stanzas`.
- **Files modified:** src/components/PsalmTabs.tsx, tests/psalm-detail.test.ts
- **Commit:** 87089e1

**2. [Rule 1 - Bug] Base UI Select onValueChange callback signature**
- **Found during:** Task 1 implementation
- **Issue:** Base UI Select's `onValueChange` signature is `(value: T | null, eventDetails) => void`. Passing `setSelectedBook` directly would set state to `null` when value is null. Also TypeScript would complain about the second argument.
- **Fix:** Used arrow function wrapper: `onValueChange={(v) => setSelectedBook(v ?? "all")}` — coalesces null to "all".
- **Files modified:** src/components/PsalmGrid.tsx
- **Commit:** a18b9e3

## Known Stubs

None — all data wired from live DB via fetchPsalmDetail/fetchPsalmIds. Tune chips link to /tunes/[id] which doesn't exist yet (Phase 2 Plan 4) but links are correct.

## Threat Flags

None — all threat model items from plan are implemented:
- T-02-07: URL param id bounded by generateStaticParams to 1..150 + explicit numeric bounds check before DB query
- T-02-08: isTabValue() type guard restricts ?tab= to 4 known values; unknown values fall back to "overview"
- T-02-10: No dangerouslySetInnerHTML; React escapes all text nodes automatically

## Self-Check: PASSED

Files created:
- src/components/PsalmCard.tsx: FOUND
- src/components/PsalmGrid.tsx: FOUND
- src/app/psalms/page.tsx: FOUND
- src/components/PsalmTabs.tsx: FOUND
- src/app/psalms/[id]/page.tsx: FOUND
- tests/psalm-detail.test.ts: FOUND

Commits verified:
- a18b9e3: feat(02-03): build /psalms list with PsalmCard, PsalmGrid, and static route
- 87089e1: feat(02-03): build /psalms/[id] detail page with 4-tab PsalmTabs component

Build verification:
- /psalms: ○ (Static)
- /psalms/[id]: ● (SSG, 150 paths)
- No ƒ (Dynamic) markers for either route
- TypeScript: clean (npx tsc --noEmit exits 0)
- Tests: 5/5 passed
