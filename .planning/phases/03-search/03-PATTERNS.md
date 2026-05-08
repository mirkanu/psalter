# Phase 3: Search - Pattern Map

**Mapped:** 2026-05-08
**Files analyzed:** 11 new/modified files
**Analogs found:** 11 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/search/page.tsx` | page (RSC, dynamic) | request-response | `src/app/psalms/[id]/page.tsx` | role-match (dynamic page with async params) |
| `src/app/search/loading.tsx` | loading skeleton | — | `src/app/psalms/[id]/page.tsx` Suspense fallback | partial (inline fallback pattern) |
| `src/app/explore/page.tsx` | page (RSC, static) | CRUD | `src/app/tunes/page.tsx` | role-match (RSC list page) |
| `src/app/explore/loading.tsx` | loading skeleton | — | inline `animate-pulse` in psalm/daily pages | partial |
| `src/app/explore/topics/[slug]/page.tsx` | page (RSC, static, dynamic segment) | CRUD | `src/app/psalms/[id]/page.tsx` | exact (static dynamic segment + generateStaticParams) |
| `src/app/explore/naves/[slug]/page.tsx` | page (RSC, static, dynamic segment) | CRUD | `src/app/psalms/[id]/page.tsx` | exact |
| `src/app/explore/messianic/page.tsx` | page (RSC, static) | CRUD | `src/app/daily/page.tsx` | role-match (static list page) |
| `src/app/explore/authors/[author]/page.tsx` | page (RSC, static, dynamic segment) | CRUD | `src/app/daily/[day]/page.tsx` | exact (static dynamic segment) |
| `src/components/TuneGrid.tsx` | component (client, filter) | request-response | `src/components/PsalmGrid.tsx` | exact |
| `src/db/queries/search.ts` | query module | request-response | `src/db/queries/psalms.ts` | role-match (query file pattern) |
| `src/db/queries/explore.ts` | query module | CRUD | `src/db/queries/psalms.ts` + `src/db/queries/tunes.ts` | role-match |
| `src/components/SiteHeader.tsx` (modified) | component (RSC→client) | — | self | — (upgrade: add `'use client'` + `usePathname`) |
| `src/app/tunes/page.tsx` (modified) | page (RSC→delegates to TuneGrid) | CRUD | `src/app/psalms/page.tsx` | exact (RSC fetches + passes to client grid) |

---

## Pattern Assignments

### `src/db/queries/search.ts` (query module, request-response)

**Analog:** `src/db/queries/psalms.ts`

**Imports pattern** (`src/db/queries/psalms.ts` lines 1–4):
```typescript
import { cache } from "react"
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { psalms } from "@/db/schema"
```

**CRITICAL difference for this file** — import `sql` from `drizzle-orm`, NOT from `@/db`:
```typescript
// src/db/queries/search.ts
import { db } from "@/db"
import { sql } from "drizzle-orm"   // <-- drizzle-orm, NOT @/db
// src/db/index.ts exports the postgres.js pool as `sql` — using it as a
// Drizzle template tag causes a runtime error. Always import from 'drizzle-orm'.
```

**Core FTS query pattern** (from RESEARCH.md verified pattern):
```typescript
export async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const rows = await db.execute(sql`
    SELECT
      p.id,
      pv.first_line AS "firstLine",
      pv.meter,
      ts_rank(
        to_tsvector('english', COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, '')),
        plainto_tsquery('english', ${query})
      ) AS rank,
      ts_headline(
        'english',
        COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, ''),
        plainto_tsquery('english', ${query}),
        'StartSel=<b>, StopSel=</b>, MaxWords=15, MinWords=5, MaxFragments=1'
      ) AS snippet
    FROM psalms p
    LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
    WHERE to_tsvector('english', COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, ''))
      @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 50
  `)

  return rows as SearchResult[]
}
```

**Export type pattern** (`src/db/queries/psalms.ts` line 39):
```typescript
export type PsalmDetail = NonNullable<Awaited<ReturnType<typeof fetchPsalmDetail>>>
```
Apply same pattern: `export type SearchResult = { id: number; firstLine: string | null; meter: string | null; rank: number; snippet: string }`

---

### `src/db/queries/explore.ts` (query module, CRUD)

**Analog:** `src/db/queries/tunes.ts` and `src/db/queries/psalms.ts`

**Imports pattern** (`src/db/queries/tunes.ts` lines 1–4):
```typescript
import { cache } from "react"
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { tunes } from "@/db/schema"
```

**Adapted imports for explore.ts:**
```typescript
import { db } from "@/db"
import { sql } from "drizzle-orm"          // for Naves count (multi-join)
import { eq, asc, desc, count, isNotNull } from "drizzle-orm"
import { topics, psalmTopics, navesTopics, verseNavesTopics, verses, psalms, messianicPsalms, psalmVersions } from "@/db/schema"
```

**Drizzle select pattern** (`src/db/queries/tunes.ts` lines 12–17):
```typescript
export async function fetchAllTunes() {
  return db.select({
    id: tunes.id,
    name: tunes.name,
    meter: tunes.meter,
    scoreJpgUrl: tunes.scoreJpgUrl,
  }).from(tunes).orderBy(asc(tunes.name))
}
```

**Naves count query — multi-join through verses** (RESEARCH.md pitfall 4 pattern):
```typescript
// Must join naves_topics → verse_naves_topics → verses to get psalm_id
// Direct naves_topics → psalm does NOT exist in schema
export async function fetchNavesTopicsWithCounts() {
  const rows = await db.execute(sql`
    SELECT nt.id, nt.name, COUNT(DISTINCT v.psalm_id) AS psalm_count
    FROM naves_topics nt
    JOIN verse_naves_topics vnt ON vnt.naves_topic_id = nt.id
    JOIN verses v ON v.id = vnt.verse_id
    GROUP BY nt.id, nt.name
    ORDER BY psalm_count DESC
  `)
  return rows as Array<{ id: number; name: string; psalm_count: number }>
}
```

**Topics count query — Drizzle typed select:**
```typescript
export async function fetchTopicsWithCounts() {
  return db
    .select({ id: topics.id, name: topics.name, count: count(psalmTopics.psalmId) })
    .from(topics)
    .leftJoin(psalmTopics, eq(psalmTopics.topicId, topics.id))
    .where(isNotNull(topics.name))
    .groupBy(topics.id, topics.name)
    .orderBy(desc(count(psalmTopics.psalmId)))
}
```

**Psalms-by-naves-topic query** (RESEARCH.md pitfall 4 fix pattern):
```typescript
// NOT: SELECT psalm_id FROM verse_naves_topics WHERE naves_topic_id = ?
// CORRECT: multi-join through verses table
export async function fetchPsalmsByNavesTopic(topicId: number) {
  const rows = await db.execute(sql`
    SELECT DISTINCT v.psalm_id FROM verse_naves_topics vnt
    JOIN verses v ON v.id = vnt.verse_id
    WHERE vnt.naves_topic_id = ${topicId}
  `)
  return rows as Array<{ psalm_id: number }>
}
```

**cache() usage pattern** (`src/db/queries/psalms.ts` lines 15–16):
```typescript
export const fetchPsalmDetail = cache(async function fetchPsalmDetail(id: number) {
```
Apply `cache()` to any per-item fetch (fetchPsalmsByTopic, fetchPsalmsByNavesTopic) called from both `generateMetadata` and the page body.

---

### `src/app/search/page.tsx` (page, RSC, dynamic, request-response)

**Analog:** `src/app/psalms/[id]/page.tsx`

**Dynamic page imports pattern** (`src/app/psalms/[id]/page.tsx` lines 1–4):
```typescript
import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import { fetchPsalmDetail, fetchPsalmIds } from "@/db/queries/psalms"
```

**Next.js 15 async searchParams pattern** (RESEARCH.md Pattern 3 — verified for Next.js 16.2.5):
```typescript
// searchParams is a Promise in Next.js 15+; must await it
type SearchParams = Promise<{ q?: string | string[] }>

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams
  const query = Array.isArray(q) ? q[0] : (q ?? '')

  const results = query ? await fetchSearchResults(query) : []
  // ...
}
```

**Page layout shell pattern** (`src/app/psalms/page.tsx` lines 34–35):
```typescript
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
  <div className="mb-6 mt-4">
```

**Suspense fallback pattern** (`src/app/psalms/[id]/page.tsx` line 43):
```typescript
<Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded mt-6" />}>
```

**XSS-safe snippet rendering** — use `dangerouslySetInnerHTML` with `data-snippet` attribute scope:
```tsx
// ts_headline output is PostgreSQL-generated <b> tags, not user-originated HTML — safe
<p data-snippet className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: result.snippet }} />
// In globals.css: [data-snippet] b { font-weight: 600; }
```

---

### `src/app/search/loading.tsx` (loading skeleton)

**Analog:** Inline `animate-pulse` pattern from `src/app/psalms/[id]/page.tsx` line 43 + `src/app/daily/page.tsx`

**Skeleton pattern:**
```tsx
// 5 skeleton rows matching the compact list row shape
export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="h-10 w-72 bg-muted animate-pulse rounded mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}
```

---

### `src/app/explore/page.tsx` (page, RSC, static, CRUD)

**Analog:** `src/app/tunes/page.tsx`

**Static RSC list page pattern** (`src/app/tunes/page.tsx` full file):
```typescript
import Link from "next/link"
import type { Metadata } from "next"
import { fetchAllTunes } from "@/db/queries/tunes"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Tunes | CPRC Psalter",
  description: "Browse all tunes in the Scottish Psalter.",
}

