---
phase: 06-security-data-safety-prerequisites
plan: 02
subsystem: auth
tags: [nextjs, admin-auth, defence-in-depth, regression-sweep, bash]

# Dependency graph
requires: ["06-01: getAdminSessionOr401() helper, middleware relocation"]
provides:
  - "Per-route admin guard on all 8 /api/dev/* route files (11 handlers)"
  - "Server-side admin gate on all 4 previously-unprotected /dev pages"
  - "scripts/verify-dev-surface-locked.sh — 12-surface anonymous-access regression sweep, re-runnable via npm run verify:dev-locked"
affects: [security-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getAdminSessionOr401() called as the first statement of every /api/dev/* handler, destructured as authRes to avoid colliding with existing local res/result identifiers"
    - "Page-level admin gate (auth.api.getSession + redirect('/login')) copied verbatim from src/app/dev/accounts/page.tsx into all 4 previously-unprotected /dev pages, placed before any DB query or filesystem read"
    - "Bash regression sweep with a FAILURES counter (no set -e) so every surface is probed and reported, not aborted on first failure"

key-files:
  created:
    - scripts/verify-dev-surface-locked.sh
  modified:
    - src/app/api/dev/asset/route.ts
    - src/app/api/dev/melisma-decision/route.ts
    - src/app/api/dev/melisma-save/route.ts
    - src/app/api/dev/sketch/route.ts
    - src/app/api/dev/test-ocr/route.ts
    - src/app/api/dev/tune-feedback/route.ts
    - src/app/api/dev/tune-feedback/all/route.ts
    - src/app/api/dev/tune-ocr-result/route.ts
    - src/app/dev/page.tsx
    - src/app/dev/melisma-editor/page.tsx
    - src/app/dev/musicxml-preview/page.tsx
    - src/app/dev/notation-compare/page.tsx
    - package.json

key-decisions:
  - "Destructured guard result as authRes (not res) in every route handler, per the plan's explicit naming rule, to avoid shadowing existing local res/result variables"
  - "Verification build ran on port 3013, not the plan's suggested 3006 — 3006 was occupied by an unrelated long-running Docker container (docker-proxy, since Jul 14) on this shared VPS, unrelated to any GSD worktree. Live PM2 psalter service on port 3005 confirmed untouched (200 OK) throughout."

patterns-established:
  - "Every /dev/* admin surface now has both a middleware-level check (Plan 01) AND a per-route/per-page check (this plan) — no single point of failure for the admin perimeter"

requirements-completed: [SEC-01]

# Metrics
duration: 35min
completed: 2026-07-30
---

# Phase 06 Plan 02: Per-Route Admin Auth & Regression Sweep Summary

**Added getAdminSessionOr401() as the first statement in all 11 exported /api/dev/* handlers and the accounts-page admin gate to all 4 unprotected /dev pages, then proved both hold independently of middleware via a 15-assertion regression sweep run twice — once normally, once with src/middleware.ts renamed away.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-30T07:22:00Z
- **Completed:** 2026-07-30T07:57:00Z
- **Tasks:** 3 completed
- **Files modified:** 13 (12 modified, 1 created)

## Accomplishments

- Closed the single-point-of-failure risk flagged by Plan 01: every one of the 8 `/api/dev/*` route files (11 exported handlers across GET/POST) now rejects anonymous callers with 401 even if `src/middleware.ts` is misconfigured, edited, or removed entirely
- Added the exact admin gate from `src/app/dev/accounts/page.tsx` to all 4 previously-unprotected `/dev` pages (`/dev`, `/dev/melisma-editor`, `/dev/musicxml-preview`, `/dev/notation-compare`), placed before any DB query or filesystem read
- Converted `src/app/dev/page.tsx` from a synchronous to an async component so the session check could be awaited
- Built `scripts/verify-dev-surface-locked.sh`, a re-runnable 15-assertion sweep (12 surfaces + `/robots.txt` + 2 public control routes) with a `FAILURES` counter that reports every failure rather than aborting on the first
- Ran the sweep twice against a local production build on port 3013: once normally (15/15 pass), once with `src/middleware.ts` renamed to `.bak` (still 15/15 pass) — the negative control proving Tasks 1+2's guards are genuinely independent of the middleware layer, not just redundant with it
- Confirmed the live PM2 `psalter` service on port 3005 stayed `online` and returned 200 throughout both build/verify cycles; it was never restarted or stopped

## Task Commits

Each task was committed atomically:

1. **Task 1: Guard all 8 /api/dev/* routes with getAdminSessionOr401()** - `c983814`
2. **Task 2: Add server-side admin gate to the 4 unprotected /dev pages** - `bfb14b8`
3. **Task 3: Add and run the 12-surface anonymous-access regression sweep** - `74f90d1`

**Plan metadata:** committed separately per worktree convention (SUMMARY.md only; STATE.md/ROADMAP.md owned by orchestrator)

## Files Created/Modified

- `src/app/api/dev/asset/route.ts` - GET guarded before the `readFile` call
- `src/app/api/dev/melisma-decision/route.ts` - GET and POST both guarded; `runtime`/`dynamic` consts preserved
- `src/app/api/dev/melisma-save/route.ts` - POST guarded before body parsing; `runtime`/`dynamic` consts preserved
- `src/app/api/dev/sketch/route.ts` - GET guarded before the `readFile` call
- `src/app/api/dev/test-ocr/route.ts` - GET guarded before any `execSync` path (highest-severity item per threat register T-06-12)
- `src/app/api/dev/tune-feedback/route.ts` - GET and POST both guarded
- `src/app/api/dev/tune-feedback/all/route.ts` - GET guarded (closes the confirmed-live information-disclosure hole, T-06-13)
- `src/app/api/dev/tune-ocr-result/route.ts` - GET and POST both guarded
- `src/app/dev/page.tsx` - Converted sync → async; gate added before rendering `<SketchViewer />`
- `src/app/dev/melisma-editor/page.tsx` - Gate added before the heavy Drizzle queries and `node:fs` reads in `loadTunes()`
- `src/app/dev/musicxml-preview/page.tsx` - Gate added before the `readFileSync` call
- `src/app/dev/notation-compare/page.tsx` - Gate added before the `db.select()` call
- `scripts/verify-dev-surface-locked.sh` - New 103-line regression sweep script
- `package.json` - Added `"verify:dev-locked": "bash scripts/verify-dev-surface-locked.sh"`

## Decisions Made

- Used `authRes` (not `res`) as the destructured guard variable name in every handler, per the plan's explicit instruction, since several handlers already use local `res`/`result` identifiers
- Verified locally on port 3013 instead of the plan's suggested 3006, because 3006 was bound by an unrelated Docker container (`docker-proxy`, running since Jul 14, unrelated to any GSD worktree) on this shared VPS — not a conflict with a sibling executor this time, just a pre-existing service. Confirmed via `ss -tlnp` before choosing the port.
- Copied `.env` from the main repo checkout (gitignored, not committed) into this worktree to unblock `next build`'s data-collection step, consistent with Plan 01's precedent — no schema or data changes were made

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria for all 3 tasks were met on the first attempt with no auto-fixes required.

## Issues Encountered

- Port 3006 (plan's suggested default) was occupied by an unrelated Docker container's proxy, not a sibling worktree this time. Used port 3013 instead (same port Plan 01 used for the same reason), with no impact on the live 3005 service.
- The initial attempt to start the negative-control server hit `EADDRINUSE` on port 3013 because the first verification server (from the normal-mode sweep) was still running in a separate backgrounded shell invocation whose job-table entry didn't carry over between tool calls. Diagnosed via `ss -tlnp` and killed the stale PID before restarting — no code or script changes required.

## Known Stubs

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Both layers of the admin perimeter (Plan 01's middleware, Plan 02's per-route/per-page guards) are now independently verified in place for all 12 previously-unprotected surfaces
- `scripts/verify-dev-surface-locked.sh` / `npm run verify:dev-locked` is available for any future refactor to re-verify this property without manual curl probing
- No blockers for Plan 03 or subsequent Phase 06 work

---
*Phase: 06-security-data-safety-prerequisites*
*Completed: 2026-07-30*

## Self-Check: PASSED

All 13 created/modified files confirmed present on disk (8 route.ts guards, 4 page.tsx gates, scripts/verify-dev-surface-locked.sh, package.json). All 4 commit hashes (`c983814`, `bfb14b8`, `74f90d1`, `fd6a0ec`) confirmed present in `git log`.
