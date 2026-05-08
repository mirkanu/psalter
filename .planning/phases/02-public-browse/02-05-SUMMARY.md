---
phase: 02-public-browse
plan: 05
subsystem: ui
tags: [nextjs, react, daily-plan, homepage, static-rendering, tailwind, vitest]

# Dependency graph
requires:
  - phase: 02-01
    provides: fetchAllDailyReadings, fetchDailyReading query functions, dailyReadings schema with psalm relation
  - phase: 02-02
    provides: getDayOfYear utility function (lib/daily.ts)
provides:
  - Homepage / with TodayCard (client today-detection) + PsalmSearchWidget (psalm number nav)
  - /daily — 365-row static reading list with DailyPlanClient scroll-to-today side-effect
  - /daily/[day] — SSG individual day pages (365 static paths), notFound() for out-of-range
  - DailyPlanClient — single source of truth for today detection on /daily
  - 7 integration tests for daily plan queries (tests/daily-plan.test.ts)
affects: [02-06, phase-03-search, phase-05-precentor]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client today-detection: TodayCard uses useState+useEffect to run getDayOfYear on mount, avoiding static render mismatch"
    - "DailyPlanClient side-effect pattern: 'use client' component returns null, DOM mutation runs in useEffect only"
    - "data-[today]: Tailwind selector: empty-string attribute set by DailyPlanClient triggers CSS via data-[today]:bg-muted etc."
    - "today-badge reveal: hidden class removed by DailyPlanClient querySelector rather than React state to avoid hydration complexity"
    - "Slim serialization: RSC slims full DB results to minimal shape before passing as props to client components"

key-files:
  created:
    - src/app/page.tsx (replaced scaffold)
    - src/components/TodayCard.tsx
    - src/components/PsalmSearchWidget.tsx
    - src/app/daily/page.tsx
    - src/app/daily/[day]/page.tsx
    - src/components/DailyPlanClient.tsx
    - tests/daily-plan.test.ts
  modified: []

key-decisions:
  - "TodayCard is 'use client': today detection must run on mount to avoid static-render mismatch between build-time day and real day"
  - "DailyPlanClient reveals today-badge by removing 'hidden' class (DOM mutation), not React state — avoids hydration race and keeps /daily fully static"
  - "dailyReadings.dayNumber is nullable in schema — RSC page.tsx filters null entries before passing to TodayCard"
  - "data-[today]: Tailwind selector (empty-string attribute) used for today row highlighting — no inline style or script needed"

patterns-established:
  - "Client mount pattern: useState(null) initial + useEffect(() => setState(compute())) for values that differ between server and client"
  - "DailyPlanClient null-render pattern: pure side-effect component, returns null, safe to place above h1 in RSC"

requirements-completed: [PLAN-01, PSALM-06]

# Metrics
duration: 15min
completed: 2026-05-08
---

# Phase 02 Plan 05: Homepage + Daily Plan Summary

**Homepage devotional dashboard (TodayCard + PsalmSearchWidget) and statically pre-rendered /daily list (365 rows, scroll-to-today) plus /daily/[day] detail pages via generateStaticParams**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-08T07:10:00Z
- **Completed:** 2026-05-08T07:25:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Homepage replaces Next.js scaffold with two-column devotional dashboard (lg:grid-cols-2)
- TodayCard hydrates on mount to show correct day without breaking static pre-render
- /daily renders all 365 readings as pure static HTML; DailyPlanClient handles scroll + badge reveal post-hydration
- /daily/[day] generates 365 static paths at build time; invalid day numbers return 404
- 7 integration tests confirm DB data integrity: 365 entries, sorted, all with psalms, edge cases

## Task Commits

1. **Task 1: Homepage with TodayCard + PsalmSearchWidget** - `2c87f0a` (feat)
2. **Task 2 (RED): Daily plan integration tests** - `3b4e86f` (test)
3. **Task 2 (GREEN): /daily + /daily/[day] + DailyPlanClient** - `8f6a1f8` (feat)

## Files Created/Modified

