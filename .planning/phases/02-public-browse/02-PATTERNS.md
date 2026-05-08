# Phase 2: Public Browse - Pattern Map

**Mapped:** 2026-05-07
**Files analyzed:** 19 new/modified files
**Analogs found:** 16 / 19

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/layout.tsx` | layout | request-response | `src/app/layout.tsx` (psalter — modify existing) | exact |
| `src/app/page.tsx` | page (RSC) | request-response | `src/app/page.tsx` (prc homepage) | role-match |
| `src/app/psalms/page.tsx` | page (RSC) | CRUD read | `src/app/resources/page.tsx` (prc) | role-match |
| `src/app/psalms/[id]/page.tsx` | page (RSC, generateStaticParams) | CRUD read | `src/app/confessions/[confession]/page.tsx` (prc) | exact |
| `src/app/tunes/page.tsx` | page (RSC) | CRUD read | `src/app/resources/page.tsx` (prc) | role-match |
| `src/app/tunes/[id]/page.tsx` | page (RSC, generateStaticParams) | CRUD read | `src/app/confessions/[confession]/page.tsx` (prc) | exact |
| `src/app/daily/page.tsx` | page (RSC) | CRUD read | `src/app/resources/page.tsx` (prc) | role-match |
| `src/app/daily/[day]/page.tsx` | page (RSC, generateStaticParams) | CRUD read | `src/app/confessions/[confession]/page.tsx` (prc) | role-match |
| `src/components/SiteHeader.tsx` | component (RSC) | request-response | `src/components/ui/Header.tsx` (prc) | role-match |
| `src/components/PsalmCard.tsx` | component (RSC) | request-response | (card pattern from prc resources page inline) | partial |
| `src/components/PsalmGrid.tsx` | component (client, filter) | request-response | `src/components/ui/Header.tsx` (prc, `use client` pattern) | partial |
| `src/components/PsalmTabs.tsx` | component (client, useSearchParams) | request-response | no exact analog — see RESEARCH.md Pattern 2 | none |
| `src/components/TodayCard.tsx` | component (RSC) | request-response | (inline card from prc pages) | partial |
| `src/components/DailyPlanClient.tsx` | component (client, useEffect) | event-driven | no exact analog — see RESEARCH.md Pattern 4 | none |
| `src/components/YouTubeEmbed.tsx` | component (RSC/client) | request-response | `src/components/resource/SermonVideoEmbed` pattern (prc, inline) | partial |
| `src/db/schema.ts` | model | CRUD | `src/db/schema.ts` (psalter — modify existing) | exact |
| `src/db/queries/psalms.ts` | utility (query) | CRUD read | `scripts/migrate-airtable.ts` (psalter, drizzle db patterns) | role-match |
| `src/db/queries/tunes.ts` | utility (query) | CRUD read | `scripts/migrate-airtable.ts` (psalter, drizzle db patterns) | role-match |
| `src/db/queries/daily.ts` | utility (query) | CRUD read | `scripts/migrate-airtable.ts` (psalter, drizzle db patterns) | role-match |
| `src/lib/daily.ts` | utility | transform | no analog — pure date math | none |
| `src/lib/youtube.ts` | utility | transform | no analog — 5-line regex utility | none |

---

## Pattern Assignments

### `src/app/layout.tsx` (layout — modify existing)

**Analog:** `src/app/layout.tsx` (psalter, lines 1-33) and `src/app/layout.tsx` (prc, lines 66-93)

**Existing imports pattern** (`src/app/layout.tsx` lines 1-8):
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
```

**Addition — import SiteHeader** (insert after globals.css import):
```typescript
import { SiteHeader } from "@/components/SiteHeader";
```

**Body pattern to follow** (`/data/home/prc/src/app/layout.tsx` lines 74-93):
```tsx
<body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}>
  <SiteHeader />
  <main className="flex-1">{children}</main>
</body>
```

**Note:** Keep existing `min-h-full flex flex-col` on body; add `<SiteHeader />` before `{children}` wrapped in `<main className="flex-1">`.

---

### `src/app/page.tsx` (homepage RSC — full replacement)

**Analog:** `src/app/page.tsx` (psalter, lines 1-65, to be replaced) + prc homepage card structure

