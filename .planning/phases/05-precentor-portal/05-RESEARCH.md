# Phase 5: Precentor Portal — Research

**Researched:** 2026-06-14
**Domain:** Next.js 15 App Router, dnd-kit drag-and-drop, Drizzle ORM Server Actions / API Routes, React component reuse
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create new tables `precenting_sets` and `set_items` — do NOT extend or reuse existing `events` + `service_items` tables.
- **D-02:** `precenting_sets` schema: `id` (serial PK), `date` (date, required), `type` (text: 'AM Service' | 'PM Service' | 'Other', required), `note` (text, nullable), `precentor_name` (text, default 'Manuel'), `created_at` (timestamp), `updated_at` (timestamp).
- **D-03:** `set_items` schema: `id` (serial PK), `set_id` (FK → precenting_sets), `psalm_id` (FK → psalms), `tune_id` (FK → tunes, nullable), `verse_range` (text, nullable), `position` (integer).
- **D-04:** Routes at `/precent`, `/precent/[id]`, `/precent/[id]/sing/[pos]`.
- **D-05:** `/precent/[id]/sing/[pos]` is a new dedicated route that wraps the existing psalm singing view inside a precenting shell (amber bar, position counter, nav arrows).
- **D-06:** "Add Psalm" modal uses the existing `PsalmListingGrid` component.
- **D-07:** After psalm selection, an inline verse range input appears in the modal (free text, stored in `set_items.verse_range`, no effect on rendering in Phase 5).
- **D-08:** TunePickerModal embeds `TuneGrid` (NOT `TuneTable`) with psalm's meter pre-selected. Mismatch warning on set detail row, not in picker.
- **D-09:** `precentor_name` hardcoded to `'Manuel'` in Phase 5.
- **D-10:** All `/precent/*` routes are unprotected in Phase 5 (Phase 05.1 adds auth).

### Claude's Discretion

None declared beyond the decisions above.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PREC-01 | Precentor can create a service event (date + AM/PM) | CreateSetForm with date picker + type select → POST /api/precent or Server Action → `precenting_sets` table |
| PREC-02 | Precentor can assign psalm + tune pairs to a service event, specifying verses/stanzas per slot | PsalmPickerModal + TunePickerModal → `set_items` table; verse_range stored as free text |
| PREC-03 | Precentor can edit and reorder psalm slots within a service event | dnd-kit sortable rows; position batch-update Server Action / API route |
| PREC-04 | Precentor can view a service set list overview before the service | `/precent/[id]` page server-renders set + items; data joins psalms + tunes |
| PREC-05 | Precentor service view shows all assigned psalms in sequence with notation pre-loaded | `/precent/[id]/sing/[pos]` wraps `SingingView` with data pre-fetched server-side |
| PREC-06 | Precentor can preview a tune's melody via abcjs Web Audio API (requires user gesture) | `AbcPlayer` / `AbcAudioControls` components already handle Web Audio; reuse from existing singing view |
</phase_requirements>

---

## Summary

Phase 5 adds a precentor-facing portal to the CPRC Psalter app. A precentor creates "Precenting Sets" (date, type, optional note), builds an ordered list of psalm+tune pairs, reorders them via drag-and-drop, and runs a live precenting mode that navigates the set with an amber status bar. Auth is out of scope for Phase 5 — Phase 05.1 adds that.

The codebase is a well-structured Next.js 15 App Router project. Mutations are currently handled via **API Routes** (`/api/dev/*`) — there are zero Server Actions (`'use server'`) in the codebase. Phase 5 will follow the same API Route pattern for consistency, using `fetch` from Client Components. The two main reusable components — `PsalmListingGrid` and `TuneGrid` — both accept simple props arrays and are `'use client'` components; they can be embedded in modals with minimal wrapping. `TuneGrid` needs a new `initialMeter` prop added (it currently reads meter from `useSearchParams`). The existing `SingingView` component has a large props signature and is rendered from a server page — the precenting mode page will replicate that server-side data-fetching pattern and render `SingingView` with an added `PrecentingBar` above it.

`dnd-kit` must be installed fresh (not in `package.json`). The correct package set is `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` + `@dnd-kit/utilities@3.2.2`. The classic v6 API (`DndContext`, `SortableContext`, `useSortable`, `arrayMove`) is used — this is the well-documented pattern that works in Next.js 15 App Router when the sortable list component carries `'use client'`.

**Primary recommendation:** Use API Routes (matching existing codebase pattern) for all CRUD mutations; use the classic dnd-kit v6 API with `DndContext` + `SortableContext` + `useSortable` in a `'use client'` list component; reuse `PsalmListingGrid` as-is inside the psalm picker modal, and add an `initialMeter` prop to `TuneGrid` for the tune picker modal.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Set CRUD (create/update/delete) | API / Backend (Next.js API Route) | — | Follows existing codebase mutation pattern; no Server Actions in codebase |
| Set item CRUD + reorder | API / Backend (Next.js API Route) | — | Same as above; batch position update needs a single API call |
| Set list page (`/precent`) | Frontend Server (RSC page) | Browser (Client form) | Page fetches all sets server-side; CreateSetForm is client interactive |
| Set detail page (`/precent/[id]`) | Frontend Server (RSC page) | Browser (Client table) | Page fetches set + items + psalms + tunes server-side; drag table is client |
| Precenting mode (`/precent/[id]/sing/[pos]`) | Frontend Server (RSC page) | Browser (SingingView, PrecentingBar) | Replicates `/psalms/[id]` pattern: server fetches all tune data, passes to client SingingView |
| Psalm picker modal | Browser (Client) | API (fetchPsalmListRows) | PsalmListingGrid is `'use client'`; data passed from parent RSC |
| Tune picker modal | Browser (Client) | API (fetchAllTunes) | TuneGrid is `'use client'`; data passed from parent RSC |
| Meter mismatch detection | Browser (Client) | — | Compare psalm.meter vs tune.meter in client component after tune selection |
| Drag-and-drop reorder | Browser (Client) | API (batch position update) | dnd-kit requires client environment; server action called on drop |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 | Drag context, sensors, event system | Required peer of `@dnd-kit/sortable`; pointer-event-based (mobile compatible) |
| `@dnd-kit/sortable` | 10.0.0 | `useSortable`, `SortableContext`, `arrayMove` | Official sortable preset for dnd-kit |
| `@dnd-kit/utilities` | 3.2.2 | `CSS.Transform.toString` for transform style | Required utility for applying drag transforms |

