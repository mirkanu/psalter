# Phase 5: Precentor Portal — Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 22 new/modified files
**Analogs found:** 20 / 22

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/db/schema.ts` (extend) | model | CRUD | `src/db/schema.ts` lines 110-135 (`events` + `serviceItems`) + lines 322-400 (relations) | exact — same file, same pattern |
| `src/app/precent/page.tsx` | page (RSC) | request-response | `src/app/tunes/page.tsx` | exact |
| `src/app/precent/loading.tsx` | loading skeleton | — | `src/app/tunes/loading.tsx` | exact |
| `src/app/precent/[id]/page.tsx` | page (RSC) | request-response | `src/app/explore/topics/[slug]/page.tsx` | role-match (dynamic RSC, notFound, data pass to client) |
| `src/app/precent/[id]/loading.tsx` | loading skeleton | — | `src/app/psalms/loading.tsx` | role-match |
| `src/app/precent/[id]/sing/[pos]/page.tsx` | page (RSC) | request-response | `src/app/psalms/[id]/page.tsx` | exact (replicates fetch pipeline) |
| `src/app/precent/[id]/sing/[pos]/loading.tsx` | loading skeleton | — | `src/app/psalms/[id]/loading.tsx` | role-match |
| `src/app/api/precent/route.ts` | api route | CRUD | `src/app/api/dev/tune-feedback/route.ts` | exact |
| `src/app/api/precent/[id]/route.ts` | api route | CRUD | `src/app/api/dev/tune-feedback/route.ts` | exact |
| `src/app/api/precent/[id]/items/route.ts` | api route | CRUD | `src/app/api/dev/tune-feedback/route.ts` | exact |
| `src/app/api/precent/[id]/items/[itemId]/route.ts` | api route | CRUD | `src/app/api/dev/melisma-save/route.ts` | role-match (PATCH/DELETE with validation) |
| `src/app/api/precent/[id]/reorder/route.ts` | api route | batch | `src/app/api/dev/melisma-save/route.ts` | role-match (POST with body validation + Drizzle transaction) |
| `src/components/precent/SetItemsSortableList.tsx` | component | event-driven | no codebase analog (dnd-kit not yet used) | no-analog |
| `src/components/precent/SetItemRow.tsx` | component | event-driven | no codebase analog | no-analog |
| `src/components/precent/PsalmPickerModal.tsx` | component | request-response | `src/components/SelectPsalmDialog.tsx` | exact (Dialog + search + callback) |
| `src/components/precent/TunePickerModal.tsx` | component | request-response | `src/components/ChangeTuneDialog.tsx` | exact (Dialog + onSelect callback) |
| `src/components/precent/PrecentingBar.tsx` | component | request-response | `src/components/singing/PsalmTopBar.tsx` | role-match (sticky bar with nav arrows) |
| `src/components/precent/PrecentingSetList.tsx` | component | CRUD | `src/components/TuneGrid.tsx` (filtered list) | role-match |
| `src/components/precent/CreateSetForm.tsx` | component | CRUD | `src/components/GlobalSearch.tsx` (form with controlled state + fetch) | role-match |
| `src/components/PsalmListingGrid.tsx` (modify) | component | CRUD | self | exact |
| `src/components/TuneGrid.tsx` (modify) | component | CRUD | self | exact |
| `src/components/SiteHeader.tsx` (modify) | component | — | self | exact |

---

## Pattern Assignments

### `src/db/schema.ts` — extend with new tables

**Analog:** `src/db/schema.ts` lines 110-135 (events + serviceItems) and lines 362-370 (serviceItemsRelations)

**Table definition pattern** (lines 110-135):
```typescript
/**
 * events — Event (Airtable: ...)
 */
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  eventDate: date('event_date'),
  session: text('session'),                      // 'AM' or 'PM'
  precentor: text('precentor'),
  notes: text('notes'),
})