**Imports pattern** (derive from prc + psalter conventions):
```typescript
import { db } from "@/db"
import { dailyReadings, psalms } from "@/db/schema"
import { eq } from "drizzle-orm"
import { TodayCard } from "@/components/TodayCard"
import { PsalmSearchWidget } from "@/components/PsalmSearchWidget"
```

**Core RSC pattern** (build-time data fetch, then pass to components):
```tsx
export default async function HomePage() {
  // Fetch all 365 daily readings at build time (static)
  // Today card receives the full list; client component picks today's entry
  const readings = await db.query.dailyReadings.findMany({
    with: { psalm: true },
    orderBy: (r, { asc }) => [asc(r.dayNumber)],
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <TodayCard readings={readings} />
      <PsalmSearchWidget />
    </div>
  )
}
```

**Tailwind container pattern** (from prc, `src/app/resources/page.tsx` line 159):
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
```

---

### `src/app/psalms/page.tsx` (psalm list RSC)

**Analog:** `src/app/resources/page.tsx` (prc) — RSC, no `generateStaticParams`, data fetched at build

**Imports pattern** (prc `resources/page.tsx` lines 1-7 adapted for psalter):
```typescript
import { db } from "@/db"
import { psalms, psalmVersions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { PsalmGrid } from "@/components/PsalmGrid"
import type { Metadata } from "next"
```

**Core static list pattern** (derived from RESEARCH.md Pattern 1 + prc page structure):
```tsx
export const metadata: Metadata = {
  title: "Psalms | CPRC Psalter",
}

export default async function PsalmsPage() {
  const rows = await db
    .select({
      id: psalms.id,
      bibleTitle: psalms.bibleTitle,
      book: psalms.book,
      firstLine: psalmVersions.firstLine,
      meter: psalmVersions.meter,
    })
    .from(psalms)
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))
    .orderBy(psalms.id)

  // Deduplicate: keep only first version per psalm for card display
  const seen = new Set<number>()
  const uniqueRows = rows.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <h1 className="text-3xl font-bold mb-6">The 150 Psalms</h1>
      <PsalmGrid psalms={uniqueRows} />
    </div>
  )
}
```

**Page header pattern** (from prc `resources/page.tsx` lines 163-174):
```tsx
<div className="text-center mb-6 mt-4">
  <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
    The 150 Psalms
  </h1>
  <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
    Browse the Scottish Psalter
  </p>
