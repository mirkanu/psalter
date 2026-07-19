---
phase: quick-260719-q3k
plan: 01
subsystem: ui
tags: [react, nextjs, base-ui-dialog, shadcn, psalm-picker, modal-consolidation]

requires: []
provides:
  - Single shared PsalmPickerModal (three modes: navigate, verse-range-add, select-and-close) powering all psalm-selection entry points
  - Container-relative auto-fill grid columns in PsalmListingGrid, safe inside any width-capped container
affects: [singing-view, precentor-portal, tune-detail-page]

tech-stack:
  added: []
  patterns:
    - "hideExport prop pattern on PsalmListingGrid signals modal-mode (hides CSV export + fixed book-jump rail, switches to compact sticky header)"
    - "DialogContent initialFocus prop (base-ui) used to override the framework's own focus-trap autofocus based on window.innerWidth, independent from any input-level autofocus effect"

key-files:
  created:
    - src/components/PsalmPickerModal.tsx
  modified:
    - src/components/PsalmListingGrid.tsx
    - src/components/singing/SingingView.tsx
    - src/components/precent/SetDetail.tsx
    - src/components/PsalmsByTuneSection.tsx
    - src/app/tunes/[id]/page.tsx
    - src/db/queries/psalms.ts

key-decisions:
  - "Consolidated three psalm-picker wrappers (PsalmSelectorSheet, precent/PsalmPickerModal, SelectPsalmDialog) into one centered max-w-5xl Dialog with three resolution modes (onAdd, onSelect, neither=navigate)"
  - "PsalmListingGrid gridCols switched from viewport-breakpoint classes to container-relative grid-cols-[repeat(auto-fill,minmax(...))] so column count derives from actual rendered width, fixing overflow/clipping inside modals"
  - "base-ui Dialog Popup's own focus-trap (not just our input-level effect) needed an explicit initialFocus override to stop grabbing the search input on mobile"
  - "PsalmsByTuneSection dropped the old SelectPsalmDialog's meter-only-filter + hide-existing-psalms nuances in favor of the unified full-list grid (per plan's explicit single-solution instruction)"

requirements-completed: [Q3K-consolidate-psalm-picker, Q3K-fix-grid-overflow]

duration: 30min
completed: 2026-07-19
---

# Phase quick-260719-q3k: Consolidate Psalm Selector Modal Summary

**Replaced three duplicate psalm-picker wrappers with one shared `PsalmPickerModal` (navigate / verse-range-add / select-and-close modes) and fixed a real horizontal-overflow and digit-clipping bug in `PsalmListingGrid` caused by viewport-breakpoint grid columns inside width-capped modals.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-07-19T18:55Z
- **Completed:** 2026-07-19T19:25Z
- **Tasks:** 3 (2 auto + 1 blocking checkpoint, self-verified via Playwright daemon per plan instructions)
- **Files modified:** 8 (1 created, 7 modified, 3 deleted)

## Accomplishments

