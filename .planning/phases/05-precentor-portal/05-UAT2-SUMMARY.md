---
phase: "05"
plan: "UAT2"
subsystem: precentor-portal
tags: [uat, precenting, modals, navigation, ui-polish]
dependency_graph:
  requires: [05-UAT1]
  provides: [set-edit-delete, tune-picker-table, precenting-amber-arrows]
  affects: [SetDetail, PrecentingBar, PsalmTopBar, TuneTable, TunePickerModal, PsalmPickerModal, SingingView]
tech_stack:
  added: []
  patterns: [shadcn-dialog, shadcn-calendar, shadcn-select, shadcn-popover, precenting-nav-override]
key_files:
  created: []
  modified:
    - src/components/precent/SetDetail.tsx
    - src/components/precent/PrecentingBar.tsx
    - src/components/precent/TunePickerModal.tsx
    - src/components/precent/PsalmPickerModal.tsx
    - src/components/TuneTable.tsx
    - src/components/singing/PsalmTopBar.tsx
    - src/components/singing/SingingView.tsx
    - src/app/precent/[id]/sing/[pos]/page.tsx
    - src/app/precent/[id]/page.tsx
decisions:
  - "TunePickerModal now uses TuneTable (full search+filter experience) instead of TuneGrid (card grid)"
  - "TuneRow type unified to TuneTable.TuneRow across precenting components (richer type is superset)"
  - "Precenting navigation moved from PrecentingBar arrows into PsalmTopBar amber arrow overrides"
  - "PrecentingBar simplified to thin 8px status label strip"
  - "initialFocus removed from Calendar — not supported in this shadcn version"
metrics:
  duration_minutes: 25
  completed_date: "2026-06-15"
  tasks_completed: 3
  files_modified: 9
---

# Phase 05 UAT Batch 2 Summary

Edit/delete controls for set header, TuneTable-powered tune picker modal with full search, and redesigned precenting navigation with amber-coloured arrows in PsalmTopBar.

## Tasks Completed

### Task 1: Edit/Delete controls + metadata in set detail header (da42a9c)

- Added Edit Date & Type dialog triggered by pencil icon — uses shadcn Calendar (in Popover) + Select for AM/PM/Other type
- Added Delete set dialog triggered by Trash2 icon — confirmation text, calls `DELETE /api/precent/[id]`, navigates to `/precent`
- Both pencil and trash icons grouped in a flex row, replacing the single inline-edit pencil
- Created/Last modified metadata shown in small muted text below the note
- `SerializedSet` interface extended with `createdAt: string` and `updatedAt: string`
- Page serializes both via `.toISOString()` from the DB timestamp columns

### Task 2: Fix modal squishing + TuneTable in TunePickerModal (fa38dd4)

- `TuneTable` gains two optional props: `onSelectTune?: (tune: TuneRow) => void` and `hideExport?: boolean`
- When `onSelectTune` is provided, rows get `cursor-pointer` and `onClick` handler
- When `hideExport` is true, the Download CSV button is hidden
- `TunePickerModal` replaced TuneGrid with TuneTable — users now get full search, meter/mood filters, column toggles
- Modal widened to `max-w-5xl w-full max-h-[90vh]` with `overflow-y-auto flex-1 min-h-0` scroll container
- `PsalmPickerModal` widened from `max-w-2xl max-h-[80vh]` to `max-w-5xl w-full max-h-[90vh]`, inner scroll div gets `min-h-0`
- `TuneRow` type unified: `TunePickerModal` and `SetDetail` now import from `TuneTable` (richer type); page.tsx import updated accordingly

### Task 3: Precenting bar redesign (4a201e5)

- `PrecentingBar` rewritten as thin 8px amber strip — no arrows, just "Precenting Mode — N / M" label
- `setId` prop removed (no longer needed for navigation)
- `PsalmTopBar` gains `precentingPrevHref?: string | null` and `precentingNextHref?: string | null` props
- When precenting props are provided: arrows use those hrefs (null = disabled span), rendered with `text-amber-600 dark:text-amber-400`
- Keyboard ArrowLeft/ArrowRight handler respects precenting hrefs when provided
- `SingingView` threads both new props through to `PsalmTopBar`
- `sing/[pos]/page.tsx` computes `precentingPrevHref`/`precentingNextHref` from position/total and passes them

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed `initialFocus` from Calendar — not a valid prop**
- Found during: TypeScript build check
- Issue: `initialFocus` is not accepted by this shadcn Calendar version (react-day-picker v9 API)
- Fix: Removed the prop; calendar renders without it (still opens in Popover)
- Files modified: `src/components/precent/SetDetail.tsx`
- Commit: da42a9c (amended via re-commit)

**2. [Rule 1 - Bug] Fixed `onValueChange` type mismatch on Select for type field**
- Found during: TypeScript build check
- Issue: `setEditType` is `Dispatch<SetStateAction<string>>` but Select passes `string | null`
- Fix: Wrapped in `(v) => setEditType(v ?? set.type)` to handle the null case
- Files modified: `src/components/precent/SetDetail.tsx`
- Commit: 4a201e5

**3. [Rule 1 - Bug] TuneRow type mismatch between TuneGrid and TuneTable**
- Found during: TypeScript build check after switching TunePickerModal to TuneTable
- Issue: `TuneGrid.TuneRow` (6 fields) is a subset of `TuneTable.TuneRow` (13 fields); passing the narrower type to TuneTable failed
- Fix: Updated TunePickerModal, SetDetail, and precent/[id]/page.tsx to import TuneRow from TuneTable
- Files modified: `src/components/precent/TunePickerModal.tsx`, `src/components/precent/SetDetail.tsx`, `src/app/precent/[id]/page.tsx`
- Commit: 4a201e5

## Self-Check

- [x] da42a9c exists in git log
- [x] fa38dd4 exists in git log
- [x] 4a201e5 exists in git log
- [x] `npm run build` passes with no TypeScript errors
- [x] All 9 modified files tracked in git

## Self-Check: PASSED