</div>
```

---

### `src/app/psalms/[id]/page.tsx` (psalm detail RSC + generateStaticParams)

**Analog:** `src/app/confessions/[confession]/page.tsx` (prc, lines 96-119) — same role+data flow: static params + RSC body

**Imports pattern** (prc `confessions/[confession]/page.tsx` lines 1-12, adapted):
```typescript
import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import { db } from "@/db"
import { psalms } from "@/db/schema"
import { fetchPsalmDetail, fetchPsalmIds } from "@/db/queries/psalms"
import { PsalmTabs } from "@/components/PsalmTabs"
```

**generateStaticParams + params-as-Promise pattern** (prc `confessions/[confession]/page.tsx` lines 96-101):
```typescript
interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const ids = await fetchPsalmIds()
  return ids.map((id) => ({ id: String(id) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  // ...
}
```

**Core RSC page body pattern** (prc `confessions/[confession]/page.tsx` lines 118-130):
```typescript
export default async function PsalmPage({ params }: PageProps) {
  const { id } = await params
  const psalm = await fetchPsalmDetail(Number(id))
  if (!psalm) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{psalm.bibleTitle}</h1>
      <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded" />}>
        <PsalmTabs psalm={psalm} />
      </Suspense>
    </div>
  )
}
```

**notFound pattern** (prc `confessions/[confession]/page.tsx` line 122):
```typescript
const config = CONFESSION_CONFIG[slug as ConfessionSlug]
if (!config) notFound()
```

---

### `src/app/tunes/page.tsx` (tune list RSC)

**Analog:** `src/app/resources/page.tsx` (prc) — static listing, no params

**Imports + core pattern** (same shape as `psalms/page.tsx` above, different table):
```typescript
import { db } from "@/db"
import { tunes } from "@/db/schema"
import { asc } from "drizzle-orm"
import Link from "next/link"

export default async function TunesPage() {
  const allTunes = await db
    .select({ id: tunes.id, name: tunes.name, meter: tunes.meter })
    .from(tunes)
    .orderBy(asc(tunes.name))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* ... grid of tune cards */}
    </div>
  )
}
```

---

### `src/app/tunes/[id]/page.tsx` (tune detail RSC + generateStaticParams)

**Analog:** `src/app/confessions/[confession]/page.tsx` (prc, lines 96-119) — same exact shape

**Key differences from psalm detail:**
- No tab component — single-view layout
- Score JPG via `<img src={tune.scoreJpgUrl} />` (no Next/Image config needed — served from `public/`)
- YouTube embed via `YouTubeEmbed` client component or direct iframe
- `generateStaticParams` iterates over 172 tune IDs

**Score image pattern** (prc `resource/[id]/page.tsx` lines 258-264, adapted):
```tsx
{tune.scoreJpgUrl && (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={tune.scoreJpgUrl}
    alt={`Score for ${tune.name}`}
    className="w-full rounded-xl border border-border"
  />
)}
```

---

### `src/app/daily/page.tsx` (daily plan RSC)

**Analog:** `src/app/resources/page.tsx` (prc, lines 147-480) — full static list + embedded data

**Core pattern:**
```typescript
export default async function DailyPage() {
  const readings = await db.query.dailyReadings.findMany({
    with: { psalm: true },
    orderBy: (r, { asc }) => [asc(r.dayNumber)],
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <DailyPlanClient />  {/* side-effect only: scrollIntoView */}
      <ol>
        {readings.map((r) => (
          <li key={r.dayNumber} data-day={r.dayNumber}>
            {/* ... */}
          </li>
        ))}
      </ol>
    </div>
  )
}
```

---

### `src/app/daily/[day]/page.tsx` (single day RSC + generateStaticParams)

**Analog:** `src/app/confessions/[confession]/page.tsx` (prc) — same shape, params is Promise

**generateStaticParams:**
```typescript
export async function generateStaticParams() {
  return Array.from({ length: 365 }, (_, i) => ({ day: String(i + 1) }))
}
```

---

### `src/components/SiteHeader.tsx` (RSC sticky nav)

**Analog:** `src/components/ui/Header.tsx` (prc, lines 1-163)

**Note:** The prc Header is `'use client'` due to `useRouter` for pending nav state. The psalter SiteHeader can be RSC since no auth state or pending transitions are needed in Phase 2. Active-link detection requires `'use client'` and `usePathname` only if active link highlight is needed.

**Simplified RSC nav pattern** (derived from prc Header lines 77-114):
```tsx
import Link from "next/link"

const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/daily", label: "Daily Plan" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-semibold text-foreground">
            CPRC Psalter
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium px-3 py-2 rounded-md"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
```

---

### `src/components/PsalmCard.tsx` (RSC card)

**Analog:** Card link pattern from `src/app/resources/page.tsx` (prc, lines 225-255)

**Card pattern** (prc `resources/page.tsx` lines 225-255):
```tsx
<Link
  key={source.slug}
  href={`/sources/${source.slug}`}
  className="block bg-white border border-navy-100/80 rounded-xl p-5 shadow-soft hover:shadow-card-hover hover:border-navy-200/80 transition-all duration-200 group"
>
  <div className="flex items-start justify-between">
    {/* content */}
  </div>
</Link>
```

**Psalter adaptation** (shadcn Nova tokens, stone/slate palette):
```tsx
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PsalmCardProps {
  id: number
  bibleTitle: string | null
  book: string | null
  firstLine: string | null
  meter: string | null
}

export function PsalmCard({ id, bibleTitle, book, firstLine, meter }: PsalmCardProps) {
  return (
    <Link
      href={`/psalms/${id}`}
      className="block bg-card border border-border rounded-xl p-5 hover:border-ring/50 hover:shadow-sm transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl font-bold text-muted-foreground">{id}</span>
        {meter && (
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {meter}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
        {bibleTitle ?? `Psalm ${id}`}
      </p>
      {firstLine && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
          {firstLine}
        </p>
      )}
    </Link>
  )
}
```

---

### `src/components/PsalmGrid.tsx` (client component, book filter)

**Analog:** `src/components/ui/Header.tsx` (prc, line 1 `'use client'`) for the client directive; `useMemo` filter is a standard React pattern with no direct analog.

**Core pattern:**
```tsx
'use client'
import { useMemo, useState } from "react"
import { PsalmCard } from "./PsalmCard"

type PsalmRow = {
  id: number
  bibleTitle: string | null
  book: string | null
  firstLine: string | null
  meter: string | null
}

export function PsalmGrid({ psalms }: { psalms: PsalmRow[] }) {
  const [selectedBook, setSelectedBook] = useState<string>("all")

  const books = useMemo(() => {
    const unique = [...new Set(psalms.map((p) => p.book).filter(Boolean))]
    return unique as string[]
  }, [psalms])

  const filtered = useMemo(
    () => selectedBook === "all" ? psalms : psalms.filter((p) => p.book === selectedBook),
    [psalms, selectedBook]
  )

  return (
    <div>
      {/* Book filter using shadcn Select component */}
      <div className="mb-6">
        {/* <Select> from shadcn */}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((psalm) => (
          <PsalmCard key={psalm.id} {...psalm} />
        ))}
      </div>
    </div>
  )
}
```

---

### `src/components/PsalmTabs.tsx` (client component, useSearchParams)

**Analog:** None in this codebase. Closest external reference: RESEARCH.md Pattern 2 (verified against Next.js docs).

**Pattern** (from RESEARCH.md Pattern 2 — no codebase analog):
```tsx
'use client'
import { useSearchParams, useRouter, usePathname } from "next/navigation"
// Import shadcn Tabs (after `npx shadcn@latest add tabs`)
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function PsalmTabs({ psalm }: { psalm: PsalmDetail }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get("tab") ?? "overview"

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(pathname + "?" + params.toString())
  }

  return (
    <Tabs value={activeTab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
        <TabsTrigger value="study">Study</TabsTrigger>
        <TabsTrigger value="messianic">Messianic</TabsTrigger>
      </TabsList>
      {/* TabsContent blocks */}
    </Tabs>
  )
}
```

**Critical:** This component must be wrapped in `<Suspense>` in the RSC parent or the static render is lost.

---

### `src/components/TodayCard.tsx` (RSC)

**Analog:** Card structure from prc `resources/page.tsx` inline cards (lines 225-255)

**Pattern** (RSC component, receives full readings list, picks today on server via static day):
```tsx
// TodayCard receives all readings from RSC parent
// Since this is statically rendered, we compute an approximate day server-side
// The DailyPlanClient handles scroll; TodayCard just renders the card shell
import Link from "next/link"

export function TodayCard({ readings }: { readings: DailyReadingWithPsalm[] }) {
  // Approximate server-side day (will be corrected client-side by DailyPlanClient)
  // For static rendering, we can show day 1 as fallback or omit until client hydrates
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Today&apos;s Reading
      </p>
      {/* Client component handles today detection + display */}
      <TodayCardClient readings={readings} />
    </div>
  )
}
```

---

### `src/components/DailyPlanClient.tsx` (client, useEffect scroll)

**Analog:** None in codebase. Pattern from RESEARCH.md Pattern 4.

**Pattern:**
```tsx
'use client'
import { useEffect } from "react"

