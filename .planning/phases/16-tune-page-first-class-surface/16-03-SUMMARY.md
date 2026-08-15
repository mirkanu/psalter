---
phase: 16-tune-page-first-class-surface
plan: 03
subsystem: ui
tags: [nextjs, react-server-components, tabs, url-state, base-ui]

# Dependency graph
requires:
  - phase: 16-01
    provides: Shared TunePickerDialog consolidation (unrelated surface, same phase)
  - phase: 16-02
    provides: Confirmed /tunes/[slug]'s Score section (TuneScoreSection + TuneMiniBarSection) is already at parity with /psalms/[slug]'s Study tab
provides:
  - "Details/Notation tabbed surface on /tunes/[slug] (TPAGE-03) with ?tab= URL sync"
  - "src/app/tunes/_components/TunePageTabs.tsx — reusable tab-chrome pattern for the tune route"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RSC data-fetch → thin 'use client' tab-chrome wrapper pattern (mirrors PsalmTabs.tsx), now also used on /tunes/[slug]"
    - "Tab state synced to ?tab= via router.replace({ scroll: false }) with a strict value allowlist, falling back to a safe default for any unrecognised value"

key-files:
  created:
    - "src/app/tunes/_components/TunePageTabs.tsx"
    - "src/app/tunes/_components/TunePageTabs.test.tsx"
  modified:
    - "src/app/tunes/[slug]/page.tsx"

key-decisions:
  - "Preserved all three existing Notation-tab branches (ABC path, JPG-only fallback, ABC+audio secondary player) instead of the plan's literal instruction to remove TuneDetailClient and show a static 'not available' placeholder for every non-ABC tune — Rule 1 (avoid regression). Plan 16-02 (commit 3b79121) already explicitly decided TuneDetailClient must stay for image-only tunes; the 16-03 plan text was written without full visibility into that decision."
  - "youtubeUrl added to TunePageTabsProps (absent from the plan's documented interface) — required so the preserved TuneDetailClient fallback branches keep working; without it the audio-only YouTube fallback would silently break for tunes with no SoundCloud link."
  - "_components import path from page.tsx corrected to '../_components/TunePageTabs' (not './_components/TunePageTabs' as literally written in the plan's Task 2 action text) — _components is a sibling of the [slug] route segment, not nested inside it, per Next.js App Router convention for route-private folders."
  - "hasFamousHymn coalesced with ?? false when passed to TunePageTabs — the Drizzle-inferred column type is boolean | null (no .notNull()), but the prop type is boolean."

patterns-established:
  - "Tab surfaces on this project sync active tab to ?tab= via router.replace({ scroll: false }), never router.push, to avoid adding history entries or resetting scroll — same pattern for any future tabbed route."

requirements-completed: [TPAGE-03]

# Metrics
duration: 35min
completed: 2026-08-15
---

# Phase 16 Plan 03: Tune Page Tabs Summary

**Wrapped `/tunes/[slug]` in a Details (default) / Notation `Tabs` surface backed by a new `TunePageTabs` client component, with the active tab synced to `?tab=` via `router.replace({ scroll: false })`; the page itself became a thin RSC that keeps every existing data-fetch and hands serialisable props to the new component.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2 completed
- **Files created:** 2
- **Files modified:** 1

## Accomplishments