- `src/app/page.tsx` — Replaced scaffold; RSC fetches all readings, slims to {dayNumber, psalmId, psalm}, renders two-column grid
- `src/components/TodayCard.tsx` — Client component; useState(null) initial + useEffect getDayOfYear() on mount; shows "Today's Reading", "Day N of 365", "Read Psalm N" link
- `src/components/PsalmSearchWidget.tsx` — Client component; number input 1-150 + Search icon button; router.push("/psalms/N") on submit
- `src/app/daily/page.tsx` — RSC list of 365 readings; DailyPlanClient rendered first; each `<li>` has data-day=N; today-badge hidden by default
- `src/app/daily/[day]/page.tsx` — RSC; generateStaticParams 1..365; notFound() for out-of-range or missing DB entry
- `src/components/DailyPlanClient.tsx` — Client null-render; useEffect: getDayOfYear() → setAttribute("data-today","") → remove "hidden" from .today-badge → scrollIntoView
- `tests/daily-plan.test.ts` — 7 vitest integration tests for daily plan DB queries

## Decisions Made

- **TodayCard as 'use client':** Server can't know the current day without making the page dynamic. useState(null) initial state prevents hydration mismatch; useEffect sets real day on mount.
- **DailyPlanClient DOM mutation (not React state):** Badge reveal and scroll are one-shot side effects. Using direct DOM mutation avoids adding client state to an otherwise-static page.
- **dailyReadings.dayNumber nullable filter:** Schema column has no `.notNull()` so TypeScript infers `number | null`. RSC filters these before passing to TodayCard's typed prop interface.
- **data-[today]: Tailwind attribute selector:** Setting an empty-string data attribute allows Tailwind `data-[today]:bg-muted` to trigger without any inline style manipulation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error: dailyReadings.dayNumber is nullable**
- **Found during:** Task 1 (homepage page.tsx)
- **Issue:** Schema defines `dayNumber: integer('day_number')` without `.notNull()`, so TypeScript infers `number | null`. The slim mapping produced `{ dayNumber: number | null }[]` which was incompatible with TodayCard's `ReadingProp` requiring `dayNumber: number`.
- **Fix:** Added `.filter((r): r is typeof r & { dayNumber: number } => r.dayNumber !== null)` before the `.map()` in page.tsx
- **Files modified:** src/app/page.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 2c87f0a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 type bug)
**Impact on plan:** Minimal — schema nullability not documented in plan's interface spec. Fix is correct and safe.

## Issues Encountered

- TDD RED phase: All 7 tests passed immediately (no failing RED state). This is expected — the DB queries were implemented in 02-01 and the tests validate existing DB data. The tests are integration tests, not unit tests of new code. Documented as noted behavior, proceeded to GREEN.

## Threat Mitigations Applied

| Threat | Mitigation | Verified |
|--------|-----------|----------|
| T-02-17 URL param spoofing | generateStaticParams limits to 1..365; explicit `dayNumber < 1 \|\| dayNumber > 365` check + notFound() | Build log shows ● /daily/[day] only |
| T-02-18 PsalmSearchWidget input tampering | Number coercion + range check `n >= 1 && n <= 150` before router.push; no-op for invalid | Code review |
| T-02-19 XSS on /daily | All today-detection in DailyPlanClient useEffect; no dangerouslySetInnerHTML; no user input in DOM | grep confirms |

## Stub Scan

No stubs found. All data flows from real DB queries:
- TodayCard receives real 365-reading list from fetchAllDailyReadings
- /daily renders real psalm titles/IDs from DB
- /daily/[day] fetches real reading from DB

## Next Phase Readiness

- All three new routes are live and static
- /daily and /daily/[day] complete PLAN-01 requirement
- / + /daily/[day] static pre-rendering satisfies PSALM-06
- SiteHeader "Daily Plan" link now resolves correctly
- Ready for Phase 2 Plan 06 (remaining plans) or Phase 3 (Search)

---
*Phase: 02-public-browse*
*Completed: 2026-05-08*
