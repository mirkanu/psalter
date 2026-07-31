---
phase: 08-feedback-email-rate-limiting
plan: 03
subsystem: api
tags: [nextjs, rate-limiting, email, resend, feedback, vitest]

# Dependency graph
requires:
  - phase: 08-feedback-email-rate-limiting (08-01)
    provides: "In-memory sliding-window rate limiter (checkRateLimit, getClientIp) in src/lib/rate-limit.ts"
  - phase: 08-feedback-email-rate-limiting (08-02)
    provides: "Fire-and-forget owner notification email (sendFeedbackNotification) in src/lib/feedback-email.ts"
provides:
  - "POST /api/feedback throttled to 5 requests/60s per IP, returning 429 + Retry-After"
  - "Every successful feedback submission fires exactly one owner notification email, non-blocking"
  - "FeedbackModal shows a distinct 'wait a minute' message on 429 instead of the generic error"
  - "Route-level test suite (14 tests) proving the fire-and-forget + throttle contract with @/db and @/lib/feedback-email mocked"
affects: [08-04-deployment-and-live-proof]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rate-limit check as the first statement of POST, before req.json() — flood and garbage-body requests both consume budget"
    - "vi.hoisted + vi.mock('@/db', ...) / vi.mock('@/lib/feedback-email', ...) pattern for route tests, avoiding DATABASE_URL and real network calls"
    - "void promise.catch(...) for fire-and-forget side effects in a long-lived next start process"

key-files:
  created:
    - src/app/api/feedback/route.test.ts
  modified:
    - src/app/api/feedback/route.ts
    - src/components/FeedbackModal.tsx

key-decisions:
  - "Typed notifyMock's input/output explicitly in the test file (NotifyInput/NotifyResult) rather than letting TS infer an empty tuple from the untyped async arrow — needed for tsc --noEmit to pass cleanly on the test file"

patterns-established:
  - "Route tests for unauthenticated write endpoints mock @/db and any outbound side-effect module, and exercise the real rate limiter (resetRateLimit() in beforeEach) to prove throttle + notification-count contracts without a live DB"

requirements-completed: [FEED-01, FEED-02]

# Metrics
duration: 11min
completed: 2026-07-31
---

# Phase 08 Plan 03: Wire Rate Limiting and Email Notification into /api/feedback Summary

**`/api/feedback` now throttles at 5 requests/60s/IP with a 429 + Retry-After, fires exactly one non-blocking owner-notification email per successful submission, and FeedbackModal shows a dedicated "wait a minute" message on 429 — all proven by a 14-test route suite with `@/db` and `@/lib/feedback-email` mocked.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-31T18:23:00Z
- **Completed:** 2026-07-31T18:34:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 new)

## Accomplishments

- `POST /api/feedback` checks `checkRateLimit('feedback:'+ip, {limit:5, windowMs:60_000})` as its first statement (before `req.json()`), returning 429 with `retryAfterSeconds` and a `Retry-After` header once exceeded
- After a successful `db.insert`, fires `void sendFeedbackNotification(...).catch(...)` — the visitor's response never waits on Resend, and the DB write is unaffected by mail failures (proven for both a rejected-`ok:false` resolution and a thrown error)
- `FeedbackModal` branches on `res.status === 429` before the generic `!res.ok` check, showing "You've sent several messages just now. Please wait a minute and try again." with no countdown/timer
- 14 new route tests cover: happy path, insert/notify call shapes, DB-fail-no-notify, notify-fail-still-200 (both resolve and reject paths), 5-then-429 throttling, Retry-After header correctness, per-IP isolation, and validation-failures-still-consume-budget

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing route tests** - `bc2adef` (test)
2. **Task 1 GREEN: rate-limit + notify wiring** - `4afad5d` (feat)
3. **Task 2: FeedbackModal 429 message** - `dfbbc08` (feat)

**Plan metadata:** committed separately by the worktree orchestrator after merge.

_Note: Task 1 used `tdd="true"` — RED then GREEN, no REFACTOR commit needed (implementation was already minimal)._

## Files Created/Modified

- `src/app/api/feedback/route.ts` - Added `getClientIp`/`checkRateLimit` gate before body parsing, `FEEDBACK_RATE_LIMIT`/`FEEDBACK_RATE_WINDOW_MS` exported constants, and a fire-and-forget `sendFeedbackNotification` call after a successful insert. All pre-existing validation logic and response bodies preserved verbatim.
- `src/app/api/feedback/route.test.ts` - New route test suite (14 tests), `@/db` and `@/lib/feedback-email` mocked via `vi.hoisted` + `vi.mock`, real `checkRateLimit`/`resetRateLimit` exercised.
- `src/components/FeedbackModal.tsx` - Widened `status` union to include `'rate-limited'`, added a 429 branch in `handleSubmit` before the generic error throw, added the corresponding message paragraph.

