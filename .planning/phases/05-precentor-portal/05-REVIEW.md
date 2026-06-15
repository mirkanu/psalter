---
phase: 05-precentor-portal
reviewed: 2026-06-15T12:00:00Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - src/app/api/precent/[id]/items/[itemId]/route.ts
  - src/app/api/precent/[id]/items/route.test.ts
  - src/app/api/precent/[id]/items/route.ts
  - src/app/api/precent/[id]/reorder/route.test.ts
  - src/app/api/precent/[id]/reorder/route.ts
  - src/app/api/precent/[id]/route.ts
  - src/app/api/precent/route.test.ts
  - src/app/api/precent/route.ts
  - src/app/precent/[id]/loading.tsx
  - src/app/precent/[id]/page.tsx
  - src/app/precent/[id]/sing/[pos]/loading.tsx
  - src/app/precent/[id]/sing/[pos]/page.tsx
  - src/app/precent/loading.tsx
  - src/app/precent/page.tsx
  - src/components/precent/CreateSetForm.tsx
  - src/components/precent/PrecentingBar.tsx
  - src/components/precent/PrecentingSetList.tsx
  - src/components/precent/PsalmPickerModal.tsx
  - src/components/precent/SetDetail.tsx
  - src/components/precent/SetItemRow.tsx
  - src/components/precent/SetItemsSortableList.tsx
  - src/components/precent/TunePickerModal.tsx
  - src/components/PsalmListingGrid.tsx
  - src/components/PsalmNumberBox.tsx
  - src/components/TuneGrid.tsx
  - src/components/ui/calendar.tsx
  - tests/precent-detail.spec.ts
  - tests/precent-reorder.spec.ts
  - tests/precent-sing.spec.ts
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-15T12:00:00Z
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

This phase implements a precentor portal: CRUD for precenting sets, a sortable item list, psalm/tune pickers, and a live singing view. The overall structure is sound — API routes validate types, the reorder endpoint is scoped to the set's own items, and optimistic UI patterns are correctly applied.

Two blockers exist. The most severe is that **all five `/api/precent` API routes have zero authentication or authorisation checks**. Any unauthenticated HTTP client can create, modify, reorder, or delete precenting sets and their items. The stack uses Better Auth but no middleware or per-route session guard is wired to the precent API surface. The second blocker is a **silent data corruption path** in the reorder route: if the client sends an empty `ids` array, the transaction succeeds with `{ ok: true }` but position values are left in whatever state the DB holds, which can diverge from the UI silently.

Five warnings cover a tune override logic gap that silently falls back to the wrong tune, an unvalidated date string written to a `date` column, an empty `updateSet` PATCH that fires a no-op UPDATE, a dead `allTunes` prop on `SetItemsSortableList`, and a state-clobber bug in the psalm group expand toggle. Three info items are noted below.

---

## Critical Issues

### CR-01: All `/api/precent` routes are unauthenticated

**Files:**
- `src/app/api/precent/route.ts:1`
- `src/app/api/precent/[id]/route.ts:1`
- `src/app/api/precent/[id]/items/route.ts:1`
- `src/app/api/precent/[id]/items/[itemId]/route.ts:1`
- `src/app/api/precent/[id]/reorder/route.ts:1`

**Issue:** None of the five precenting API handlers check for an authenticated session. The project stack includes Better Auth 1.6.9 and the CLAUDE.md project guide notes it is used for "precentor login, admin-created accounts only". Despite this, there is no middleware protecting `/api/precent/**` (confirmed: `middleware-manifest.json` shows `"middleware": {}`), and no per-route session check (`getSession`, cookie validation, etc.). Any anonymous HTTP client can:
- `GET /api/precent` — enumerate all sets
- `POST /api/precent` — create sets
- `PATCH /api/precent/[id]` — rename/change any set
- `DELETE /api/precent/[id]` — delete any set
- `POST /api/precent/[id]/items` — add psalms to any set
- `PATCH /api/precent/[id]/items/[itemId]` — change tune on any item
- `DELETE /api/precent/[id]/items/[itemId]` — remove any item
- `POST /api/precent/[id]/reorder` — reorder any set's items

**Fix:** Add a session guard at the top of every handler (or add a Next.js matcher in `src/middleware.ts`). Example per-route pattern using Better Auth:

```ts
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}
```

