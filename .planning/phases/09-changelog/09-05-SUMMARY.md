---
phase: 09-changelog
plan: 05
subsystem: ui
tags: [react, nextjs, better-auth, date-fns, vitest, testing-library]

# Dependency graph
requires:
  - phase: 09-changelog (Plan 01)
    provides: fetchPublishedPosts()/ChangelogPost from src/db/queries/changelog.ts
provides:
  - "/changelog public route (RSC): post list newest-first, empty state, admin composer slot, subscribe form"
  - "ChangelogPostCard: presentational post card, no accent stripe, date-fns formatted <time>, whitespace-pre-wrap body"
  - "ChangelogComposer: admin-only inline publish form, client-side visibility gate only (not a security boundary)"
  - "SubscribeForm: single-email-field subscribe form with unconditional success copy on any 2xx"
affects: [09-06, 09-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vite ?raw import suffix for source-scanning a component's own file text inside a jsdom-environment vitest test, avoiding node:fs (which Vite externalizes to a browser stub under @vitest-environment jsdom)"
    - "Plain vitest/chai assertions + within(container) scoped queries + explicit cleanup() in afterEach for component tests — this repo has no @testing-library/jest-dom installed and vitest.config.mts sets globals:false, so React Testing Library's automatic afterEach(cleanup) never registers"

key-files:
  created:
    - src/components/ChangelogPostCard.tsx
    - src/components/ChangelogPostCard.test.tsx
    - src/components/SubscribeForm.tsx
    - src/components/SubscribeForm.test.tsx
    - src/components/ChangelogComposer.tsx
    - src/components/ChangelogComposer.test.tsx
    - src/app/changelog/page.tsx
    - src/types/vite-raw.d.ts
  modified: []

key-decisions:
  - "SubscribeForm/ChangelogComposer client visibility gates are UX-only; ChangelogComposer's header comment states plainly that POST /api/changelog independently enforces getAdminSessionOr401() server-side (Plan 04) — the composer hides the form, it does not authorize the write"
  - "SubscribeForm's success branch is unconditional on any 2xx response so a duplicate-subscribe attempt renders byte-identical copy to a new subscribe, preventing a list-membership enumeration leak on a public form"

patterns-established:
  - "Component test files in this repo must avoid @testing-library/jest-dom matchers (toBeInTheDocument, toHaveAttribute, toBeDisabled) — not installed. Use plain DOM property checks (className, getAttribute, .disabled) and vitest's native matchers instead."

requirements-completed: [CHLG-01, CHLG-02, CHLG-04]

duration: 45min
completed: 2026-08-03
---

# Phase 09 Plan 05: Changelog page, admin composer, subscribe form Summary

**Public `/changelog` RSC route with newest-first post list, an admin-only inline composer that self-gates client-side (never a security boundary), and a single-field subscribe form whose success copy is identical for new and duplicate addresses.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-08-03T10:00:00Z (approx)
- **Completed:** 2026-08-03T10:39:24Z
- **Tasks:** 3 (2 TDD, 1 auto)
- **Files modified:** 8 created, 0 modified

## Accomplishments

- `/changelog` builds and serves — verified via a full `npm run build` (Turbopack), listed in the route table as `ƒ /changelog` (dynamic, matches `export const dynamic = 'force-dynamic'`)
- `ChangelogPostCard` + `SubscribeForm` shipped with 10 passing component tests (TDD RED confirmed before implementation)
- `ChangelogComposer` shipped with 9 passing component tests including a source-scan assertion that exactly one `role !== 'admin'` gated `return null` pair exists (no bypass branch)
- All 19 of this plan's tests green; `npx tsc --noEmit` clean for every file this plan touched; zero `dangerouslySetInnerHTML` in any Changelog component or the `/changelog` route

## Task Commits

Each task was committed atomically:

1. **Task 1: ChangelogPostCard + SubscribeForm (RED)** - `07a06e8` (test)
2. **Task 1: ChangelogPostCard + SubscribeForm (GREEN)** - `7e98bfe` (feat)
3. **Task 2: ChangelogComposer (RED)** - `29f1f03` (test)
4. **Task 2: ChangelogComposer (GREEN)** - `c907ca0` (feat)
5. **Task 3: /changelog page** - `d5826c2` (feat)

_TDD tasks 1 and 2 each produced a RED test commit followed by a GREEN implementation commit, per plan._

## Files Created/Modified

- `src/components/ChangelogPostCard.tsx` - Server-renderable post card: title, date-fns-formatted `<time dateTime=iso>`, `whitespace-pre-wrap` body, no accent stripe
- `src/components/ChangelogPostCard.test.tsx` - 4 tests: title text, `<time>` ISO+formatted text, pre-wrap body, no `border-l-primary`
- `src/components/SubscribeForm.tsx` - Single-email-field form; idle/loading/success/error/rate-limited states; unconditional success on any 2xx
- `src/components/SubscribeForm.test.tsx` - 6 tests: render, POST body, success-replaces-form, duplicate-identical-copy, 429+generic-error, in-flight disabled state
- `src/components/ChangelogComposer.tsx` - Admin-only inline composer; `isPending` branched before `data`; header comment documents the client gate is UX-only, not authorization
- `src/components/ChangelogComposer.test.tsx` - 9 tests: pending/anonymous/non-admin all render nothing, admin renders form, POST body, success clears fields + `router.refresh()` once, error copy + no refresh, in-flight disabled, source-scan for exactly one gated `return null` pair
- `src/app/changelog/page.tsx` - `force-dynamic` RSC: fetches posts, renders composer + list/empty-state + subscribe form, no server-side auth gate
- `src/types/vite-raw.d.ts` - Type declaration for Vite's `?raw` import suffix (needed for the composer test's tsc-clean source scan)