export function DailyPlanClient() {
  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 0)
    const diff = Date.now() - start.getTime()
    const today = ((Math.floor(diff / 86400000) - 1) % 365) + 1
    const el = document.querySelector(`[data-day="${today}"]`)
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])
  return null  // pure side-effect, renders nothing
}
```

---

### `src/components/YouTubeEmbed.tsx` (client component)

**Analog:** Inline iframe in prc `resource/[id]/page.tsx` lines 488-495.

**Existing prc iframe pattern** (`src/app/resource/[id]/page.tsx` lines 488-495):
```tsx
<iframe
  src={`https://embed.sermonaudio.com/player/a/${sermonAudioId}/`}
  style={{ width: "100%", height: "150px", border: "none" }}
  allow="autoplay"
  title={`Listen: ${resource.title}`}
/>
```

**Psalter adaptation:**
```tsx
import { toEmbedUrl } from "@/lib/youtube"

export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const embedUrl = toEmbedUrl(url)
  if (!embedUrl) return null
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden border border-border">
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
```

---

### `src/db/schema.ts` (modify — add junction relations)

**Analog:** Existing `src/db/schema.ts` (psalter, lines 230-281) — same `relations()` pattern, extend it

**Existing pattern to copy** (`src/db/schema.ts` lines 261-265):
```typescript
export const serviceItemsRelations = relations(serviceItems, ({ one }) => ({
  event: one(events, { fields: [serviceItems.eventId], references: [events.id] }),
  psalm: one(psalms, { fields: [serviceItems.psalmId], references: [psalms.id] }),
  tune: one(tunes, { fields: [serviceItems.tuneId], references: [tunes.id] }),
}))
```

**Five missing junction relations to append** (from RESEARCH.md Code Examples, lines 476-499):
```typescript
export const psalmTopicsRelations = relations(psalmTopics, ({ one }) => ({
  psalm: one(psalms, { fields: [psalmTopics.psalmId], references: [psalms.id] }),
  topic: one(topics, { fields: [psalmTopics.topicId], references: [topics.id] }),
}))