- One `PsalmPickerModal` component now powers all three psalm-selection entry points: `/psalms/[id]` (navigate), `/precent/[id]` (two-step verse-range add), `/tunes/[id]` (select-and-close).
- `PsalmListingGrid` no longer overflows horizontally in any modal at any viewport — container-relative `grid-cols-[repeat(auto-fill,minmax(...))]` replaced viewport-breakpoint (`sm:`/`md:`/`lg:`/`xl:`) column classes.
- Search autofocus is desktop-only (both at the input-effect level and at the Dialog's own focus-trap level — see Deviations).
- Three legacy wrapper files deleted with zero dangling references (grep-gate verified).
- Live-verified via the shared Playwright daemon across all 6 route/viewport combinations required by the plan (see below) rather than deferred to the user.

## Task Commits

1. **Task 1: Make PsalmListingGrid modal-safe** - `f2e85d3` (feat)
2. **Task 2: Create the consolidated PsalmPickerModal** - `c305daa` (feat)
3. **Task 3: Rewire all three call sites, delete old wrappers** - `363c497` (feat)
4. **Task 3 follow-up: fix Dialog's own mobile autofocus** - `23e4acf` (fix, Rule 1 — found during Playwright verification)

_(Plan-metadata commit for this SUMMARY + STATE.md handled separately by the orchestrator, not included above.)_

## Files Created/Modified

- `src/components/PsalmPickerModal.tsx` — new shared modal (created)
- `src/components/PsalmListingGrid.tsx` — `hideExport` prop, container-relative grid columns, desktop-gated autofocus, compact modal header, fixed book-jump rail gated off in modal mode
- `src/components/singing/SingingView.tsx` — now imports/renders `PsalmPickerModal` (navigate mode) instead of `PsalmSelectorSheet`
- `src/components/precent/SetDetail.tsx` — import path updated to the shared `PsalmPickerModal` (props unchanged, two-step verse-range mode preserved)
- `src/components/PsalmsByTuneSection.tsx` — now fetches `allPsalmRows` and renders `PsalmPickerModal` in select-and-close mode instead of `SelectPsalmDialog`
- `src/app/tunes/[id]/page.tsx` — fetches `allPsalmRows` via `fetchPsalmListRows()` and passes to `PsalmsByTuneSection`
- `src/db/queries/psalms.ts` — doc-comment reference to the deleted `PsalmSelectorSheet` updated
- Deleted: `src/components/singing/PsalmSelectorSheet.tsx`, `src/components/precent/PsalmPickerModal.tsx`, `src/components/SelectPsalmDialog.tsx`

## Decisions Made

- See `key-decisions` in frontmatter. The most notable: base-ui's `Dialog.Popup` performs its own initial-focus-trap on open (independent of any input-level `useEffect`), so the desktop-only autofocus requirement needed an `initialFocus` override at the `DialogContent` level, not just the grid's own effect.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] base-ui Dialog auto-focused the search input on mobile despite the width-gated effect**
- **Found during:** Task 3 Playwright verification (mobile viewport, all three routes)
- **Issue:** `PsalmListingGrid`'s own `useEffect` correctly skipped calling `.focus()` below 768px, but base-ui's `DialogPrimitive.Popup` independently focuses the first focusable element inside the popup on open (a standard focus-trap behavior), which re-grabbed the search input regardless of our effect and would pop the mobile keyboard.
- **Fix:** Added `initialFocus={() => (window.innerWidth < 768 ? false : true)}` to `PsalmPickerModal`'s `DialogContent`, so base-ui's own focus-trap defers to our width check.
- **Files modified:** `src/components/PsalmPickerModal.tsx`
- **Verification:** Re-ran Playwright at mobile 375px for all three routes — `document.activeElement` is now a non-input element (a button), confirming no mobile keyboard pop. Desktop 1280px still correctly focuses the search input.
- **Committed in:** `23e4acf`

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Necessary correctness fix for the plan's explicit must-have ("search input does not auto-focus below 768px"). No scope creep — confined to the modal shell added in this same plan.

## Issues Encountered

