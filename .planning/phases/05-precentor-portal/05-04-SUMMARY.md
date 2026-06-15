---
phase: 05-precentor-portal
plan: 04
subsystem: precentor-portal
tags: [api, dnd-kit, sortable, drag-and-drop, set-detail, meter-mismatch, tdd]
dependency_graph:
  requires:
    - precenting_sets + set_items tables (plan 01)
    - PsalmPickerModal + TunePickerModal (plan 03)
    - fetchPsalmListRows + fetchAllTunes queries (plans 02/03)
    - @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities (plan 01)
  provides:
    - POST /api/precent/[id]/reorder (batch position update)
    - /precent/[id] RSC page (set + items joined server-side)
    - /precent/[id]/loading.tsx (skeleton)
    - SetDetail shell (header, Add Psalm, Start Precenting, modals)
    - SetItemsSortableList (dnd-kit DndContext + SortableContext)
    - SetItemRow (useSortable, handle-only drag, mismatch, play, delete)
  affects:
    - src/app/api/precent/[id]/reorder/route.ts
    - src/app/precent/[id]/page.tsx
    - src/app/precent/[id]/loading.tsx
    - src/components/precent/SetDetail.tsx
    - src/components/precent/SetItemsSortableList.tsx
    - src/components/precent/SetItemRow.tsx
    - src/app/layout.tsx (Toaster added)
tech_stack:
  added:
    - sonner@2.0.7 (toast notifications)
  patterns:
    - dnd-kit v6 handle-only drag (listeners on GripVertical button, not tr)
    - Optimistic reorder with revert: setOptimisticItems(reordered) → fetch → setOptimisticItems(items) on error
    - base-ui render= prop pattern for TooltipTrigger and DialogClose (not asChild)
    - RSC serialization: date/timestamp fields mapped to strings before crossing client boundary
    - psalmMeterById: first-wins map from fetchPsalmListRows output
key_files:
  created:
    - src/app/api/precent/[id]/reorder/route.ts
    - src/app/precent/[id]/page.tsx
    - src/app/precent/[id]/loading.tsx
    - src/components/precent/SetDetail.tsx
    - src/components/precent/SetItemsSortableList.tsx
    - src/components/precent/SetItemRow.tsx
  modified:
    - src/app/layout.tsx (Toaster)
    - package.json (sonner added)
decisions:
  - "TooltipTrigger and DialogClose use render= prop (base-ui pattern), not asChild (Radix pattern) — consistent with rest of codebase (D-04.9.3-04)"
  - "sonner installed (not yet in project) for toast.error on reorder/delete failures; Toaster added to root layout"
  - "SetItemView type defined in SetItemsSortableList.tsx and imported by SetItemRow to avoid circular deps"
  - "psalmMeterById built as first-wins map: if a psalm has multiple versions, the first PsalmRow encountered wins (matches fetchPsalmListRows sort order — version id asc)"
  - "listeners/attributes spread on handle button only, never on tr — avoids interfering with tune/delete click targets"
metrics:
  duration_seconds: 900
  completed_date: "2026-06-15"
  tasks_completed: 3
  files_created: 6
  files_modified: 2
---

# Phase 05 Plan 04: Set Detail Page Summary

**One-liner:** PREC-03 + PREC-04 complete — batch reorder API (set-scoped transaction), /precent/[id] RSC page with psalm+tune joins, dnd-kit sortable table with handle-only drag, optimistic reorder+revert, meter-mismatch amber highlight, play link, and delete-with-confirmation Dialog.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Batch reorder API route (TDD — GREEN) | 0507437 | src/app/api/precent/[id]/reorder/route.ts |
| 2 | Set detail RSC page + loading skeleton + SetDetail shell | 349b191 | src/app/precent/[id]/page.tsx, src/app/precent/[id]/loading.tsx, src/components/precent/SetDetail.tsx |
| 3 | dnd-kit sortable table (SetItemsSortableList + SetItemRow) | 8cc2f2f | src/components/precent/SetItemsSortableList.tsx, src/components/precent/SetItemRow.tsx, src/app/layout.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Installed sonner + added Toaster to root layout**
- **Found during:** Task 3
- **Issue:** Plan references `toast.error()` from 'sonner', but sonner was not in package.json and no toast provider was in the app
- **Fix:** `npm install sonner@2.0.7`; added `<Toaster richColors />` to `src/app/layout.tsx`
- **Files modified:** src/app/layout.tsx, package.json
- **Commit:** 8cc2f2f

**2. [Rule 1 - Bug] TooltipTrigger/DialogClose render= not asChild**
- **Found during:** Task 3 TypeScript check
- **Issue:** Plan example used `asChild` on TooltipTrigger and DialogClose, but the project uses base-ui/react (not Radix) which requires `render=` prop, not `asChild`
- **Fix:** Replaced all `asChild` usages with `render={<Element />}` pattern on TooltipTrigger and DialogClose — consistent with existing codebase (MetadataPanel.tsx, dialog.tsx)
- **Files modified:** src/components/precent/SetItemRow.tsx
- **Commit:** 8cc2f2f

## Known Stubs

None. All features are fully wired. The `/precent/[id]/sing/[pos]` target routes (plan 05) do not yet exist, so Play links will 404 until plan 05 is complete — this is expected at this stage.

## Threat Flags

No new security surface beyond what was declared in the plan threat model. All three threat entries (T-05-03, T-05-09, T-05-10) are mitigated:
- T-05-03/T-05-09: `and(eq(setItems.id, ids[i]), eq(setItems.setId, setId))` — foreign ids are no-ops
- T-05-10: Drizzle parameterised queries; positions are loop indices (server-owned)

## Self-Check: PASSED

- [x] src/app/api/precent/[id]/reorder/route.ts exists, exports POST, contains Array.isArray(ids) and typeof n === 'number' and status: 400 and db.transaction and and(eq(setItems.id and eq(setItems.setId
- [x] src/app/precent/[id]/page.tsx contains export const dynamic = 'force-dynamic', await params, notFound(), asc(setItems.position)
- [x] src/app/precent/[id]/loading.tsx contains Skeleton and h-14
- [x] src/components/precent/SetDetail.tsx contains 'use client', Add Psalm, Start Precenting, bg-amber-100, PsalmPickerModal, TunePickerModal, No psalms added, fetch to /api/precent/ + items, router.refresh()
- [x] src/components/precent/SetItemsSortableList.tsx contains DndContext, SortableContext, arrayMove, PointerSensor, /reorder, setOptimisticItems(items) revert, Reorder didn't save
- [x] src/components/precent/SetItemRow.tsx contains useSortable, CSS.Transform.toString, GripVertical with {...listeners}, touch-none, Meter mismatch, bg-amber-50, PlayCircle, Trash2, Remove psalm from set?
- [x] SetItemRow does NOT spread {...listeners} on the tr element (only on the GripVertical handle button)
- [x] Wave 0 reorder test: 2/2 GREEN (npx vitest run src/app/api/precent/[id]/reorder/route.test.ts)
- [x] npx tsc --noEmit: 0 new errors in plan-04 files
- [x] Commits 0507437, 349b191, 8cc2f2f present in git log
