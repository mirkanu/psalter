---
phase: 20
plan: 03
subsystem: build-version-cache-bust
tags: [deploy-info, bfcache, hard-reload, public-route, force-dynamic, pageshow, localStorage, no-info-disclosure]

# Dependency graph
requires:
  - phase: 20-01
    provides: "FirstVisitModal + OnboardingTour 3-trigger refactor merged to master"
  - phase: 20-02
    provides: "Legacy view + audio persistence + open/close toggle merged to master"
provides:
  - "Public /api/build-version route handler returning ONLY { buildId } from .next/BUILD_ID"
  - "BuildVersionGuard client component covering BOTH bfcache restore AND generic stale-build cases"
  - "Single-source-of-truth cache-bust mechanism mounted globally from layout.tsx"
  - "DeployStatus pageshow handler removed (replaced by the global BuildVersionGuard listener)"
  - "Architectural resolution of pre-existing data-build-id='unknown' staleness issue"
affects:
  - Every route that mounts from layout.tsx (the guard fires once globally, not per route)
  - DeployStatus admin footer freshness indicator (DOM data-build-id check is preserved unchanged)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "force-dynamic public route (no auth gate) with strict 500 on missing/unreadable filesystem reads"
    - "localStorage seed-on-first-load + compare-on-subsequent-load + hard-reload on mismatch"
    - "pageshow listener with event.persisted === true guard for bfcache restore"
    - "Single mounted-from-layout side-effect component covering all routes"
    - "Hidden <span data-X /> attribute anchor for Playwright mount assertion"

key-files:
  created:
    - src/app/api/build-version/route.ts (~85 lines, public endpoint)
    - src/components/BuildVersionGuard.tsx (~95 lines, 'use client' side-effect component)
    - tests/api/build-version.test.ts (~115 lines, 7 vitest unit tests)
    - tests/diagnostics/build-version-guard.mjs (~165 lines, 3 Playwright sub-checks)
  modified:
    - src/app/layout.tsx (+6 lines: import + JSX mount after InstallDialogHost)
    - src/components/DeployStatus.tsx (-22 lines: pageshow handler + cleanup removed; DOM data-build-id staleness check preserved)

key-decisions:
  - "D-25 (public, buildId-only, 500 on missing/unreadable) implemented via single try/catch in the route handler — empty string after .trim() is treated as missing; readFileSync throw is unreadable. Both 500 paths return only an `error` key with no buildId leak (T-20-02 mitigation)."
  - "D-26 (single mechanism covers both trigger conditions) implemented via one useEffect in BuildVersionGuard that runs the mount-time fetch AND registers the pageshow listener. No duplicate logic between the two paths."
  - "D-27 (localStorage compare-and-reload) implemented with try/catch around every localStorage access — failure is silent. Set-before-reload prevents infinite loop."
  - "D-28 (refactor existing bfcache guard) implemented by REMOVING the pageshow handler from DeployStatus.tsx entirely (lines 115-144 of the old file are gone). The DOM data-build-id SSR attribute STAYS unchanged because DeployStatus still reads it for the admin footer staleness check."
  - "D-29 (DeployStatus data-build-id='unknown' side-effect resolution) — the new mechanism reads the same .next/BUILD_ID source as the existing getBuildId() in layout.tsx (both use readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf8')). Any future PM2 cwd misconfiguration would affect BOTH consistently rather than one returning 'unknown' and the other working."
  - "D-33 (where to read BUILD_ID from) — direct fs.readFile at process.cwd()/.next/BUILD_ID, mirroring /api/deploy-info's pattern for data/deploy-info.json (route.ts:48-50). No special case for PM2 cwd — verified live via pm2 jlist that cwd is /home/services/psalter."
  - "BuildVersionGuard returns `<span data-build-version-guard hidden />` (NOT null) to anchor a Playwright-queryable attribute while maintaining zero layout impact — per UI-SPEC.md Visual markers contract."

patterns-established:
  - "Public, force-dynamic route pattern for cache-bust freshness probes: Cache-Control private, max-age=0, must-revalidate on success; no-store on 500 paths"
  - "Side-effect mounted-from-layout component pattern: null/hidden return value, useEffect registers globals (window listeners), no rendered UI"

requirements-completed: []

# Metrics
duration: "approx 15 minutes wall-clock (Task 1 ~12 min — single tightly-scoped change with 4 file edits + 2 test files)"
tasks_completed: 1
files_created: 4
files_modified: 2
commits: 1
merged_via: "local commit 71ea3990 awaiting gitleaks-protected master merge via PR"
completed_date: 2026-10-15"
---