export default async function TunesPage() {
  const tunes = await fetchAllTunes()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-3">
          Tunes
        </h1>
```

**Adapted for explore hub:** fetch all taxonomy counts, render taxonomy sections with Link cards per taxonomy value. No `generateStaticParams` needed (static leaf page, not a dynamic segment).

**Badge usage pattern** (`src/app/tunes/page.tsx` lines 36–38):
```tsx
{tune.meter && (
  <Badge variant="secondary" className="text-xs shrink-0">
    {tune.meter}
  </Badge>
)}
```
Use Badge for psalm count on each taxonomy row: `<Badge variant="secondary">{topic.count} psalms</Badge>`

---

### `src/app/explore/topics/[slug]/page.tsx` (page, RSC, static dynamic segment)

**Analog:** `src/app/psalms/[id]/page.tsx`

**generateStaticParams pattern** (`src/app/psalms/[id]/page.tsx` lines 11–13):
```typescript
export async function generateStaticParams() {
  const ids = await fetchPsalmIds()
  return ids.map((id) => ({ id: String(id) }))
}
```

**Adapted for topic slug:**
```typescript
export async function generateStaticParams() {
  const topics = await fetchTopicsWithCounts()
  return topics.map((t) => ({ slug: slugify(t.name ?? '') }))
}
```

**Async params pattern** (`src/app/psalms/[id]/page.tsx` lines 7–9, 16–18, 26–28):
```typescript
interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  // ...
}

