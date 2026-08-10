---
phase: 12-psalm-selector-polish
plan: 08
subsystem: deployment
tags: [production-deploy, playwright, telegram, uat, pm2]

# Dependency graph
requires:
  - phase: 12-05
    provides: Gap 1 (search placeholder) + Gap 2 (Book I-V tabs) fixes
  - phase: 12-06
    provides: Gap 3 (collapsed meter tag) fix
  - phase: 12-07
    provides: Gap 4 (meter box sizing/overlay) fix
provides:
  - Gap-closure build (plans 05-07) live in production at psalter.gsdlabs.dev
  - Automated 6-state production sweep proving all 4 gaps measure as fixed on the real deployed site
  - 4 Telegram screenshots delivered for developer's own real-device re-check
affects: [phase-12-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Playwright-daemon jobs reuse the daemon's single pre-warmed page (page.setViewportSize + goto/reload to seed localStorage) instead of browser.newContext() — on this VPS's 3.7GB/heavy-swap memory profile, spawning additional browser contexts on the single-process Chromium instance reliably crashed the daemon within ~150ms of the request; the shared-page pattern completed all 6 sweep jobs and all 4 screenshot jobs without a single relaunch"

key-files:
  created:
    - .planning/phases/12-psalm-selector-polish/12-08-SUMMARY.md
  modified:
    - .gitignore

key-decisions:
  - "gridRight in the 'no regression' alignment check must be measured from the actual .grid content element inside a book section, not the outer padded wrapper that also hosts the fixed tab column — the wrapper's own right edge reads ~40px wider (it includes the pr-10/pr-14 gutter reserved for the tabs) and would have produced a false regression failure at 390 and 844 widths"

patterns-established: []

requirements-completed: [PSEL-02, PSEL-03]

# Metrics
duration: ~25min
completed: 2026-08-10
---

# Phase 12 Plan 08: Deploy Gap-Closure to Production + Sweep Summary

**Deployed plans 05-07's gap-closure build to production (build 2026-08-10T12:43:05Z, `pm2 restart psalter` 12:43:08Z, confirmed process uptime postdates the build), then ran a 6-state live Playwright sweep against `https://psalter.gsdlabs.dev/psalms` — every Gap 1-4 assertion and the PSEL-03 no-regression alignment check passed with literal measured integers/booleans — and pushed 4 confirmatory screenshots to the developer's Telegram.**

## Performance

- **Duration:** ~25 min (Task 1 automated) + developer real-device re-check (Task 2, async)
- **Started:** 2026-08-10T12:39:48Z
- **Task 1 completed:** 2026-08-10T12:52:50Z
- **Task 2 completed:** developer verdict "all approved" (async, real-device checkpoint)
- **Tasks:** 2/2 complete

## Accomplishments — Task 1

- Pre-deploy gate: `npx vitest run` (46/46 green), `npx tsc --noEmit` (zero errors in the 3 target files), `git status --short src/` empty
- Deployed: `npm run build` (finished 2026-08-10T12:43:05Z) → `pm2 restart psalter` (2026-08-10T12:43:08Z) → confirmed `pm2 describe psalter` uptime (9m at the 12:52:50Z check, i.e. continuously online since the restart) demonstrably postdates the build, and `curl -sI https://psalter.gsdlabs.dev/psalms` returns 200
- Live production sweep: 3 viewports (390x844, 844x390, 1280x800) x 2 `showMeter` states = 6 fresh-context measurements against the real deployed site, every gate PASS (table below)
- 4 screenshots captured and pushed to the developer's Telegram, one per gap, all 4 pushes confirmed `{"ok":true}`

## Deploy Timestamps

| Event | Timestamp (UTC) |
|---|---|
| Pre-deploy gate started | 2026-08-10T12:39:48Z |
| `npm run build` finished | 2026-08-10T12:43:05Z |
| `pm2 restart psalter` issued | 2026-08-10T12:43:08Z |
| `pm2 describe psalter` uptime check | 2026-08-10T12:52:50Z → uptime `9m`, status `online` |
| `curl -sI https://psalter.gsdlabs.dev/psalms` | `200`, confirmed immediately after restart and again at final gate |

The running process has been online continuously since the 12:43:08Z restart (no further restarts/crashes in between) — the build that finished 3 seconds earlier is the one actually serving traffic.

## Production Sweep Table (live, `https://psalter.gsdlabs.dev/psalms`, shared Playwright-daemon page)

| Viewport | showMeter | placeholder | textFits | inputRight | gridRight | tabsShown | tabLeft | meterTagCount | book1Cols | overlapFound | expandedHasMeter | expandedOverflowOk | expandedOverlapFound | collapsedMeterOnPsalm6 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844 | false | `Number or keyword…` | true | 334 | 334 | true | 366 | 0 | 5 | false | true | true | false | 0 |
| 390x844 | true | `Number or keyword…` | true | 334 | 334 | true | 366 | 0 | 3 | false | true | true | false | 0 |
| 844x390 | false | `Search by psalm number or keyword…` | true | 780 | 780 | true | 820 | 0 | 11 | false | true | true | false | 0 |
| 844x390 | true | `Search by psalm number or keyword…` | true | 780 | 780 | true | 820 | 0 | 7 | false | true | true | false | 0 |
| 1280x800 | false | `Search by psalm number or keyword…` | true | 1248 | 1248 | false | null | 0 | 19 | false | true | true | false | 0 |
| 1280x800 | true | `Search by psalm number or keyword…` | true | 1248 | 1248 | false | null | 0 | 12 | false | true | true | false | 0 |

### Gate results (Task 1 step 3, all measured on the live production site)

- **Gap 1 (search placeholder):** PASS — `placeholder` matches 12-05's shipped strings exactly (`Number or keyword…` below 640px, `Search by psalm number or keyword…` at/above), and `textFits === true` at 390 (and, as a bonus, at all three viewports).
- **Gap 2 (Book I-V tab visibility, D-GAP2 option-a):** PASS — `tabsShown === true` at 844x390 (short) and `false` at 1280x800 (wide+tall); also `true` at 390x844 (narrow), consistent with the narrow-OR-short rule.
- **Gap 3 (collapsed meter tag, D-GAP3 stays-hidden):** PASS — `meterTagCount === 0` in every one of the 6 states (the `[data-meter-tag]` attribute no longer exists in the codebase at all, per 12-06). Expanding Psalm 6 (`[data-version-toggle="6"]`) always produces a `[data-meter]` element inside `[data-expanded-panel="6"]` (`expandedHasMeter === true` in all 6 states). With `showMeter` ticked, the *closed* Psalm 6 toggle box still shows zero meter elements (`collapsedMeterOnPsalm6 === 0` in both `showMeter=true` rows) — matches `stays-hidden` exactly: reappearing on check was explicitly ruled out by the developer's decision.
- **Gap 4 (box sizing/overlap):** PASS — `overlapFound === false` and `expandedOverlapFound === false` in every state (zero label/meter rect intersections found anywhere on the page, collapsed or expanded). `book1Cols === 3` at 390x844 with `showMeter=true` (>= 3 required). `expandedOverflowOk === true` in every state (every expanded-panel box's `scrollHeight <= clientHeight + 1`).
- **No regression (PSEL-03 alignment):** PASS — `inputRight === gridRight` exactly (diff 0px) at all three viewports. Wherever tabs are shown, `inputRight <= tabLeft - 8`: 390 (334 ≤ 358), 844 (780 ≤ 812).

## Telegram Screenshots

All 4 pushed via `POST http://localhost:4820/api/services/telegram/send-file`, each confirmed `{"ok":true}`:

| File | Gap evidenced | Caption |
|---|---|---|
| `gap1-default-390.png` | Gap 1 | Search hint fits fully at 390px portrait, no clipping |
| `gap3-4-show-meter-390.png` | Gap 3 + Gap 4 | "Show meter" ticked — CM tags sit neatly next to each number, no overlap, 3 columns |
| `gap3-expanded-psalm6-390.png` | Gap 3 | Psalm 6 expanded with "Show meter" OFF — closed boxes show no tag, expanded versions (6a LM, 6b CM) each show their own meter |
| `gap2-landscape-tabs-844x390.png` | Gap 2 | Book I-V tabs still visible on the right edge in landscape phone orientation |

Screenshots were visually inspected before sending (Read tool) and independently confirm what the sweep numbers show: no truncated placeholder, tabs present in landscape, no meter/number overlap, and the correct D-GAP3 closed-vs-expanded meter visibility split.

## Files Created/Modified

- `.planning/phases/12-psalm-selector-polish/12-08-SUMMARY.md` (this file)
- `.gitignore` — added `.tmp-uat/` (untracked screenshot scratch directory per this plan's own threat register T-12-12)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Playwright-daemon `browser.newContext()` reliably crashed the daemon on this memory-constrained VPS**
- **Found during:** Task 1 step 3, first sweep attempt
- **Issue:** The daemon's Chromium runs with `--single-process`, and the VPS was at ~90MB free RAM / ~6.8GB swap in use at the time (a pre-existing systemic condition, not caused by this plan's build). Every attempt to call `browser.newContext()` inside a submitted job crashed the browser within ~150ms (`Target page, context or browser has been closed`), triggering the daemon's own 30s job-timeout-driven relaunch loop and making every "fresh context" sweep job fail outright.
- **Fix:** Rewrote both the sweep script and the screenshot script to reuse the daemon's single pre-warmed `page` object directly (`page.setViewportSize()` + `page.context().clearCookies()` + `page.evaluate(() => localStorage.clear())`, then `goto`/`reload` to seed `showMeter` state) instead of creating a new browser context per measurement. All 6 sweep jobs and all 4 screenshot jobs then completed reliably with zero relaunches.
- **Files modified:** `/tmp/psel-prod-sweep.mjs`, `/tmp/psel-screenshots.mjs` (verification-only scripts, not committed to the repo)
- **Verification:** Full 6-state sweep and all 4 screenshots completed end-to-end on the retry with no daemon relaunches; `pm2 logs playwright-daemon` showed no further "Job timed out" entries after the fix.

**2. [Rule 1 - Bug] `gridRight` in the "no regression" check initially measured the wrong element**
- **Found during:** Task 1 step 3, first successful sweep run
- **Issue:** The first working sweep measured `gridRight` from the outer `<div className="relative pr-10 tabs-off:pr-0">` wrapper (the parent of the fixed tab column), which reads ~40px wider than the true content edge because it includes the `pr-10`/`pr-14` gutter reserved for the tabs. This produced `inputRight=334 vs gridRight=374` at 390px and `780 vs 820` at 844px — a false PSEL-03 regression failure that did not match Plan 05's own live-measured baseline (which recorded `inputRight === gridRight` exactly at every viewport).
- **Fix:** Re-measured `gridRight` from the actual `.grid` content element inside Book I's section (the same element already used for the `book1Cols` column count), which correctly reads `334`/`780`/`1248` — exact matches with `inputRight` at all three viewports, confirming zero regression.
- **Files modified:** `/tmp/psel-prod-sweep.mjs` (verification-only, not committed)
- **Verification:** Re-ran the full 6-state sweep after the fix; `inputRight === gridRight` (diff 0) at all three viewports in the final results.

**3. [Rule 2 - housekeeping] `.tmp-uat/` left untracked without a `.gitignore` entry**
- **Found during:** Task 1 step 4, before this SUMMARY commit
- **Issue:** The plan's threat register (T-12-12) requires `.tmp-uat/` to stay untracked, but nothing added it to `.gitignore`, so `git status --short` would show it as an unignored untracked directory going forward.
- **Fix:** Added `.tmp-uat/` to `.gitignore` under a new "UAT screenshots" comment block.
- **Files modified:** `.gitignore`
- **Verification:** `git status --short` no longer lists `.tmp-uat/` as untracked.

**Total deviations:** 3 auto-fixed (2 verification-tooling bugs found and fixed in this plan's own throwaway scripts, 1 housekeeping `.gitignore` addition). No production code was changed — this plan is deploy-and-measure only, exactly as scoped.

## Verification Results

- `npx vitest run src/components/PsalmListingGrid.test.tsx src/components/PsalmNumberBox.test.tsx src/lib/meter-abbrev.test.ts` — 46/46 passed, both before and after deploy
- `npx tsc --noEmit` — zero errors in `PsalmListingGrid.tsx`, `PsalmNumberBox.tsx`, `meter-abbrev.ts`
- `git status --short src/` — empty, confirmed before build
- Verify command (`vitest && curl 200 && pm2 online`) — printed `DEPLOY_OK`
- All 6 production-sweep gate groups (Gap 1-4 + no-regression) — PASS, table above
- All 4 Telegram pushes — `{"ok":true}`, screenshots visually confirmed via Read before sending

## Self-Check: PASSED

- FOUND: `/home/services/psalter/.tmp-uat/gap1-default-390.png` (42554 bytes)
- FOUND: `/home/services/psalter/.tmp-uat/gap2-landscape-tabs-844x390.png` (35230 bytes)
- FOUND: `/home/services/psalter/.tmp-uat/gap3-4-show-meter-390.png` (45762 bytes)
- FOUND: `/home/services/psalter/.tmp-uat/gap3-expanded-psalm6-390.png` (41952 bytes)
- FOUND: production site `https://psalter.gsdlabs.dev/psalms` returns 200 (curl re-confirmed at 12:52:50Z)
- FOUND: `pm2 describe psalter` status `online`, uptime `9m` at final check — postdates build by design (restart at 12:43:08Z, 3s after build finish)
- No git commit hashes to verify for Task 1 (no source files changed — deploy/measurement only, per plan's `files_modified: []`)

## Task 2 — Developer Real-Device Re-Check: ALL APPROVED

The developer re-checked all five `<how-to-verify>` items against the live production deployment (https://psalter.gsdlabs.dev/psalms) on their own phone and desktop, per this plan's checkpoint. Their verdict, recorded **verbatim**:

> "all approved"

The developer's response did not break the verdict out item-by-item — it was given as a single unqualified "all approved" covering the full set. Per this plan's `<resume-signal>` (`"... or 'all approved'"`), this is a valid, complete, unconditional approval of every item in `<how-to-verify>`:

1. **Search hint (Gap 1)** — approved
2. **Book tabs sideways (Gap 2)** — approved
3. **Meter tags on closed boxes (Gap 3, D-GAP3 = stays-hidden)** — approved
4. **Box sizing and overlap (Gap 4)** — approved
5. **Nothing else broke** — approved

No item was reported as still wrong, and no new complaint was raised. Per the plan's acceptance criteria ("If any item is not approved, the SUMMARY records it as a still-open gap ... never upgraded to a clean pass") — the inverse also applies here: an unqualified "all approved" is not downgraded into a manufactured partial. There are no remaining gaps; a `## Remaining Gaps` section is intentionally omitted.

### Requirement status

- **PSEL-02 (meter tags on multi-version toggles):** Complete. Gap 3 (collapsed-box tag visibility, D-GAP3 stays-hidden) and Gap 4b (meter/number overlay in expanded panels) both confirmed fixed by the developer on their own device, on top of the automated production sweep's PASS results.
- **PSEL-03 (search/filter width fix):** Complete. Gap 1 (placeholder truncation) and Gap 2 (Book I-V tab visibility) both confirmed fixed by the developer, on top of the automated production sweep's PASS results.

Phase 12's four gap-closure items (12-VERIFICATION.md Gaps 1-4) are now closed: automated production sweep (Task 1) plus human real-device sign-off (Task 2) both confirm all four fixed with no open items.

---
*Phase: 12-psalm-selector-polish*
*Task 1 completed: 2026-08-10T12:52:50Z*
*Task 2 completed: developer verdict "all approved" — no remaining gaps*
*Plan 12-08 complete*
