# Phase 2: Public Browse - Research

**Researched:** 2026-05-07
**Domain:** Next.js 16 App Router static generation, Drizzle ORM relational queries, shadcn Nova / base-ui components
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Homepage (`/`) shows a devotional dashboard: today's daily reading card + psalm number/keyword quick-search widget
- Header nav: sticky top bar, site name left, three links right — Psalms · Tunes · Daily Plan
- Neutral stone/slate color palette — calm, devotional tone
- `/psalms` renders a card grid with psalm number, first line, and meter per card; default sort 1–150; book filter dropdown
- 4 tabs on psalm detail: Overview · Lyrics · Study · Messianic
- Overview tab: Bible title, book, Haddington introduction, KJV text as numbered verses
- Lyrics tab: primary metrical version, additional versions collapsed below, associated tune(s) with links to `/tunes/[id]`
- Study tab: section headings, Nave's topics, doctrinal cross-references
- Messianic tab: messianic classification, NT verification, messianic verses
- Tune detail pages at `/tunes/[id]` — name, meter, score JPG (abcjs deferred to Phase 4), YouTube/audio links
- `/daily` — full 365-entry list, today's entry prominently highlighted with auto-scroll
- `/daily/[day]` for individual day pages
- All public pages statically pre-rendered at build time; no runtime DB queries on the read path
- abcjs live notation deferred to Phase 4; Phase 2 uses JPG fallback only
- PERF-01/PERF-02 (skeletons, click feedback polish) deferred to Phase 6

### Claude's Discretion
- Exact card dimensions and grid breakpoints
- Skeleton placeholder shape/count for loading states
- Tab URL param strategy (`?tab=lyrics` vs hash routing)
- How to handle psalms with no messianic data (hide tab vs show empty state)
- Tune page layout details (score image aspect ratio, audio embed style)

