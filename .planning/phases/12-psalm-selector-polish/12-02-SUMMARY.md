---
phase: 12-psalm-selector-polish
plan: 02
subsystem: frontend
tags: [psalm-selector, meter-abbreviation, ui-fix, jsdom-tests]
requirements: [PSEL-02]
dependency-graph:
  requires:
    - "PsalmListingGrid.expandedIds is session-only, data-version-toggle test hook (Plan 01)"
  provides:
    - "src/lib/meter-abbrev.ts — abbreviateMeter() + groupMeterTag(), zero-import, client-safe"
    - "Meter tag rendered on the collapsed multi-version toggle box in PsalmListingGrid.tsx"
  affects:
    - "src/lib/meter-abbrev.ts"
    - "src/components/PsalmListingGrid.tsx"
tech-stack:
  added: []
  patterns:
    - "Zero-import lib module pattern (src/lib/tune-slug.ts precedent) reused for meter-abbrev.ts"
key-files:
  created:
    - src/lib/meter-abbrev.ts
    - src/lib/meter-abbrev.test.ts
  modified:
    - src/components/PsalmListingGrid.tsx
    - src/components/PsalmListingGrid.test.tsx
decisions:
  - "Meter tag deliberately NOT gated by the showMeter Advanced Filters checkbox — it answers a scannability question the user needs before deciding to expand, independent of column display preferences"
  - "groupMeterTag returns null (no tag) for both CM-only groups and groups with 2+ distinct non-CM meters — one small badge cannot honestly represent two different meters"
  - "Reused PsalmNumberBox's compact-box meter treatment verbatim (absolute top-1 right-1.5 text-[10px] text-muted-foreground leading-none) so the new tag is pixel-for-pixel consistent with the existing meter badge elsewhere in the grid, placed in the corner opposite the chevron"
metrics:
  duration: "~20 min"
  completed: "2026-08-10"
---

# Phase 12 Plan 02: Meter Abbreviation Tag on Multi-Version Toggle Summary

Added a short meter-abbreviation tag (e.g. `LM`, `SM`, `HM`, `87 87`) to the collapsed multi-version psalm toggle box, so a user can tell before expanding whether a psalm has a version in a meter other than CM, backed by 27 new unit/jsdom tests.

## What Was Built