- Created `src/app/tunes/_components/TunePageTabs.tsx` — a `'use client'` component owning the Details/Notation `Tabs` surface, mirroring `PsalmTabs.tsx`'s `TabsList`/`TabsTrigger` styling (`rounded-none border-b-[3px] ... data-[active]:border-b-foreground`) and reusing the exact same `@/components/ui/tabs` primitives (no fork).
- Tab state is a local `useState<TunePageTab>` seeded from `useSearchParams().get('tab')` on mount (covers hard-refresh persistence for both `?tab=details` and `?tab=notation`), and `onValueChange` updates both the state and the URL atomically via `router.replace(pathname + '?tab=' + next, { scroll: false })`.
- `parseTab()` is a strict allowlist (`'notation'` → notation, everything else including `undefined`/`null`/`'foo'` → `'details'`) — satisfies threat T-16-05 (Tampering via the `?tab=` param) directly in code, not just by convention.
- Details tab reproduces the title/meter badge/metadata grid (Mood, RP Psalter, PR Psalter, Famous hymn, Precenting notes) plus `<PsalmsByTuneSection>`, byte-for-byte the same JSX that previously lived directly in `page.tsx`.
- Notation tab reproduces the Score section exactly as it existed pre-refactor, preserving all three branches from the original page (see Deviations below) rather than the plan's literal "remove TuneDetailClient" instruction.
- `src/app/tunes/[slug]/page.tsx` is now a thin RSC: all fetch/derive logic (`generateStaticParams`, `generateMetadata`, numeric-slug redirect, version-entry dedup + recommended/other split, `deriveTuneJpgPages`, `fetchPsalmsByMeter`/`fetchPsalmListRows`, mood derivation, `pickAbcWithMarkers`/`sopranoOnly`, `buildNotationRendererProps`) is untouched; the return statement is now a single `<TunePageTabs {...props} />` inside the original outer `<div className="max-w-4xl mx-auto ...">`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TunePageTabs client component with URL state + unit tests** - `9c4934b`
2. **Task 2: Refactor /tunes/[slug]/page.tsx into a thin RSC that delegates to TunePageTabs** - `7f195be`

## Files Created/Modified

- `src/app/tunes/_components/TunePageTabs.tsx` (new) - Details/Notation tab chrome, URL-sync logic, and all per-tab content composition.
- `src/app/tunes/_components/TunePageTabs.test.tsx` (new) - 10 unit tests (tab labels, default-tab derivation, allowlist fallback, `router.replace` call assertions, metadata/section rendering, Notation-tab content branching).
- `src/app/tunes/[slug]/page.tsx` (modified) - Reduced from a ~250-line RSC with all chrome inline to a ~170-line RSC (data-fetch only) that renders `<TunePageTabs>`.

## Decisions Made

- **Preserved the JPG-only and ABC+audio `TuneDetailClient` fallback branches** rather than following the plan's Task 2 "done" criteria literally (which described removing the `TuneDetailClient` import and replacing the no-ABC case with a static "Notation not available" placeholder). Plan 16-02's own SUMMARY (commit `3b79121`) already recorded the explicit decision to keep `TuneDetailClient` "per the plan's explicit instruction not to regress image-only tunes." Roughly 102/172 tunes are not yet ABC-approved in `/dev/melisma-editor` (see PROJECT.md Backlog) and rely entirely on this fallback — dropping it would have broken notation display for the majority of tunes on the site. This is a Rule 1 (avoid regression) deviation, documented inline in `TunePageTabs.tsx`'s doc comment above the component.
- **Added `youtubeUrl` to `TunePageTabsProps`** (not present in the plan's `<interfaces>` block) as a direct consequence of the above — `TuneDetailClient` requires it for the YouTube-embed fallback path.
- **Fixed the relative import path**: the plan's Task 2 action text said `./_components/TunePageTabs`, but `_components` is a sibling directory of `[slug]/`, not a child of it (App Router route-private-folder convention keeps `_components` outside the dynamic segment). Used `../_components/TunePageTabs` instead; verified via `npx tsc --traceResolution` that the literal path fails module resolution.
- **`hasFamousHymn ?? false`** — `tunes.has_famous_hymn` has no `.notNull()` in the Drizzle schema, so its inferred type is `boolean | null`; the component prop is `boolean`. Coalesced at the call site to satisfy `tsc`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Regression avoidance] Kept `TuneDetailClient` fallback branches instead of removing them**
- **Found during:** Task 1 (reading `src/app/tunes/[slug]/page.tsx` per `<read_first>`)
- **Issue:** The plan's Task 2 "done" criteria instructed removing the `TuneDetailClient` import and, per Task 1's action text, rendering a static "Notation not available for this tune" placeholder whenever `bestAbc` is null. The actual page (post-16-02) has three Notation-relevant branches: ABC path (`TuneScoreSection`+`TuneMiniBarSection`), JPG-only fallback (`TuneDetailClient`, for tunes with no ABC), and an ABC+audio secondary player (`TuneDetailClient` with `staffPages=[]`). Plan 16-02's SUMMARY explicitly recorded that these fallback paths must not regress.
- **Fix:** `TunePageTabs.tsx`'s Notation tab reproduces all three original branches; the plan's literal placeholder text is kept only as a true last-resort (no ABC, no images, no audio at all — a case that does not currently occur in the data).
- **Files modified:** `src/app/tunes/_components/TunePageTabs.tsx`
- **Commit:** `9c4934b`