### Deferred Ideas (OUT OF SCOPE)
- Search (full-text keyword, topic browse, meter filter) — Phase 3
- abcjs live notation rendering — Phase 4
- Audio playback on tune pages — Phase 5 (precentor portal)
- Loading skeletons and click feedback polish — Phase 6
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PSALM-01 | User can browse all 150 psalms (list view, filterable by book and meter) | `/psalms` static page; all 150 psalm records with `first_line`, `meter`, `book` fetched at build time; client-side filter by book (5 distinct values); meter filter deferred to Phase 3 (SRCH-04) |
| PSALM-02 | User can view psalm detail — Overview tab (title, book, Haddington introduction, KJV text) | `/psalms/[id]` static page using `generateStaticParams` over IDs 1–150; data from `psalms` table (`bible_title`, `book`, `haddington_intro`, `kjv_text`) |
| PSALM-03 | User can view psalm detail — Study tab (section headings, Nave's topics, doctrinal cross-references) | Study tab data from `section_headings`, `verse_naves_topics → naves_topics`, `verse_doctrines → doctrines`; requires junction relation additions to schema |
| PSALM-04 | User can view psalm detail — Messianic tab (messianic classification, NT verification, messianic verses) | 18 records in `messianic_psalms`; empty state shown for psalms with no record |
| PSALM-05 | User can read metrical lyrics (Scottish Psalter versification) for each psalm | 184 `psalm_versions` records; primary version shown inline, additional versions in `<details>`; tune chips from `psalm_version_tunes → tunes` |
| PSALM-06 | Psalm pages are statically pre-rendered at build time (no runtime DB queries) | `generateStaticParams` + DB queries in `generateStaticParams` and page Server Component body; tab state managed client-side via `useSearchParams` wrapped in Suspense |
| TUNE-01 | User can view tune detail (name, meter, score display, YouTube and audio links) | `/tunes/[id]` static page; 172 tunes; 137 with `score_jpg_url` (public/tunes/ path); 95 with embeddable YouTube; 13 with other media links |
| PLAN-01 | User can view the 365-day reading plan; today's entry is prominently highlighted | `/daily` static page with 365 rows embedded; today detection via `new Date()` in client component; `data-today` attribute + `scrollIntoView` on mount |
</phase_requirements>

---

## Summary

Phase 2 builds the entire public-facing browse surface of the CPRC Psalter: a devotional homepage, a psalm card grid with book filter, individual psalm detail pages with 4 tabs, tune detail pages, and a daily reading plan. All pages must be statically pre-rendered at build time with zero runtime DB queries on the read path — a firm requirement from PSALM-06.

The database is fully populated from Phase 1: 150 psalms, 184 psalm versions, 172 tunes (137 with JPG scores in `public/tunes/`), 365 daily reading entries, 402 section headings, 18 messianic records, 6005 verse-Nave's topic links, and 882 psalm-topic associations. All data is ready to query.

One schema gap requires a Wave 0 fix before any relational queries will work: the junction tables (`psalm_topics`, `psalm_version_tunes`, `tune_moods`, `verse_naves_topics`, `verse_doctrines`) have no Drizzle relations declared on themselves, which means `db.query.X.findMany({ with: { junction: { with: { target: true }}}})` traversal chains cannot resolve. Relations for all five junction tables must be added to `schema.ts` as the first task of Phase 2.

The shadcn Nova preset uses `@base-ui/react` primitives (not Radix UI). The existing `button.tsx` demonstrates the pattern. Required new components — `tabs`, `badge`, `select`, `separator` — must be added via `npx shadcn@latest add` and will auto-use `@base-ui/react@1.4.1` (already installed). Tune score JPGs are already in `public/tunes/` and are served as static Next.js public assets via their `score_jpg_url` path (e.g. `/tunes/moravia-staff-0.jpg`).

**Primary recommendation:** Add missing schema junction relations first, install shadcn components, then build routes in dependency order: layout/nav → homepage → `/psalms` → `/psalms/[id]` → `/tunes` listing → `/tunes/[id]` → `/daily`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DB queries (psalm/tune/plan data) | Next.js Server Component (build-time) | — | `generateStaticParams` + RSC body; no runtime DB access on public read path |
| Static page rendering (150 psalms, 172 tunes, 365 days) | Next.js build (SSG) | — | `generateStaticParams` pre-renders all param combinations |
| Tab active state / URL param (`?tab=`) | Browser / Client Component | Next.js Server (initial render) | URL param read from `useSearchParams`; wrapped in Suspense so static shell renders |
| Book filter on psalm list | Browser / Client Component | — | Client-side filter over statically embedded data; no server round-trip |
| Today's day detection for `/daily` | Browser / Client Component | — | `new Date()` must run in browser; server doesn't know "today" at build time |
| Auto-scroll to today's row | Browser / Client Component | — | `scrollIntoView` requires DOM; client-only `useEffect` |
| Tune score JPG serving | CDN / Static (Next.js `public/`) | — | Files live in `public/tunes/`; served as static assets; no route handler needed |
| YouTube embed | Browser | — | `<iframe>` with converted embed URL; no server logic needed |
| Psalm quick-search (homepage widget) | Browser / Client Component | — | Input + router.push to `/psalms/[number]`; no API needed |
| Navigation header | Next.js Server Component | — | Static markup; active-link detection is client-side |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.5 | App Router, SSG, server components | [VERIFIED: package.json] Already installed |
| drizzle-orm | 0.45.2 | Type-safe DB queries | [VERIFIED: package.json] Already installed; schema and `db` export ready |
| postgres | 3.4.9 | PostgreSQL driver for drizzle | [VERIFIED: package.json] Singleton pool in `src/db/index.ts` |
| @base-ui/react | 1.4.1 | Headless UI primitives (shadcn Nova) | [VERIFIED: node_modules] Tabs, Select, Separator all present |
| lucide-react | ^1.14.0 | Icons (Search icon for homepage widget) | [VERIFIED: package.json] Already installed |
| tw-animate-css | 1.4.0 | Animations (Tailwind CSS 4 compatible) | [VERIFIED: package.json] NOT tailwindcss-animate |
| tailwindcss | ^4 | Styling | [VERIFIED: package.json] Already installed |

### Supporting (to add via shadcn CLI)
| Component | Install Command | Purpose | When to Use |
|-----------|----------------|---------|-------------|
| tabs | `npx shadcn@latest add tabs` | Psalm detail 4-tab navigation | Psalm detail page |
| badge | `npx shadcn@latest add badge` | Meter display, book labels | Psalm cards, tune detail |
| select | `npx shadcn@latest add select` | Book filter dropdown on `/psalms` | Psalm list page |
| separator | `npx shadcn@latest add separator` | Section dividers in tabs | Psalm detail tab content |

**Note:** These `npx shadcn@latest add` commands generate components using `@base-ui/react` primitives (not Radix UI) because `components.json` specifies `"style": "base-nova"`. [VERIFIED: button.tsx uses `@base-ui/react/button`; base-ui has tabs, select, separator modules]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `db.query.X.findMany({ with: {...} })` | Raw SQL joins | Relational API is cleaner but requires junction relations; raw joins always work |
| Client-side book filter | Separate static routes per book | Static routes would require 5x pages; client-side is simpler at 150 items |
| YouTube `<iframe>` embed | `react-youtube` npm package | Native iframe is sufficient; no extra dependency needed |

**Installation (new shadcn components):**
```bash
cd /data/home/psalter
npx shadcn@latest add tabs badge select separator
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  │
  ├─ / (homepage)
  │    ├─ [RSC] TodayCard — reads day = dayOfYear % 365, looks up daily_readings[day]
  │    └─ [Client] PsalmSearchWidget — <input> + router.push("/psalms/"+num)
  │
  ├─ /psalms [RSC static]
  │    ├─ build: fetchAllPsalms() → 150 records
  │    └─ [Client] PsalmGrid — receives all data, filters by selectedBook
  │
  ├─ /psalms/[id] [RSC static, generateStaticParams]
  │    ├─ build: fetchPsalmDetail(id) → psalm + versions + verses + topics + messianic
  │    └─ [Client] PsalmTabs — reads ?tab= via useSearchParams, wrapped in Suspense
  │
  ├─ /tunes [RSC static]
  │    └─ build: fetchAllTunes() → 172 records
  │
  ├─ /tunes/[id] [RSC static, generateStaticParams]
  │    └─ build: fetchTuneDetail(id) → tune + psalm_version links
  │
  ├─ /daily [RSC static]
  │    ├─ build: fetchAllDailyReadings() → 365 records
  │    └─ [Client] DailyPlanClient — today = dayOfYear % 365, scrollIntoView(data-today)
  │
  └─ /daily/[day] [RSC static, generateStaticParams: 1-365]
       └─ build: fetchDailyReading(day) → single entry + psalm

Database (psalter-db:5435) ← accessed ONLY at build time
  └─ All DB queries run in generateStaticParams or RSC body during `next build`
```

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx           # Add SiteHeader, update font/body classes
│   ├── page.tsx             # Homepage — TodayCard + PsalmSearchWidget
│   ├── psalms/
│   │   ├── page.tsx         # Psalm list — static, all 150
│   │   └── [id]/
│   │       └── page.tsx     # Psalm detail — generateStaticParams 1-150
│   ├── tunes/
│   │   ├── page.tsx         # Tune list — static, all 172
│   │   └── [id]/
│   │       └── page.tsx     # Tune detail — generateStaticParams
│   └── daily/
│       ├── page.tsx         # Full 365-day plan — static
│       └── [day]/
│           └── page.tsx     # Single day — generateStaticParams 1-365
├── components/
│   ├── ui/                  # shadcn components (button + new: tabs, badge, select, separator)
│   ├── SiteHeader.tsx       # Sticky nav (RSC)
│   ├── PsalmCard.tsx        # Card for /psalms grid (RSC)
│   ├── PsalmGrid.tsx        # 'use client' — receives psalm list, handles book filter
│   ├── PsalmTabs.tsx        # 'use client' — 4-tab controller, reads ?tab= param
│   ├── TodayCard.tsx        # RSC — renders homepage daily reading
│   ├── DailyPlanClient.tsx  # 'use client' — scrollIntoView on mount
│   └── YouTubeEmbed.tsx     # Converts youtu.be URL → embed URL, renders iframe
├── db/
│   ├── index.ts             # Existing — unchanged
│   ├── schema.ts            # NEEDS junction relations added (Wave 0 task)
│   └── queries/
│       ├── psalms.ts        # fetchAllPsalms, fetchPsalmDetail, fetchPsalmIds
│       ├── tunes.ts         # fetchAllTunes, fetchTuneDetail, fetchTuneIds
│       └── daily.ts         # fetchAllDailyReadings, fetchDailyReading
└── lib/
    ├── utils.ts             # Existing — cn()
    └── daily.ts             # dayOfYear() helper (shared browser+server)
```

### Pattern 1: Static Page with generateStaticParams
**What:** Page pre-renders all param variants at build time; DB is called only during build.
**When to use:** All public psalm, tune, and daily pages.

```typescript
// Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/generate-static-params.mdx
// app/psalms/[id]/page.tsx

import { db } from '@/db'
import { psalms } from '@/db/schema'

export async function generateStaticParams() {
  const rows = await db.select({ id: psalms.id }).from(psalms)
  return rows.map((r) => ({ id: String(r.id) }))
}

export default async function PsalmPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params  // params is a Promise in Next.js 15+/16
  const psalm = await fetchPsalmDetail(Number(id))
  return <PsalmDetailView psalm={psalm} />
}
```

**Key:** `params` is `Promise<{...}>` in Next.js 15+/16. Always `await params`. [VERIFIED: Context7 Next.js docs]

### Pattern 2: Client-Side Tab State with useSearchParams
**What:** Tab active state driven by `?tab=` URL param; page itself is static.
**When to use:** Psalm detail tabs — allows deep-linking without making the page dynamic.

```typescript
// Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/use-search-params.mdx
// components/PsalmTabs.tsx
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function PsalmTabs({ psalm }: { psalm: PsalmDetail }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = searchParams.get('tab') ?? 'overview'

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(pathname + '?' + params.toString())
  }

  return (
    <Tabs value={activeTab} onValueChange={setTab}>
      {/* ... */}
    </Tabs>
  )
}