**Task 1 — `src/lib/meter-abbrev.ts` (PSEL-02 abbreviation rules):** A new zero-import, client-safe module (following the `src/lib/tune-slug.ts` precedent) exporting two pure functions:
- `abbreviateMeter(meter)` — strips trailing parenthetical text (`'LM (long meter, 88 88)'` → `'LM'`), normalises letter-code meters (`CM`, `SM`, `LM`, `LMD`, `SMD`, `CMD`/`DCM` all correctly normalise, longest-code-first so `DCM` never matches the `CM` prefix first), maps the one named numeric alias (`'66 66 88'` → `'HM'`, Hallelujah Metre), and returns any other numeric syllable pattern verbatim (`'87 87'`, `'76 76 D'`, `'66 66 D'`, `'10 10 10 10 10'`) since the compact pattern IS the standard short form, not a fallback.
- `groupMeterTag(meters)` — abbreviates every entry's meter in a multi-version group, takes the distinct non-CM set, and returns that single value only when there's exactly one; returns `null` for CM-only groups (the unmarked default) and for groups with 2+ distinct non-CM meters (e.g. Psalm 136's `HM` + `87 87` mix).

**Task 2 — Render the tag in `PsalmListingGrid.tsx`:** The collapsed multi-version toggle button now computes `groupMeterTag(entries.map((e) => e.meter))` per group and, when non-null, renders a `[data-meter-tag]` span using `PsalmNumberBox`'s exact compact-box meter treatment (`absolute top-1 right-1.5 text-[10px] text-muted-foreground leading-none`) — the corner opposite the existing chevron (`absolute bottom-1 right-1`). The button's `title` attribute now reads `Psalm {id} ({meterTag} available) – tap to expand` (en dash preserved) when a tag is shown, unchanged otherwise. The tag is deliberately independent of the `showMeter` Advanced Filters checkbox — confirmed via a dedicated test setting `localStorage['psalms.showMeter'] = 'false'` and asserting the tag still renders.

Both tasks followed TDD: a failing test file/block was written and committed first (RED), then the minimal implementation landed to make it pass (GREEN). Final state: 33/33 tests passing across `src/lib/meter-abbrev.test.ts` (22) and `src/components/PsalmListingGrid.test.tsx` (11, including 6 carried over from Plan 01).

## Deviations from Plan

None — plan executed exactly as written. Every acceptance-criteria grep, test count, and behavior matched on first implementation.

## Known Stubs

None — this plan touches no data-fetching paths; it is a pure-function module plus a display/copy change on already-fetched data.

## Threat Flags

None — this plan's changes exactly match the threat model's disposed items (T-12-05/06/07/08 all `mitigate`/`accept` with no further control required): the tag renders as an escaped JSX text child (never `dangerouslySetInnerHTML`), the meter values are already public elsewhere in the same grid via the `showMeter` checkbox, and no new network/auth/schema surface is introduced.

## Verification

- `npx vitest run src/lib/meter-abbrev.test.ts src/components/PsalmListingGrid.test.tsx` — 33/33 tests pass.
- `npx tsc --noEmit` — 57 pre-existing errors confirmed unrelated (all in `tests/e2e/*.spec.ts` / `tests/precent-*.spec.ts` / `tests/tune-notation.spec.ts`), zero errors in either file this plan touched.
- `npm run lint` — pre-existing errors/warnings only, scattered across unrelated files (`abc-melisma.ts`, `abc-note-to-solfege.ts`, various `tests/e2e/*.spec.ts` `require()` imports); zero new issues in `src/lib/meter-abbrev.ts` or `src/components/PsalmListingGrid.tsx` (the one pre-existing error + warning on lines 106/107 and 147 of `PsalmListingGrid.tsx` predate this plan, per Plan 01's Summary confirming the same baseline via `git stash` diff).
- `grep -c "^import" src/lib/meter-abbrev.ts` → `0` (zero-import, client-safe).
- `grep -c "export function abbreviateMeter" src/lib/meter-abbrev.ts` → `1`.
- `grep -c "export function groupMeterTag" src/lib/meter-abbrev.ts` → `1`.
- `grep -c "'CMD', 'DCM', 'LMD', 'SMD', 'CM', 'LM', 'SM'" src/lib/meter-abbrev.ts` → `1` (longest-code-first ordering preserved).
- `grep -c 'import { groupMeterTag } from "@/lib/meter-abbrev"' src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "const meterTag = groupMeterTag(entries.map((e) => e.meter))" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "absolute top-1 right-1.5 text-\[10px\] text-muted-foreground leading-none" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "data-meter-tag" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "(\${meterTag} available)" src/components/PsalmListingGrid.tsx` → `1`.
- `grep -c "showMeter" src/components/PsalmListingGrid.tsx` → `7` — unchanged from before this task (confirmed via a pre-edit baseline check), so the tag correctly does not reference `showMeter`.

## TDD Gate Compliance

Both tasks followed the full RED → GREEN cycle with dedicated commits:
- Task 1: `test(12-02)` 56716ea (RED, module doesn't exist, 0 tests collected) → `feat(12-02)` 7f1c981 (GREEN, 22/22 tests passing)
- Task 2: `test(12-02)` ca71648 (RED, 4/11 new assertions failing) → `feat(12-02)` ae41756 (GREEN, 33/33 tests passing)

No REFACTOR commits were needed — both GREEN implementations matched the plan's exact prescribed code.

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 56716ea | test | Add failing tests for meter-abbrev module (RED) |
| 7f1c981 | feat | Add zero-import meter-abbrev module (GREEN) |
| ca71648 | test | Add failing tests for meter tag on multi-version toggle (RED) |
| ae41756 | feat | Render meter tag on collapsed multi-version toggle (GREEN) |

## Self-Check: PENDING