## Decisions Made

- Kept the plan's exact copy strings, class names, and component structure verbatim from the UI-SPEC-derived code blocks — no deviation from the provided implementation.
- No edit/delete affordance and no draft state in `ChangelogComposer`, per plan and UI-SPEC Notes item 2/3 — one button, one action.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test files rewritten to avoid `@testing-library/jest-dom` matchers**
- **Found during:** Task 1, first `npx vitest run` after writing `SubscribeForm.test.tsx`/`ChangelogPostCard.test.tsx` per the plan's suggested action text
- **Issue:** The plan's action text described driving assertions with `toBeInTheDocument()`/`findByText` via `screen`, but this repo has no `@testing-library/jest-dom` installed — those matchers threw `Invalid Chai property`. Additionally `vitest.config.mts` sets `globals: false`, so React Testing Library's automatic `afterEach(cleanup)` never registers, and `screen`-based queries accumulated matches across tests in the same file.
- **Fix:** Rewrote both test files to use plain vitest/chai assertions (`.not.toBeNull()`, `.getAttribute(...)`, `.disabled`) and `within(container)`-scoped queries with an explicit `afterEach(() => { cleanup(); vi.unstubAllGlobals() })`, matching the existing `StanzaList.test.tsx` container-scoped convention already established in this repo.
- **Files modified:** `src/components/ChangelogPostCard.test.tsx`, `src/components/SubscribeForm.test.tsx`, `src/components/ChangelogComposer.test.tsx`
- **Verification:** All 19 tests pass; `npx vitest run` confirms no cross-test contamination
- **Committed in:** `7e98bfe`, `c907ca0` (part of each task's GREEN commit)

**2. [Rule 1 - Bug] `ChangelogComposer.test.tsx` source-scan switched from `node:fs` to Vite's `?raw` import**
- **Found during:** Task 2, running `npx tsc --noEmit` after the GREEN implementation
- **Issue:** The plan's suggested `readFileSync(join(__dirname, ...))` approach failed at runtime under `@vitest-environment jsdom` — Vite externalizes `node:fs`/`node:path` to browser stubs for jsdom-environment test files, so `readFileSync is not a function` at test time, and separately `import { join } from 'node:path'` also failed the same way.
- **Fix:** Replaced with `import composerSource from './ChangelogComposer.tsx?raw'` (Vite's raw-text import), which reads the file's contents at build time without touching `fs`. Added `src/types/vite-raw.d.ts` declaring the `*?raw` module shape so `tsc --noEmit` type-checks it.
- **Files modified:** `src/components/ChangelogComposer.test.tsx`, `src/types/vite-raw.d.ts` (new)
- **Verification:** Test 9 (source-scan) passes; `npx tsc --noEmit` clean for both files
- **Committed in:** `29f1f03` (test file), `d5826c2` (type declaration, added alongside Task 3's tsc gate)

**3. [Rule 1 - Bug] `useSessionMock`'s inferred return type widened to a `MockSession` union**
- **Found during:** Task 2, same `npx tsc --noEmit` pass
- **Issue:** `vi.fn(() => ({ data: null, isPending: true }))`'s inferred generic locked `data` to the literal type `null`, so later `mockReturnValue({ data: { user: {...} }, isPending: false })` calls (admin/user fixtures) failed to type-check.
- **Fix:** Declared `type MockSession = { data: { user: { id: string; role: string } } | null; isPending: boolean }` and annotated the initial mock factory's return type, so `mockReturnValue` accepts both the anonymous and authenticated session shapes.
- **Files modified:** `src/components/ChangelogComposer.test.tsx`
- **Verification:** `npx tsc --noEmit` clean; all 9 composer tests still pass
- **Committed in:** `d5826c2`

---

**Total deviations:** 3 auto-fixed (all Rule 1 — mechanical test-tooling fixes discovered while running this plan's own `tsc`/`vitest` verification gates, no behavior change to shipped components)
**Impact on plan:** No scope creep — every fix is confined to test files (plus one new type declaration) required to make this plan's own acceptance criteria pass. No production component logic changed from what the plan specified.

## Issues Encountered

- **Worktree missing `.planning/phases/09-changelog/*.md` and `.env`.** This git worktree does not carry gitignored operational files (`.planning/phases/` and `.env` are both gitignored per this repo's convention). The plan file itself and the runtime `.env` (needed for `DATABASE_URL` during `npm run build`'s static-generation pass) were copied in from the main repo checkout at `/home/services/psalter/` before execution could proceed. This mirrors the identical gap already documented in `09-01-SUMMARY.md` and `09-03-SUMMARY.md`.
- **VPS memory contention during `npm run build`.** The shared 3.7GB VPS was running a concurrent `next build`/`npm ci` from another parallel wave-2 agent; the first two `npm run build` attempts were killed (exit 143, and a hung "Running TypeScript..." step) under memory pressure (swap at 5-6GB/8GB used, <350MB free). Waited for the competing process to finish, then retried successfully (exit 0, `/changelog` present in route table). No code change was needed — this was pure resource contention, consistent with the VPS memory-hygiene guidance in the global CLAUDE.md.
- **Pre-existing, unrelated test/typecheck failures confirmed out of scope.** `npx tsc --noEmit` shows the same 51 pre-existing `tests/e2e/*.spec.ts` duplicate-declaration errors documented in `09-01-SUMMARY.md`; `npx vitest run` (full suite) shows the same 14 pre-existing `src/app/api/precent/**` `headers() was called outside a request scope` failures plus a handful of DB-data-dependent test failures (`tests/tune-detail.test.ts`, `tests/tune-quality-phrase-count.test.ts`, `src/lib/abc-melisma.test.ts`, etc.). None touch this plan's files; confirmed via the failing-test-file list. Logged here, not fixed, per the executor's scope-boundary rule.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/changelog` is live-buildable and ready for Plan 06/07 (unsubscribe flow, homepage hero, broadcast email) to link into.
- `ChangelogComposer` and `SubscribeForm` both assume `/api/changelog` (Plan 04) and `/api/subscribe` (Plan 02) exist and honor the documented contracts — this plan did not re-verify those routes' server-side behavior, only that these client components call them correctly per the interfaces given.
- No blockers.

---
*Phase: 09-changelog*
*Completed: 2026-08-03*

## Self-Check: PASSED

All 5 created files verified present on disk (ChangelogPostCard.tsx, SubscribeForm.tsx, ChangelogComposer.tsx, src/app/changelog/page.tsx, src/types/vite-raw.d.ts) and all 5 task/deviation commit hashes (07a06e8, 7e98bfe, 29f1f03, c907ca0, d5826c2) verified present in `git log --oneline --all`.
