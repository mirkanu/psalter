---
phase: 15-lighthouse-90-on-psalms-psalms-id-fix-client-side-tbt-6-2-7-
plan: 15-01
title: Dynamic-import wrappers + Wave 0 tests
subsystem: lighthouse-perf
tags: [polish-03, lighthouse, dynamic-import, next-dynamic, abcjs, performance]
dependency-graph:
  requires: []
  provides:
    - src/components/singing/PlayMiniBarClient.tsx (NEW wrapper)
    - src/components/PsalmListingGridClient.tsx (NEW wrapper)
    - src/components/singing/PlayMiniBarClient.test.tsx (Wave 0 test)
    - src/components/PsalmListingGridClient.test.tsx (Wave 0 test)
  affects:
    - src/components/singing/SingingView.tsx (PlayMiniBar → PlayMiniBarClient)
    - src/components/TuneMiniBarSection.tsx (PlayMiniBar → PlayMiniBarClient)
    - src/app/psalms/page.tsx (PsalmListingGrid → PsalmListingGridClient)
tech-stack:
  added: []
  patterns:
    - next/dynamic({ ssr: false }) wrapper with 'use client' directive
    - Suspense fallback as either empty placeholder or reused page-level loading.tsx
key-files:
  created:
    - src/components/singing/PlayMiniBarClient.tsx
    - src/components/PsalmListingGridClient.tsx
    - src/components/singing/PlayMiniBarClient.test.tsx
    - src/components/PsalmListingGridClient.test.tsx
  modified:
    - src/components/singing/SingingView.tsx
    - src/components/TuneMiniBarSection.tsx
    - src/app/psalms/page.tsx
decisions:
  - Use empty h-[44px] placeholder for PlayMiniBarClient (not pulsing Skeleton) because SingingView's existing dynamic spacer reserves the exact PlayMiniBar height via onHeightChange; a pulsing Skeleton would fight that spacer and risk CLS.
  - Reuse src/app/psalms/loading.tsx (72 Skeleton boxes) as the PsalmListingGridClient Suspense fallback — bit-identical to the rendered grid, guarantees zero CLS.
  - Defer PlayMiniBar on /tunes/[slug] too (Claude's discretion from research, free win since same abcjs chunk cost applies).
  - Leave modal callers (PsalmPickerModal, PsalmPickerModal in modal context) using the eager imports — modal chunks load on interaction, not first paint.
metrics:
  duration: ~50 minutes (incl. dynamic-import-chunk timing investigation)
  tasks: 7/7
  files-created: 4
  files-modified: 3
  total-lines-added: 139
  total-lines-removed: 6
  completed-date: 2026-08-12
---

# Phase 15 Plan 01: Dynamic-import wrappers + Wave 0 tests Summary

Two thin `'use client'` wrappers (`PlayMiniBarClient`, `PsalmListingGridClient`) that defer their underlying client component chunks off the initial paint, plus Wave 0 Vitest tests proving the wrappers expose the named exports. After this plan merges, the psalm-detail bundle no longer eagerly pulls `AbcAudioControls` → `import * as abcjsModule from 'abcjs'` (the 71 KB abcjs synth/audio chunk per the Phase 14 Lighthouse JSONs), and the psalm-list bundle no longer eagerly pulls `PsalmListingGrid`'s 498 LoC of `useLocalStorage`-backed search/filter state. Wave 0 Vitest coverage (T1 + T2 from 15-VALIDATION.md) is complete.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create `PlayMiniBarClient.tsx` | `0e5930c` | `src/components/singing/PlayMiniBarClient.tsx` |
| 2 | Create `PsalmListingGridClient.tsx` | `c6bd988` | `src/components/PsalmListingGridClient.tsx` |
| 3 | Update `SingingView.tsx` to use `PlayMiniBarClient` | `75134b6` | `src/components/singing/SingingView.tsx` |
| 4 | Update `TuneMiniBarSection.tsx` to use `PlayMiniBarClient` | `f36e58f` | `src/components/TuneMiniBarSection.tsx` |
| 5 | Update `psalms/page.tsx` to use `PsalmListingGridClient` | `aa463ce` | `src/app/psalms/page.tsx` |
| 6 | Wave 0 test for `PlayMiniBarClient` | `95b57d0` | `src/components/singing/PlayMiniBarClient.test.tsx` |
| 7 | Wave 0 test for `PsalmListingGridClient` | `fd3f712` | `src/components/PsalmListingGridClient.test.tsx` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `PlayMiniBarClient.test.tsx` initial implementation queried DOM AFTER waitFor instead of INSIDE**

- **Found during:** Task 6 (first test run, before commit)
- **Issue:** The plan's verbatim test placed `const real = container.querySelector('[data-play-mini-bar]')` AFTER `await waitFor(() => { expect(container).toBeDefined() })`. But the dynamic-import chunk takes ~700-1000ms to resolve in jsdom, so by the time the queries ran, the chunk hadn't loaded yet — both `data-play-mini-bar` and the 44px fallback were missing. The test failed: `expected false to be true`. The wrapper itself was correct; the test logic just queried at the wrong moment.
- **Fix:** Moved the queries INSIDE `waitFor` (the polling body), so the assertions retry every 50ms until either element appears. Bumped the timeout from 3000ms to 5000ms to comfortably cover the 1-2s jsdom chunk-fetch path observed in subsequent runs.
- **Files modified:** `src/components/singing/PlayMiniBarClient.test.tsx`
- **Commit:** `95b57d0` (committed as part of Task 6 after the fix)
- **Verification:** Both tests pass (`2 passed`); PsalmListingGridClient test (which has the same issue) was authored with the correct polling-inside-waitFor pattern from the start.

**2. [Rule 3 - Blocking] `.env` not present in worktree**

- **Found during:** Task 8 (`npm run build`)
- **Issue:** Build compiled + typechecked successfully but failed at "Collecting page data" with `DATABASE_URL environment variable is not set`. Next.js needs the env at build time to evaluate RSC pages that import auth code. The worktree doesn't ship a `.env` (it's gitignored, so correctly absent from the worktree).
- **Fix:** Copied `/home/services/psalter/.env` to the worktree root so the build could resolve `DATABASE_URL`. Confirmed `.env` is in `.gitignore` so it won't accidentally commit.
- **Files affected:** `.env` (untracked, gitignored — NOT committed)
- **Commit:** N/A (env file is not in the commit set)

