---
phase: 12-psalm-selector-polish
plan: 03
subsystem: ui
tags: [psalm-selector, playwright, human-verify, ui-verification, gap-tracking]

requires:
  - phase: 12-psalm-selector-polish
    provides: "PsalmListingGrid session-only expandedIds + stickyRightPad gutter (Plan 01), meter-abbrev.ts + rendered meter tag (Plan 02)"
provides:
  - "Live-browser measurement evidence (Playwright daemon) for PSEL-01/02/03 against a real running dev server"
  - "Human UAT verdict against production (psalter.gsdlabs.dev) — PARTIAL approval with 4 open gaps"
affects: [psalm-selector-gap-closure]

tech-stack:
  added: []
  patterns:
    - "Shared playwright-daemon runPlaywright() used for all live-browser measurement, no raw chromium.launch()"

key-files:
  created: []
  modified: []

key-decisions:
  - "Recorded an honest partial verdict rather than upgrading to a clean pass, per plan's Task 2 acceptance criteria"
  - "Gaps 3 and 4 constitute a PSEL-02 respec (meter tag visibility gating) that supersedes the originally-implemented always-visible behavior from Plan 02"
  - "Did not attempt any fix in this continuation — gap-closure planning is deferred to /gsd-plan-phase 12 --gaps"

patterns-established: []

requirements-completed: []

duration: "~15min (continuation only)"
completed: "2026-08-10"
---

# Phase 12 Plan 03: Live Verification + Human UAT Verdict Summary

**Live-browser Playwright measurements confirm PSEL-01/02/03 pass in isolation, but human UAT against the deployed production build surfaced 4 open gaps (mobile placeholder truncation, tab visibility on iPhone landscape, a PSEL-02 visibility respec, and meter-display sizing/overlay bugs) — phase is NOT closed.**

## Performance

- **Tasks:** 1 of 2 fully complete (Task 1 automated measurement); Task 2 (human sign-off) returned a partial verdict, not a clean approval
- **Files modified:** 0 (verification-only plan; this SUMMARY is the only artifact)

## Task 1 — Live Layout + Meter-Tag Measurement (completed, no source changes)

All measurements were taken against a local verification dev server (port 3100) via the shared Playwright daemon (`runPlaywright()` from `/home/services/playwright-daemon/client.js`), per the global CLAUDE.md's no-raw-Chromium rule.

### Layout measurement (PSEL-03) — all gates PASS

**`/psalms` full page, 390px viewport:**
| Metric | Value |
|---|---|
| `inputRight` | 334 |
| `gridContentRight` | 334 |
| `tabLeft` | 366 |

- Gate 1 (`|inputRight - gridContentRight| <= 1`): Δ = 0 → PASS
- Gate 2 (`inputRight <= tabLeft - 8` = 358): 334 <= 358 → PASS
- Gate 3 (`gridContentRight <= tabLeft - 8` = 358): 334 <= 358 → PASS

**`/psalms` full page, 1280px viewport:**
- `inputRight` = 1248, `gridContentRight` = 1248 (Δ = 0 → PASS)
- Book-tab container confirmed hidden (`offsetParent === null`) → PASS

**Modal (`PsalmPickerModal`, opened from `/tunes/lennox`, tune id 5), 390px:**
| Metric | Value |
|---|---|
| `inputRight` | 334 |
| `gridContentRight` | 334 |
| `tabLeft` | 366 |

Identical to the full-page numbers — all 3 gates PASS.

### Collapse-on-reload (PSEL-01) — PASS

390px, Psalm 6:
```json
{ "afterClick": "true", "stored": null, "afterReload": "false" }
```
Exact match to the required `{ afterClick: 'true', stored: null, afterReload: 'false' }`.

### Live meter-tag sweep (PSEL-02) — 14/14 PASS

390px, all UI-SPEC §1-listed psalms matched exactly:

| Psalm | Expected | Actual | Result |
|---|---|---|---|
| 6 | LM | LM | ✓ |
| 100 | LM | LM | ✓ |
| 102 | LM | LM | ✓ |
| 145 | LM | LM | ✓ |
| 25 | SM | SM | ✓ |
| 45 | SM | SM | ✓ |
| 50 | SM | SM | ✓ |
| 67 | SM | SM | ✓ |
| 70 | SM | SM | ✓ |
| 124 | 10 10 10 10 10 | 10 10 10 10 10 | ✓ |
| 143 | 66 66 D | 66 66 D | ✓ |
| 148 | HM | HM | ✓ |
| 136 | null | null | ✓ |
| 119 | null | null | ✓ |

### Automated regression gate — PASS

`npx vitest run src/lib/meter-abbrev.test.ts src/components/PsalmListingGrid.test.tsx` → 33/33 passing, re-run immediately before the checkpoint was presented.

### Evidence delivery