// In the page.tsx (RSC), wrap with Suspense to preserve static rendering:
// <Suspense fallback={<TabsFallback />}>
//   <PsalmTabs psalm={psalm} />
// </Suspense>
```

**Critical:** `useSearchParams` in a client component causes that subtree to be dynamically rendered client-side. Wrapping it in `<Suspense>` preserves the static pre-rendering of the RSC parent. [VERIFIED: Context7 Next.js docs]

### Pattern 3: Drizzle Relational Query with Junction Tables
**What:** Fetch a psalm with its topics via the junction table using `db.query`.
**When to use:** Study tab (topics, doctrines), Lyrics tab (tunes), after junction relations are added to schema.

```typescript
// Source: https://context7.com/drizzle-team/drizzle-orm-docs/llms.txt
// db/queries/psalms.ts

import { db } from '@/db'
import { eq } from 'drizzle-orm'

export async function fetchPsalmDetail(id: number) {
  return db.query.psalms.findFirst({
    where: eq(schema.psalms.id, id),
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
          verseNavesTopics: {
            with: { navesTopic: true },
          },
          verseDoctrines: {
            with: { doctrine: true },
          },
        },
      },
      sectionHeadings: true,
      messianicPsalms: true,
    },
  })
}
```

**Prerequisite:** Junction relations must exist on `psalmTopics`, `psalmVersionTunes`, `tuneMoods`, `verseNavesTopics`, `verseDoctrines` tables in `schema.ts`. This is the Wave 0 task.

### Pattern 4: Client-Side Today Detection
**What:** Static page; client component computes today's day number on mount.
**When to use:** Homepage TodayCard, `/daily` scroll-to-today.

```typescript
// lib/daily.ts (shared utility, works in browser and server)
export function getDayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  return ((dayOfYear - 1) % 365) + 1  // 1-based, wraps at 365
}