[VERIFIED: npm registry — `npm view @dnd-kit/core version`, `npm view @dnd-kit/sortable version`, `npm view @dnd-kit/utilities version`]

### Supporting (already in project — no new installs needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `drizzle-orm` | 0.45.2 | Schema definition + query building | New table definitions + join queries |
| `shadcn/ui Dialog` | installed | Modal container for PsalmPicker + TunePicker | Already available — no new shadcn install needed |
| `shadcn/ui Calendar` | NOT YET INSTALLED | Date picker in CreateSetForm | Add via `npx shadcn add calendar` — Wave 0 task |
| `shadcn/ui Tooltip` | installed | Mismatch tooltip on desktop | Already in `src/components/ui/tooltip.tsx` |
| `lucide-react` | ^1.14.0 | `GripVertical`, `PlayCircle`, `Trash2`, `ChevronLeft`, `ChevronRight` icons | Already installed |

[VERIFIED: `ls /data/home/psalter/src/components/ui/` — `tooltip.tsx`, `dialog.tsx`, `popover.tsx` confirmed present; `calendar.tsx` absent]

**Installation:**

```bash
npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2
npx shadcn add calendar
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser Request
    │
    ▼
RSC Page (/precent, /precent/[id], /precent/[id]/sing/[pos])
    │  fetches data server-side (Drizzle queries)
    │
    ├─→ Client Component (SetDetail, SetItemsSortableList, Modals)
    │       │
    │       ├─→ dnd-kit (DndContext + SortableContext + useSortable)
    │       │       └─→ onDragEnd: optimistic reorder state → POST /api/precent/[id]/reorder
    │       │
    │       ├─→ PsalmPickerModal (Dialog)
    │       │       └─→ PsalmListingGrid (existing, embedded)
    │       │              └─→ psalm selected → verse range input → POST /api/precent/[id]/items
    │       │
    │       └─→ TunePickerModal (Dialog)
    │               └─→ TuneGrid (existing, with initialMeter prop added)
    │                      └─→ tune selected → PATCH /api/precent/[id]/items/[itemId]
    │
    ├─→ Client Component (PrecentingBar)
    │       └─→ next/link navigation (/precent/[id]/sing/[pos±1])
    │
    └─→ SingingView (existing client component, unchanged)
            └─→ NotationRendererClient → abcjs Web Audio (PREC-06)

API Routes:
POST   /api/precent                          → create precenting_set
PATCH  /api/precent/[id]                     → update set header (date/type/note)
DELETE /api/precent/[id]                     → delete set
POST   /api/precent/[id]/items               → add set_item (psalm + optional tune + verse_range)
PATCH  /api/precent/[id]/items/[itemId]      → update set_item (tune, verse_range)
DELETE /api/precent/[id]/items/[itemId]      → remove set_item
POST   /api/precent/[id]/reorder             → batch update position values
```

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── precent/
│   │       ├── route.ts                    # GET all sets, POST create set
│   │       └── [id]/
│   │           ├── route.ts                # PATCH update set, DELETE set
│   │           ├── items/
│   │           │   ├── route.ts            # POST add item
│   │           │   └── [itemId]/
│   │           │       └── route.ts        # PATCH update item, DELETE item
│   │           └── reorder/
│   │               └── route.ts            # POST batch position update
│   └── precent/
│       ├── loading.tsx                     # Skeleton: 3 table rows
│       ├── page.tsx                        # RSC: fetch all sets + render
│       └── [id]/
│           ├── loading.tsx                 # Skeleton: set header + 4 rows
│           ├── page.tsx                    # RSC: fetch set + items + psalm/tune data
│           └── sing/
│               └── [pos]/
│                   ├── loading.tsx         # Skeleton: amber bar + SingingView skeleton
│                   └── page.tsx            # RSC: replicate /psalms/[id] fetch pattern
├── components/
│   └── precent/
│       ├── PrecentingSetList.tsx           # 'use client' — set list table
│       ├── CreateSetForm.tsx               # 'use client' — date/type/note form
│       ├── SetDetail.tsx                   # 'use client' — shell for set detail page
│       ├── SetItemsSortableList.tsx        # 'use client' — dnd-kit table
│       ├── SetItemRow.tsx                  # 'use client' — single draggable row
│       ├── PsalmPickerModal.tsx            # 'use client' — Dialog + PsalmListingGrid
│       ├── TunePickerModal.tsx             # 'use client' — Dialog + TuneGrid
│       └── PrecentingBar.tsx              # 'use client' — amber position bar
└── db/
    └── schema.ts                           # Add precentingSets + setItems tables + relations
