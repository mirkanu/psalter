---
phase: "05"
plan: "UAT1"
subsystem: precentor-portal
tags: [uat-fix, precentor, set-detail, reactivity, psalm-picker]
dependency_graph:
  requires: [05-precentor-portal]
  provides: [uat-gap-fixes-batch-1]
  affects: [precent-page, set-detail, set-item-row]
tech_stack:
  added: []
  patterns: [optimistic-ui-sync-with-useEffect, router.refresh-after-mutation]
key_files:
  created: []
  modified:
    - src/app/precent/page.tsx
    - src/app/precent/[id]/page.tsx (no change — SetDetail owns the heading)
    - src/app/api/precent/[id]/items/[itemId]/route.ts
    - src/components/precent/PrecentingSetList.tsx
    - src/components/precent/SetDetail.tsx
    - src/components/precent/SetItemsSortableList.tsx
    - src/components/precent/SetItemRow.tsx
decisions:
  - "Psalm number in set detail shows only the numeric ID (not full title) to keep the row compact; psalm title is still accessible via PsalmPickerModal"
  - "Recommended tune shown italic/muted to distinguish from explicitly assigned tune"
  - "useEffect + isDragging ref pattern chosen over key-remounting to avoid losing drag sensor state"
  - "psalmPickerMode ('add'/'change') stored in SetDetail to reuse the existing PsalmPickerModal for both flows"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-15T10:18:41Z"
  tasks_completed: 5
  files_changed: 7
---

# Phase 05 UAT Batch 1: Data and Display Fixes Summary

Fixes for Phase 5 UAT gaps — page title wording, psalm list column, psalm-number-only display with inline change flow, default tune fallback, and reactivity on successive psalm additions.

## Tasks Completed

### Task 1: Fix page titles (commit 105db84)
- `/precent` h1: "Precenting Sets" → "My Psalm Sets for Precenting"
- `SetDetail` h1: now static "Psalm Set for Precenting"; date/type/precentor moved to a single subtitle line

### Task 2: Add Psalms column to set list (commit ca2ee21)
- `precent/page.tsx` now fetches `setItems` (psalmId, position) via Drizzle relational query using `with: { setItems: { orderBy: [asc(setItems.position)] } }`
- Serialises `psalmIds: number[]` and passes to `PrecentingSetList`
- `PrecentingSetList` adds "Psalms" column rendering comma-separated psalm numbers (e.g. "3, 23, 46"), or "—" if empty

### Task 3: Psalm column shows number only + click to change (commit 507a66a)
- PATCH `/api/precent/[id]/items/[itemId]` now accepts `psalmId` field (validated: integer 1–150)
- `SetItemRow` Psalm cell: removed full title link, replaced with a `<button>` showing just the psalm number
- Clicking psalm number opens `PsalmPickerModal` in "change" mode via `onPsalmClick` callback
- `SetDetail` tracks `psalmPickerMode` ('add' | 'change') and `psalmPickerItemId`; dispatches PATCH or POST accordingly
- Props `allPsalms` and `onPsalmClick` threaded through `SetItemsSortableList` → `SetItemRow`

### Task 4: Tune column shows recommended tune by default (commit d6fa921)
- `SetDetail` builds `recommendedTuneByPsalmId` map from `psalmListRows` (which includes `recommendedTune` from the primary `psalmVersionTunes` join in `fetchPsalmListRows`)
- Map threaded through `SetItemsSortableList` → `SetItemRow`
- `SetItemRow` Tune cell: assigned tune shown normally; if null, recommended tune shown italic/muted; if neither, shows "—"

### Task 5: Fix reactivity for successive psalm additions (commit 9e30eb2)
- Root cause: `SetItemsSortableList` used `useState(items)` which only initialises once at mount — `router.refresh()` updated the RSC props but the optimistic state was stale
- Fix: `useEffect` syncs `optimisticItems` from `items` prop whenever it changes
- `isDragging` ref prevents the sync overriding the optimistic reorder state mid-gesture
- `handleDelete` now also calls `router.refresh()` after successful delete to confirm server state

### Deviation: Link import missing (commit 548e50e)
- **Rule 1 - Bug**: Removing `Link` import in Task 3 (while replacing the psalm cell Link with a button) accidentally broke the play-precenting action button which still uses `Link`
- Fixed by restoring the import; caught by TypeScript check before deploy

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored accidentally removed Link import**
- **Found during:** TypeScript verification after Task 3
- **Issue:** Removing `import Link from 'next/link'` in SetItemRow broke the play-precenting action button (still uses `<Link>`)
- **Fix:** Restored the import
- **Files modified:** `src/components/precent/SetItemRow.tsx`
- **Commit:** 548e50e

**2. [Rule 2 - Missing] router.refresh() after delete mutation**
- **Found during:** Task 5 analysis
- **Issue:** `handleDelete` in `SetItemsSortableList` used optimistic removal but never confirmed with server state via `router.refresh()`
- **Fix:** Added `router.refresh()` on successful delete response
- **Files modified:** `src/components/precent/SetItemsSortableList.tsx`
- **Commit:** 9e30eb2

## Known Stubs

None — all data displayed is live from the database.

## Self-Check: PASSED

All commits verified in git log. All source files modified as described. TypeScript: 0 errors in `src/`.