export const psalmVersionTunesRelations = relations(psalmVersionTunes, ({ one }) => ({
  psalmVersion: one(psalmVersions, { fields: [psalmVersionTunes.psalmVersionId], references: [psalmVersions.id] }),
  tune: one(tunes, { fields: [psalmVersionTunes.tuneId], references: [tunes.id] }),
}))

export const tuneMoodsRelations = relations(tuneMoods, ({ one }) => ({
  tune: one(tunes, { fields: [tuneMoods.tuneId], references: [tunes.id] }),
  mood: one(moods, { fields: [tuneMoods.moodId], references: [moods.id] }),
}))

export const verseNavesTopicsRelations = relations(verseNavesTopics, ({ one }) => ({
  verse: one(verses, { fields: [verseNavesTopics.verseId], references: [verses.id] }),
  navesTopic: one(navesTopics, { fields: [verseNavesTopics.navesTopicId], references: [navesTopics.id] }),
}))

export const verseDoctrinesRelations = relations(verseDoctrines, ({ one }) => ({
  verse: one(verses, { fields: [verseDoctrines.verseId], references: [verses.id] }),
  doctrine: one(doctrines, { fields: [verseDoctrines.doctrineId], references: [doctrines.id] }),
}))
```

---

### `src/db/queries/psalms.ts` (utility — query functions)

**Analog:** `src/db/index.ts` (psalter, lines 1-19) for `db` import; `scripts/migrate-airtable.ts` (psalter, lines 17-29) for drizzle usage pattern.

**DB import pattern** (`src/db/index.ts` lines 1-4 + 19):
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
// ...
export const db = drizzle({ client: sql, schema })
```

**Query file pattern** (derive from index.ts conventions):
```typescript
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { psalms } from "@/db/schema"

export async function fetchPsalmIds(): Promise<number[]> {
  const rows = await db.select({ id: psalms.id }).from(psalms)
  return rows.map((r) => r.id)
}

export async function fetchPsalmDetail(id: number) {
  return db.query.psalms.findFirst({
    where: eq(psalms.id, id),
    with: {
      psalmVersions: {
        with: {
          psalmVersionTunes: {
            with: { tune: true },
          },
        },
      },
      verses: {
        with: {
          verseNavesTopics: { with: { navesTopic: true } },
          verseDoctrines: { with: { doctrine: true } },
        },
        orderBy: (v, { asc }) => [asc(v.verseNumber)],
      },
      sectionHeadings: { orderBy: (s, { asc }) => [asc(s.verseStart)] },
      messianicPsalms: true,
    },
  })
}
```

---

### `src/db/queries/tunes.ts` and `src/db/queries/daily.ts`

**Analog:** Same `db` import + drizzle query pattern as `queries/psalms.ts` above.

**Tunes query pattern:**
```typescript
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { tunes } from "@/db/schema"

export async function fetchTuneIds(): Promise<number[]> {
  const rows = await db.select({ id: tunes.id }).from(tunes)
  return rows.map((r) => r.id)
}

export async function fetchTuneDetail(id: number) {
  return db.query.tunes.findFirst({
    where: eq(tunes.id, id),
    with: {
      psalmVersionTunes: {
        with: { psalmVersion: { with: { psalm: true } } },
      },
      tuneMoods: { with: { mood: true } },
    },
  })
}
```

