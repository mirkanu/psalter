---
phase: 05-precentor-portal
verified: 2026-06-15T09:30:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Create a new set via /precent and verify navigation to /precent/[id]"
    expected: "After clicking 'Create Set' with a valid date and type, the user is redirected to the set detail page showing the new set header"
    why_human: "Client-side navigation after POST requires a browser; curl cannot follow the JavaScript router.push call in CreateSetForm"
  - test: "Drag-reorder two rows in /precent/[id] and reload the page"
    expected: "The row order after the reload matches the dragged order, confirming the POST /api/precent/[id]/reorder persisted"
    why_human: "Actual pointer drag simulation is excluded from automated smoke checks due to flakiness in headless; the spec only checks handle presence"
  - test: "Add a psalm via PsalmPickerModal and assign a tune via TunePickerModal"
    expected: "After selecting a psalm, a verse-range input appears; clicking 'Add to Set' adds the row; clicking the tune cell opens the TunePickerModal pre-filtered by the psalm's meter; selecting a tune updates the row"
    why_human: "Multi-step modal interaction and meter pre-filtering are client-side behaviors that require a browser to exercise"
  - test: "Verify meter mismatch highlight: add a psalm (e.g. CM) and assign a tune with a different meter (e.g. LM)"
    expected: "The row gains a amber left border and a 'Meter mismatch' badge in the tune cell; a tooltip shows 'Psalm is CM, tune is LM'"
    why_human: "Requires specific psalm/tune combination selection in the browser; cannot be scripted without knowing a CM psalm and LM tune pairing in the fixture data"
deferred:
  - truth: "Precentor can log in with email and password (AUTH-01)"
    addressed_in: "Phase 05.1"
    evidence: "ROADMAP.md Phase 05.1 goal: 'Protect all /precent/* routes behind Better Auth login; admin-created accounts only'; requirements: AUTH-01, AUTH-02. D-10 in all Phase 5 plans explicitly states routes are unprotected by design, to be addressed in Phase 05.1."
  - truth: "Precentor accounts are admin-created only (AUTH-02)"
    addressed_in: "Phase 05.1"
    evidence: "ROADMAP.md Phase 05.1 success criteria 4: 'An admin can create precentor accounts via a CLI script or minimal admin UI; no self-registration route exists'"
---

# Phase 05: Precentor Portal Verification Report

**Phase Goal:** Build the Precentor Portal — authenticated precentor workflow for creating and managing precenting sets, assigning psalm/tune pairs with drag-and-drop reordering, and a live precenting view that displays the full singing experience one item at a time.
**Verified:** 2026-06-15T09:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | precenting_sets and set_items tables exist in the live psalter-db database | VERIFIED | `SELECT to_regclass('precenting_sets')` → `precenting_sets`; `to_regclass('set_items')` → `set_items`; 16 rows in precenting_sets, 3 in set_items |
| 2 | dnd-kit and shadcn Calendar are installed and importable | VERIFIED | `package.json` has `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`; `src/components/ui/calendar.tsx` exists |
| 3 | SiteHeader shows a 'Precent' nav item linking to /precent | VERIFIED | `src/components/SiteHeader.tsx` line 14: `{ href: "/precent", label: "Precent" }` |
| 4 | A precentor can open /precent and see a list of all Precenting Sets; can create a new set | VERIFIED | GET `/api/precent` returns 16 sets (live); `src/app/precent/page.tsx` renders "Precenting Sets" heading and "New Set" button; CreateSetForm POSTs to `/api/precent` with `useTransition` + Loader2 |
| 5 | A precentor can assign psalm + tune pairs via picker modals with optional verse ranges | VERIFIED | `PsalmPickerModal` wraps `PsalmListingGrid` with `onSelect`; two-step flow (grid → verse range → Add to Set); `TunePickerModal` wraps `TuneGrid` with `initialMeter` pre-filter; item API uses `Math.max` transaction for auto-position |
| 6 | A precentor can open /precent/[id] and see ordered psalm rows; drag-reorder persists with revert on error | VERIFIED | Live check: `/precent/9` returns "Add Psalm" and "Start Precenting"; `SetItemsSortableList` has `DndContext`, `arrayMove`, fetch to `/reorder`, `setOptimisticItems(items)` revert on error; `SetItemRow` has `GripVertical` with `{...listeners}` on handle only (not on `<tr>`) |
| 7 | Meter mismatch rows are amber-highlighted with a 'Meter mismatch' indicator | VERIFIED | `SetItemRow` line 65: `bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400` on mismatch; line 134: "Meter mismatch" badge; mismatch computed as `psalmMeter !== item.tune.meter` after trim/uppercase |
| 8 | A precentor can open /precent/[id]/sing/[pos] and see SingingView with notation + amber PrecentingBar | VERIFIED | Live check: `/precent/9/sing/1` returns "Precenting Mode" and `data-singing-play` in HTML; `page.tsx` replicates full `/psalms/[id]` data pipeline; `PrecentingBar` uses `invisible pointer-events-none` at boundaries |
| 9 | The three Wave 0 Playwright specs are passing assertions (PREC-03/04/05/06) | VERIFIED | All three specs run and pass: precent-detail (4/4), precent-reorder (2/2), precent-sing (7/7) — 13 total assertions, 0 failures |