export const serviceItems = pgTable('service_items', {
  id: serial('id').primaryKey(),
  airtableId: text('airtable_id').notNull().unique(),
  eventId: integer('event_id').references(() => events.id),
  psalmId: integer('psalm_id').references(() => psalms.id),
  tuneId: integer('tune_id').references(() => tunes.id),
  versesSung: text('verses_sung'),
  position: integer('position'),
})
```

**Relations pattern** (lines 362-370):
```typescript
export const serviceItemsRelations = relations(serviceItems, ({ one }) => ({
  event: one(events, { fields: [serviceItems.eventId], references: [events.id] }),
  psalm: one(psalms, { fields: [serviceItems.psalmId], references: [psalms.id] }),
  tune: one(tunes, { fields: [serviceItems.tuneId], references: [tunes.id] }),
}))
```

**Imports already at top** (lines 1-13):
```typescript
import {
  pgTable,
  integer,
  text,
  serial,
  date,
  boolean,
  timestamp,
  primaryKey,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
```

**New tables to append** (after `tuneMelismaDecisions`, before relations section):
```typescript
/**
 * precenting_sets — precentor-built service sets (Phase 5)
 * Replaces manual paper preparation; auth added in Phase 05.1
 */
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

---

### `src/app/precent/page.tsx` (RSC list page)

**Analog:** `src/app/tunes/page.tsx`

**Full file pattern** (lines 1-30):
```typescript
export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import type { Metadata } from "next"
import { fetchAllTunes } from "@/db/queries/tunes"
import { TuneTable } from "@/components/TuneTable"

export const metadata: Metadata = {
  title: "Tunes | CPRC Psalter",
  description: "Browse all tunes in the Scottish Psalter.",
}

export default async function TunesPage() {
  const allTunes = await fetchAllTunes()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Tunes
        </h1>
      </div>
      <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded" />}>
        <TuneTable tunes={allTunes} />
      </Suspense>
    </div>
  )
}
```

**Adapt for `/precent`:**
- Use `max-w-4xl` (narrower than tunes — per UI-SPEC)
- H1 text: "Precenting Sets" (`text-xl font-semibold` — per UI-SPEC typography)
- Replace `fetchAllTunes` with `db.query.precentingSets.findMany({ orderBy: [desc(precentingSets.date)] })`
- Replace `TuneTable` with `PrecentingSetList` + `CreateSetForm` (client components)
- `export const dynamic = 'force-dynamic'` — mandatory (no static params)

---

### `src/app/precent/loading.tsx`

**Analog:** `src/app/tunes/loading.tsx`

**Copy pattern** (lines 1-25):
```typescript
import { Skeleton } from "@/components/ui/skeleton"

export default function TunesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <div className="h-9 w-24 bg-muted animate-pulse rounded mb-3" />
      </div>
      {/* Filter row skeleton — two Selects */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="w-48 h-10" />
        <Skeleton className="w-48 h-10" />
      </div>
      {/* ... grid ... */}
    </div>
  )
}
```

**Adapt for `/precent` loading:** Use `max-w-4xl`. Render heading skeleton + 3 table row skeletons (`h-12` each) + a right-aligned button skeleton. Match UI-SPEC: "3 skeleton table rows (each h-12), '+ New Set' button skeleton right-aligned".

---

### `src/app/precent/[id]/page.tsx` (RSC set detail)

**Analog:** `src/app/explore/topics/[slug]/page.tsx`

**Key pattern** (lines 1-10, 62-78):
```typescript
export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation"
import { db } from '@/db'
// ...

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params        // ← always await params (Next.js 15)
  // ...
  if (!topic) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* data passed to client component */}
    </div>
  )
}
```

**Adapt for `/precent/[id]`:**
```typescript
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { precentingSets, setItems } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { fetchPsalmListRows } from '@/db/queries/psalms'
import { fetchAllTunes } from '@/db/queries/tunes'
import { SetDetail } from '@/components/precent/SetDetail'

export default async function PrecentSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const setId = parseInt(id)
  if (isNaN(setId)) notFound()

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

  const psalmListRows = await fetchPsalmListRows()
  const allTunes = await fetchAllTunes()

  return <SetDetail set={set} psalmListRows={psalmListRows} allTunes={allTunes} />
}
```

---

### `src/app/precent/[id]/loading.tsx`

**Analog:** `src/app/psalms/loading.tsx`

**Copy pattern** (lines 1-35) — use `Skeleton` from shadcn. Adapt shape: set header block (2 lines, h-6 + h-4) + separator + 4 table rows (each h-14 matching real row height, 5 columns).

---

### `src/app/precent/[id]/sing/[pos]/page.tsx` (precenting mode RSC)

**Analog:** `src/app/psalms/[id]/page.tsx` — exact replication of data-fetch pipeline

**Core pattern to copy** (lines 1-171, adapted):
```typescript
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { precentingSets, setItems } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import {
  fetchPsalmDetail,
  getEditoriallyLinkedTuneIdsForPsalm,
  fetchPsalmListRows,
} from '@/db/queries/psalms'
import { fetchTunesByMeter } from '@/db/queries/tunes'
import { SingingView } from '@/components/singing/SingingView'
import { PrecentingBar } from '@/components/precent/PrecentingBar'
import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'
import { parseSlug } from '@/lib/psalm-slugs'
// ... same imports as PsalmPage

export default async function PrecentSingPage({
  params,
}: { params: Promise<{ id: string; pos: string }> }) {
  const { id, pos } = await params      // ← always await params
  const setId = parseInt(id)
  const position = parseInt(pos) - 1   // 1-based URL → 0-based index

  const set = await db.query.precentingSets.findFirst({
    where: eq(precentingSets.id, setId),
    with: { setItems: { orderBy: [asc(setItems.position)] } },
  })
  if (!set || !set.setItems[position]) notFound()

  const item = set.setItems[position]
  const total = set.setItems.length

  // Replicate /psalms/[id]/page.tsx data-fetch from here:
  const psalm = await fetchPsalmDetail(item.psalmId)
  if (!psalm) notFound()

  // [copy entire tune derivation block from PsalmPage lines 75-138]
  // Pass prevSlug={null} nextSlug={null} — disable psalm-level nav

  return (
    <>
      <PrecentingBar setId={setId} pos={parseInt(pos)} total={total} />
      <SingingView
        psalm={psalm}
        currentSlug={String(psalm.id)}
        prevSlug={null}
        nextSlug={null}
        // ... same remaining props as PsalmPage
      />
    </>
  )
}
```

**Critical:** Do NOT add `generateStaticParams` — these pages are dynamic. The `SingingView` receives `prevSlug={null}` and `nextSlug={null}` to disable the psalm-level navigation arrows (the `PrecentingBar` owns set-level navigation instead).

---

### `src/app/precent/[id]/sing/[pos]/loading.tsx`

**Analog:** `src/app/psalms/[id]/loading.tsx`

**Copy pattern** (lines 1-35). Prepend an amber bar skeleton above the existing PsalmDetailLoading structure:
```typescript
{/* PrecentingBar skeleton — amber tint */}
<div className="h-10 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 animate-pulse" />
{/* rest of PsalmDetailLoading content */}
```

---

### `src/app/api/precent/route.ts` (GET list, POST create)

**Analog:** `src/app/api/dev/tune-feedback/route.ts`

**Full file pattern** (lines 1-29):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { tuneNotationFeedback } from '@/db/schema'

export async function GET(req: NextRequest) {
  const tuneId = parseInt(req.nextUrl.searchParams.get('tuneId') ?? '')
  if (!tuneId) return NextResponse.json(null)

  const row = await db.select().from(tuneNotationFeedback)
    .where(eq(tuneNotationFeedback.tuneId, tuneId))
    .limit(1)

  return NextResponse.json(row[0] ?? null)
}

export async function POST(req: NextRequest) {
  const { tuneId, selectedVersion, comment } = await req.json()
  if (!tuneId) return NextResponse.json({ error: 'Missing tuneId' }, { status: 400 })

  await db.insert(tuneNotationFeedback)
    .values({ tuneId, selectedVersion: selectedVersion ?? 'none', comment: comment ?? '' })
    .onConflictDoUpdate({ ... })

  return NextResponse.json({ ok: true })
}
```

**Adapt for `/api/precent`:**
- GET returns all sets ordered by date desc
- POST creates a set; validate `date` + `type` present, `type` in allowed values
- Input validation pattern: inline type guard, return 400 with `{ error: '...' }` on failure
- Return `{ ok: true, id: result[0].id }` so client can navigate to `/precent/[id]`

---

### `src/app/api/precent/[id]/route.ts` (PATCH update, DELETE set)

**Analog:** `src/app/api/dev/melisma-save/route.ts` (PATCH with validation + returning)

**Key patterns** (lines 54-68, 153-177):
```typescript
export async function POST(req: Request) {
  let body: SaveBody
  try {
    body = (await req.json()) as SaveBody
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (typeof body.tuneId !== 'number' || ...) {
    return NextResponse.json({ error: '...' }, { status: 400 })
  }

  const result = await db.update(tunes)
    .set(updateSet)
    .where(eq(tunes.id, body.tuneId))
    .returning({ id: tunes.id, ... })

  if (result.length !== 1) {
    return NextResponse.json({ error: `expected 1 row update, got ${result.length}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ... })
}
```

**Dynamic params pattern** (Next.js 15 — must await params):
```typescript
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params          // ← always await in Next.js 15
  const setId = parseInt(id)
  if (isNaN(setId)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })
  // ...
}
```

---

### `src/app/api/precent/[id]/items/route.ts` (POST add item)

**Analog:** `src/app/api/dev/tune-feedback/route.ts` (POST + validation)

Same validation-then-insert pattern. Extra logic: compute `position` as `MAX(position) + 1` for the set (or `0` if no items yet) within a transaction.

---

### `src/app/api/precent/[id]/items/[itemId]/route.ts` (PATCH update, DELETE item)

**Analog:** `src/app/api/dev/melisma-save/route.ts` (PATCH with validation + returning)

Two dynamic params — both must be awaited:
```typescript
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await params
  const setId = parseInt(id)
  const itemIdNum = parseInt(itemId)
  // validate + update setItems where id = itemIdNum AND setId = setId
}
```

Security note (from RESEARCH.md): always filter by BOTH `setItems.id = itemIdNum` AND `setItems.setId = setId` to prevent cross-set tampering.

---

### `src/app/api/precent/[id]/reorder/route.ts` (POST batch position update)

**Analog:** `src/app/api/dev/melisma-save/route.ts` (POST + Drizzle db.transaction)

**Transaction pattern** (lines 153-165):
```typescript
const result = await db.update(tunes)
  .set(updateSet)
  .where(eq(tunes.id, body.tuneId))
  .returning({ id: tunes.id })
```

**Adapt with transaction:**
```typescript
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const setId = parseInt(id)
  const { ids } = await req.json() as { ids: number[] }

  if (!Array.isArray(ids) || !ids.every((n) => typeof n === 'number')) {
    return NextResponse.json({ error: 'ids must be number[]' }, { status: 400 })
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(setItems)
        .set({ position: i })
        .where(eq(setItems.id, ids[i]))   // security: also verify setId matches
    }
  })

  return NextResponse.json({ ok: true })
}
```

---

### `src/components/precent/PsalmPickerModal.tsx` (Dialog + PsalmListingGrid)

**Analog:** `src/components/SelectPsalmDialog.tsx` — exact pattern for Dialog structure + search + callback

**Full file pattern** (lines 1-121):
```typescript
'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface SelectPsalmDialogProps {
  open: boolean
  onClose: () => void
  psalms: PsalmOption[]
  // ...
}

export function SelectPsalmDialog({ open, onClose, ... }: SelectPsalmDialogProps) {
  const [query, setQuery] = useState('')

  function handleSelect(psalmId: number) {
    onClose()
    setQuery('')
    router.push(`/psalms/${psalmId}?tune=${tuneId}`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setQuery('') } }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Select different Psalm</DialogTitle>
        </DialogHeader>
        {/* ... search input + list ... */}
      </DialogContent>
    </Dialog>
  )
}
```

**Adapt for PsalmPickerModal:**
- Use `max-w-2xl max-h-[80vh]` (larger — embeds full PsalmListingGrid)
- Instead of custom search UI: embed `<PsalmListingGrid psalms={psalmListRows} onSelect={handleSelect} />`
- After psalm selected: show verse range `<Input>` + "Add to Set" button inline below
- `onSelect` callback receives `PsalmRow`; triggers verse range step before closing
- `PsalmListingGrid` must be modified to accept `onSelect?: (psalm: PsalmRow) => void`

---

### `src/components/precent/TunePickerModal.tsx` (Dialog + TuneGrid)

**Analog:** `src/components/ChangeTuneDialog.tsx` — exact pattern for Dialog + list + onSelect

**Full file pattern** (lines 1-85):
```typescript
'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { AlternateTune } from '@/db/queries/tunes'

interface ChangeTuneDialogProps {
  open: boolean
  onClose: () => void
  currentTuneId: number | null
  tunes: AlternateTune[]
  meter: string | null
  onSelect: (tune: AlternateTune) => void
}

export function ChangeTuneDialog({ open, onClose, tunes, meter, onSelect }: ChangeTuneDialogProps) {
  const [query, setQuery] = useState('')

  function handleSelect(tune: AlternateTune) {
    onSelect(tune)
    onClose()
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Select a Tune</DialogTitle>
          {meter && (
            <p className="text-sm text-muted-foreground">
              Showing tunes in <span className="font-medium">{meter}</span> meter
            </p>
          )}
        </DialogHeader>
        {/* ... search + list ... */}
      </DialogContent>
    </Dialog>
  )
}
```

**Adapt for TunePickerModal:**
- Use `max-w-3xl max-h-[85vh]` (larger — per UI-SPEC)
- Instead of custom search list: embed `<TuneGrid tunes={allTunes} initialMeter={psalmMeter} onSelectTune={handleSelect} />`
- `TuneGrid` must be modified to accept `initialMeter?: string` + `onSelectTune?: (tune: TuneRow) => void`
- Subtitle: "Meter pre-filtered to [{meter}] — you can change this" (per UI-SPEC copywriting)

---

### `src/components/precent/PrecentingBar.tsx` (amber status bar)

**Analog:** `src/components/singing/PsalmTopBar.tsx` — sticky bar with nav arrows + content

Look at the sticky bar pattern in PsalmTopBar for structural reference. The PrecentingBar is simpler:

```typescript
'use client'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PrecentingBarProps {
  setId: number
  pos: number      // 1-based current position
  total: number
}

export function PrecentingBar({ setId, pos, total }: PrecentingBarProps) {
  const prevHref = `/precent/${setId}/sing/${pos - 1}`
  const nextHref = `/precent/${setId}/sing/${pos + 1}`

  return (
    <div className="h-10 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 flex items-center justify-between px-4">
      {/* Left arrow — invisible on pos=1 to preserve layout */}
      <Link
        href={prevHref}
        aria-label="Previous psalm"
        className={`p-2.5 text-amber-700 dark:text-amber-300 ${pos === 1 ? 'invisible' : ''}`}
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs text-amber-700 dark:text-amber-300 uppercase tracking-wide">
          Precenting Mode
        </span>
        <span className="text-sm font-semibold tabular-nums text-amber-900 dark:text-amber-200">
          {pos} / {total}
        </span>
      </div>

      {/* Right arrow — invisible on last position */}
      <Link
        href={nextHref}
        aria-label="Next psalm"
        className={`p-2.5 text-amber-700 dark:text-amber-300 ${pos === total ? 'invisible' : ''}`}
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  )
}
```

**UI-SPEC reference:** `h-10 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 flex items-center justify-between px-4`. Counter: `text-sm font-semibold tabular-nums`. Label: `text-xs uppercase tracking-wide`. Both arrows use `invisible` (not `hidden`) on boundaries to preserve layout width.

---

### `src/components/SiteHeader.tsx` (modify — add Precent nav item)

**Analog:** self (lines 9-14)

**Current navLinks** (lines 9-14):
```typescript
const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/explore", label: "Explore" },
  { href: "/daily", label: "Daily Plan" },
]
```

**Change:** append `{ href: "/precent", label: "Precent" }` to the array. No other changes needed — the rest of SiteHeader renders navLinks dynamically.

---

### `src/components/PsalmListingGrid.tsx` (modify — add onSelect prop)

**Analog:** self (lines 51-128)

**Current props interface** (lines 51-53):
```typescript
interface PsalmListingGridProps {
  psalms: PsalmRow[]
}
```

**Required change — add optional onSelect:**
```typescript
interface PsalmListingGridProps {
  psalms: PsalmRow[]
  onSelect?: (psalm: PsalmRow) => void   // new: when provided, suppress router.push
}
```

**handleKeyDown currently** (lines 118-128):
```typescript
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter' && selectedPsalm) {
    router.push(`/psalms/${selectedPsalm.slug}`)   // ← branch on onSelect here
  }
  // ...
}
```

**PsalmNumberBox** (imported at line 10) currently uses `<Link href={...}>`. When `onSelect` is provided, `PsalmNumberBox` must receive an `onClick` prop that calls `onSelect(psalm)` instead of navigating.

---

### `src/components/TuneGrid.tsx` (modify — add initialMeter + onSelectTune props)

**Analog:** self (lines 19-76)

**Current props** (lines 19-21):
```typescript
interface TuneGridProps {
  tunes: TuneRow[]
}
```

**Required changes:**
```typescript
interface TuneGridProps {
  tunes: TuneRow[]
  initialMeter?: string                          // new: pre-select meter filter
  onSelectTune?: (tune: TuneRow) => void         // new: callback instead of Link nav
}
```

**Current useState initialisation** (lines 26-28):
```typescript
const [selectedMeter, setSelectedMeter] = useState<string>(
  searchParams.get('meter') ?? 'all'
)
```

**Change to:** `useState<string>(initialMeter ?? searchParams.get('meter') ?? 'all')`

**handleMeterChange currently** (lines 60-64):
```typescript
function handleMeterChange(v: string) {
  const val = v ?? 'all'
  setSelectedMeter(val)
  router.replace(buildUrl(val, selectedMood), { scroll: false })  // ← no-op when onSelectTune provided
}
```

**Tune card Link** (lines 127-130): When `onSelectTune` provided, replace `<Link href={...}>` with `<button onClick={() => onSelectTune(tune)}>`.

---

### `src/components/precent/SetItemsSortableList.tsx` and `SetItemRow.tsx`

**No codebase analog** — dnd-kit is not yet installed. Use the reference pattern from RESEARCH.md Pattern 1 directly:

```typescript
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
import { useState, useTransition } from 'react'
```

**Critical:** `{...listeners}` goes ONLY on the `GripVertical` button (the drag handle), NOT on the `<tr>`. The `<tr>` gets `ref={setNodeRef}` and `style={{ transform: CSS.Transform.toString(transform), transition }}`. During drag: `opacity-50` on the dragged row. On `onDragEnd`: call `arrayMove`, update optimistic state, then `fetch('/api/precent/[id]/reorder', ...)`, revert on error with toast.

---

## Shared Patterns

### `export const dynamic = 'force-dynamic'`

**Source:** `src/app/tunes/page.tsx` line 1, `src/app/psalms/[id]/page.tsx` line 1, `src/app/api/dev/melisma-save/route.ts` line 35

**Apply to:** ALL `/precent/*` pages and `/api/precent/*` routes. No `generateStaticParams` anywhere in the precent tree.

### Drizzle Relational Query API

**Source:** `src/app/psalms/[id]/page.tsx` lines 71-74 and `src/app/api/search/route.ts` lines 40-48

**Pattern:**
```typescript
const set = await db.query.precentingSets.findFirst({
  where: eq(precentingSets.id, setId),
  with: {
    setItems: {
      orderBy: [asc(setItems.position)],
      with: { psalm: { columns: { id: true, bibleTitle: true } } },
    },
  },
})
if (!set) notFound()
```

**Apply to:** Set detail page, set list page, precenting sing page.

### Async `params` (Next.js 15)

**Source:** `src/app/psalms/[id]/page.tsx` line 64

```typescript
const { id: slug } = await params     // ← always await in Next.js 15
```

**Apply to:** ALL pages with dynamic segments (`/precent/[id]/page.tsx`, `/precent/[id]/sing/[pos]/page.tsx`) and ALL API routes with dynamic segments (`/api/precent/[id]/route.ts`, etc.).

### Input Validation in API Routes

**Source:** `src/app/api/dev/melisma-save/route.ts` lines 62-68

```typescript
if (typeof body.tuneId !== 'number' || typeof body.abcNotation !== 'string') {
  return NextResponse.json(
    { error: 'tuneId (number) and abcNotation (non-empty string) required' },
    { status: 400 },
  )
}
```

**Apply to:** All POST/PATCH API routes in `/api/precent/*`. Validate: `setId` is an integer, `type` is one of the allowed values, `note`/`verseRange` length within bounds.

### Skeleton loading with `Skeleton` + `animate-pulse`

**Source:** `src/app/psalms/loading.tsx` lines 1-35, `src/app/tunes/loading.tsx` lines 1-25

```typescript
import { Skeleton } from "@/components/ui/skeleton"
// Skeleton className="h-12 w-full" — use h-* matching real element height
// bg-muted animate-pulse rounded — for non-shadcn skeleton elements
```

**Apply to:** All three `loading.tsx` files in the `/precent` tree.

### `Dialog` open/close pattern

**Source:** `src/components/ChangeTuneDialog.tsx` line 32, `src/components/SelectPsalmDialog.tsx` line 61

```typescript
<Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetState() } }}>
  <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-4">
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
    </DialogHeader>
    {/* scrollable body */}
    <div className="overflow-y-auto flex-1 -mx-1 px-1">
```

**Apply to:** `PsalmPickerModal` and `TunePickerModal`. Both reset local state (query string, selected psalm) on close.

### `notFound()` on missing entity

**Source:** `src/app/psalms/[id]/page.tsx` line 71, `src/app/explore/topics/[slug]/page.tsx` line 69

```typescript
if (!set) notFound()
```

**Apply to:** Set detail page and precenting sing page after DB lookup.

### Optimistic update + revert on error

**Source:** RESEARCH.md Pattern 1 (dnd-kit section) — no existing codebase example, but this is the standard React pattern to follow

```typescript
// 1. Store original
const [optimisticItems, setOptimisticItems] = useState(items)
// 2. Update immediately
setOptimisticItems(arrayMove(optimisticItems, oldIndex, newIndex))
// 3. Persist async
const res = await fetch(...)
// 4. Revert on failure
if (!res.ok) setOptimisticItems(items)
```

**Apply to:** `SetItemsSortableList` drag-end handler. Same pattern (but simpler) for delete item — remove from list optimistically, restore on API error.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/precent/SetItemsSortableList.tsx` | component | event-driven | No drag-and-drop exists in codebase; dnd-kit not yet installed |
| `src/components/precent/SetItemRow.tsx` | component | event-driven | Same — no `useSortable` usage exists to reference |

For these files, use RESEARCH.md Pattern 1 (dnd-kit v6 classic API with `DndContext`, `SortableContext`, `useSortable`, `arrayMove`) as the implementation reference.

---

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `src/db/`, `src/app/api/`
**Files scanned:** 22 analog candidates read; 4 API routes, 6 pages, 8 components, 1 schema, 3 loading files
**Pattern extraction date:** 2026-06-14