- Screenshots taken at 390x844 and 1280px, pushed to the owner's Telegram via `POST http://localhost:4820/api/services/telegram/send-file` — both pushes confirmed successful.
- Verification dev server on port 3100 confirmed stopped at the end of Task 1 (`ss -ltn | grep 3100` returned nothing).
- No raw `chromium.launch()` used anywhere — all browser work went through the shared `playwright-daemon`.

### Post-Task-1 production deployment (orchestrator action, not part of Task 1's plan text)

Between Task 1 completing and Task 2's checkpoint being presented to the human, the orchestrator built and deployed the changes to production:
- `npm run build` succeeded.
- `pm2 restart psalter` was run.
- The live site at `psalter.gsdlabs.dev` (port 3005) was confirmed serving the new build — `data-version-toggle` and `pr-14` markers present in served HTML, HTTP 200.

**The human's UAT below was performed against this live production deployment, not the local dev server the plan's `<how-to-verify>` instructions describe.** This is a stronger verification substrate than the plan called for (real production, not a throwaway dev server) and is the reason new issues surfaced that the plan's own automated checks (which only exercise the fixed set of `/psalms` scenarios listed in the UI-SPEC) did not catch.

## Task 2 — Human Sign-Off: PARTIAL APPROVAL, 4 open gaps

The human worked through all 7 `<how-to-verify>` steps against the live production site. Their verdict, recorded **verbatim**:

> 1. approved BUT on mobile in search bar the "Search by psalm number or keyword" is being cut off - any possibility to force fit or wrap?
> 2. approved
> 3. seems to work - BUT on iPhone landscape the anchor tabs disappear - they should be displayed unless e.g. 75% of the entire page fits on the viewport
> 4. approved BUT I think I gave the wrong spec - with "show meter" unchecked in Advanced Filters, no meters should be shown even for multi-version psalms UNTIL a multi-version psalm is expanded - then the meter is shown for only the expanded multi-version psalm
> 5. approved with point 4 proviso
> 6. approved
> 7. approved
>
> In addition, selecting Show meter under Advanced Filters, the psalm "boxes" become much too big with lots of wasted whit space. Conversely, expanded multi-version Psalm "boxes" do not grow sufficiently - the meter info is overlaid on top of the psalm number

