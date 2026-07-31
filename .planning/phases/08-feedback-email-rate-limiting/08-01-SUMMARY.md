---
phase: 08-feedback-email-rate-limiting
plan: 01
subsystem: infra
tags: [rate-limiting, security, vitest, tdd, in-memory]

requires: []
provides:
  - "checkRateLimit(key, { limit, windowMs, now? }) — bounded, dependency-free sliding-window rate limiter"
  - "getClientIp(req) — trusted-proxy header extraction with a safe fallback to UNKNOWN_CLIENT_IP"
affects: [08-feedback-email-rate-limiting]

tech-stack:
  added: []
  patterns:
    - "Module-scope Map<string, number[]> as the single in-process rate-limit store (single pm2 fork_mode process, no Redis)"
    - "Injected `now` clock parameter for deterministic, sleep-free vitest tests"

key-files:
  created:
    - src/lib/rate-limit.ts
    - src/lib/rate-limit.test.ts
  modified: []

key-decisions:
  - "In-process Map is the correct store — app runs as a single pm2 fork_mode process (next start), no Redis/Upstash/ioredis added"
  - "Rejected requests are never appended to the hit log, so a throttled client always recovers exactly windowMs after its last accepted request (prevents indefinite lockout of a shared NAT/CGNAT address)"
  - "getClientIp validates candidates against a length-capped (45 char) character-class regex rather than full IPv4/IPv6 semantics — sufficient for a safe Map key and avoids collapsing real clients into the 'unknown' bucket"
  - "CR/LF header-injection test constructs a duck-typed headers object (not a real Request) because Node's own Headers/Request implementation already rejects raw CR/LF at construction time — verified getClientIp's own regex guard independently of that runtime behavior"

patterns-established:
  - "Pure rate-limit module colocated with its test, following src/lib/inline-staff-gating.ts (JSDoc header, named exports) and src/lib/email.test.ts (vitest globals:false, explicit imports) house style"

requirements-completed: [FEED-02]

duration: 6min
completed: 2026-07-31
---

# Phase 08 Plan 01: Rate Limiting Primitive Summary

**Dependency-free, in-memory sliding-window rate limiter (`checkRateLimit`) plus a hardened `getClientIp` extractor, both fully unit-tested with an injected clock — no route wired yet.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-31T18:14:00Z
- **Completed:** 2026-07-31T18:20:38Z
- **Tasks:** 2 completed
- **Files modified:** 2 (both created)

## Accomplishments
- `checkRateLimit(key, options)` enforces an N-per-`windowMs` sliding-window limit per key, with a deterministic injectable `now` clock, bounded store (`MAX_TRACKED_KEYS = 10_000` with expired-key sweep + fail-open clear), and a `retryAfterSeconds` that is never 0
- `getClientIp(req)` turns a `Request` into a bounded, log-safe client-IP string via `x-forwarded-for` → `x-real-ip` → `UNKNOWN_CLIENT_IP`, with a length-capped character-class validator preventing garbage/forged values from poisoning the store
- 23 unit tests, all passing, zero real timers/sleeps
- No new runtime dependency added (`redis`/`ioredis`/`@upstash` all absent from `package.json`)

## Task Commits

Each task followed the TDD RED → GREEN cycle:

1. **Task 1: Sliding-window checkRateLimit with a bounded store**
   - `ef930e4` test(08-01): add failing tests for sliding-window rate limiter (RED)
   - `e5ac81e` feat(08-01): implement bounded sliding-window rate limiter (GREEN)
2. **Task 2: getClientIp — trusted-proxy header extraction with a safe fallback**
   - `c66fc96` test(08-01): add failing tests for getClientIp header extraction (RED)
   - `5c882c1` feat(08-01): implement getClientIp trusted-proxy header extraction (GREEN)

## Files Created/Modified
- `src/lib/rate-limit.ts` - `checkRateLimit`, `resetRateLimit`, `trackedKeyCount`, `MAX_TRACKED_KEYS`, `getClientIp`, `UNKNOWN_CLIENT_IP`
- `src/lib/rate-limit.test.ts` - 23 deterministic tests covering both exports

## Decisions Made
- See `key-decisions` in frontmatter above. All followed the plan's `<action>` rules exactly; no architectural deviation from what was specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/environment mismatch] CR/LF injection test adapted to a duck-typed headers object**
- **Found during:** Task 2 (getClientIp tests)
- **Issue:** The plan's behavior spec calls for a test where `x-forwarded-for: '1.2.3.4\r\nX-Injected: 1'` is passed through a real `new Request(...)`. Node's actual `Headers`/`Request` implementation throws `TypeError: Headers.append: ... is an invalid header value` at construction time — a genuine `Request` can never carry a raw CR/LF header value in this runtime, so the test as literally written could never reach `getClientIp` at all.
- **Fix:** Rewrote that one test to pass a minimal object matching `{ headers: { get(name) } }` (cast as `Request`), exercising `getClientIp`'s own `IP_LIKE` regex guard directly and independently of the runtime's own (also-correct) rejection. All other `getClientIp` tests use a real `Request` unchanged.
- **Files modified:** src/lib/rate-limit.test.ts
- **Verification:** Test passes; `getClientIp` still returns `UNKNOWN_CLIENT_IP` for the injected value.
- **Committed in:** c66fc96 (Task 2 RED commit)

---

**Total deviations:** 1 auto-fixed (1 bug/test-environment adaptation)
**Impact on plan:** No scope creep — the underlying guard (regex validation in `getClientIp`) is exactly as specified; only the test's construction mechanism changed because the literal construction described in the plan is impossible in Node's Fetch API implementation.

## Issues Encountered
- Full `npx vitest run` (whole-repo suite) shows 17 pre-existing failing test files (DB-query tests requiring live Postgres connectivity, auth tests, and one unrelated `abc-melisma.test.ts` assertion) — all unrelated to this plan's files and present before this plan's changes (this isolated worktree has no DB connection). Confirmed out of scope per the executor's scope-boundary rule; not touched. `src/lib/rate-limit.test.ts` itself is 23/23 green in both isolated and full-suite runs.

## User Setup Required

None - no external service configuration required. This plan added no runtime dependency and touched no route.

## Next Phase Readiness
- `checkRateLimit` and `getClientIp` are ready to be imported and wired into `/api/feedback` by a later plan in this phase (per the plan's stated scope: "No route is touched and no runtime behaviour changes in this plan").
- No blockers.

---
*Phase: 08-feedback-email-rate-limiting*
*Completed: 2026-07-31*

## Self-Check: PASSED

- FOUND: src/lib/rate-limit.ts
- FOUND: src/lib/rate-limit.test.ts
- FOUND: .planning/phases/08-feedback-email-rate-limiting/08-01-SUMMARY.md
- FOUND commit: ef930e4 (test RED, Task 1)
- FOUND commit: e5ac81e (feat GREEN, Task 1)
- FOUND commit: c66fc96 (test RED, Task 2)
- FOUND commit: 5c882c1 (feat GREEN, Task 2)
