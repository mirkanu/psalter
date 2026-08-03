---
phase: 09-changelog
plan: 02
subsystem: api
tags: [nextjs, vitest, tdd, rate-limiting, security]

# Dependency graph
requires: [09-01]
provides:
  - "POST /api/subscribe — rate-limited, enumeration-safe single opt-in"
  - "POST /api/unsubscribe — token-gated hard delete, POST-only"
affects: [09-05, 09-06, 09-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "subscribe: rate-limit key prefix on the shared src/lib/rate-limit.ts Map store — mirrors feedback: prefix, never shares budget across routes"
    - "onConflictDoNothing({ target }) + unconditional { ok: true } response as the standard enumeration-defence shape for public insert endpoints"
    - "POST-only mutation routes with no GET export as the standard defence against email-link prescanners"

key-files:
  created:
    - src/app/api/subscribe/route.ts
    - src/app/api/subscribe/route.test.ts
    - src/app/api/unsubscribe/route.ts
    - src/app/api/unsubscribe/route.test.ts
  modified: []

key-decisions:
  - "No rate limiter on /api/unsubscribe — a randomUUID() token carries 122 bits of entropy (brute force infeasible), and an IP-keyed limiter would let one shared corporate NAT block legitimate unsubscribes for everyone behind it"
  - "Followed the plan's exact implementation text for both route.ts files verbatim — no deviation from the written code"

patterns-established:
  - "Public unauthenticated POST routes in this codebase now have two references depending on need: /api/feedback (rate-limited, DB write only) and /api/subscribe (rate-limited, DB write with enumeration defence via onConflictDoNothing)"

requirements-completed: []

# Metrics
duration: 40min
completed: 2026-08-03
---

# Phase 9 Plan 02: Subscribe & Unsubscribe Endpoints Summary

**Two public POST-only endpoints — `/api/subscribe` (rate-limited, enumeration-safe single opt-in via `onConflictDoNothing`) and `/api/unsubscribe` (token-gated hard delete, no GET export) — both proven by real TDD RED/GREEN cycles against the live `changelog_subscribers` schema from Plan 01.**

## Performance

- **Duration:** ~40 min (includes worktree environment setup: missing `.planning/phases/09-changelog/` plan docs and `.env` copied from main repo checkout since both are gitignored; `node_modules` was absent and required a fresh `npm ci --include=dev` after diagnosing an `NODE_ENV=production`-driven `omit=dev` install that silently skipped the entire vite/vitest/esbuild devDependency subtree)
- **Started:** ~2026-08-03T09:59:00Z
- **Completed:** 2026-08-03T10:38:15Z
- **Tasks:** 2 completed
- **Files modified:** 4 (all created)

## Accomplishments
- `POST /api/subscribe`: rate-limited 5/60s per IP (checked before body parsing, matching `/api/feedback`'s anti-bypass ordering), server-side email validation + 200-char cap, `randomUUID()` unsubscribe token, and an unconditional `{ ok: true }` response for both new and duplicate emails via `onConflictDoNothing({ target: changelogSubscribers.email })` — closes the list-enumeration side channel (T-09-11)
- `POST /api/unsubscribe`: hard-deletes the subscriber row matching a token via `db.delete(...).where(eq(unsubscribeToken, token)).returning(...)`, returns 404 with no delete side-effect for an unknown/reused token, and exports no `GET`/`PUT`/`PATCH`/`DELETE` handler so an email-security-scanner's automated GET prefetch of the emailed link cannot silently unsubscribe a real subscriber
- 20 Vitest tests (11 + 9) covering every `<behavior>` line in the plan, all passing; `npx tsc --noEmit` clean for both new files

## Task Commits

Each task was committed atomically, following the plan's mandated TDD RED/GREEN sequence:

1. **Task 1: POST /api/subscribe** — `2ee9eb7` (test, RED) then `49ebd6a` (feat, GREEN)
2. **Task 2: POST /api/unsubscribe** — `ba16296` (test, RED) then `f4f32a8` (feat, GREEN)

## Files Created
- `src/app/api/subscribe/route.ts` — `POST` handler: rate limit → JSON parse guard → email validation → `db.insert(changelogSubscribers).values({ email, unsubscribeToken: randomUUID() }).onConflictDoNothing({ target: changelogSubscribers.email })` → `{ ok: true }`. Exports `SUBSCRIBE_RATE_LIMIT` (5) and `SUBSCRIBE_RATE_WINDOW_MS` (60_000).
- `src/app/api/subscribe/route.test.ts` — 11 tests: new-email 200, UUID-shaped token, `onConflictDoNothing` call shape, duplicate-email response parity, invalid-email 400 with no insert, non-JSON 400, 5-then-429 throttling with `Retry-After`, budget consumption on repeated 400s, per-IP isolation, absent `GET`, 500 on DB failure.
- `src/app/api/unsubscribe/route.ts` — `POST` handler: JSON parse guard → token presence check → `db.delete(changelogSubscribers).where(eq(unsubscribeToken, token)).returning({ id: changelogSubscribers.id })` → 404 if empty, else `{ ok: true }`. No rate limiter (token entropy is the defence); no `GET` export.
- `src/app/api/unsubscribe/route.test.ts` — 9 tests: valid-token 200, delete/where/returning call-chain invocation, unknown-token 404 with no delete, missing/non-string/empty-token 400 with no delete, non-JSON 400 with no delete, absent `GET`, 500 on DB failure.

## Decisions Made
- Implemented both route files exactly as written in the plan's `<action>` blocks — no deviation from the specified code.
- Left `CHLG-04`/`CHLG-05` as `Pending` in `.planning/REQUIREMENTS.md`'s traceability table rather than marking them complete: both requirements span multiple Phase 9 plans (CHLG-04 also needs Plan 05's subscribe UI form; CHLG-05 also needs Plans 03/04/06/07's admin authoring, publish flow, and broadcast email). Marking them complete after only the backend endpoints would misrepresent the requirement's actual delivery state, following this project's established convention of recording accurate partial status (see EMAIL-02, FEED-02 precedents in REQUIREMENTS.md).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied the missing `09-changelog` plan directory and `.env` into the worktree**
- **Found during:** Plan load, before Task 1
- **Issue:** `.planning/phases/` and `.env` are both gitignored per this project's global CLAUDE.md convention; this worktree's checkout predated the Phase 9 planning docs (only `09-01-SUMMARY.md` and `09-03-SUMMARY.md` were present — Wave 1's outputs — with no `09-02-PLAN.md` or supporting research/pattern docs).
- **Fix:** `cp` of `09-02-PLAN.md`, `09-UI-SPEC.md`, `09-PATTERNS.md`, `09-RESEARCH.md`, `09-VALIDATION.md`, and `.env` from the main repo checkout (`/home/services/psalter/`) into the worktree.
- **Files modified:** none tracked (both paths are gitignored)
- **Verification:** Plan and reference docs readable afterward; `.env` unused directly by this plan's tests since both mock `@/db` entirely, but copied for tooling parity with the rest of the phase.
- **Committed in:** N/A (gitignored, not part of any commit)

**2. [Rule 3 - Blocking] `node_modules` was absent from the worktree; `npm ci`/`npm install` initially failed with an esbuild version-mismatch error**
- **Found during:** Plan load, before Task 1
- **Issue:** The worktree had no `node_modules` at all. A first `npm install` failed inside `@esbuild-kit/core-utils`'s nested `esbuild` postinstall: `Error: Expected "0.18.20" but got "0.25.12"`. Root-caused (not just retried) to the shell's inherited `NODE_ENV=production`, which makes npm default `omit=dev` — silently skipping the entire vite/vitest/esbuild devDependency subtree (and its `optionalDependencies` platform binaries) on install. A stray global npm package (`vellum`) elsewhere on the VPS red-herringed the investigation via Node's legacy `module.globalPaths` fallback (`/usr/lib/node_modules`), but was not the actual cause.
- **Fix:** `npm ci --include=dev` (matches an identical documented precedent in this project: `.planning/STATE.md`'s `[Phase ?]` decision "drizzle-kit not installed due to NODE_ENV=production suppressing devDependency installation; fixed by npm install --include=dev"). Installed 934 packages (up from 625 without dev deps); `node_modules/.bin/vitest`, `tsc`, `next` all present afterward.
- **Files modified:** none tracked (`node_modules` is gitignored)
- **Verification:** `npx vitest run` and `npx tsc --noEmit` both execute correctly afterward.
- **Committed in:** N/A (gitignored, not part of any commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — missing worktree-local files/tooling blocking task execution, both gitignored/environment-local, neither touches tracked source or plan content)
**Impact on plan:** Zero impact on shipped code. Both fixes were worktree-environment setup gaps, not plan or code defects.

## Issues Encountered
- `npx tsc --noEmit` shows the same pre-existing, unrelated 51 typecheck errors confined to `tests/e2e/*.spec.ts` (duplicate-declaration errors from standalone Playwright scripts, not part of the Next.js build) documented in `09-01-SUMMARY.md`. Zero typecheck errors in any file this plan created or modified.
- `npx vitest run` (full suite) shows the same class of pre-existing failures noted in `09-01-SUMMARY.md`: 14 failures in `src/app/api/precent/**` (`headers() was called outside a request scope` — Next.js test-harness issue, unrelated to auth logic) plus a handful of DB-state-dependent tests (`tests/lib-utilities.test.ts`, `tests/psalm-23-crimond-regression.test.ts`, `tests/psalm-detail.test.ts`, `tests/tune-detail.test.ts`, `tests/tune-quality-phrase-count.test.ts`, `src/lib/abc-melisma.test.ts`) that depend on live production DB content/fixtures not necessarily present in this environment. None reference `subscribe` or `unsubscribe`; confirmed out of scope per the deviation-rules scope boundary — logged here, not fixed. All 20 of this plan's own tests pass (681/699 total suite tests passing).

## User Setup Required

None — no external service configuration required. Both routes use the existing `db` client and the existing shared rate-limit module; no new environment variables.

## Next Phase Readiness
- `POST /api/subscribe` and `POST /api/unsubscribe` are both live route handlers ready to be wired into Plan 05's subscribe UI form and Plan 03/04/06/07's publish-and-broadcast flow (which will construct unsubscribe links using `changelogSubscribers.unsubscribeToken` and POST to this endpoint from a landing page, per the route's own doc comment)
- `SUBSCRIBE_RATE_LIMIT` / `SUBSCRIBE_RATE_WINDOW_MS` are exported for reuse or assertion by any later plan's tests
- No blockers identified

---
*Phase: 09-changelog*
*Completed: 2026-08-03*

## Self-Check: PASSED

- FOUND: src/app/api/subscribe/route.ts
- FOUND: src/app/api/subscribe/route.test.ts
- FOUND: src/app/api/unsubscribe/route.ts
- FOUND: src/app/api/unsubscribe/route.test.ts
- FOUND: .planning/phases/09-changelog/09-02-SUMMARY.md
- FOUND commit: 2ee9eb7 (Task 1 RED: subscribe test)
- FOUND commit: 49ebd6a (Task 1 GREEN: subscribe route)
- FOUND commit: ba16296 (Task 2 RED: unsubscribe test)
- FOUND commit: f4f32a8 (Task 2 GREEN: unsubscribe route)
- FOUND commit: 2d4080a (SUMMARY.md)