# Phase 20 Plan 03: Build-Version Cache Bust Summary

**One-liner:** Public `/api/build-version` route returning ONLY `{ buildId }` + `BuildVersionGuard` client component mounted globally from `layout.tsx` covering BOTH bfcache restore and generic stale-build cases via localStorage compare-and-reload; existing `DeployStatus` pageshow handler refactored to no-op since the new guard owns the bfcache case.

## What shipped

### 1. New `/api/build-version` public route
- **`src/app/api/build-version/route.ts`** (~85 lines) — public, `force-dynamic`, NO `getAdminSessionOr401` import (per D-25). Reads `.next/BUILD_ID` via `readFileSync(join(process.cwd(), '.next', 'BUILD_ID'), 'utf8').trim()` and returns ONLY `{ buildId }`. 500 with `{ error: 'BUILD_ID missing' }` on empty file (D-25, T-20-03). 500 with `{ error: 'BUILD_ID unreadable' }` on read failure. Cache-Control: `private, max-age=0, must-revalidate` on success; `no-store` on 500 paths.
- **Information disclosure mitigation (T-20-02):** response contains ONLY `{ buildId }` — NO commit SHA, NO commit message, NO deployedAt. Tested via `expect(Object.keys(data)).toEqual(['buildId'])` in `tests/api/build-version.test.ts`.

### 2. New `BuildVersionGuard` client component
- **`src/components/BuildVersionGuard.tsx`** (~95 lines, `'use client'`) — single side-effect component covering BOTH stale-build trigger conditions per D-26:
  1. **Mount-time check** — fetch `/api/build-version`, compare response.buildId to `localStorage.psalter.lastSeenBuildId`. First-ever load (empty storage) just records the buildId (no reload — empty storage is "no last-seen" not "stale"). Mismatch → hard reload, set new buildId BEFORE reload to prevent loop.
  2. **bfcache restore** — `pageshow` listener with `event.persisted === true` guard. Same fetch-and-compare flow.
- Renders `<span data-build-version-guard hidden />` for Playwright mount assertion (zero layout impact).

### 3. `layout.tsx` mount (3 lines added)
- **Import added** after `InstallAsAppBanner`: `import { BuildVersionGuard } from "@/components/BuildVersionGuard";`
- **JSX mount** after `<InstallDialogHost />` inside `<Providers>`: `<BuildVersionGuard />`
- The existing SSR'd `<html data-build-id={buildId}>` attribute is UNCHANGED — DeployStatus still reads it for the admin footer staleness check.

### 4. `DeployStatus.tsx` refactor (pageshow handler removed)
- **Removed:** the existing `onPageShow` function (was lines 115-144 of the old file) + the `window.addEventListener('pageshow', onPageShow)` call + the `window.removeEventListener('pageshow', onPageShow)` cleanup.
- **Kept unchanged:** the DOM `data-build-id` staleness check at the render block (was lines 157-163 of the old file, now lines ~131-137 after edit). The admin footer freshness indicator still works.
- **New comment** at the old handler site: `// bfcache reload is handled globally by BuildVersionGuard (mounted in layout.tsx — see Phase 20 Plan 03).`

### 5. Tests
- **`tests/api/build-version.test.ts`** (NEW, 7 vitest unit tests):
  1. Returns 200 with body `{ buildId }` and NO other keys (D-25, T-20-02)
  2. Sets `Cache-Control: private, max-age=0, must-revalidate` on success (D-25)
  3. Returns 500 with `{ error: 'BUILD_ID missing' }` on empty file (D-25, T-20-03)
  4. Returns 500 with `{ error: 'BUILD_ID unreadable' }` on read failure (D-25, T-20-03)
  5. Does NOT call any admin auth helper (route is PUBLIC)
  6. Trims trailing whitespace from BUILD_ID before returning
  7. Reads from `process.cwd()/.next/BUILD_ID` (D-33, PM2 cwd invariant)
- **`tests/diagnostics/build-version-guard.mjs`** (NEW, Playwright via Chromium daemon :3099, 3 sub-checks):
  1. Empty localStorage → no reload, buildId written
  2. Stale stored buildId → hard reload, then stored = live buildId
  3. Matching stored buildId → no reload

## Deviations from Plan

### Auto-fixed Issues

**None.** Plan executed exactly as written.

### Pragmatic deviations

**1. Test mock pattern: mocked `node:fs` instead of `vi.mock` of the route module**
- **Plan said:** Tests at `tests/api/build-version.test.ts` mocking `readFileSync` to return `''`, throw, or valid string.
- **Why deviation:** Same plan, same approach — no deviation. The plan's pseudo-code uses `mock readFileSync to return ''` / `throw` directly. Implemented via `vi.mock('node:fs', () => ({ readFileSync }))` with a hoisted `vi.fn()`.
- **No files changed** — the implementation matches the plan's intent.

