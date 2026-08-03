---
phase: 09-changelog
plan: 04
subsystem: api
tags: [nextjs, drizzle, admin-auth, email-broadcast, vitest, tdd]

# Dependency graph
requires:
  - phase: 09-changelog
    provides: "changelogPosts/changelogSubscribers schema (Plan 01) and buildChangelogEmail/sendChangelogBroadcastEmail (Plan 03)"
provides:
  - "POST /api/changelog — the server-side security boundary for publishing (CHLG-02)"
  - "broadcastToSubscribers() — sequential, failure-tolerant subscriber fan-out (CHLG-05)"
affects: ["09-05 (ChangelogComposer client component, calls this route)", "09-changelog phase verification"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin-gate-first idiom: getAdminSessionOr401() as the literal first statement, before any db call — copied from src/app/api/dev/tune-feedback/route.ts"
    - "Insert-then-detached-side-effect: await the DB write, respond, then `void sideEffect().catch(...)` — copied from src/app/api/feedback/route.ts"
    - "Sequential for...of broadcast loop with recipient list sourced exclusively from the DB, never request input"

key-files:
  created:
    - src/lib/changelog-broadcast.ts
    - src/lib/changelog-broadcast.test.ts
    - src/app/api/changelog/route.ts
    - src/app/api/changelog/route.test.ts
  modified: []

key-decisions:
  - "Reworded a docstring comment in changelog-broadcast.ts to remove the literal substring 'Promise.all' — the plan's own suggested comment text failed its own acceptance-criteria grep check"

patterns-established:
  - "Broadcast fan-out lives in its own lib module (not inline in the route) so it is directly awaitable and testable without timing hacks, even though the route fires it detached"

requirements-completed: [CHLG-02, CHLG-05]

# Metrics
duration: 13min
completed: 2026-08-03
---

# Phase 09 Plan 04: Changelog Publish Endpoint + Subscriber Broadcast Summary

**`POST /api/changelog` admin-gated publish route plus a sequential, failure-tolerant `broadcastToSubscribers()` fan-out that emails every subscriber their own unsubscribe link without ever using `Promise.all`.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-03T10:00:00Z (approx.)
- **Completed:** 2026-08-03T10:13:17Z
- **Tasks:** 2 (both TDD: RED → GREEN)
- **Files modified:** 4 created, 0 modified

## Accomplishments
- `broadcastToSubscribers()` sends one personalised email per subscriber strictly sequentially (250ms pause between sends), reading recipients only from `changelog_subscribers` — never from the caller's `post` argument
- A failing or throwing send for one subscriber never stops the remaining subscribers; the function returns `{ sent, failed }` and never throws, even when the subscriber `SELECT` itself throws
- `POST /api/changelog` rejects unauthenticated (401) and non-admin (403) requests before touching the database, validates and trims `title`/`body` (`MAX_TITLE=200`, `MAX_BODY=20000`), inserts exactly one row, and fires the broadcast detached so a mail outage never turns a successful publish into an error response
- 22 new tests (9 broadcast + 13 route), all green

## Task Commits

Each task was committed atomically (TDD RED/GREEN pairs):

1. **Task 1: Sequential, failure-tolerant subscriber broadcast**
   - `307fb03` test(09-04): add failing tests for changelog subscriber broadcast (RED)
   - `871c44a` feat(09-04): implement sequential subscriber broadcast (GREEN)
2. **Task 2: POST /api/changelog — admin gate, validated insert, detached broadcast**
   - `c57c92b` test(09-04): add failing tests for POST /api/changelog (RED)
   - `6f113d5` feat(09-04): implement POST /api/changelog publish endpoint (GREEN)

_No REFACTOR commits needed — both implementations matched the plan's drafted code with one inline comment fix (see Deviations)._

## Files Created/Modified
- `src/lib/changelog-broadcast.ts` — `broadcastToSubscribers()`, `BROADCAST_SEND_INTERVAL_MS`; sequential `for...of` loop over `db.select().from(changelogSubscribers)`, calling `sendChangelogBroadcastEmail` once per subscriber
- `src/lib/changelog-broadcast.test.ts` — 9 tests: call count, per-subscriber isolation, unchanged title/body, strict sequential ordering (start/end interleave proof), `ok:false` tolerance, thrown-send tolerance, zero-subscriber case, SELECT-throw resilience, recipient-source lockdown
- `src/app/api/changelog/route.ts` — `POST`, `MAX_TITLE`, `MAX_BODY`; admin gate first, JSON parse guard, title/body validation, insert, detached broadcast trigger, `{ ok: true }` response
- `src/app/api/changelog/route.test.ts` — 13 tests: 401/403 short-circuit, 200 success shape, trimmed insert values, broadcast trigger with correct payload, blank/oversized title+body 400s, non-JSON 400, insert-failure 500 with no broadcast, broadcast-rejection still 200, no `GET` export

## Decisions Made
- Kept the plan's architecture exactly as specified — broadcast logic in its own module (`src/lib/changelog-broadcast.ts`) rather than inline in the route, per the plan's own documented deviation-from-PATTERNS.md rationale (directly awaitable/testable without timing hacks).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed self-contradicting acceptance criteria in changelog-broadcast.ts's own docstring**
- **Found during:** Task 1 (Sequential, failure-tolerant subscriber broadcast)
- **Issue:** The plan's own suggested code for `changelog-broadcast.ts` includes a docstring comment reading "NEVER use Promise.all here" — but the plan's own acceptance criteria requires `grep -c "Promise.all\|Promise.allSettled" src/lib/changelog-broadcast.ts` to return `0`. The literal substring in the warning comment caused the grep to match, failing the plan's own gate.
- **Fix:** Reworded the comment to "Do NOT fan these sends out concurrently" — same warning intent, no literal `Promise.all` substring.
- **Files modified:** `src/lib/changelog-broadcast.ts`
- **Verification:** `grep -c "Promise.all\|Promise.allSettled" src/lib/changelog-broadcast.ts` now returns `0`; all 9 tests still pass.
- **Committed in:** `871c44a` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in the plan's own example/acceptance-criteria pairing)
**Impact on plan:** Cosmetic — a one-line comment reword. No behavioral change, no scope creep.

## Issues Encountered
- This worktree agent's branch (`worktree-agent-a6b2dd6ad5b35f436`) was based on an older ancestor commit that predated Wave 1's merge. `git reset --hard 12b815fb...` (the base commit specified in the worktree branch check) corrected this and brought in Wave 1's schema/email-builder work needed by this plan.
- `.planning/phases/09-changelog/` is gitignored per project convention (only `SUMMARY.md` force-added); the plan file itself (`09-04-PLAN.md`) was present in the main repo checkout but not copied into this worktree — read directly from `/home/services/psalter/.planning/phases/09-changelog/09-04-PLAN.md` instead.
- `npx tsc --noEmit` reports pre-existing type errors in unrelated Playwright e2e spec files (`tests/e2e/*.spec.ts`, `tests/precent-*.spec.ts`, `tests/tune-notation.spec.ts`) — none reference this plan's files. Logged to `deferred-items.md`, not fixed (out of scope).
- Full `npx vitest run` (all suites) shows 18 pre-existing failing test files / 16 failing tests unrelated to this plan (mostly `DATABASE_URL environment variable is not set` in this worktree's test env, plus unrelated `abc-melisma.test.ts` regressions). This plan's two owned suites are 22/22 green. Logged to `deferred-items.md`.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- `POST /api/changelog` and `broadcastToSubscribers()` are ready for Plan 05's `ChangelogComposer` client component to call.
- Plan 09-06/09-07 (or wherever `/changelog` page + subscribe/unsubscribe routes land) can rely on this route as the sole write path for publishing.
- No blockers. The pre-existing `tsc`/full-suite failures noted above are unrelated infrastructure issues that predate this plan and should be triaged separately from Phase 09.

---
*Phase: 09-changelog*
*Completed: 2026-08-03*