export default async function PsalmPage({ params }: PageProps) {
  const { id } = await params
  const psalmId = Number(id)
  if (!Number.isFinite(psalmId) || psalmId < 1 || psalmId > 150) notFound()
```

**Adapted for topic slug:**
```typescript
interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params
  // lookup topic by slug, then fetchPsalmsByTopic(topic.id)
  if (!topic) notFound()
```

**Back link pattern** (`src/app/daily/[day]/page.tsx` line 33):
```typescript
<Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
  ← Back to Explore
</Link>
```

---

### `src/app/explore/naves/[slug]/page.tsx` (page, RSC, static dynamic segment)

**Analog:** `src/app/psalms/[id]/page.tsx`

Same pattern as `/explore/topics/[slug]/page.tsx` above, with two differences:

1. **Slug collision handling** — use `buildNavesSlug(id, name)` at `generateStaticParams` time:
```typescript
// The one collision: "Mercy Seat" (id 269) and "Mercy-Seat" (id 477) both → "mercy-seat"
// Append -{id} suffix only for the colliding pair (detected at generateStaticParams time)
function buildNavesSlug(id: number, name: string, slugCounts: Map<string, number>): string {
  const base = slugify(name)
  return (slugCounts.get(base) ?? 1) > 1 ? `${base}-${id}` : base
}
```

2. **Join chain** — the query must join through `verses` (see `src/db/queries/explore.ts` pattern above).

---

### `src/app/explore/messianic/page.tsx` (page, RSC, static)

**Analog:** `src/app/daily/page.tsx` (static list page rendering a simple ordered list)

**List rendering pattern** (`src/app/daily/page.tsx` lines 20–48):
```typescript
<ol className="divide-y divide-border">
  {readings.map((r) => (
    <li key={r.dayNumber} className="flex items-center gap-4 py-3 px-3 ...">
      <span className="font-mono text-sm tabular-nums text-muted-foreground w-12 shrink-0">
        {r.dayNumber}
      </span>
      <Link href={`/psalms/${psalmId}`} className="flex-1 text-base hover:text-primary transition-colors">
        ...
      </Link>
    </li>
  ))}
</ol>
```

No `generateStaticParams` needed (single static page). No dynamic segment. Fetch `messianicPsalms` with joined psalm data.

---

### `src/app/explore/authors/[author]/page.tsx` (page, RSC, static dynamic segment)

**Analog:** `src/app/daily/[day]/page.tsx`

**Generates known params from DB** (`src/app/daily/[day]/page.tsx` lines 10–11):
```typescript
export function generateStaticParams() {
  return Array.from({ length: 365 }, (_, i) => ({ day: String(i + 1) }))
}
```

**Adapted for authors:**
```typescript
export async function generateStaticParams() {
  const authors = await fetchDistinctAuthors()
  return authors.map((a) => ({ author: encodeURIComponent(a) }))
}
```

**Async params + notFound()** (`src/app/daily/[day]/page.tsx` lines 21–26):
```typescript
export default async function DailyDayPage({ params }: PageProps) {
  const { day } = await params
  const dayNumber = Number(day)
  if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 365) notFound()
  const reading = await fetchDailyReading(dayNumber)
  if (!reading) notFound()
```

---

### `src/components/TuneGrid.tsx` (component, client, filter)

**Analog:** `src/components/PsalmGrid.tsx` — copy this file structure exactly.

**Full client component pattern** (`src/components/PsalmGrid.tsx` lines 1–77):
```typescript
'use client'
import { useMemo, useState } from "react"
import { PsalmCard, type PsalmCardProps } from "./PsalmCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
```

**Filter state + useMemo pattern** (`src/components/PsalmGrid.tsx` lines 11–32):
```typescript
const [selectedBook, setSelectedBook] = useState<string>("all")
const [selectedMeter, setSelectedMeter] = useState<string>("all")

const meters = useMemo(() => {
  const unique = Array.from(new Set(psalms.map((p) => p.meter).filter((m): m is string => Boolean(m))))
  return unique.sort()
}, [psalms])

const filtered = useMemo(
  () => psalms.filter((p) => selectedMeter === "all" || p.meter === selectedMeter),
  [psalms, selectedMeter]
)
```

**Select onValueChange pattern** (`src/components/PsalmGrid.tsx` lines 40–41, 55–56):
```typescript
<Select value={selectedMeter} onValueChange={(v) => setSelectedMeter(v ?? "all")}>
```

**KEY DIFFERENCE from PsalmGrid:** TuneGrid syncs meter state to URL via `router.replace` (for shareability), and reads initial state from `useSearchParams()`. PsalmGrid uses local `useState` only.

```typescript
// TuneGrid URL sync pattern (different from PsalmGrid):
import { useRouter, useSearchParams } from 'next/navigation'

const router = useRouter()
const searchParams = useSearchParams()
const [selectedMeter, setSelectedMeter] = useState<string>(
  searchParams.get('meter') ?? 'all'
)

function handleMeterChange(v: string) {
  setSelectedMeter(v)
  if (v === 'all') {
    router.replace('/tunes', { scroll: false })
  } else {
    router.replace(`/tunes?meter=${encodeURIComponent(v)}`, { scroll: false })
  }
}
```

**Grid layout pattern** (`src/components/PsalmGrid.tsx` line 70):
```typescript
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
```
TuneGrid uses the existing inline tune card layout from `src/app/tunes/page.tsx` lines 24–42 (Link card with name + Badge).

---

### `src/components/SiteHeader.tsx` (modified — RSC → client)

**Analog:** Self (read the current file). Current state (`src/components/SiteHeader.tsx` lines 1–35):
```typescript
import Link from "next/link"

const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/daily", label: "Daily Plan" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
```

**Upgrade to 'use client' for active link** (RESEARCH.md Code Examples):
```typescript
'use client'
import Link from "next/link"
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/daily", label: "Daily Plan" },
  { href: "/search", label: "Search" },
  { href: "/explore", label: "Explore" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname.startsWith(href)
  // Link className: isActive(link.href)
  //   ? 'text-foreground bg-muted text-sm font-medium px-3 py-2 rounded-md'
  //   : 'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium px-3 py-2 rounded-md'
```

---

### `src/app/tunes/page.tsx` (modified — delegate to TuneGrid)

**Analog:** `src/app/psalms/page.tsx` (RSC that fetches + passes to client component)

**RSC → client delegation pattern** (`src/app/psalms/page.tsx` lines 1–46):
```typescript
import { db } from "@/db"
import { psalms, psalmVersions } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { PsalmGrid } from "@/components/PsalmGrid"

export default async function PsalmsPage() {
  const rows = await db.select({ ... }).from(psalms).leftJoin(...)
  // ...
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <PsalmGrid psalms={uniqueRows} />
    </div>
  )
}
```

**Adapted for tunes:** replace inline tune card rendering with `<TuneGrid tunes={tunes} />`. Keep the `fetchAllTunes()` call. Add `Suspense` wrapper around TuneGrid (required because TuneGrid uses `useSearchParams`):
```tsx
import { Suspense } from "react"
// ...
<Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded" />}>
  <TuneGrid tunes={tunes} />
</Suspense>
```

---

## Shared Patterns

### Async Params (Next.js 15+)
**Source:** `src/app/psalms/[id]/page.tsx` lines 7–9, 26–27
**Apply to:** All dynamic segment pages (`[slug]`, `[author]`) and search page (`searchParams`)
```typescript
// params
interface PageProps { params: Promise<{ id: string }> }
const { id } = await params

// searchParams (search page)
type SearchParams = Promise<{ q?: string | string[] }>
const { q } = await searchParams
```

### notFound() Guard
**Source:** `src/app/psalms/[id]/page.tsx` lines 29–30
**Apply to:** All dynamic segment pages
```typescript
if (!result) notFound()
```

### Page Layout Shell
**Source:** `src/app/psalms/page.tsx` line 34 / `src/app/tunes/page.tsx` line 15
**Apply to:** All new page files
```typescript
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
  <div className="mb-6 mt-4">
    <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-3">
```

### Back Link
**Source:** `src/app/daily/[day]/page.tsx` line 33
**Apply to:** All `/explore/[taxonomy]/[slug]` detail pages
```typescript
<Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground">
  ← Back to Explore
</Link>
```

### Animate-Pulse Skeleton
**Source:** `src/app/psalms/[id]/page.tsx` line 43
**Apply to:** All `loading.tsx` files
```typescript
<div className="h-12 bg-muted animate-pulse rounded mt-6" />
```

### DB Import Convention
**Source:** `src/db/queries/psalms.ts` lines 1–4 / `src/db/index.ts` lines 19–20
**Apply to:** `src/db/queries/search.ts` and `src/db/queries/explore.ts`
```typescript
import { db } from "@/db"              // Drizzle ORM client
import { sql } from "drizzle-orm"      // FTS template tag — NEVER from "@/db"
```

### cache() for Shared DB Calls
**Source:** `src/db/queries/psalms.ts` lines 15–16
**Apply to:** Any query called from both `generateMetadata` and page body
```typescript
export const fetchTopic = cache(async function fetchTopic(slug: string) {
  // ...
})
```

### Select Component Pattern
**Source:** `src/components/PsalmGrid.tsx` lines 40–48
**Apply to:** `TuneGrid.tsx` meter filter
```typescript
<Select value={selectedMeter} onValueChange={(v) => setSelectedMeter(v ?? "all")}>
  <SelectTrigger id="meter-filter" className="w-64">
    <SelectValue placeholder="All Meters" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Meters</SelectItem>
    {meters.map((meter) => (
      <SelectItem key={meter} value={meter}>{meter}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## No Analog Found

No files in this phase lack an analog entirely. However, two patterns have no existing codebase example and must follow RESEARCH.md patterns:

| File | Role | Pattern Source |
|------|------|----------------|
| `src/app/search/loading.tsx` (and other `loading.tsx` files) | loading skeleton | RESEARCH.md + animate-pulse inline examples — no dedicated `loading.tsx` files exist yet in the project |
| Slug collision detection in `generateStaticParams` | utility | RESEARCH.md Pattern 5 — no slug logic exists yet in codebase |

---

## Metadata

**Analog search scope:** `src/app/**`, `src/components/**`, `src/db/queries/**`
**Files scanned:** 14 source files read in full
**Pattern extraction date:** 2026-05-08