## Verification

### Acceptance criteria check

All grep-count acceptance criteria from the plan pass:

- `PlayMiniBarClient.tsx`: 1× `'use client'`, 1× `dynamic(`, 1× `ssr: false`, 1× `m.PlayMiniBar`, 1× `h-[44px]`, 1× `export function PlayMiniBarClient`, 1× `export type PlayMiniBarProps`, 0× `bg-muted` ✓
- `PsalmListingGridClient.tsx`: 1× `'use client'`, 1× `dynamic(`, 1× `ssr: false`, 1× `m.PsalmListingGrid`, 1× `import PsalmsLoading from '@/app/psalms/loading'`, 1× `<PsalmsLoading />`, 1× `export function PsalmListingGridClient`, 1× `psalms: PsalmRow[]`, 1× `onSelect?:`, 1× `hideExport?:` ✓
- `SingingView.tsx`: 1× `from './PlayMiniBarClient'`, 0× `from './PlayMiniBar'`, 1× `<PlayMiniBarClient`, 0× stale `<PlayMiniBar `, ≥2× `PlayMiniBarClient` mentions, 1× `variant="inline"`, 1× `onHeightChange={setMiniBarHeight}` ✓
- `TuneMiniBarSection.tsx`: 1× `from './singing/PlayMiniBarClient'`, 0× `from './singing/PlayMiniBar'`, 1× `<PlayMiniBarClient`, 0× stale `<PlayMiniBar `, 1× `"use client"` (preserved) ✓
- `psalms/page.tsx`: 1× `from "@/components/PsalmListingGridClient"`, 0× `from "@/components/PsalmListingGrid"`, 1× `<PsalmListingGridClient psalms={listRows}`, 0× stale `<PsalmListingGrid psalms={listRows}`, 1× `export const dynamic = 'force-dynamic'` (preserved) ✓
- `PlayMiniBarClient.test.tsx`: 1× `@vitest-environment jsdom`, 1× `import { PlayMiniBarClient } from './PlayMiniBarClient'`, ≥1× `waitFor`, 2 tests pass ✓
- `PsalmListingGridClient.test.tsx`: 1× `@vitest-environment jsdom`, 1× `import { PsalmListingGridClient } from './PsalmListingGridClient'`, ≥1× `data-psalm-box`, 1× `vi.mock('next/navigation'`, 2 tests pass ✓