(Step numbers refer to the 7 items in the plan's `<how-to-verify>`: 1=search bar width/truncation, 2=Advanced Filters panel edge, 3=desktop regression + tab visibility, 4=meter tags correctness, 5=meter tags not gated on "Show meter" checkbox, 6=collapse on reload, 7=picker modal.)

### Requirement status (do NOT read as fully satisfied)

- **PSEL-01: verified, no gaps.** Collapse-on-reload behavior confirmed by both automated measurement (Task 1) and human step 6.
- **PSEL-02: implemented functionality (meter abbreviations themselves are correct) verified, but visibility-gating behavior needs respec.** See Gap 3 — the human's correction to step 4 changes what "correct" means for the always-visible design Plan 02 shipped, and step 5's approval was conditioned on the old (now superseded) premise.
- **PSEL-03: width/alignment verified, but tab-visibility breakpoint has an open gap.** The core "search bar aligns with grid, no overlap" measurement passed at both 390px and 1280px (Task 1) and the human approved steps 1 (partially, re: alignment) and 2. But step 3 surfaced a real defect: the `md:hidden` breakpoint hides the Book I–V tabs on iPhone landscape, which the human did not intend. See Gap 2.

## Gaps (ready for `/gsd-plan-phase 12 --gaps`)

### Gap 1 — Search bar placeholder truncated on mobile (new finding, not an original PSEL-01/02/03 requirement)

- **Component:** `#psalms-sticky-header input` placeholder text `"Search by psalm number or keyword"`.
- **Viewport:** mobile (<768px), narrow widths in particular.
- **Expected (per human):** placeholder should not be visually cut off — either the input should accommodate it, or it should wrap/shrink.
- **Observed:** text is cut off at narrow mobile widths.
- **Open design question:** force-fit (e.g. smaller font-size, shorter placeholder copy) vs. wrap to two lines — needs a design decision before implementation, not just a mechanical bug fix.

### Gap 2 — Book I–V tabs disappear on iPhone landscape (behavior change to a pre-existing feature, surfaced during Phase 12 UAT, not a Phase 12 regression)

- **Component:** the fixed Book I–V tab column (`div.fixed.right-0`, currently `md:hidden`, i.e. hidden at >=768px viewport width).
- **Viewport:** iPhone landscape (e.g. iPhone 12/13 Pro landscape is ~844px wide, which crosses the existing 768px breakpoint and hides the tabs).
- **Expected (per human):** tabs should still display in landscape. Human's proposed heuristic: show the tabs "unless e.g. 75% of the entire page fits on the viewport" (i.e. base visibility on whether the full psalm list already fits on screen without scrolling, not a fixed width breakpoint). **This is the human's own suggested rule, not a locked spec** — flag as needing confirmation/refinement during gap-closure planning, not blind implementation.
- **Note:** this breakpoint (`md:hidden`) predates Phase 12 — it was part of the Phase 11 tune-list-selector-overhaul groundwork (confirmed inherited, not introduced, per 12-01-SUMMARY.md's "Context inherited, not part of this plan" note). The human is raising it now as a defect against the still-open Book-tab UX, so it belongs in this phase's gap list rather than being silently dropped as out-of-scope.

### Gap 3 — Meter tag visibility must be gated by expand state, not always-on (PSEL-02 respec — supersedes what was implemented)

- **Component:** `[data-meter-tag]` span on multi-version toggle boxes in `PsalmListingGrid.tsx`.
- **Current implemented behavior (per 12-02-SUMMARY.md):** the meter tag is ALWAYS visible on the collapsed toggle box, independent of the "Show meter" Advanced Filters checkbox — this was a deliberate design decision in Plan 02 ("Meter tag deliberately NOT gated by the showMeter Advanced Filters checkbox").
- **Corrected spec (per human, superseding UI-SPEC §1 and the original PSEL-02 requirement wording):** with "Show meter" UNCHECKED, NO meter tag should show on a collapsed multi-version toggle box. Only once a multi-version group is EXPANDED should the meter show — and only for the specific expanded version's row, not the collapsed toggle box itself.
- **Open question for gap-closure planning:** what happens with "Show meter" CHECKED — does the collapsed toggle box meter tag reappear in that case (reverting to something like the original Phase 12 behavior when the checkbox is on), or does checked/unchecked no longer matter at all for the collapsed box now that expand-state is the real gate? The human's wording ties the fix to the unchecked case; get this confirmed explicitly before implementing, rather than guessing.
- This also affects the human's proviso on step 5 (meter tags "not opt-in") — step 5 was approved originally on the premise of always-visible; the human's correction to step 4 changes what "correct" means for step 5 too.

### Gap 4 — Meter display sizing/overlay issues (newly discovered layout bug, scope unclear — pre-existing vs. Phase 12 regression needs investigation)

- **4a.** With "Show meter" checked (the existing Advanced Filters checkbox, not the new PSEL-02 tag), psalm result boxes become "much too big" with a lot of wasted white space.
- **4b.** When a multi-version group is expanded, the box does not grow enough to fit the meter info, so the meter text visually overlays/collides with the psalm number.
- Both need investigation during gap-closure to determine whether either is a Phase 12 regression (e.g. from PSEL-02's new `[data-meter-tag]` markup interacting with existing "Show meter" row rendering) or a pre-existing bug the human happened to notice while doing Phase 12 UAT. Recorded as open gaps; root cause was not diagnosed or fixed in this continuation — that's gap-closure's job.

## Decisions Made

- Recorded the human's verdict as a partial approval with 4 explicit open gaps, per the plan's own Task 2 acceptance criteria ("record an honest partial verdict with an explicit open gap rather than upgrading it to a clean pass"), rather than treating the majority "approved" language as a clean pass.
- No source code changes were made in this continuation — gap-closure implementation is explicitly deferred to a future `/gsd-plan-phase 12 --gaps` run.

## Deviations from Plan

None from this continuation's own scope — this continuation's only job was to record the verdict and write this SUMMARY, which it did without touching application source. The underlying situation (human UAT surfacing gaps rather than a clean pass) is not a deviation from *this* plan; it is the plan's designed outcome path for a non-approval response, and the plan explicitly anticipated and specified this exact section's structure.

## Known Stubs

None — no code was written in this continuation.

## Threat Flags

None — no new files, endpoints, or trust-boundary changes introduced by this continuation.

## Issues Encountered

None during this continuation's execution. The substantive "issues" are the 4 gaps above, which are the expected output of a partial-approval verdict, not execution problems.

## Next Phase Readiness

Phase 12 is **not closed**. The next step is `/gsd-plan-phase 12 --gaps` to plan gap-closure work for the 4 items above. Two of the four (Gap 1, Gap 4) are new findings outside the original PSEL-01/02/03 scope; Gap 3 is a direct respec of PSEL-02's shipped behavior; Gap 2 concerns a pre-existing (Phase 11) breakpoint decision now flagged as a defect. All four need a human decision point during gap-closure planning before implementation (design choice for Gap 1, heuristic confirmation for Gap 2, checked-state behavior confirmation for Gap 3, and regression-vs-pre-existing triage for Gap 4) — none should be implemented purely from this SUMMARY without that planning step.

## Self-Check: PASSED

- FOUND: .planning/phases/12-psalm-selector-polish/12-03-SUMMARY.md

---
*Phase: 12-psalm-selector-polish*
*Completed: 2026-08-10*
