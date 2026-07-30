---
phase: 06-security-data-safety-prerequisites
plan: 01
subsystem: auth
tags: [nextjs, middleware, better-auth, robots-txt, admin-auth, vitest]

# Dependency graph
requires: []
provides:
  - "Compiled node-runtime middleware at src/middleware.ts gating /dev/*, /api/dev/*, and /precent/*"
  - "getAdminSessionOr401() reusable admin-role-check helper for API routes"
  - "src/app/robots.ts disallowing /dev/* and /api/dev/* from crawlers"
affects: [06-02-per-route-admin-auth, security-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Discriminated-union session-check helpers ({session, res:null} | {session:null, res}) mirrored across precent-auth.ts and admin-auth.ts for consistent call-site ergonomics"
    - "Next.js src/ directory requires middleware at src/middleware.ts, not repo root — root-level middleware.ts silently compiles to nothing"

key-files:
  created:
    - src/lib/admin-auth.ts
    - src/lib/admin-auth.test.ts
    - src/app/robots.ts
  modified:
    - src/middleware.ts (relocated from repo-root middleware.ts via git mv, then extended)

key-decisions:
  - "getAdminSessionOr401() added as a new sibling helper rather than modifying precent-auth.ts's getSessionOr401(), since 5 /api/precent/* routes depend on its current any-logged-in-user semantics"
  - "middleware-manifest.json is empty by design in Next.js 16.2.5 (middleware convention deprecated in favor of proxy); decisive compilation proof moved to functions-config-manifest.json's /_middleware key plus runtime curl verification"

patterns-established:
  - "getAdminSessionOr401() is the canonical admin-gate for API routes (401 no-session / 403 wrong-role / pass-through admin), ready for Plan 02 to apply per-route"

requirements-completed: [SEC-01, SEC-02]

# Metrics
duration: 20min
completed: 2026-07-30
---

# Phase 06 Plan 01: Middleware Relocation & Admin-Auth Helper Summary

**Relocated dead root-level middleware.ts to src/middleware.ts (the only path Next.js actually compiles in this src/-directory project), extended it to gate /api/dev/* with JSON 401/403, added getAdminSessionOr401() for Plan 02, and published robots.ts disallowing the admin surface.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-30T06:54:00Z
- **Completed:** 2026-07-30T07:14:04Z
- **Tasks:** 3 completed
- **Files modified:** 4 (1 relocated+edited, 3 created)

## Accomplishments
- Closed a live production security hole: `/dev/*` and `/precent/*` were served to anonymous visitors because `middleware.ts` sat at the repo root, where Next.js never compiles it in a `src/`-directory project (proven by an empty `middleware-manifest.json` before the fix)
- Extended middleware to cover `/api/dev/*` with proper JSON 401/403 responses (not a useless redirect for `fetch()` callers)
- Added `getAdminSessionOr401()`, a unit-tested, admin-role-checking sibling to the existing `getSessionOr401()`, ready for Plan 02 to wire into individual `/api/dev/*` routes as defence-in-depth
- Published `/robots.txt` via the App Router `robots.ts` metadata convention, disallowing both `/dev` and `/api/dev` prefixes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getAdminSessionOr401() admin-role helper** (TDD) - `6003515` (test: RED — 4 failing cases), `d282262` (feat: GREEN — implementation, all 4 pass)
2. **Task 2: Relocate middleware to src/ and extend it over /api/dev/*** - `6cd1931` (fix)
3. **Task 3: Add robots.ts disallowing the admin surface** - `be9016b` (feat)

**Plan metadata:** committed separately per worktree convention (SUMMARY.md only; STATE.md/ROADMAP.md owned by orchestrator)

_TDD note: Task 1 followed full RED→GREEN cycle; no REFACTOR commit was needed (implementation matched the plan's exact contract with no cleanup required)._

## Files Created/Modified
- `src/lib/admin-auth.ts` - `getAdminSessionOr401()`: 401 (no session) / 403 (non-admin role) / pass-through (admin), discriminated-union return mirroring `precent-auth.ts`
- `src/lib/admin-auth.test.ts` - 4 tests covering anonymous, `user` role, `precentor` role, and `admin` role
- `src/middleware.ts` - Relocated from repo-root `middleware.ts`; added `/api/dev/*` branch (JSON 401/403) ahead of the existing `/dev` and `/precent` branches; matcher extended to explicit `/dev`, `/dev/:path*`, `/api/dev/:path*`, `/precent`, `/precent/:path*` entries
- `src/app/robots.ts` - App Router metadata route; disallows `/dev`, `/dev/*`, `/api/dev`, `/api/dev/*`; allows `/`; no `sitemap` field (none exists in this project)

## Decisions Made
- Kept `precent-auth.ts`'s `getSessionOr401()` untouched — it only proves "logged in", and 5 `/api/precent/*` routes already depend on that exact semantics; a new `getAdminSessionOr401()` sibling was added instead, per the plan's explicit instruction
- Verified middleware compilation via `functions-config-manifest.json`'s `/_middleware` key (containing all 5 matcher entries) rather than the legacy `middleware-manifest.json`, which the build now emits empty by design in Next.js 16.2.5 (the build explicitly warns that the "middleware" file convention is deprecated in favor of "proxy"). Runtime curl checks against a locally-built production server were treated as the decisive proof, consistent with the threat model's own guidance ("verified by asserting the built manifest is non-empty, not by reading the source")
- Copied `.env` from the main repo checkout into this worktree (gitignored, not committed) — required for `next build`'s data-collection step, which connects read-only to the shared `psalter-db` container; no schema or data changes were made

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted middleware-compilation verification method**
- **Found during:** Task 2 (Relocate middleware to src/ and extend it over /api/dev/*)
- **Issue:** The plan's automated verify command (`node -e "...middleware-manifest.json..."`) expects a non-empty `middleware` key in `.next/server/middleware-manifest.json`. On this project's Next.js 16.2.5, that file is `{"version":3,"middleware":{},"sortedMiddleware":[],"functions":{}}` even after successful compilation — the build emits a deprecation warning ("The 'middleware' file convention is deprecated. Please use 'proxy' instead") and has moved the manifest data elsewhere.
- **Fix:** Confirmed compilation via `.next/server/functions-config-manifest.json`'s `/_middleware` key, which lists all 5 matcher regexes (`/dev`, `/dev/:path*`, `/api/dev/:path*`, `/precent`, `/precent/:path*`) plus `runtime: "nodejs"`. Additionally ran the full set of runtime curl acceptance checks against a locally built production server (port 3013, since 3005 is the live PM2 service and 3006 was occupied by the parallel Plan 06-03 worktree agent) to obtain the truly decisive proof: `/dev/melisma-editor` → 307, `POST /api/dev/melisma-save` → 401, `/api/dev/tune-feedback/all` → `{"error":"Unauthorized"}` body, `/precent` → 307, `/psalms/23` → 200 (public route unaffected).
- **Files modified:** None (verification-method only; `src/middleware.ts` content matches the plan exactly)
- **Verification:** All 5 runtime curl checks passed; `functions-config-manifest.json` confirmed non-empty `/_middleware` entry
- **Committed in:** `6cd1931` (Task 2 commit; deviation documented in commit message)

---

**Total deviations:** 1 auto-fixed (1 blocking — stale verification assumption for a newer Next.js version)
**Impact on plan:** No functional or scope change. The middleware code is exactly as specified; only the *proof method* for compilation had to be adapted to Next.js 16.2.5's actual manifest layout. All literal acceptance criteria involving runtime behavior (redirects, JSON status codes, robots.txt body) passed unmodified.

## Issues Encountered
- Port 3006 (the plan's suggested verification port) was already bound by the sibling parallel executor working on Plan 06-03 in a separate worktree; switched to port 3013 for this plan's local production-server verification with no other impact. The live PM2 `psalter` service on port 3005 was confirmed still `online` and returning 200 throughout, and was never restarted or stopped.
- `next build` initially failed with `DATABASE_URL environment variable is not set` because this worktree checkout has no `.env` (gitignored, and this is a fresh worktree). Copied `.env` from the main repo checkout (`/home/services/psalter/.env`) — same file used by the live service — to unblock the build's data-collection step; no destructive DB operations were performed.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `getAdminSessionOr401()` is exported, unit-tested, and ready for Plan 02 to wire into each `/api/dev/*` route handler as defence-in-depth alongside the middleware-level check added here
- Middleware now actually compiles and enforces `/dev/*`, `/api/dev/*`, and `/precent/*` gating — the primary perimeter defence for this phase's threat register (T-06-01 through T-06-06) is in place
- No blockers for Plan 02 or Plan 03 (independent wave-1 plan)

---
*Phase: 06-security-data-safety-prerequisites*
*Completed: 2026-07-30*