**Daily query pattern:**
```typescript
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { dailyReadings } from "@/db/schema"

export async function fetchAllDailyReadings() {
  return db.query.dailyReadings.findMany({
    with: { psalm: true },
    orderBy: (r, { asc }) => [asc(r.dayNumber)],
  })
}

export async function fetchDailyReading(dayNumber: number) {
  return db.query.dailyReadings.findFirst({
    where: eq(dailyReadings.dayNumber, dayNumber),
    with: { psalm: true },
  })
}
```

---

## Shared Patterns

### shadcn/ui Component Imports
**Source:** `src/components/ui/button.tsx` (psalter, lines 1-4)
**Apply to:** All component files using shadcn components

```typescript
import { Button } from "@/components/ui/button"
// After `npx shadcn@latest add tabs badge select separator`:
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
```

### cn() Utility
**Source:** `src/lib/utils.ts` (psalter, lines 1-6)
**Apply to:** All components that conditionally combine class names

```typescript
import { cn } from "@/lib/utils"
// Usage: className={cn("base-classes", condition && "conditional-class")}
```

### Base-UI React Primitives
**Source:** `src/components/ui/button.tsx` (psalter, lines 1 and 43-56)
**Apply to:** Any new shadcn components added via CLI

```typescript
import { Button as ButtonPrimitive } from "@base-ui/react/button"
// shadcn CLI auto-generates this pattern; do NOT use @radix-ui imports
```

### Drizzle DB Import
**Source:** `src/db/index.ts` (psalter, line 19)
**Apply to:** All query files and RSC pages

```typescript
import { db } from "@/db"
// NEVER import db in 'use client' files
```

### Next.js 15+ params as Promise
**Source:** `src/app/resource/[id]/page.tsx` (prc, lines 28-36) + RESEARCH.md Pattern 1
**Apply to:** All `[id]/page.tsx` and `[day]/page.tsx` files

```typescript
interface PageProps {
  params: Promise<{ id: string }>  // Always Promise<> in Next.js 15+
}
export default async function Page({ params }: PageProps) {
  const { id } = await params     // Always await before destructuring
}
```

### Metadata Pattern
**Source:** `src/app/confessions/[confession]/page.tsx` (prc, lines 100-112)
**Apply to:** All page files

```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Psalm ${id} | CPRC Psalter`,
    description: "...",
  }
}
```

### Tailwind CSS 4 Animations
**Source:** `src/app/globals.css` (psalter, line 2)
**Apply to:** All components needing animation

```css
/* Already imported in globals.css: */
@import "tw-animate-css";
/* Use tw-animate-css class names, NOT tailwindcss-animate */
/* e.g. animate-fade-in, animate-slide-in-from-top */
```

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/components/PsalmTabs.tsx` | component | request-response | No existing `useSearchParams` tab component in psalter or prc; use RESEARCH.md Pattern 2 |
| `src/components/DailyPlanClient.tsx` | component | event-driven | No existing scroll-to-element side-effect component; use RESEARCH.md Pattern 4 |
| `src/lib/daily.ts` | utility | transform | No date utility exists; 5-line pure function — see RESEARCH.md Pattern 4 |
| `src/lib/youtube.ts` | utility | transform | No URL transform utility exists; 5-line regex — see RESEARCH.md Pattern 5 |

---

## Metadata

**Analog search scope:** `/data/home/psalter/src/`, `/data/home/prc/src/`
**Files scanned:** 11 source files read directly
**Pattern extraction date:** 2026-05-07

**Key constraint reminders:**
- `tw-animate-css` not `tailwindcss-animate` (Tailwind CSS 4 — verified in `globals.css`)
- `@base-ui/react/*` not `@radix-ui/react-*` (Nova preset — verified in `button.tsx`)
- `params` is `Promise<{...}>` — always `await params` (Next.js 15+ — verified in prc `resource/[id]/page.tsx` line 29)
- `useSearchParams` must be wrapped in `<Suspense>` or static rendering is lost
- Never import `db` in `'use client'` files
- Tune score JPGs are in `public/tunes/` — use `<img src={tune.scoreJpgUrl}>` directly, no route handler