**2. [Rule 3 - Blocking issue] Corrected the `_components` relative import path**
- **Found during:** Task 2, `tsc --noEmit` verification step
- **Issue:** Plan's literal instruction (`./_components/TunePageTabs`) does not resolve — `_components` is a sibling of `[slug]/`, not a child.
- **Fix:** Changed the import in `page.tsx` to `../_components/TunePageTabs`.
- **Files modified:** `src/app/tunes/[slug]/page.tsx`
- **Commit:** `7f195be`

**3. [Rule 1 - Type bug] `hasFamousHymn` null-coalesced**
- **Found during:** Task 2, `tsc --noEmit` verification step
- **Issue:** `tune.hasFamousHymn` is `boolean | null` (Drizzle schema has no `.notNull()`); `TunePageTabsProps.hasFamousHymn` is `boolean`.
- **Fix:** `hasFamousHymn={tune.hasFamousHymn ?? false}` at the call site.
- **Files modified:** `src/app/tunes/[slug]/page.tsx`
- **Commit:** `7f195be`

## Issues Encountered

- Pre-existing, unrelated `tsc --noEmit` errors in `src/app/api/changelog/**/*.test.ts`, `src/lib/changelog-broadcast.test.ts`, and `tests/e2e/*.spec.ts` (duplicate declarations, Playwright type mismatches) were observed but are out of scope — confirmed zero TS errors attributable to any file this plan touched.
- Two live-verification scripts predating this phase (`tests/tune-notation.spec.ts`, `tests/e2e/abc-player.spec.ts`) assume the Score/notation SVG is visible on `/tunes/[id]` by default with no `?tab=` param. That assumption is now false by design — TPAGE-03 requires Details to be the default tab. These are manual Node scripts (not part of the `vitest` suite; `tests/**/*.spec.ts` is outside `vitest.config.mts`'s `include` glob, which only picks up `*.test.{ts,tsx}`), so they do not run in CI and were not modified. Flagged here as a known follow-up: anyone running these scripts against the live site post-deploy should append `?tab=notation` to the target URLs, or the scripts should be updated in a future plan.
- Manual live-browser verification (plan `<verification>` items 3–6: click Notation tab, confirm URL update, hard-refresh persistence, unknown-tab-value fallback, visual metadata check) was not performed. This plan has no `checkpoint:human-verify` task (fully autonomous, Pattern A), and the VPS had only ~192Mi free RAM (`free -h`) at execution time with a live production PM2 process and Postgres container already running — starting a second `next dev` instance from this worktree risked resource contention on a 3.7GB/earlyoom-protected shared VPS. Automated coverage (10 passing unit tests exercising exactly this URL-sync/allowlist/content-branching behaviour, plus a clean `tsc --noEmit` and `eslint` pass) stands in as the verification evidence for this run, consistent with the EMAIL-02/FEED-02 precedent of recording an honest partial rather than a silent pass.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- TPAGE-03 is code-complete: `/tunes/[slug]` renders Details (default) and Notation tabs, `?tab=` state round-trips through `parseTab`'s allowlist, and the Notation tab composes the same `TuneScoreSection`/`TuneMiniBarSection` pair confirmed at parity by plan 16-02.
- Live-browser confirmation of the tab-switch/URL/scroll-preservation behaviour on the deployed site remains an open item (see Issues Encountered) — recommend a lightweight Playwright check via the shared `playwright-daemon` (http://localhost:3099) against `psalter.gsdlabs.dev` post-merge, once this worktree lands on `master` and the production process is redeployed.
- No blockers for closing out Phase 16.

---
*Phase: 16-tune-page-first-class-surface*
*Completed: 2026-08-15*
