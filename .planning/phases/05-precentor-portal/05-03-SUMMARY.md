---
phase: 05-precentor-portal
plan: 03
subsystem: precentor-portal
tags: [api, crud, ui, picker-modal, item-assignment, tdd]
dependency_graph:
  requires:
    - set_items table (plan 01)
    - PsalmListingGrid + TuneGrid existing components
    - shadcn Dialog + Input + Button (pre-existing)
  provides:
    - POST /api/precent/[id]/items (add item with auto-position)
    - PATCH /api/precent/[id]/items/[itemId] (update tune/verse scoped to set)
    - DELETE /api/precent/[id]/items/[itemId] (delete item scoped to set)
    - PsalmListingGrid.onSelect modal prop
    - PsalmNumberBox.onClick modal prop
    - TuneGrid.initialMeter + onSelectTune modal props + exported TuneRow
    - PsalmPickerModal (grid + verse range step)
    - TunePickerModal (grid pre-filtered by meter)
  affects:
    - src/app/api/precent/[id]/items/route.ts
    - src/app/api/precent/[id]/items/[itemId]/route.ts
    - src/components/PsalmListingGrid.tsx
    - src/components/PsalmNumberBox.tsx
    - src/components/TuneGrid.tsx
    - src/components/precent/PsalmPickerModal.tsx
    - src/components/precent/TunePickerModal.tsx
tech_stack:
  added: []
  patterns:
    - Drizzle transaction for auto-position computation (Math.max + 1)
    - Set-scoped mutation guards: and(eq(setItems.id, ...), eq(setItems.setId, ...))
    - Optional prop modal mode: onSelect/onSelectTune gates Link vs button render
    - base-ui Dialog with open/onOpenChange (consistent with D-04.9.3-04)
    - Two-step modal flow: grid picker → confirm/verse-range step
key_files:
  created:
    - src/app/api/precent/[id]/items/route.ts
    - src/app/api/precent/[id]/items/[itemId]/route.ts
    - src/components/precent/PsalmPickerModal.tsx
    - src/components/precent/TunePickerModal.tsx
  modified:
    - src/components/PsalmListingGrid.tsx
    - src/components/PsalmNumberBox.tsx
    - src/components/TuneGrid.tsx
decisions:
  - "PsalmNumberBox renders <button> when onClick provided, <Link> otherwise — zero regression to /psalms page"
  - "TuneRow exported from TuneGrid.tsx so TunePickerModal can import the type directly"
  - "TuneGrid router.replace guarded by !onSelectTune to prevent modal close on filter change (Pitfall 1 from RESEARCH)"
  - "PsalmPickerModal two-step: grid → psalm selected → verse range input + Add to Set; back button returns to grid"
  - "TunePickerModal single-step: selecting a tune immediately calls onSelect + onClose"
metrics:
  duration_seconds: 720
  completed_date: "2026-06-15"
  tasks_completed: 3
  files_created: 4
  files_modified: 3
---

# Phase 05 Plan 03: Item Assignment Layer Summary

**One-liner:** PREC-02 complete — item CRUD API with transaction-based auto-position and set-scoped tampering guards; PsalmListingGrid/PsalmNumberBox/TuneGrid made reusable via optional modal props; PsalmPickerModal (two-step grid + verse range) and TunePickerModal (meter pre-filtered grid) ready for plan 04 set detail page.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Item API routes (add with auto-position, update, delete) | 40e1753 | src/app/api/precent/[id]/items/route.ts, src/app/api/precent/[id]/items/[itemId]/route.ts |
| 2 | Make PsalmListingGrid + PsalmNumberBox + TuneGrid reusable in modals | 1583e3a | src/components/PsalmListingGrid.tsx, src/components/PsalmNumberBox.tsx, src/components/TuneGrid.tsx |
| 3 | PsalmPickerModal + TunePickerModal | 581a0b1 | src/components/precent/PsalmPickerModal.tsx, src/components/precent/TunePickerModal.tsx |

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met, vitest GREEN, no new TypeScript errors.

## Known Stubs

None introduced in this plan. The Wave 0 stub from plan 01 that remains RED is out of scope:
- src/app/api/precent/[id]/reorder/route.test.ts — Plan 04

## Threat Flags

T-05-02 and T-05-07 from the plan threat model are fully mitigated:
- POST /api/precent/[id]/items: psalmId type-checked (number), setId isNaN guard → 400; verseRange clamped to 20 chars; FK constraint on psalm_id rejects non-existent psalms at DB layer
- PATCH/DELETE scoped to BOTH setItems.id AND setItems.setId via Drizzle and(eq(...), eq(...)) — prevents cross-set item tampering

## Self-Check: PASSED

- [x] src/app/api/precent/[id]/items/route.ts exists, exports POST, contains Math.max and isNaN(setId)
- [x] src/app/api/precent/[id]/items/[itemId]/route.ts exists, exports PATCH and DELETE, contains and(eq(setItems.id and eq(setItems.setId
- [x] src/components/PsalmListingGrid.tsx contains "onSelect?: (psalm: PsalmRow) => void" and "if (onSelect)"
- [x] src/components/PsalmNumberBox.tsx contains "onClick" and "<button" branch
- [x] src/components/TuneGrid.tsx contains "initialMeter?: string", "onSelectTune?: (tune: TuneRow) => void", and "if (!onSelectTune)"
- [x] src/components/precent/PsalmPickerModal.tsx contains 'use client', PsalmListingGrid, onSelect, "Add to Set", "leave blank for all", onAdd with { psalmId, verseRange }
- [x] src/components/precent/TunePickerModal.tsx contains 'use client', TuneGrid, initialMeter, onSelectTune, "Select Tune", "pre-filtered", max-w-3xl
- [x] vitest items/route.test.ts: 2/2 GREEN
- [x] tsc --noEmit: 0 new errors in plan-03 files
- [x] Commits 40e1753, 1583e3a, 581a0b1 present in git log