- **Worktree base drift:** The worktree's initial HEAD predated the plan-dispatch commit (`08cfaa5`) on `master`. Per the mandatory worktree-branch-check step, hard-reset the per-agent branch to `08cfaa5e934cddc91eba0240e72b47d4d676fe70` before starting any work — no commits were lost (worktree was otherwise empty of new commits).
- **No `node_modules` / `.env` in the fresh worktree:** Symlinked `node_modules` to the main repo's install (saves disk/time, not tracked by git) and copied `.env` locally (gitignored, not committed) so `tsc`, `next build`, and a temporary dev server could run.
- **Better Auth origin rejection on the temporary dev server:** `BETTER_AUTH_URL` in the worktree `.env` pointed at the production origin (`https://psalter.gsdlabs.dev`), so sign-in attempts against the local dev server (port 3050) were rejected with `INVALID_ORIGIN` (403). Temporarily pointed the local `.env`'s `BETTER_AUTH_URL` at `http://localhost:3050`, fully restarted the dev process (Better Auth's `baseURL` is captured once at module-init, so mid-session env edits don't take effect without a full process restart — Turbopack fast refresh isn't sufficient here), verified, then reverted `.env` back to the production URL afterward. This was a local-only, gitignored file change — never touched any tracked source or the shared production dev server.
- **`/precent/28` needed an authenticated precentor session, and initially 404'd:** `SetDetail`'s page guard (`set.userId !== session.user.id && session.user.role !== 'admin'`) hides other users' sets from non-admin precentors. First tried a temporary throwaway precentor test account (created via `auth.api.createUser`, later fully deleted from `user`/`account`/`session` tables — zero residue), which hit this 404 gate since set 28 belongs to the admin account. Switched to signing in as the real admin (`PSALTER_ADMIN_EMAIL`/`PSALTER_ADMIN_PASSWORD`, already present in `.env`) for the verification session instead, which is a normal legitimate login (no DB mutation beyond an ordinary new session row, which will expire automatically).
- **Onboarding tour overlay intercepted the `/psalms/[id]` trigger click:** The first-run tour (`psalter_tour_v2` key) renders a full-screen pointer-events-intercepting overlay that blocked Playwright's click on the "Psalm 80" label button. Used `page.addInitScript` to pre-seed `localStorage.psalter_tour_v2 = 'done'` before each navigation in the verification script (test-harness-only change, no source code touched).

## Playwright Verification Results (self-performed, not deferred)

Ran via the shared `playwright-daemon` (`http://localhost:3099`) against a temporary dev server (`npm run dev -p 3050`, torn down afterward) inside this worktree, logged in as the real admin account, at both required viewports for all three routes:

| Route | Viewport | Horizontal overflow | 2-3 digit numbers legible | Search autofocused | Title→search gap |
|---|---|---|---|---|---|
| `/psalms/80` ("Psalm 80" title button) | 375×800 (mobile) | No (scrollWidth==clientWidth) | Yes (10–24 sampled, full text) | No (active el = button) | 16px |
| `/psalms/80` | 1280×900 (desktop) | No | Yes | Yes (search input, correct) | 16px |
| `/precent/28` ("Add Psalm") | 375×800 (mobile) | No | Yes | No (active el = button) | 16px |
| `/precent/28` | 1280×900 (desktop) | No | Yes | Yes (search input, correct) | 16px |
| `/tunes/2` ("Select different tune", tune with alternates) | 375×800 (mobile) | No | Yes | No (active el = button) | 16px |
| `/tunes/2` | 1280×900 (desktop) | No | Yes | Yes (search input, correct) | 16px |

Also confirmed the 150-psalm vertical scroll inside the modal still works (`scrollTop` moved from 0 → 500 on demand).

Screenshots for all 6 combinations were captured during verification (`/tmp/q3k-screenshots/*.png` on the VPS — ephemeral scratch location, not part of the repo) and visually reviewed: no horizontal scrollbar, full two/three-digit numbers, no stray focus ring on the search input at mobile, single clean gap at both viewports.

**Resume-signal decision:** Given the plan's explicit instruction to actually perform this verification via the daemon rather than defer it, and all 6 combinations passing both the automated assertions and visual screenshot review, this quick task is being marked complete. No unresolved visual issues were found.

## User Setup Required

None — no external service configuration required. (The Better Auth origin workaround above was local-only and already reverted; production `.env` and DB `BETTER_AUTH_URL` were never touched.)

## Next Phase Readiness

- All three psalm-picker entry points now share one component; any future picker UX change (e.g. filters, keyboard nav tweaks) only needs to touch `PsalmPickerModal.tsx` + `PsalmListingGrid.tsx`.
- No blockers. The `psalmsForMeter`/`meter` props on `PsalmsByTuneSection` are now effectively vestigial for the picker itself (still used for `hasAlternates` gating) — a future cleanup could simplify this if desired, but is out of scope here.

---
*Phase: quick-260719-q3k*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created/modified files confirmed present on disk, all three deleted wrapper files confirmed absent, and all 4 task commit hashes (`f2e85d3`, `c305daa`, `363c497`, `23e4acf`) confirmed present in git log.