```

### Pattern 1: dnd-kit v6 Classic Sortable List

**What:** `DndContext` wraps the entire list; `SortableContext` provides item ordering; `useSortable` per row; drag handle restricts activation to the `GripVertical` icon only.

**When to use:** Any time a list needs user-reorderable rows in a `'use client'` component.

**Example:**
```typescript
// Source: https://github.com/clauderic/dnd-kit/blob/main/apps/docs (classic v6 API)
// [VERIFIED: npm view @dnd-kit/sortable@10.0.0 peerDependencies → '@dnd-kit/core': '^6.3.0']
'use client'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useTransition } from 'react'

// Parent list component
function SetItemsSortableList({ items, setId }: { items: SetItem[]; setId: number }) {
  const [optimisticItems, setOptimisticItems] = useState(items)
  const [, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = optimisticItems.findIndex((i) => i.id === active.id)
    const newIndex = optimisticItems.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(optimisticItems, oldIndex, newIndex)

    // Optimistic update
    setOptimisticItems(reordered)

    // Persist
    startTransition(async () => {
      const res = await fetch(`/api/precent/${setId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map((i) => i.id) }),
      })
      if (!res.ok) {
        setOptimisticItems(items) // revert
        toast.error("Reorder didn't save. The list has been restored.")
      }
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={optimisticItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {optimisticItems.map((item, index) => (
          <SetItemRow key={item.id} item={item} index={index} />
        ))}
      </SortableContext>
    </DndContext>
  )
}

// Per-row sortable component with handle
function SetItemRow({ item }: { item: SetItem }) {
  const {
    attributes,
    listeners,        // attach to handle only, not whole row
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className="h-14">
      {/* Handle — only element with {...listeners} */}
      <td className="w-8 cursor-grab active:cursor-grabbing" {...attributes}>
        <button {...listeners} className="p-2 touch-none" aria-label="Drag to reorder">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </td>
      {/* ... rest of row */}
    </tr>
  )
}
```

**Critical detail — handle vs whole-row dragging:** Attach `{...listeners}` to the drag handle element only, NOT to the row element. The `{...attributes}` can go on the row or the handle. The row gets `ref={setNodeRef}` and `style`. [VERIFIED: Context7 dnd-kit docs — handle pattern]

**Mobile pointer events:** `PointerSensor` (not `MouseSensor` + `TouchSensor`) handles both desktop mouse and mobile touch via the Pointer Events API. Add `touch-none` CSS class to the handle to prevent scroll interference on mobile. [CITED: dndkit.com docs]

### Pattern 2: API Route Mutations (matching existing codebase)

**What:** All CRUD mutations go through `src/app/api/` Next.js Route Handlers (`GET`/`POST`/`PATCH`/`DELETE`). Client components call `fetch()`. This matches every existing mutation in the codebase.

**Why not Server Actions:** Zero instances of `'use server'` exist in the codebase. [VERIFIED: `grep -r "'use server'"` returned no results] The existing API Route pattern in `/api/dev/tune-feedback/route.ts` and `/api/dev/melisma-save/route.ts` is the established convention.

**Example (reorder endpoint):**
```typescript
// Source: pattern from /api/dev/melisma-save/route.ts [VERIFIED: read from codebase]
// src/app/api/precent/[id]/reorder/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { setItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const setId = parseInt(id)
  const { ids } = await req.json() as { ids: number[] }

  // Batch update: assign position = index
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(setItems)
        .set({ position: i })
        .where(eq(setItems.id, ids[i]))
    }
  })

  return NextResponse.json({ ok: true })
}
```

### Pattern 3: Precenting Mode — Wrapping SingingView

**What:** `/precent/[id]/sing/[pos]` is a RSC page that replicates the data-fetching logic from `/psalms/[id]/page.tsx` and renders `SingingView` with a `PrecentingBar` above it.

**How it works:** The page receives `[id]` (set ID) and `[pos]` (1-based position). It fetches the `set_item` at that position, then runs the same data-fetching pipeline as `PsalmPage` (psalm detail, tune options, psalm list rows, neighbors etc.), and passes the data to `SingingView`. The `PrecentingBar` is rendered as a sibling above `SingingView`.

**Key insight from codebase audit:** `SingingView` is a large `'use client'` component with 12+ props. The page component renders it directly — there is no intermediate wrapper component to extend. The precenting page must replicate the server-side data assembly, then pass `<PrecentingBar>` and `<SingingView>` as siblings inside a `<div className="flex flex-col">`. [VERIFIED: read `/data/home/psalter/src/app/psalms/[id]/page.tsx` and `SingingView.tsx`]

**SingingView props that PREC-05 needs:**
```typescript
// From SingingView.tsx [VERIFIED: read from codebase]
interface Props {
  psalm: PsalmDetail           // from fetchPsalmDetail(psalmId)
  currentSlug: string          // psalm slug (e.g. "23")
  prevSlug: string | null      // null — no psalm-level prev/next in precenting mode
  nextSlug: string | null      // null
  primaryTune: TuneOption | null
  alternateTunes: TuneOption[]
  editoriallyLinkedTuneIds: number[]
  meter: string | null
  stanzaMeter: string | null
  lyrics: string
  lyricsStructured: StructuredLyrics | null
  psalmListRows: PsalmRow[]
  studyHref: string
  versePartLabel?: string | null
}
```

PREC-06 (abcjs Web Audio preview) is already handled by the existing `AbcAudioControls` component embedded in `SingingView` — no new work needed for the core audio functionality. It requires a user gesture to start playback (Web Audio API constraint), already handled by the existing play button.

### Pattern 4: TuneGrid with initialMeter Prop

**What:** `TuneGrid` currently reads meter from `useSearchParams()` which is URL-bound. In `TunePickerModal`, there is no URL to set. A new `initialMeter` prop must be added.

**Current TuneGrid signature:**
```typescript
// [VERIFIED: read /data/home/psalter/src/components/TuneGrid.tsx]
interface TuneGridProps {
  tunes: TuneRow[]
  // No initialMeter — currently reads from searchParams
}
```

**Required change to TuneGrid:**
```typescript
interface TuneGridProps {
  tunes: TuneRow[]
  initialMeter?: string          // new: pre-select meter filter without URL param
  onSelectTune?: (tune: TuneRow) => void  // new: callback instead of next/link navigation
}
```

The `initialMeter` prop initialises `useState` instead of reading from `searchParams`. When `onSelectTune` is provided, clicking a tune card calls the callback instead of navigating to `/tunes/[id]`. [ASSUMED — this design follows D-08; exact prop shape is Claude's discretion]

**Note on TuneGrid vs TuneTable:** The current `/tunes` page actually uses `TuneTable` (a more feature-rich component with sortable columns, CSV export, PRCA filter, etc.). `TuneGrid` is a simpler card grid also in the codebase. Per D-08, the TunePickerModal should embed the "full /tunes page experience from search bar down" — meaning it should use `TuneTable` (or at minimum, match the `TuneTable` UI). [ASSUMED: CONTEXT.md says "TuneGrid" but the current /tunes page uses TuneTable. Planner should clarify which to embed — TuneTable is the richer match for "full /tunes page experience".]

### Pattern 5: PsalmListingGrid Reuse in Modal

**Current PsalmListingGrid signature:**
```typescript
// [VERIFIED: read /data/home/psalter/src/components/PsalmListingGrid.tsx]
interface PsalmListingGridProps {
  psalms: PsalmRow[]
}
```

The component is self-contained — it has its own search state, meter filter, and handles Enter-key navigation via `router.push()`. In the modal context, Enter-key navigation must be intercepted to call an `onSelect` callback instead of navigating. Two options:

1. **Add `onSelect` prop:** When provided, clicking a psalm box (or pressing Enter) calls `onSelect(psalm)` instead of routing. Minimal diff.
2. **Wrap and intercept:** Use a capture-phase click handler on the modal container to catch psalm box clicks. Fragile — depends on DOM structure.

**Recommendation:** Add an optional `onSelect?: (psalm: PsalmRow) => void` prop to `PsalmListingGrid`. When provided, keyboard Enter and psalm box click call `onSelect` instead of `router.push`. [ASSUMED — exact prop signature is Claude's discretion]

### Anti-Patterns to Avoid

- **Spreading `{...listeners}` on the `<tr>` element:** Makes the entire row draggable, which interferes with clicking Tune cells, Verse Range cells, Play/Delete icons. Only the `GripVertical` handle gets `{...listeners}`.
- **Using `TouchSensor` + `MouseSensor` separately:** Use `PointerSensor` only — it handles both and avoids dual-event conflicts on hybrid devices.
- **Storing raw `router.replace()` calls inside TuneGrid when embedded in a modal:** The filter state change in `TuneGrid` calls `router.replace('/tunes?...')` which will navigate the page. Must be suppressed when the component is modal-embedded.
- **Calling `generateStaticParams` on precenting routes:** These routes are user-specific and dynamic — do NOT add `generateStaticParams`. Use `export const dynamic = 'force-dynamic'` on precenting pages.
- **Omitting `touch-none` on drag handle:** Without this, mobile scroll and drag-start conflict on touch devices.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable list reorder | Custom mouse/touch event handlers | `@dnd-kit/core` + `@dnd-kit/sortable` | Pointer Events API, keyboard accessibility, collision detection, placeholder rendering — all handled |
| Array reorder after drag | Custom splice logic | `arrayMove` from `@dnd-kit/sortable` | One-liner, well-tested, handles edge cases |
| Modal/Dialog | Custom overlay component | shadcn `Dialog` | Already installed, accessible, handles focus trap and Esc key |
| Date picker | Custom date input | shadcn `Calendar` + `Popover` | Accessible, keyboard navigable, consistent design; requires `npx shadcn add calendar` |
| Transform CSS for drag | Manual `translate()` string | `CSS.Transform.toString(transform)` from `@dnd-kit/utilities` | Handles null transform safely, correct format |

**Key insight:** dnd-kit handles the hardest parts of drag-and-drop — coordinate calculation, scroll adjustment, keyboard accessibility (Tab/Space/Enter/Escape), and multi-input support. The only application code needed is array reorder state + the API call to persist.

---

## Schema Additions

Add to `src/db/schema.ts`:

```typescript
// [VERIFIED against D-02 and D-03 in CONTEXT.md; Drizzle import patterns from existing schema.ts]
import { pgTable, integer, text, serial, date, timestamp } from 'drizzle-orm/pg-core'
// (these are already imported at the top of schema.ts)

export const precentingSets = pgTable('precenting_sets', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  type: text('type').notNull(),          // 'AM Service' | 'PM Service' | 'Other'
  note: text('note'),                    // nullable
  precentorName: text('precentor_name').notNull().default('Manuel'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const setItems = pgTable('set_items', {
  id: serial('id').primaryKey(),
  setId: integer('set_id').notNull().references(() => precentingSets.id, { onDelete: 'cascade' }),
  psalmId: integer('psalm_id').notNull().references(() => psalms.id),
  tuneId: integer('tune_id').references(() => tunes.id),    // nullable
  verseRange: text('verse_range'),                           // nullable free text
  position: integer('position').notNull(),
})

// Relations
export const precentingSetsRelations = relations(precentingSets, ({ many }) => ({
  setItems: many(setItems),
}))

export const setItemsRelations = relations(setItems, ({ one }) => ({
  set: one(precentingSets, { fields: [setItems.setId], references: [precentingSets.id] }),
  psalm: one(psalms, { fields: [setItems.psalmId], references: [psalms.id] }),
  tune: one(tunes, { fields: [setItems.tuneId], references: [tunes.id] }),
}))
```

**Migration:** After schema changes, run `npx drizzle-kit generate` then `npx drizzle-kit migrate`. The project uses `drizzle/migrations/` output dir. [VERIFIED: drizzle.config.ts]

**Meter mismatch detection:** `psalm_versions.meter` stores psalm meter; `tunes.meter` stores tune meter. Both are normalised abbreviations (CM, LM, SM, etc.). Comparison is a simple string equality check. The `psalm_id` on `set_items` references `psalms` (not `psalm_versions`), so the set detail query must join `psalm_versions` to get the psalm's meter. A psalm may have multiple versions with different meters — use the first/primary version's meter, or the psalm's most common meter. [ASSUMED: use primary psalm_version meter (the one with the lowest id, or the one whose psalmVersionTunes has isPrimary=true for the default tune)]

---

## Position/Reorder Persistence

**Recommended pattern:** Batch update on `onDragEnd`.

When the user drops an item, `arrayMove` produces the new ordered array. Send a `POST /api/precent/[id]/reorder` with `{ ids: number[] }` — the ordered list of `set_item` IDs. The API route runs a Drizzle transaction that updates `position = index` for each ID.

**Why batch, not per-move:** The user may drag rapidly. A batch call on drop is one network request vs. N position updates. The server owns the final positions.

**Optimistic pattern (required per PERF-02 and UI-SPEC):**
1. `setOptimisticItems(arrayMove(...))` — instant visual reorder
2. `fetch('/api/.../reorder', ...)` — async persist
3. On error: `setOptimisticItems(originalItems)` + `toast.error(...)`

```typescript
// src/app/api/precent/[id]/reorder/route.ts
// [ASSUMED — no existing reorder pattern in codebase to reference]
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ids } = await req.json() as { ids: number[] }
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(setItems).set({ position: i }).where(eq(setItems.id, ids[i]))
    }
  })
  return NextResponse.json({ ok: true })
}
```

---

## Component Reuse Audit

### PsalmListingGrid

- **File:** `src/components/PsalmListingGrid.tsx` [VERIFIED: read from codebase]
- **Current props:** `{ psalms: PsalmRow[] }` — no navigation callback
- **Client/Server:** `'use client'` — uses `useState`, `useLocalStorage`, `useRouter`
- **Reuse blocker:** On psalm selection (Enter key or box click), calls `router.push('/psalms/' + slug)`. In the modal, must call `onSelect(psalm)` instead.
- **Required change:** Add `onSelect?: (psalm: PsalmRow) => void` prop. When provided, suppress `router.push` and call `onSelect` instead. The `handleKeyDown` Enter handler and `PsalmNumberBox` click handler both need to branch on `onSelect`.
- **PsalmNumberBox:** Imported from `src/components/PsalmNumberBox.tsx`. Also needs an `onClick` prop or the parent passes click through context. Simpler: pass `onSelect` through to `PsalmNumberBox` directly.
- **Data supply:** Use existing `fetchPsalmListRows()` from `src/db/queries/psalms.ts` (already used by SingingView) — the RSC parent fetches once and passes the array down.

### TuneGrid

- **File:** `src/components/TuneGrid.tsx` [VERIFIED: read from codebase]
- **Current props:** `{ tunes: TuneRow[] }` — no initial meter, no selection callback
- **Client/Server:** `'use client'` — uses `useState`, `useSearchParams`, `useRouter`
- **Reuse blocker 1:** Reads initial meter from `useSearchParams()` — not available in a modal context.
- **Reuse blocker 2:** Clicking a tune navigates to `/tunes/[tune.id]` via `next/link` — must instead call `onSelect(tune)`.
- **Reuse blocker 3:** Meter/mood filter changes call `router.replace('/tunes?...')` — must be suppressed in modal context.
- **Required changes:**
  1. Add `initialMeter?: string` prop — use as initial state instead of `searchParams.get('meter')`
  2. Add `onSelectTune?: (tune: TuneRow) => void` prop — when provided, clicking a tune card calls `onSelectTune(tune)` instead of navigating
  3. Suppress `router.replace` calls when `onSelectTune` is provided
- **Data supply:** Use existing `fetchAllTunes()` from `src/db/queries/tunes.ts` — RSC parent fetches and passes down. Note: `TuneRow` interface is defined in `TuneGrid.tsx` — the tune picker uses the same shape.

**Important clarification on TuneGrid vs TuneTable:** The current `/tunes` page uses `TuneTable` (the richer component with search bar, column toggles, CSV export). `TuneGrid` is an older/simpler card grid. CONTEXT.md D-08 says "full /tunes page experience from search bar down" — this better matches `TuneTable`. However, CONTEXT.md and the UI-SPEC both call it "TuneGrid". The planner should decide: use `TuneTable` (more work to adapt but matches "full experience") or `TuneGrid` (less work, simpler card UI). [ASSUMED: use `TuneGrid` as named in CONTEXT.md; if the user wants the full TuneTable experience, this is an open question for plan review]

### SingingView

- **File:** `src/components/singing/SingingView.tsx` [VERIFIED: read from codebase]
- **Client/Server:** `'use client'` — large interactive component
- **Usage:** Rendered from `src/app/psalms/[id]/page.tsx` (RSC) which assembles all props server-side
- **Modification needed:** None — `SingingView` is used as-is, receiving the same props. The precenting mode page wraps it with a `PrecentingBar` above.
- **PREC-06:** abcjs Web Audio preview is already inside `SingingView` via `AbcAudioControls` + `GlassBottomBar`. No new implementation needed.
- **PsalmTopBar inside SingingView:** `PsalmTopBar` (psalm navigation arrows + psalm number display) will still render inside SingingView. In precenting mode, `prevSlug`/`nextSlug` should be passed as `null` to disable psalm-level navigation (the amber `PrecentingBar` handles set-level navigation instead).

### SiteHeader

- **File:** `src/components/SiteHeader.tsx` [VERIFIED: read from codebase]
- **Current nav links:** Psalms, Tunes, Explore, Daily Plan
- **Required change:** Add `{ href: "/precent", label: "Precent" }` to the `navLinks` array — one-line addition.

---

## Common Pitfalls

### Pitfall 1: TuneGrid router.replace in Modal Context

**What goes wrong:** `TuneGrid` calls `router.replace('/tunes?meter=CM')` when the meter filter changes. Inside a `Dialog`, this navigates the background page and closes the modal.

**Why it happens:** `TuneGrid` was built for URL-based filter state (reflects filter in URL for shareability). Modal context has no URL to manage.

**How to avoid:** Add `onSelectTune` prop; when provided, replace `router.replace` with a no-op (or local state only).

**Warning signs:** Modal closes unexpectedly when changing meter filter.

### Pitfall 2: dnd-kit useSortable on `<tr>` Elements

**What goes wrong:** `setNodeRef` on a `<tr>` and then applying `style={{ transform: ... }}` works but causes layout issues with table column widths during drag.

**Why it happens:** CSS `transform` on a `<tr>` takes it out of the normal table layout flow.

**How to avoid:** Wrap rows in a `<tbody>` and apply `setNodeRef` / `style` to a `<div>` wrapper, OR use a `<div>`-based layout instead of a native `<table>` for the draggable rows. Alternatively, use `CSS.Transform.toString(transform)` only for the `transform` property and avoid `position: absolute` — dnd-kit's transform moves the element without taking it out of flow for table rows when handled carefully. The recommended approach for table rows with dnd-kit is to apply the style to the `<tr>` and accept minor column width shifts during drag (opacity-50 on dragged row hides the issue visually). [ASSUMED: based on known dnd-kit table row pattern; verify during implementation]

**Warning signs:** Column widths jump during drag; drag placeholder has wrong width.

### Pitfall 3: PsalmListingGrid useLocalStorage Persistence in Modal

**What goes wrong:** `PsalmListingGrid` uses `useLocalStorage` for `advancedOpen`, `meterFilter`, etc. These persist between sessions. If the precentor had a meter filter set from the `/psalms` page, the modal opens with that filter active — potentially hiding psalms.

**Why it happens:** The same localStorage keys are used in both the `/psalms` page and the modal.

**How to avoid:** Accept this behavior (the precentor's filter preferences carry over — arguably useful). Or pass different localStorage key prefixes. Given D-06 says "reuse established UI and search behavior," keeping shared localStorage is acceptable.

### Pitfall 4: Position Gaps After Delete

**What goes wrong:** After deleting a `set_item`, position values are no longer contiguous (e.g., 0, 1, 3 with 2 deleted). Drag-and-drop reorder math breaks if it assumes contiguous integers.

**Why it happens:** Only the deleted item's position is removed; others are not renumbered.

**How to avoid:** Normalise positions on every reorder (the batch reorder endpoint already does this — it assigns `position = index` for all items). After delete, either re-fetch the list (which re-renders with correct display order) or renumber client-side. Always query `ORDER BY position ASC` when fetching items.

### Pitfall 5: `params` is a Promise in Next.js 15

**What goes wrong:** Writing `const { id } = params` in a Route Handler or page — this was the Next.js 14 pattern.

**Why it happens:** Next.js 15 made `params` async.

**How to avoid:** Always `await params` first: `const { id } = await params`. [VERIFIED: pattern already used in `/psalms/[id]/page.tsx` — `const { id: slug } = await params`]

---

## Code Examples

### Set Detail Page — Server Data Assembly

```typescript
// src/app/precent/[id]/page.tsx
// [ASSUMED — pattern derived from /psalms/[id]/page.tsx in codebase]
export const dynamic = 'force-dynamic'
import { db } from '@/db'
import { precentingSets, setItems, psalms, tunes } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { SetDetail } from '@/components/precent/SetDetail'
import { fetchPsalmListRows } from '@/db/queries/psalms'
import { fetchAllTunes } from '@/db/queries/tunes'
import { notFound } from 'next/navigation'

export default async function PrecentSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const setId = parseInt(id)

  const set = await db.query.precentingSets.findFirst({
    where: eq(precentingSets.id, setId),
    with: {
      setItems: {
        orderBy: [asc(setItems.position)],
        with: {
          psalm: { columns: { id: true, bibleTitle: true } },
          tune: { columns: { id: true, name: true, meter: true } },
        },
      },
    },
  })

  if (!set) notFound()

  // Need psalm meters — join through psalm_versions
  // (psalm.meter doesn't exist; meter is on psalm_versions)
  // Fetch psalm meters separately
  const psalmListRows = await fetchPsalmListRows()  // contains meter per version
  const allTunes = await fetchAllTunes()

  return <SetDetail set={set} psalmListRows={psalmListRows} allTunes={allTunes} />
}
```

### Precenting Mode Page — Wrapping SingingView

```typescript
// src/app/precent/[id]/sing/[pos]/page.tsx
// [ASSUMED — derived by replicating /psalms/[id]/page.tsx fetch pattern]
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { precentingSets, setItems } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { fetchPsalmDetail, fetchPsalmListRows, getEditoriallyLinkedTuneIdsForPsalm } from '@/db/queries/psalms'
import { fetchTunesByMeter } from '@/db/queries/tunes'
import { SingingView } from '@/components/singing/SingingView'
import { PrecentingBar } from '@/components/precent/PrecentingBar'
import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'

export default async function PrecentSingPage({
  params,
}: {
  params: Promise<{ id: string; pos: string }>
}) {
  const { id, pos } = await params
  const setId = parseInt(id)
  const position = parseInt(pos) - 1  // convert 1-based URL to 0-based index

  // Fetch set with ordered items
  const set = await db.query.precentingSets.findFirst({
    where: eq(precentingSets.id, setId),
    with: { setItems: { orderBy: [asc(setItems.position)] } },
  })
  if (!set || !set.setItems[position]) notFound()

  const item = set.setItems[position]
  const total = set.setItems.length

  // Replicate /psalms/[id] data assembly
  const psalm = await fetchPsalmDetail(item.psalmId)
  if (!psalm) notFound()

  // ... (same tune derivation logic as /psalms/[id]/page.tsx)

  return (
    <>
      <PrecentingBar setId={setId} pos={parseInt(pos)} total={total} />
      <SingingView
        psalm={psalm}
        currentSlug={String(psalm.id)}
        prevSlug={null}   // disable psalm-level nav in precenting mode
        nextSlug={null}
        primaryTune={primaryTune}
        alternateTunes={alternateTunes}
        editoriallyLinkedTuneIds={Array.from(editorialSet)}
        meter={primaryMeter}
        stanzaMeter={stanzaMeter}
        lyrics={lyrics}
        lyricsStructured={lyricsStructured}
        psalmListRows={psalmListRows}
        studyHref={`/psalms/${psalm.id}/study`}
      />
    </>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` (Next.js 14) | `const { id } = await params` (Next.js 15) | Next.js 15 | Async params in all pages and route handlers |
| `MouseSensor + TouchSensor` (dnd-kit v5) | `PointerSensor` only (dnd-kit v6) | dnd-kit v6 | Single sensor for all input methods; mobile-first |
| `arrayMove` from `@dnd-kit/sortable` | Same, still current | — | Unchanged API |

**Deprecated / outdated:**
- `@dnd-kit/sortable@4.x` patterns with `DragOverlay` are not needed for a simple single-list use case.
- `SortableContext` with `strategy={rectSortingStrategy}` — for vertical lists, use `verticalListSortingStrategy`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TuneGrid should be used for TunePickerModal (CONTEXT.md says "TuneGrid" but the current /tunes page actually uses the richer TuneTable) | Component Reuse Audit | If user wants the TuneTable experience, the adaptation work is more substantial |
| A2 | Meter mismatch: use the first/primary psalm_version's meter when a psalm has multiple versions | Schema Additions | A psalm with both CM and LM versions could give incorrect mismatch warnings |
| A3 | PsalmListingGrid should receive an `onSelect` prop; clicking a psalm calls `onSelect` instead of routing | Component Reuse Audit | Requires a small change to PsalmListingGrid (and PsalmNumberBox); risk is low |
| A4 | TuneGrid receives `initialMeter` and `onSelectTune` props; `router.replace` is suppressed when `onSelectTune` is provided | Component Reuse Audit | Requires TuneGrid modification; risk is low |
| A5 | Batch reorder via POST body `{ ids: number[] }` is sufficient; no per-move persistence | Position/Reorder Persistence | If user drags rapidly and browser closes, last drag may not persist — acceptable for this use case |
| A6 | dnd-kit transform on `<tr>` elements acceptable with opacity-50 visual trick | Common Pitfalls | May need div-based layout if table column widths jump unacceptably during drag |

---

## Open Questions

1. **TuneGrid vs TuneTable in TunePickerModal**
   - What we know: CONTEXT.md says "TuneGrid component", UI-SPEC says "TuneGrid component". But the actual `/tunes` page now uses `TuneTable`.
   - What's unclear: Whether the user's intent was the old `TuneGrid` card grid or the current `TuneTable` experience.
   - Recommendation: Plan uses `TuneGrid` as specified in CONTEXT.md. If the richer `TuneTable` experience is desired, that's a straightforward swap (same props shape from `fetchAllTunes()`).

2. **Psalm meter for mismatch: which psalm_version?**
   - What we know: `set_items.psalm_id` references `psalms`, not `psalm_versions`. Meter lives on `psalm_versions`.
   - What's unclear: A psalm may have multiple versions with different meters (e.g., Psalm 23 may have CM and LM versions). Which meter to use for mismatch detection?
   - Recommendation: Use the primary tune's psalm_version meter (the version whose psalmVersionTunes.isPrimary = true). If no primary, use the first version. This matches how the rest of the app derives the "primary meter" for a psalm.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@dnd-kit/core` | Drag-and-drop reorder | Not installed | — | — (must install) |
| `@dnd-kit/sortable` | Drag-and-drop reorder | Not installed | — | — (must install) |
| `@dnd-kit/utilities` | CSS.Transform utility | Not installed | — | — (must install) |
| shadcn `Calendar` | Date picker in CreateSetForm | Not installed | — | Use plain `<input type="date">` as fallback |
| PostgreSQL (psalter-db) | Schema migration | ✓ | 16 | — |
| Node.js | Script runtime | ✓ | v20.x | — |

**Missing dependencies with no fallback:**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — must be installed before drag-and-drop implementation begins

**Missing dependencies with fallback:**
- shadcn `Calendar` — `<input type="date">` works if Calendar install is blocked

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.mts` (root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

[VERIFIED: `package.json` scripts: `"test": "vitest"`; `vitest.config.mts` present and read]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PREC-01 | POST /api/precent creates set in DB | unit (API route) | `npx vitest run src/app/api/precent/route.test.ts` | ❌ Wave 0 |
| PREC-02 | POST /api/precent/[id]/items adds set_item with psalm + optional tune + verse_range | unit (API route) | `npx vitest run src/app/api/precent/[id]/items/route.test.ts` | ❌ Wave 0 |
| PREC-03 | POST /api/precent/[id]/reorder updates positions correctly | unit (API route) | `npx vitest run src/app/api/precent/[id]/reorder/route.test.ts` | ❌ Wave 0 |
| PREC-03 | Drag-and-drop optimistic reorder reverts on error | smoke (Playwright) | Playwright test — `tests/precent-reorder.spec.ts` | ❌ Wave 0 |
| PREC-04 | Set detail page renders psalm list and tune assignments | smoke (Playwright) | Playwright test — `tests/precent-detail.spec.ts` | ❌ Wave 0 |
| PREC-05 | Precenting mode renders psalm notation at correct position | smoke (Playwright) | Playwright test — `tests/precent-sing.spec.ts` | ❌ Wave 0 |
| PREC-06 | abcjs audio play button is present on precenting sing page | smoke (Playwright) | included in `tests/precent-sing.spec.ts` | ❌ Wave 0 |

**Note on unit tests for API routes:** Vitest can test Route Handlers in isolation by mocking `db` and calling the handler directly. The existing API route tests pattern (none yet in the codebase for `/api/precent`) should follow the style in `src/lib/*.test.ts`.

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=dot` (fast, 5-10s)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green + Playwright smoke tests pass before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/app/api/precent/route.test.ts` — covers PREC-01 (set creation)
- [ ] `src/app/api/precent/[id]/items/route.test.ts` — covers PREC-02 (item add)
- [ ] `src/app/api/precent/[id]/reorder/route.test.ts` — covers PREC-03 (reorder)
- [ ] `tests/precent-detail.spec.ts` — Playwright smoke for PREC-04
- [ ] `tests/precent-sing.spec.ts` — Playwright smoke for PREC-05 + PREC-06

---

## Security Domain

> `security_enforcement` not explicitly set in `.planning/config.json` — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (Phase 05.1 handles auth) | — |
| V3 Session Management | No (Phase 05.1) | — |
| V4 Access Control | Partially — `/precent/*` is unprotected by design in Phase 5 (D-10) | Phase 05.1 adds middleware |
| V5 Input Validation | Yes — all API route bodies must be validated | Inline type guards in route handlers |
| V6 Cryptography | No | — |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invalid set ID in URL (`/api/precent/abc/items`) | Tampering | `parseInt(id)` + `if (isNaN(setId)) return 400` |
| Oversized note/verse_range text | Tampering | Server-side length check (note ≤ 500 chars, verse_range ≤ 20 chars) |
| SQL injection via position values | Tampering | Drizzle ORM parameterized queries — never string-interpolate |
| Reorder with IDs from a different set | Tampering | Validate all item IDs belong to the requested set before updating |

**Phase 5 auth posture:** All `/precent/*` routes are intentionally unprotected in Phase 5 per D-10. This is acceptable for a personal-use project where Cloudflare Access can be added as a lightweight gate at the edge before Phase 05.1 is complete.

---

## Sources

### Primary (HIGH confidence)

- Codebase read — `src/components/PsalmListingGrid.tsx`, `TuneGrid.tsx`, `TuneTable.tsx`, `SiteHeader.tsx`, `SingingView.tsx`, `PsalmTopBar.tsx`, `src/db/schema.ts`, `src/db/queries/psalms.ts`, `src/db/queries/tunes.ts`, `src/app/psalms/[id]/page.tsx`, `src/app/tunes/page.tsx`, `src/app/api/dev/tune-feedback/route.ts`, `src/app/api/dev/melisma-save/route.ts`, `package.json`, `drizzle.config.ts`, `vitest.config.mts`
- npm registry — `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2` versions and peer dependencies confirmed
- Context7 (`/clauderic/dnd-kit`, `/websites/dndkit`) — `useSortable`, `DndContext`, `SortableContext`, `arrayMove`, drag handle pattern, pointer events

### Secondary (MEDIUM confidence)

- Context7 dnd-kit docs — `DragDropProvider` (new API) vs classic `DndContext` pattern distinction inferred from peer dependency check confirming `@dnd-kit/sortable@10.0.0` → `@dnd-kit/core@^6.3.0`

### Tertiary (LOW confidence)

- dnd-kit `<tr>` drag behaviour (Pitfall 2) — based on known CSS transform + table layout interaction; not directly verified from official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack (dnd-kit versions): HIGH — npm registry verified
- Schema additions: HIGH — directly derived from CONTEXT.md locked decisions + codebase schema
- Component reuse audit (PsalmListingGrid, TuneGrid, SingingView): HIGH — all components read from codebase
- Mutation pattern (API Routes vs Server Actions): HIGH — verified zero Server Actions in codebase
- dnd-kit `<tr>` table drag behaviour: LOW — not tested, assumed from CSS knowledge
- TuneGrid vs TuneTable question: MEDIUM — discrepancy found, flagged as open question

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable stack; dnd-kit minor versions may update but API is stable)