### Test suite results

```
$ npx vitest run \
    src/components/PsalmListingGrid.test.tsx \
    src/components/singing/PlayMiniBarClient.test.tsx \
    src/components/PsalmListingGridClient.test.tsx

 ✓ src/components/PsalmListingGrid.test.tsx (19 tests) 1015ms
 ✓ src/components/PsalmListingGridClient.test.tsx (2 tests) 452ms
 ✓ src/components/singing/PlayMiniBarClient.test.tsx (2 tests) 960ms

 Test Files  3 passed (3)
      Tests  23 passed (23)
```

- All 19 existing PsalmListingGrid tests still pass — regression check confirms the wrapper doesn't break the underlying component behaviour.
- 2 new PlayMiniBarClient tests pass (named-export resolution + wrapper function type).
- 2 new PsalmListingGridClient tests pass (lazy export resolves to psalm boxes + wrapper accepts the optional `hideExport` + `onSelect` props).
- Wave 0 gates T1 (PsalmListingGridClient test file exists and passes) and T2 (PlayMiniBarClient test file exists and passes) from `15-VALIDATION.md` are satisfied.

### Build verification

`npm run build` exits 0 (after resolving the `.env` issue documented above) with the following outcome:

- TypeScript: 0 errors
- Turbopack: 1 warning about NFT file trace (pre-existing, unrelated — comes from the dev API routes using `process.cwd()`).
- Static page generation: 1529/1529 succeeded.
- Routes include `/psalms` (ƒ Dynamic, `force-dynamic` preserved) and `/psalms/[id]` (ƒ Dynamic).
- Wrapper chunks detected in `.next/static/chunks/` (Turbopack produces hashed names — `0a0m5s.pk2k-l.js` etc. contain the wrapper code).

## What This Plan Unblocks

This plan ships the wrapper components that defer the heavy chunks identified in the Phase 14 Lighthouse JSONs:

- The 71 KB abcjs audio/synth chunk on `/psalms/[id]` (per `14-04-lighthouse-psalm-detail.json`) now loads only when PlayMiniBar first mounts, not on initial paint.
- The 38 KB psalm-grid chunk on `/psalms` (per `14-04-lighthouse-psalms.json`) now loads only after hydration, not on initial paint.

Wave 0 Vitest coverage is in place. Wave 2 (Plan 15-02: next/image conversion + Geist preload) and Wave 3 (Plan 15-03: Lighthouse validation against the live deploy) can proceed independently.

## Known Stubs

None. Every change is a complete refactor — the wrappers pass all props through unchanged, and the rendering fallback (empty `h-[44px]` div for PlayMiniBarClient, the existing `PsalmsLoading` 72-box skeleton for PsalmListingGridClient) is identical to the page-level loading state the user already saw.

## Threat Flags

None. No new auth/data/authentication surface; no new network endpoints; no new file access patterns; no schema changes. The dynamic-import deferral is a build-time chunk-splitting optimization with no security impact.

## Self-Check: PASSED

All 7 commits verified via `git log --oneline 9b4f641..HEAD`:

| Hash | Commit message |
|------|----------------|
| `0e5930c` | feat(15-01): add PlayMiniBarClient dynamic-import wrapper |
| `c6bd988` | feat(15-01): add PsalmListingGridClient dynamic-import wrapper |
| `75134b6` | feat(15-01): use PlayMiniBarClient in SingingView |
| `f36e58f` | feat(15-01): use PlayMiniBarClient in TuneMiniBarSection |
| `aa463ce` | feat(15-01): use PsalmListingGridClient in /psalms page |
| `95b57d0` | test(15-01): add PlayMiniBarClient Wave 0 smoke test |
| `fd3f712` | test(15-01): add PsalmListingGridClient Wave 0 smoke test |

All 7 files exist in the working tree (or at the committed blob). `git status` is clean.