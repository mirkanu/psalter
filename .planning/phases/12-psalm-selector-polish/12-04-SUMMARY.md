---
phase: 12-psalm-selector-polish
plan: 04
subsystem: planning
tags: [decisions, gap-closure, psalm-selector, ux]

# Dependency graph
requires:
  - phase: 12-psalm-selector-polish
    provides: 12-VERIFICATION.md's Gap 2 (Book I-V tab breakpoint) and Gap 3 (meter tag visibility respec)
provides:
  - "D-GAP2 decision: Book I-V jump tabs shown when viewport is narrow OR short"
  - "D-GAP3 decision: collapsed multi-version boxes never show a meter tag, regardless of checkbox state"
affects: [12-05-PLAN.md, 12-06-PLAN.md]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/12-psalm-selector-polish/12-DECISIONS.md
  modified: []

key-decisions:
  - "D-GAP2: option-a — Book I-V tabs show whenever the screen is narrow OR short (fixes iPhone-landscape disappearance, no change to desktop)"
  - "D-GAP3: stays-hidden — collapsed multi-version toggle boxes never show a meter tag, whatever 'Show meter' is set to; meter only appears once a group is expanded, per individual version row"

patterns-established: []

requirements-completed: [PSEL-02, PSEL-03]

# Metrics
duration: 10min
completed: 2026-08-10
---

# Phase 12 Plan 04: Gap-Closure Decisions Summary

**Two UAT-blocking UX ambiguities from 12-VERIFICATION.md (Book I-V tab visibility rule, and "Show meter" behaviour on collapsed multi-version boxes) resolved by the developer and recorded machine-readably for Plans 12-05 and 12-06 to branch on.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 3 (2 checkpoint:decision tasks answered in a prior session via the orchestrator; Task 3 — the only task this executor run performed — recorded both answers)
- **Files modified:** 1 (`.planning/phases/12-psalm-selector-polish/12-DECISIONS.md`, new file)

## Accomplishments

- Recorded D-GAP2 (Book I-V tab visibility rule) as `option-a`, closing 12-VERIFICATION.md Gap 2.
- Recorded D-GAP3 ("Show meter" behaviour on collapsed multi-version boxes) as `stays-hidden`, closing 12-VERIFICATION.md Gap 3, including a documented reduction of the developer's literal wording onto the closest allowed token.
- No source code was touched — this plan produces a single planning artifact only, per its threat model (`T-12-02`: no trust boundary crossed).

## Task Commits

Tasks 1 and 2 were `checkpoint:decision` tasks answered by the developer via the orchestrator in a prior session (torn-down worktree attempt — no files were written and no commits were made by that attempt). This executor run performed only Task 3.

3. **Task 3: Record both decisions in 12-DECISIONS.md** - `7f617b7` (docs, force-added — `.planning/phases/` is gitignored per this project's convention)

**Plan metadata:** commit pending (this SUMMARY + STATE.md/ROADMAP.md update)

## Files Created/Modified

- `.planning/phases/12-psalm-selector-polish/12-DECISIONS.md` - Machine-readable record of both gap-closure decisions, with verbatim developer quotes and behavioral implementation notes for 12-05 and 12-06.

## Decisions Made

### D-GAP2 — Book I–V tab visibility rule (closes 12-VERIFICATION.md Gap 2)

**Chosen:** `option-a` — "Show the tabs whenever the screen is narrow OR short (recommended)"

**Developer's verbatim words:** "Narrow OR short screen (Recommended)"

The tabs must show whenever the viewport is narrow OR short, and hide only when it is both wide and tall (the ordinary desktop case). This is a pure CSS/media-query rule — no JS measurement, no flicker — and preserves today's desktop-hidden behavior unchanged. It directly fixes the reported defect: an iPhone in landscape (844x390) is short even though it is wide, so the tabs now stay visible there.

### D-GAP3 — "Show meter" behaviour for collapsed multi-version boxes (closes 12-VERIFICATION.md Gap 3)

**Chosen:** `stays-hidden` (a reduction — see below)

**Developer's verbatim words:** "re-appears when checked - but only for the individual versification (when expanded), no meter shown when collapsed"

**Why this is `stays-hidden` and not `reappears` (reduction rationale):** The developer's "re-appears when checked" clause describes the already-settled expanded-row behavior — when a multi-version group is opened, the individual version rows inside it each show their own meter tag when "Show meter" is checked. That part was never in question; both listed options already agreed it was settled baseline behavior. The decision-relevant part of the answer is the second clause, stated unconditionally: "no meter shown when collapsed." The developer did not carve out an exception for the checked state of the checkbox — the collapsed/closed toggle box shows no meter tag either way. Because `reappears` specifically means the checkbox brings a tag back onto the *closed* box, and the developer explicitly ruled that out, the answer reduces to `stays-hidden`. This reduction and its rationale are also recorded as a `**Deviation:**` line directly under the D-GAP3 section in `12-DECISIONS.md`.

**Settled regardless of this choice:** with "Show meter" unchecked, a collapsed multi-version toggle box shows no meter tag; once a group is expanded, every version row inside it shows its meter.

## Deviations from Plan

### Auto-fixed Issues

None — no code was written or fixed by this plan (planning-artifact-only scope).

### Reductions (documented per Task 3's explicit instruction, not a Rule 1-4 deviation)

**1. D-GAP3 developer answer reduced to `stays-hidden` token**
- **Found during:** Task 3 (writing 12-DECISIONS.md)
- **Issue:** The developer's verbatim answer ("re-appears when checked - but only for the individual versification (when expanded), no meter shown when collapsed") does not match either listed option's exact wording — it blends language from both.
- **Fix:** Reduced to `stays-hidden` per the plan's explicit reduction instruction ("If the developer answered with something other than one of the listed options, record their verbatim words, reduce their intent to the closest allowed token, and add a `**Deviation:**` line"). Full rationale recorded in `12-DECISIONS.md` under the D-GAP3 section and restated above.
- **Files modified:** `.planning/phases/12-psalm-selector-polish/12-DECISIONS.md`
- **Commit:** `7f617b7`

## Known Stubs

None — no UI or data code was created or modified by this plan.

## Threat Flags

None — this plan's threat model (`T-12-01`, `T-12-02`) covers the only surface touched (a local planning markdown file); no new surface was introduced.

## TDD Gate Compliance

Not applicable — this plan's type is `execute`, not `tdd`.