## Decisions Made

- Typed the mocked `sendFeedbackNotification` (`notifyMock`) input and return shape explicitly in the test file instead of relying on inference from an untyped async arrow — the plan's suggested inline mock (`vi.fn(async () => ({ ok: true, id: 'msg-1' }))`) type-checks fine at the mock-creation site but produces a `[]`-tuple parameter type for `.mock.calls[0][0]` and a return type too narrow for `mockImplementationOnce(async () => ({ ok: false, error: ... }))`. Adding local `NotifyInput`/`NotifyResult` types resolved both without changing runtime behavior. Rule 1 (bug fix) — required for `tsc --noEmit` acceptance criterion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Typed test mocks to satisfy `tsc --noEmit`**
- **Found during:** Task 1, after GREEN — acceptance criterion `npx tsc --noEmit ... | grep -c 'api/feedback'` returned 6 (not 0)
- **Issue:** The plan's literal `vi.fn(async () => ({ ok: true, id: 'msg-1' }))` mock produced a zero-arity inferred type, causing 6 TS errors: `.mock.calls[0][0]` indexing into an empty tuple, resulting `arg` treated as possibly-undefined on 4 assertions, and `mockImplementationOnce`'s `{ ok: false, error }` payload rejected against the inferred `{ ok: true, id: string }` return type
- **Fix:** Added local `NotifyInput`/`NotifyResult` type aliases in the test file and annotated `notifyMock`'s parameter and return type explicitly
- **Files modified:** `src/app/api/feedback/route.test.ts`
- **Verification:** `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -c 'api/feedback'` returns 0; all 14 tests still pass
- **Committed in:** `bc2adef` (Task 1 test commit — fixed before the RED run was finalized, so the committed test file is already type-clean)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type-only fix inside the new test file; no behavioral change, no scope creep.

## Issues Encountered

- **Full-suite `npx vitest run` shows 17 pre-existing failing test files (16 individual test failures) unrelated to this plan.** Root cause confirmed: this worktree has no `DATABASE_URL` set, and `src/db/queries/psalms.ts` throws at import time when it's unset (`tests/db-queries.test.ts` fails purely on that import). The same root cause cascades into `tests/auth/*`, `src/app/api/precent/*` (which the plan's own `discovered_facts` #2 notes hit a real DB), `tests/explore.test.ts`, `tests/search.test.ts`, `tests/daily-plan.test.ts`, `tests/psalm-detail.test.ts`, `tests/tune-detail.test.ts`. Two further failures in `src/lib/abc-melisma.test.ts` predate this plan (last touched by an unrelated 2026-07-15 commit, `53748e9`) and are unconnected to feedback/rate-limiting code. **This plan's own test file (`src/app/api/feedback/route.test.ts`, 14 tests) passes in full isolation** via `npx vitest run src/app/api/feedback/route.test.ts`. Per the executor's scope-boundary rule, these are out-of-scope, pre-existing, environment-caused failures and were not fixed here — they are unrelated to `src/app/api/feedback/route.ts`, `route.test.ts`, or `FeedbackModal.tsx`.
- **`npm run build` compiles successfully (Turbopack build + `tsc` both pass) but fails during Next's page-data-collection step**, also because `DATABASE_URL` is unset in this worktree (`src/lib/auth.ts` throws at module evaluation when collecting `/api/dev/asset` page data). This is the same environment limitation as above, not a defect in the three files this plan touched — TypeScript compilation of the route module itself succeeded ("Finished TypeScript" with no errors reported for `api/feedback`).

## User Setup Required

None - no external service configuration required. `DATABASE_URL` is expected to be present in the deployed environment (it already is in production per Phase 1); its absence here is a worktree-testing artifact, not a new requirement introduced by this plan.

## Next Phase Readiness

- FEED-01 and FEED-02 are now live in the codebase: rate limiting and owner notification are wired into the running endpoint, with all three phase success criteria (single notification per success, 200 regardless of mail outcome, 6th-request throttling) proven by automated tests.
- Ready for Plan 04 (deployment and live proof) — no code blockers. Plan 04 should re-run the full `npx vitest run` and `npm run build` against an environment with `DATABASE_URL` set (production or a properly configured CI/dev DB) to get a clean full-suite/build signal, since this worktree could not provide one.

---
*Phase: 08-feedback-email-rate-limiting*
*Completed: 2026-07-31*