Or protect the entire `/api/precent` prefix via `src/middleware.ts`:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/precent') ||
      req.nextUrl.pathname.startsWith('/precent')) {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/api/precent/:path*', '/precent/:path*'] }
```

---

### CR-02: Empty `ids` array in reorder route silently succeeds and corrupts position state

**File:** `src/app/api/precent/[id]/reorder/route.ts:30-37`

**Issue:** When `ids` is `[]` (an empty array), the validation at line 26 passes (`Array.isArray([])` is true, `[].every(...)` is vacuously true). The `for` loop at line 31 executes zero iterations. The route returns `{ ok: true }` without touching the database. The client considers the reorder persisted. If a drag-end event fires immediately after an item delete and the list briefly reports zero items, or if a client bug sends an empty `ids`, the UI optimistically reflects the empty order while the DB retains the old positions. On the next full page load positions will appear "restored" — confusing the user who thought they'd successfully reordered.

More critically: if the caller sends a partial `ids` array (e.g. [3, 1] for a 4-item set), items 3 and 1 get positions 0 and 1, but items 2 and 4 are untouched in the DB and retain their old positions — creating position collisions.

**Fix:** Reject empty arrays and validate that the array length matches the set's actual item count (or at minimum reject empty):

```ts
if (!Array.isArray(ids) || ids.length === 0 || !ids.every((n) => typeof n === 'number')) {
  return NextResponse.json({ error: 'ids must be a non-empty number[]' }, { status: 400 })
}
```

For full correctness, verify the count of items in the set equals `ids.length` inside the transaction before updating:

```ts
await db.transaction(async (tx) => {
  const existing = await tx
    .select({ id: setItems.id })
    .from(setItems)
    .where(eq(setItems.setId, setId))
  if (existing.length !== ids.length) {
    throw new Error('ids length mismatch')
  }
  // ... update loop
})
```

---

## Warnings

### WR-01: Tune override silently falls back to wrong tune when assigned tune is out-of-meter

**File:** `src/app/api/precent/[id]/sing/[pos]/page.tsx:66-75`

**Issue:** When `item.tuneId` is set but the assigned tune is not found in `alternateTunes` (because it's a different meter than the psalm's default), the code at line 73-74 falls back to `primaryTuneRow` — the psalm's own default tune — ignoring the precentor's explicit tune assignment. The assigned tune is never fetched from the DB by ID, so the user's selection is silently discarded. The comment on line 72 admits this: "Fallback: still use the psalm's default tune". This means a precentor who deliberately assigned an unusual tune (cross-meter) will see and hear the wrong tune during the service.

**Fix:** Fetch the assigned tune from the DB directly when it's not in `alternateTunes`:

```ts
if (item.tuneId) {
  const assignedInAlternates = alternateTunes.find((t) => t.id === item.tuneId)
  if (assignedInAlternates) {
    primaryTune = assignedInAlternates
  } else {
    // Fetch the assigned tune directly — it's cross-meter
    const assignedTune = await db.query.tunes.findFirst({
      where: eq(tunes.id, item.tuneId),
    })
    primaryTune = assignedTune ? buildTuneOption(assignedTune) : null
  }
}
```

---

### WR-02: `date` field accepted without format validation — arbitrary strings written to a PostgreSQL `date` column

**File:** `src/app/api/precent/route.ts:25-27` and `src/app/api/precent/[id]/route.ts:32-36`

**Issue:** The `date` field is validated only as a non-empty string (`body.date.trim() !== ''`). Any string is accepted and passed directly to the `date` column (PostgreSQL type `date`). Sending `"not-a-date"` or `"2026-13-99"` will raise a DB driver exception that is not caught, causing an unhandled 500 response. Sending `"2026-6-1"` (non-ISO) may be accepted by Postgres but will produce unexpected date-sort ordering.

**Fix:** Validate the date format before the DB call:

```ts
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
if (!dateRegex.test(body.date as string) || isNaN(Date.parse(body.date as string))) {
  return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
}
```

---

### WR-03: PATCH `/api/precent/[id]/items/[itemId]` fires an UPDATE with an empty set object

**File:** `src/app/api/precent/[id]/items/[itemId]/route.ts:26-45`

**Issue:** If the request body contains neither `tuneId` nor `verseRange` keys, `updateSet` remains `{}`. The Drizzle `db.update(...).set({})` call is then issued. Drizzle will either throw at runtime (depending on version — some versions raise "No values to set") or execute a no-op UPDATE that still returns the affected row, making the 404 branch unreachable. Either outcome is incorrect: the client receives `{ ok: true }` for a request that updated nothing, or the handler crashes.

**Fix:** Guard against an empty update set:

```ts
if (Object.keys(updateSet).length === 0) {
  return NextResponse.json({ error: 'no updatable fields provided' }, { status: 400 })
}
```

---

### WR-04: `allTunes` prop declared in `SetItemsSortableList` interface but never used inside the component

**File:** `src/components/precent/SetItemsSortableList.tsx:35` and `src/components/precent/SetItemsSortableList.tsx:40-45`

**Issue:** `SetItemsSortableListProps` declares `allTunes: TuneRow[]` at line 35, but the destructuring at line 40-45 does not include `allTunes`:

```ts
export function SetItemsSortableList({
  setId,
  items,
  psalmMeterById,
  onTuneClick,
}: SetItemsSortableListProps) {
```

The prop is silently dropped. `SetDetail` passes `allTunes={allTunes}` (line 179) causing an unnecessary serialization and transfer of all tune data to the client on every render. Additionally `SetItemRow` receives no tune data, confirming it is never consumed.

**Fix:** Remove `allTunes` from `SetItemsSortableListProps` and from the `SetDetail` call site, or destructure and use it if it was intended to be passed down to `SetItemRow` for inline display.

---

### WR-05: Psalm group expand toggle clobbers all other expanded groups

**File:** `src/components/PsalmListingGrid.tsx:205`

**Issue:** The toggle function at line 205 replaces the entire `expandedIds` record with a single-key object:

```ts
const toggle = () => setExpandedIds(isExpanded ? { [id]: false } : { [id]: true })
```

When a user expands Psalm 50 and then expands Psalm 119, expanding 119 collapses 50 (and vice versa) because the full record is replaced rather than merged. The correct pattern is to spread the previous state:

```ts
const toggle = () =>
  setExpandedIds((prev) => ({ ...prev, [id]: !isExpanded }))
```

This is stored in `localStorage`, so the clobber also corrupts the persisted expansion state across sessions.

---

## Info

### IN-01: `verseRange` from the set item is not surfaced in the singing view

**File:** `src/app/api/precent/[id]/sing/[pos]/page.tsx:33`

**Issue:** `item.verseRange` is available on the set item (fetched at line 33) but is never passed to `SingingView`. The precentor's verse restriction is silently ignored during the live service — the full psalm is displayed regardless. This may be intentional for v1, but it means the feature is incomplete and the `verseRange` stored on the item has no visible effect in singing mode.

**Fix (or document):** Either pass `verseRange={item.verseRange}` to `SingingView` (if that prop exists), or add a visible note above the notation, or explicitly comment that verse filtering is out of scope for the singing view.

---

### IN-02: UAT tests hard-code `TEST_SET_ID = 9` with no fallback discovery

**Files:** `tests/precent-detail.spec.ts:16`, `tests/precent-reorder.spec.ts:15`, `tests/precent-sing.spec.ts:15`

**Issue:** All three UAT specs default to `TEST_SET_ID = 9` with a comment "created with 2 items". If set 9 is deleted, reordered, or has a different item count, every test assertion (including the hardcoded `"1 / 2"` and `"2 / 2"` counters at lines 49 and 107 of `precent-sing.spec.ts`) will fail or give false results without a meaningful diagnostic. The specs don't create their own fixture data and can't self-heal.

**Fix:** Either seed a well-known set at test startup via the API and delete it on teardown, or document that TEST_SET_ID must be verified before running UAT.

---

### IN-03: `precentorName` is a hardcoded DB default with no runtime setter

**File:** `src/db/schema.ts:330` (referenced in display at `src/components/precent/PrecentingSetList.tsx:68` and `src/components/precent/SetDetail.tsx:102`)

**Issue:** The schema sets `precentorName` to `default('Manuel')`. There is no API or UI path to set a different precentor name when creating or editing a set. The `POST /api/precent` route accepts `date`, `type`, and `note` but not `precentorName`. The `PATCH /api/precent/[id]` route similarly omits it. The set detail page displays "Precentor: Manuel" unconditionally. This is likely intentional for a personal project but should be called out — if the portal is ever shared with another precentor, all sets will show the same hardcoded name.

**Fix:** Either add `precentorName` to the create/edit API surface and `CreateSetForm`, or add a comment in the schema and API making clear this is intentional.

---

_Reviewed: 2026-06-15T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