// components/DailyPlanClient.tsx
'use client'
import { useEffect } from 'react'
import { getDayOfYear } from '@/lib/daily'

export function DailyPlanClient() {
  useEffect(() => {
    const today = getDayOfYear()
    const el = document.querySelector(`[data-day="${today}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])
  return null  // renders nothing — side effect only
}
```

### Pattern 5: YouTube URL to Embed URL Conversion
**What:** Convert `https://youtu.be/ID?si=...` or `https://www.youtube.com/watch?v=ID` to embed URL.
**When to use:** Tune detail page YouTube section.

```typescript
// lib/youtube.ts
export function toEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const shortMatch = url.match(/youtu\.be\/([\w-]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  const longMatch = url.match(/[?&]v=([\w-]+)/)
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}`
  return null  // non-YouTube URL — render as plain link instead
}
```

**Data note:** 95 tunes have YouTube URLs; 13 have other media links (hymnary.org, hymnal.net, soundcloud.com). Render non-YouTube media links as `<a href>` rather than embeds. [VERIFIED: DB query]

### Anti-Patterns to Avoid

- **Using `await params` without a Promise type annotation:** In Next.js 15+/16, `params` and `searchParams` are Promises. Destructuring directly without await causes TypeScript errors and runtime issues. [VERIFIED: Context7]
- **Putting `useSearchParams` without a Suspense boundary:** Without Suspense wrapping, the client component that calls `useSearchParams` will opt the entire page into dynamic rendering, defeating PSALM-06. [VERIFIED: Context7]
- **Using `images.domains` in next.config.ts:** Deprecated in Next.js 16; use `remotePatterns`. However tune JPGs are local `public/` files — no image config needed for them. [VERIFIED: Context7]
- **Calling `db.query` without junction relations in schema:** The relational query builder cannot traverse `psalmVersionTunes → tunes` unless `psalmVersionTunesRelations` is declared. Symptom: TypeScript error "no such relation". [VERIFIED: schema.ts inspection + Drizzle docs]
- **Running DB queries in Client Components:** All DB access must be in RSC or `generateStaticParams`. Never import `db` in a `'use client'` file.
- **Using `tailwindcss-animate` instead of `tw-animate-css`:** The project uses `tw-animate-css@1.4.0` for Tailwind CSS 4 compatibility. [VERIFIED: package.json, globals.css]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab UI | Custom tab divs/buttons | `npx shadcn@latest add tabs` | Accessibility (ARIA), keyboard navigation, base-ui semantics already integrated |
| Dropdown select | `<select>` HTML element | `npx shadcn@latest add select` | Consistent Nova styling; base-ui Select handles focus, keyboard, ARIA |
| Meter/book badge | Inline `<span>` with manual classes | `npx shadcn@latest add badge` | Design-token-aligned variants from Nova preset |
| YouTube ID extraction | Manual string split | `lib/youtube.ts` utility (hand-rolled is fine here, it's simple) | Both `youtu.be/ID` and `?v=ID` formats present in DB; 5-line regex covers all cases |
| Day-of-year calc | Date library | `lib/daily.ts` pure function | 5-line calculation; no date library needed for this use case |
| Static params list for psalms | Hard-coded array | `db.select({ id: psalms.id }).from(psalms)` in `generateStaticParams` | DB is source of truth; avoids drift if data changes |

---

## Common Pitfalls

### Pitfall 1: Missing Junction Table Relations Break db.query
**What goes wrong:** `db.query.psalms.findFirst({ with: { psalmVersions: { with: { psalmVersionTunes: { with: { tune: true }}}}}})` throws TypeScript error or returns no join data.
**Why it happens:** The schema has `psalmVersionsRelations` pointing to `many(psalmVersionTunes)`, but `psalmVersionTunes` itself has no `relations()` declaration, so Drizzle's relational API cannot continue traversal to `tunes`.
**How to avoid:** Add relations for all five junction tables at the start of Phase 2 (Wave 0). The required additions are: `psalmTopicsRelations`, `psalmVersionTunesRelations`, `tuneMoodsRelations`, `verseNavesTopicsRelations`, `verseDoctrinesRelations`.
**Warning signs:** TypeScript errors on `with: { tune: true }` deep in a query chain.

### Pitfall 2: useSearchParams Without Suspense Forces Dynamic Rendering
**What goes wrong:** The psalm detail page loses its static pre-render and becomes fully dynamic, adding DB query latency on every page view.
**Why it happens:** `useSearchParams` in a client component opts the entire route into dynamic rendering unless the client component is wrapped in `<Suspense>`.
**How to avoid:** Isolate `useSearchParams` in a `PsalmTabs` client component, then wrap that component in `<Suspense fallback={<TabsFallback />}>` in the RSC page.
**Warning signs:** Build output shows `ƒ /psalms/[id]` (lambda = dynamic) instead of `○ /psalms/[id]` (static).

### Pitfall 3: params Is a Promise in Next.js 15+/16
**What goes wrong:** `const { id } = params` in a page component gives TypeScript error; runtime may fail.
**Why it happens:** Next.js 15 made `params` and `searchParams` async (Promise-wrapped) to enable async request handling.
**How to avoid:** Always type as `Promise<{...}>` and `await params` before destructuring. [VERIFIED: Context7]
**Warning signs:** TypeScript: "Property 'id' does not exist on type 'Promise<...>'".

### Pitfall 4: Book Filter Forces Client Re-render of All 150 Cards
**What goes wrong:** Filtering psalms by book causes a slow re-render if each card is a heavy component.
**Why it happens:** 150 cards with filtering computed on every keystroke/selection.
**How to avoid:** The `PsalmGrid` client component should receive all psalm data as a prop (from RSC), derive `filteredPsalms` via `useMemo`, and keep each `PsalmCard` lightweight (no DB calls, pure display). [ASSUMED]
**Warning signs:** Filter dropdown feels sluggish.

### Pitfall 5: Tune Score JPG Path Already Correct — No Route Handler Needed
**What goes wrong:** Developer builds an API route to serve tune images from a Docker volume.
**Why it happens:** The `score_jpg_url` format `/tunes/moravia-staff-0.jpg` looks like a path that needs special serving.
**How to avoid:** Files are already in `public/tunes/` (326 files confirmed). Next.js serves `public/` as static assets automatically. Use `score_jpg_url` directly as `<img src>`. [VERIFIED: filesystem + DB query]
**Warning signs:** Building a `/api/tune-image/[filename]` route handler.

### Pitfall 6: /tunes Nav Link Has No Listing Page in Spec
**What goes wrong:** Nav renders "Tunes" link to `/tunes` but no listing page is built, giving a 404.
**Why it happens:** CONTEXT only specifies `/tunes/[id]` detail pages; the listing is implied by the nav.
**How to avoid:** Build a `/tunes` static listing page as part of TUNE-01 scope. A simple grid of tune name + meter cards, sorted alphabetically. 172 records at build time.

---

## Code Examples

### Psalm List Page (RSC + Client Filter)
```typescript
// Source: derived from Context7 Next.js RSC + Drizzle patterns
// app/psalms/page.tsx
import { db } from '@/db'
import { psalms, psalmVersions } from '@/db/schema'
import { PsalmGrid } from '@/components/PsalmGrid'

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
    // Only take first/primary version for card display
    .orderBy(psalms.id)

  return <PsalmGrid psalms={rows} />
}
```

### Daily Plan Today Detection (Client Component)
```typescript
// Source: derived from Context7 + UI-SPEC
// components/DailyPlanClient.tsx
'use client'
import { useEffect } from 'react'

export function DailyPlanClient({ todayDay }: { todayDay?: number }) {
  useEffect(() => {
    const start = new Date(new Date().getFullYear(), 0, 0)
    const diff = Date.now() - start.getTime()
    const today = ((Math.floor(diff / 86400000) - 1) % 365) + 1
    const el = document.querySelector(`[data-day="${today}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])
  return null
}
```

### Schema Junction Relations (Wave 0 Fix)
```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/relations.mdx
// Add to src/db/schema.ts:

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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.id` direct access | `const { id } = await params` | Next.js 15 | Must await params; TypeScript enforces Promise type |
| Radix UI primitives in shadcn | `@base-ui/react` primitives (Nova preset) | shadcn v4 / Nova | Import paths differ: `@base-ui/react/tabs` not `@radix-ui/react-tabs` |
| `tailwindcss-animate` | `tw-animate-css` | Tailwind CSS 4 | Different import; already in `globals.css` |
| `images.domains` | `images.remotePatterns` | Next.js 15+ | `domains` deprecated; irrelevant here since tune JPGs are local `public/` |
| Cloudflare R2 for tune JPGs | `public/tunes/` directory | Phase 1 (Plan 01-01) | All 326 tune JPG files confirmed in `public/tunes/`; served as static assets |

**Deprecated/outdated:**
- `useRouter().push()` for shallow URL updates: use `router.replace()` for tab switching to avoid polluting browser history
- `tailwindcss-animate`: not compatible with Tailwind CSS 4; `tw-animate-css@1.4.0` is already installed and imported in `globals.css`

---

## Data Completeness Summary

All critical data is present. Key counts verified against live DB: [VERIFIED: docker exec psalter-db]

| Table | Count | Notes for Phase 2 |
|-------|-------|-------------------|
| psalms | 150 | All 150 psalm numbers present |
| psalm_versions | 184 | Some psalms have multiple versions (e.g. Psalm 124 has 2) |
| tunes | 172 | 137 with `score_jpg_url`, 35 without |
| tunes with score JPG | 137 | Files confirmed in `public/tunes/` |
| daily_readings | 365 | All 365 days present; `reading_date` is NULL for all (day-of-year used) |
| messianic_psalms | 18 | Only 18 of 150 psalms have messianic data → empty state needed for 132 |
| section_headings | 402 | Present for Study tab |
| verse_naves_topics | 6005 | Rich topic linkage via Nave's |
| verse_doctrines | 46 | Sparse (only 46 links across 40 doctrines) — Study tab may show "no doctrines" for most psalms |
| topics | 88 | BUT: `topics.name` is empty-string for all 88 records [VERIFIED: DB query] — psalm_topics junction has 882 entries but no visible labels. Study tab should rely on `naves_topics` (which has proper names) rather than `topics`. |
| tunes with YouTube | 95 | Embeddable; other 13 have hymnary.org/hymnal.net/soundcloud.com URLs |
| soundcloud_url (valid) | 0 | All 27 `soundcloud_url` values are placeholder text ("missing", "need to upload") |

**Topics table warning:** The `topics` table has 88 records but all have `name = ''` (empty string). The Study tab should use `naves_topics` (which has proper names like "Access to God", "Faith") rather than `topics`. [VERIFIED: DB query]

---

## Open Questions

1. **Does `/tunes` (listing) need a meter filter at this phase?**
   - What we know: CONTEXT specifies only `/tunes/[id]` detail; nav links to `/tunes`
   - What's unclear: Whether a simple alphabetical grid suffices or filter-by-meter is expected
   - Recommendation: Build alphabetical grid only; meter filter is Phase 3 (SRCH-04)

2. **Multi-version psalms: which psalm_version is "primary" on the card grid?**
   - What we know: 184 versions for 150 psalms; some psalms have 2+ versions; `psalm_version_tunes.is_primary` exists but it's on the tune link, not the version
   - What's unclear: Is there a canonical "first" version to show on the card grid's first-line display?
   - Recommendation: Use `ORDER BY id ASC LIMIT 1` per psalm for the card grid; show all versions on the Lyrics tab

3. **Book filter display labels: show raw book field or map to friendly names?**
   - What we know: 5 distinct values — `"1-41 (Bk 1)"`, `"42-72 (Bk 2)"`, `"73-89 (Bk 3)"`, `"90-106 (Bk 4)"`, `"107-150 (Bk 5)"`
   - What's unclear: Whether to display as-is or map to "Book 1", "Book 2" etc.
   - Recommendation: Display as-is from DB; they're already readable

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build | ✓ | v20.20.2 | — |
| PostgreSQL (psalter-db) | `generateStaticParams` at build time | ✓ | Port 5435 open, healthy | — |
| `public/tunes/` JPGs | Tune score display | ✓ | 326 files confirmed | "No score available" empty state |
| shadcn CLI (for add tabs etc.) | Component generation | ✓ | shadcn@4.7.0 in package.json | — |
| Docker | DB container | ✓ | psalter-db Up 10 hours | — |

**Missing dependencies:** None blocking Phase 2 execution.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — Wave 0 must add |
| Config file | none — Wave 0 adds vitest.config.ts |
| Quick run command | `npm test` (after Wave 0 setup) |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PSALM-01 | `/psalms` renders all 150 psalm cards | smoke | `curl -s http://localhost:3000/psalms \| grep -c "psalm-"` | ❌ Wave 0 |
| PSALM-02 | `/psalms/23` renders Overview tab with bible title | unit | `vitest run tests/psalm-detail.test.ts` | ❌ Wave 0 |
| PSALM-03 | Study tab renders Nave's topics for psalm 23 | unit | `vitest run tests/psalm-detail.test.ts` | ❌ Wave 0 |
| PSALM-04 | Messianic tab shows empty state for non-messianic psalm | unit | `vitest run tests/psalm-detail.test.ts` | ❌ Wave 0 |
| PSALM-05 | Lyrics tab renders stanza text for psalm 23 | unit | `vitest run tests/psalm-detail.test.ts` | ❌ Wave 0 |
| PSALM-06 | Build produces static HTML for /psalms/23 (no lambda) | build check | `next build 2>&1 \| grep "psalms/23"` | ❌ Wave 0 |
| TUNE-01 | `/tunes/10` renders Arnold tune with score image tag | unit | `vitest run tests/tune-detail.test.ts` | ❌ Wave 0 |
| PLAN-01 | `/daily` renders 365 rows | unit | `vitest run tests/daily-plan.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run build 2>&1 | tail -5` (build must succeed)
- **Per wave merge:** `npm run build && npm test -- --run`
- **Phase gate:** Full build green + all tests pass before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest` and `@vitejs/plugin-react` — install and configure
- [ ] `vitest.config.ts` — test framework configuration
- [ ] `tests/psalm-detail.test.ts` — covers PSALM-02 through PSALM-05
- [ ] `tests/tune-detail.test.ts` — covers TUNE-01
- [ ] `tests/daily-plan.test.ts` — covers PLAN-01
- [ ] `tests/db-queries.test.ts` — unit tests for query functions in `db/queries/`

**Note:** These are query function unit tests (call `fetchPsalmDetail`, check shape of result), not E2E browser tests. E2E is deferred to Phase 6. Unit tests verify data layer correctness at build time.

---

## Security Domain

Phase 2 is entirely public, read-only, and statically pre-rendered. No auth, no mutations, no user input to a backend.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 2 |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | All routes public |
| V5 Input Validation | Minimal | Psalm quick-search: router.push only (no API); psalm ID from URL parsed as integer — use `Number(id)` and validate `1 <= id <= 150` to prevent invalid DB lookups |
| V6 Cryptography | No | No secrets handled |

**One input to sanitize:** The `[id]` URL param in `/psalms/[id]` and `/tunes/[id]`. Since `generateStaticParams` pre-generates all valid IDs, Next.js returns a 404 for any ID not in the static params list automatically (the default `dynamicParams` behavior returns 404). No additional validation needed at the page level for statically generated routes. [VERIFIED: Context7 — dynamicParams default behavior]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Client-side book filter (150 items) will feel fast with useMemo | Common Pitfalls #4 | Could be sluggish on low-end mobile; Phase 6 can address |
| A2 | `/tunes` listing page is needed (nav link implies it exists) | Open Questions #1 | If not needed, saves one task |
| A3 | First psalm_version by id order is the right card display choice | Open Questions #2 | Could show wrong version on card; fixable with data clarification |

---

## Sources

### Primary (HIGH confidence)
- `/vercel/next.js` (Context7) — `generateStaticParams`, `params` as Promise, `useSearchParams` + Suspense, static rendering behavior
- `/drizzle-team/drizzle-orm-docs` (Context7) — relational query builder, junction table relations, `db.query.X.findMany`
- `/shadcn-ui/ui` (Context7) — tabs, badge, select, separator install commands
- `/data/home/psalter/src/db/schema.ts` — all table structures, existing relations, missing junction relations [VERIFIED: file read]
- `/data/home/psalter/package.json` — installed versions of all dependencies [VERIFIED: file read]
- `/data/home/psalter/src/components/ui/button.tsx` — confirmed base-ui/react pattern for Nova preset [VERIFIED: file read]

### Secondary (MEDIUM confidence)
- `docker exec psalter-db psql` — all row counts, data quality (empty topics.name), URL formats, daily_reading structure [VERIFIED: live DB]
- `/data/home/psalter/public/tunes/` — 326 JPG files confirmed present [VERIFIED: filesystem]
- `/data/home/psalter/.planning/phases/02-public-browse/02-UI-SPEC.md` — layout contracts, copywriting, interaction patterns [VERIFIED: file read]

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against installed node_modules and package.json
- Architecture: HIGH — verified against schema, DB data, Next.js docs, existing code
- Pitfalls: HIGH — junction relation gap verified by schema inspection; Suspense requirement verified by Context7 docs
- Data completeness: HIGH — all counts from live DB; topics.name empty-string bug verified

**Research date:** 2026-05-07
**Valid until:** 2026-06-07 (stable stack; 30-day window)