**Score:** 9/9 truths verified

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | AUTH-01: Precentor can log in with email and password | Phase 05.1 | ROADMAP.md Phase 05.1: "Better Auth login, /precent/* route protection"; Phase 5 plans document D-10: "routes unprotected by design in Phase 5; Phase 05.1 adds protection" |
| 2 | AUTH-02: Precentor accounts are admin-created only | Phase 05.1 | ROADMAP.md Phase 05.1 success criteria 4: "An admin can create precentor accounts via a CLI script or minimal admin UI; no self-registration route exists" |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/schema.ts` | precentingSets + setItems definitions + relations | VERIFIED | Lines 325–355: both tables + `precentingSetsRelations` + `setItemsRelations` |
| `src/components/ui/calendar.tsx` | shadcn Calendar component | VERIFIED | Exists; build error with `table:` key fixed to `month_grid:` in plan 05 |
| `src/app/api/precent/route.ts` | GET all sets + POST create with validation | VERIFIED | Exports GET and POST; validates date, type enum, note length |
| `src/app/api/precent/[id]/route.ts` | PATCH update + DELETE set | VERIFIED | Exports PATCH and DELETE; `await params` + `isNaN` guard |
| `src/app/precent/page.tsx` | RSC set list page | VERIFIED | `force-dynamic`, queries `precentingSets.findMany`, renders `PrecentingSetList` |
| `src/components/precent/CreateSetForm.tsx` | Client form with Calendar date picker + type select | VERIFIED | `useTransition`, `Loader2`, fetches `/api/precent`, AM/PM/Other options |
| `src/components/precent/PrecentingSetList.tsx` | Client table with row navigation + empty state | VERIFIED | `'use client'`, `router.push`, "No precenting sets yet" |
| `src/app/precent/loading.tsx` | Skeleton for /precent | VERIFIED | `Skeleton`, `max-w-4xl` |
| `src/app/api/precent/[id]/items/route.ts` | POST add item with next-position | VERIFIED | `Math.max`, transaction, `isNaN(setId)`, `psalmId` type check |
| `src/app/api/precent/[id]/items/[itemId]/route.ts` | PATCH + DELETE scoped to set | VERIFIED | `and(eq(setItems.id`, `eq(setItems.setId` — set-scoped |
| `src/components/precent/PsalmPickerModal.tsx` | Dialog embedding PsalmListingGrid + verse range step | VERIFIED | `'use client'`, `PsalmListingGrid`, `onSelect`, "Add to Set", "leave blank for all" |
| `src/components/precent/TunePickerModal.tsx` | Dialog embedding TuneGrid with initialMeter | VERIFIED | `'use client'`, `TuneGrid`, `initialMeter`, `onSelectTune`, "pre-filtered" |
| `src/app/api/precent/[id]/reorder/route.ts` | POST batch position update in transaction | VERIFIED | `Array.isArray(ids)`, `typeof n === 'number'`, `db.transaction`, set-scoped `and()` |
| `src/app/precent/[id]/page.tsx` | RSC set detail page with items joined | VERIFIED | `force-dynamic`, `asc(setItems.position)`, `notFound()`, serializes items |
| `src/app/precent/[id]/loading.tsx` | Skeleton for set detail | VERIFIED | `Skeleton`, `h-14` row skeletons |
| `src/components/precent/SetDetail.tsx` | Set detail shell with header, modals, action bar | VERIFIED | "Add Psalm", "Start Precenting", `bg-amber-100`, `PsalmPickerModal`, `TunePickerModal`, "No psalms added", `router.refresh()` |
| `src/components/precent/SetItemsSortableList.tsx` | dnd-kit sortable table with optimistic reorder | VERIFIED | `DndContext`, `SortableContext`, `arrayMove`, `PointerSensor`, fetch to `/reorder`, revert on error |
| `src/components/precent/SetItemRow.tsx` | Draggable row with handle, mismatch, play, delete | VERIFIED | `useSortable`, `CSS.Transform.toString`, `GripVertical` with `{...listeners}` on handle only, "Meter mismatch", `bg-amber-50`, `PlayCircle`, `Trash2`, "Remove psalm from set?" |
| `src/components/precent/PrecentingBar.tsx` | Amber position bar with boundary nav | VERIFIED | "Precenting Mode", `bg-amber-100`, `ChevronLeft`/`ChevronRight`, `invisible pointer-events-none` at boundaries |
| `src/app/precent/[id]/sing/[pos]/page.tsx` | RSC precenting-mode page | VERIFIED | `force-dynamic`, no `generateStaticParams`, `fetchPsalmDetail(item.psalmId)`, `SingingView`, `prevSlug={null}`, `nextSlug={null}`, `PrecentingBar`, `item.tuneId` override |
| `src/app/precent/[id]/sing/[pos]/loading.tsx` | Amber bar + singing-view skeleton | VERIFIED | `bg-amber-50`, `animate-pulse` amber bar prepended |
| `tests/precent-detail.spec.ts` | PREC-04 passing assertions | VERIFIED | 4/4 assertions pass; no `test.fixme` |
| `tests/precent-reorder.spec.ts` | PREC-03 drag handle assertions | VERIFIED | 2/2 assertions pass; no `test.fixme` |
| `tests/precent-sing.spec.ts` | PREC-05 + PREC-06 passing assertions | VERIFIED | 7/7 assertions pass; no `test.fixme` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/precent/CreateSetForm.tsx` | `/api/precent` | `fetch POST` | WIRED | Line 54: `fetch('/api/precent', ...)` with method POST |
| `src/app/precent/page.tsx` | `precentingSets` table | `db.query.precentingSets.findMany` | WIRED | Line 11: `db.query.precentingSets.findMany({ orderBy: [desc(precentingSets.date)] })` |
| `src/components/precent/PsalmPickerModal.tsx` | `PsalmListingGrid` `onSelect` | `onSelect` prop | WIRED | Line 56: `<PsalmListingGrid psalms={psalms} onSelect={(p) => setSelected(p)} />` |
| `src/components/precent/TunePickerModal.tsx` | `TuneGrid` `onSelectTune` | props | WIRED | Line 40: `onSelectTune={(t) => { onSelect(t); onClose() }}` |
| `src/components/precent/PsalmPickerModal.tsx` | `/api/precent/[id]/items` | `fetch POST` | WIRED | `onAdd` prop drives fetch from `SetDetail.tsx` (caller-side, not modal-internal) |
| `src/components/precent/SetItemsSortableList.tsx` | `/api/precent/[id]/reorder` | `fetch POST` on dragEnd | WIRED | Line 60: `fetch(\`/api/precent/${setId}/reorder\`, { method: 'POST', ... })` |
| `src/components/precent/SetDetail.tsx` | `PsalmPickerModal` + `TunePickerModal` | modal triggers | WIRED | Lines 9-10 import both modals; lines 185+192 render them |
| `src/app/precent/[id]/page.tsx` | `precentingSets` + `setItems` | `db.query.findFirst` with relations | WIRED | Lines 22-33: `precentingSets.findFirst({ with: { setItems: { orderBy: [...] } } })` |
| `src/app/precent/[id]/sing/[pos]/page.tsx` | `SingingView` | renders with `PrecentingBar` above | WIRED | Lines 95-96: `<PrecentingBar ... /><SingingView .../>` |
| `src/components/precent/PrecentingBar.tsx` | `/precent/[id]/sing/[pos±1]` | `next/link` nav arrows | WIRED | Links to `/precent/${setId}/sing/${pos - 1}` and `pos + 1` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/app/precent/page.tsx` | `sets` | `db.query.precentingSets.findMany` | Yes — live DB returns 16 rows | FLOWING |
| `src/app/precent/[id]/page.tsx` | `set` | `db.query.precentingSets.findFirst` with `setItems` relations | Yes — live DB joins items | FLOWING |
| `src/app/precent/[id]/sing/[pos]/page.tsx` | `psalm`, `primaryTune`, `lyrics` | `fetchPsalmDetail(item.psalmId)` → full data pipeline | Yes — replicates `/psalms/[id]` pipeline; live page returns `data-singing-play` | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| GET /api/precent returns non-empty array | `curl -s http://localhost:3005/api/precent` | 16 sets returned with id, date, type, precentorName | PASS |
| POST /api/precent rejects missing date | `curl -X POST ... -d '{"type":"AM Service"}'` | `{"error":"date is required"}` | PASS |
| /precent page renders list + New Set button | `curl http://localhost:3005/precent` | "Precenting Sets", "New Set" in HTML | PASS |
| /precent/9 renders set detail | `curl http://localhost:3005/precent/9` | "Add Psalm", "Start Precenting" in HTML | PASS |
| /precent/9/sing/1 renders PrecentingBar + play control | `curl http://localhost:3005/precent/9/sing/1` | "Precenting Mode", `data-singing-play` in HTML | PASS |
| precent-detail spec (PREC-04) | `NODE_PATH=... node tests/precent-detail.spec.ts` | 4/4 passed | PASS |
| precent-reorder spec (PREC-03) | `NODE_PATH=... node tests/precent-reorder.spec.ts` | 2/2 passed | PASS |
| precent-sing spec (PREC-05 + PREC-06) | `NODE_PATH=... node tests/precent-sing.spec.ts` | 7/7 passed | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PREC-01 | Plan 02 | Precentor can create a service event (date + AM/PM) | SATISFIED | `/api/precent` POST with validation; `/precent` list page; CreateSetForm; vitest 3/3 GREEN |
| PREC-02 | Plan 03 | Precentor can assign psalm + tune pairs, specifying verses/stanzas | SATISFIED | `/api/precent/[id]/items` CRUD; PsalmPickerModal (two-step + verse range); TunePickerModal (meter pre-filter); vitest 2/2 GREEN |
| PREC-03 | Plan 04 | Precentor can edit and reorder psalm slots | SATISFIED | `/api/precent/[id]/reorder` POST; `SetItemsSortableList` dnd-kit; optimistic + revert; vitest 2/2 GREEN; Playwright 2/2 pass |
| PREC-04 | Plan 04 | Precentor can view a service set list overview | SATISFIED | `/precent/[id]` RSC page; `SetDetail` + `SetItemRow` with columns; Playwright 4/4 pass |
| PREC-05 | Plan 05 | Service view shows psalms in sequence with notation pre-loaded | SATISFIED | `/precent/[id]/sing/[pos]` RSC replicating full data pipeline; Playwright 7/7 pass |
| PREC-06 | Plan 05 | Precentor can preview tune melody via abcjs Web Audio API | SATISFIED | `data-singing-play` present on live page; existing `SingingView` play control reused; Playwright asserts play button |
| AUTH-01 | (none — deferred to Phase 05.1) | Precentor can log in with email and password | DEFERRED | Phase 05.1 per ROADMAP.md; D-10 design decision in all Phase 5 plans |
| AUTH-02 | (none — deferred to Phase 05.1) | Precentor accounts are admin-created only | DEFERRED | Phase 05.1 per ROADMAP.md |

AUTH-01 and AUTH-02 appear in REQUIREMENTS.md under "Phase 5: Precentor Portal" in the traceability table but are NOT claimed by any Phase 5 plan's `requirements:` frontmatter (plans 01-05 only list PREC-01 through PREC-06). The ROADMAP.md explicitly inserts Phase 05.1 for AUTH-01/02. These are correctly deferred.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|---------|--------|
| `src/components/precent/SetDetail.tsx` | 113 | `placeholder="Add a note for this set…"` | Info | HTML input placeholder — not a stub; this is UX text on the note edit field |

No blockers found. The `placeholder` attribute is a form input label, not a missing implementation.

### Human Verification Required

#### 1. Set Creation + Navigation

**Test:** Open `http://localhost:3005/precent`, click "New Set", select a date and type, submit.
**Expected:** The dialog closes and the browser navigates to `/precent/[new-id]` showing the new set header. The new set also appears in the list at `/precent`.
**Why human:** `CreateSetForm` calls `router.push('/precent/' + id)` in the browser after a successful POST. curl cannot exercise client-side navigation.

#### 2. Drag-Reorder Persistence

**Test:** Open `/precent/9`, drag a psalm row to a different position, then reload the page.
**Expected:** The order after reload matches the dragged order. The reorder API persisted the new positions.
**Why human:** The Playwright spec only checks that drag handles (`aria-label="Drag to reorder"`) are present. It does not perform an actual pointer drag (excluded as flaky in headless). Persistence requires a human drag interaction.

#### 3. PsalmPickerModal + TunePickerModal Flow

**Test:** In `/precent/9`, click "Add Psalm", search for a psalm, click it, enter a verse range, click "Add to Set". Then click the tune cell of the new row and select a tune with a different meter from the psalm.
**Expected:** The psalm row appears. The tune cell opens TunePickerModal pre-filtered to the psalm's meter. After selecting a mismatched-meter tune, the row shows the amber "Meter mismatch" badge with tooltip.
**Why human:** Multi-step modal interaction with filter verification requires browser; curl returns static SSR HTML with no client state.

#### 4. Meter Mismatch Tooltip Content

**Test:** Open a row with a meter mismatch; hover the "Meter mismatch" badge.
**Expected:** Tooltip shows "Psalm is [meter], tune is [tune-meter]. Choose a matching tune or proceed as arranged."
**Why human:** Tooltip content is rendered dynamically in JavaScript; curl only captures the static markup.

### Gaps Summary

No gaps found. All 9 observable truths are VERIFIED by codebase evidence and behavioral spot-checks. All PREC requirements (PREC-01 through PREC-06) are satisfied. AUTH-01 and AUTH-02 are correctly deferred to Phase 05.1 per explicit ROADMAP.md design decision.

The `human_needed` status is set because 4 items require browser interaction to fully confirm client-side behavior (navigation after form submission, drag persistence, modal multi-step flow, tooltip content). All automated checks pass.

---

_Verified: 2026-06-15T09:30:00Z_
_Verifier: Claude (gsd-verifier)_