**2. `GET()` signature in tests called without arguments**
- **Found during:** Post-write TypeScript check.
- **Issue:** The route handler signature is `export async function GET()` (no parameters — mirrors `/api/deploy-info/route.ts:42`). My initial test wrapper used `GET(makeNextRequest())` with a stub NextRequest — TS flagged "Expected 0 arguments, but got 1".
- **Fix:** Removed the `makeNextRequest` wrapper entirely. All test calls now use `GET()` directly. Pure test-code cleanup — no behavioral change.
- **Files modified:** `tests/api/build-version.test.ts`

**3. `BuildVersionGuard` renders `<span hidden />` instead of `null`**
- **Plan said:** "Renders null" with a note about the `<span data-build-version-guard hidden />` Playwright anchor.
- **Why deviation:** Same plan, same implementation. The plan explicitly states: "Prefer `<span data-build-version-guard hidden />` so Playwright `page.locator('[data-build-version-guard]')` succeeds. The `<span>` is `hidden` (zero layout impact) and the only purpose is the test marker."
- **No files changed** — implementation matches the plan's explicit intent.

---

**Total deviations:** 0 auto-fixed; 2 pragmatic (1 was already in plan, 1 was a test-code cleanup)

**Impact on plan:** No scope creep. All must-haves from the plan's `<must_haves>` section are demonstrable via the 7 vitest tests + the 3 Playwright diagnostic sub-checks.

## Issues Encountered

- **gitleaks push protection rejected direct push to origin/master** (per memory `project_github_push_protection_master.md`). The local commit `71ea3990` is on master locally; the orchestrator will handle the PR-based merge via the gitleaks-protected path. Same pattern as Plan 02's PR #118.
- **Vitest hung in watch mode** when `npm test` was invoked without `--run`. First run timed out at 120s. Re-ran with explicit `npx vitest run tests/api/build-version.test.ts` — completed in 1.03s with all 7 tests passing.

## User Setup Required

None - no external service configuration required. The plan changes are entirely code (route handler + client component + layout mount + DeployStatus refactor + tests). No new secrets, no dashboard configuration, no environment variables.

## Next Phase Readiness

- **Phase 20 closes with this plan.** All 3 plans shipped: modal + tour (Plan 01), Legacy view + audio persistence (Plan 02), build-version cache bust (Plan 03).
- **Atomic Wave 2 release:** the orchestrator will deploy Plan 01+02+03 in a single release so a single `psalter.lastSeenBuildId` mismatch triggers one reload that pulls in the entire feature set.
- **Memory update recommended:** `[[psalter data-build-id="unknown" pre-existing]]` should be retired or updated after Wave 2 ships — the architectural fix (BuildVersionGuard reads the same `.next/BUILD_ID` source) means future cwd misconfigurations affect BOTH mechanisms consistently rather than one working and one returning "unknown".
- **Mobile-first verification:** N/A — BuildVersionGuard renders a hidden span only. No new UI surface.

---

*Phase: 20-single-psalm-view-onboarding-overhaul*
*Plan: 03*
*Completed: 2026-10-15*

## Self-Check: PASSED

- `src/app/api/build-version/route.ts` exists (85 lines, public endpoint)
- `src/components/BuildVersionGuard.tsx` exists (95 lines, 'use client' side-effect component)
- `tests/api/build-version.test.ts` exists (7 vitest tests, all green)
- `tests/diagnostics/build-version-guard.mjs` exists (3 Playwright sub-checks via Chromium daemon :3099)
- `src/app/layout.tsx` imports + mounts `<BuildVersionGuard />` (2 BuildVersionGuard references)
- `src/components/DeployStatus.tsx` no longer has pageshow handler (only 1 reference in a code comment)
- All 2 commits exist on local master: `71ea3990` (feat), `419d905c` (docs)
- `npx tsc --noEmit` exits 0 with 0 new errors in files owned by this plan (pre-existing spec-file errors in `tests/e2e/*.spec.ts` and `tests/precent-*.spec.ts` are unrelated to this plan and unchanged)
- 7/7 vitest unit tests for `/api/build-version` pass (`npx vitest run tests/api/build-version.test.ts` → 7 passed, 33ms)
- Push to `origin/master` rejected by gitleaks push protection (per memory `project_github_push_protection_master.md`) — local commit `71ea3990` + docs commit `419d905c` are on local master awaiting PR-based merge via the orchestrator