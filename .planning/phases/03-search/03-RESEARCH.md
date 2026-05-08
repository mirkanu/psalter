# Phase 3: Search - Research

**Researched:** 2026-05-08
**Domain:** PostgreSQL full-text search, Next.js 15 App Router dynamic pages, client-side filtering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Search Entry Point & Layout**
- Dedicated `/search` page with URL param `?q=` — shareable and bookmarkable
- Results display as compact list rows: psalm number + first line + matched text snippet (PostgreSQL `ts_headline`)
- Submit-on-enter (not live-as-you-type) — one DB call per search
- PostgreSQL `tsvector` across both metrical lyrics AND KJV text, ranked by `ts_rank`

**Topic & Taxonomy Design**
- Individual psalm detail pages already show Nave's topics and doctrines in the Study tab — no new tab needed
- `/explore` page: browse psalms by all available taxonomies — Topics (Themes), Nave's Topics, Messianic, Authors
- Each taxonomy shown as a browsable list; clicking a taxonomy value shows all matching psalms
- `/explore/topics/[slug]` — psalms tagged to a specific Topic
- `/explore/naves/[slug]` — psalms linked to a specific Nave's topic (via verse links)
- `/explore/messianic` — all psalms with messianic classification
- `/explore/authors/[author]` — all psalms by a given author
- Nave's sub-topic hierarchy not in schema — show flat list; add schema hierarchy as a tracked debt item
- Creeds and Quoted-in-NT not in schema — noted as debt, deferred to future phase

**Tune Meter Filter**
- Add meter filter dropdown to `/tunes` list page (same shadcn Select pattern as PsalmGrid book/meter filters)
- Server-rendered: pass all tunes to client, filter client-side (same pattern as /psalms)
- Existing `/tunes` meter data already available in Drizzle schema

### Claude's Discretion
- Exact URL slug strategy for topic/Nave's names (slugify or use DB id)
- Pagination strategy on explore listing pages (if topic has many psalms)
- Loading skeleton shape for search results and explore pages

### Deferred Ideas (OUT OF SCOPE)
- Nave's sub-topic (parent-child) hierarchy
- Creeds taxonomy
- Quoted-in-NT as structured browse
- Tune moods browse on /explore
- Full-text search on tunes (name, meter)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-01 | User can find a psalm by number (instant lookup) | PsalmSearchWidget already implemented — confirm widget is surfaced in SiteHeader or home page |
| SRCH-02 | User can search psalms by keyword across metrical lyrics and KJV text (PostgreSQL full-text) | PostgreSQL FTS with GIN expression index — see Architecture Patterns |
| SRCH-03 | User can browse psalms by Nave's topic / thematic tag | /explore hub + /explore/naves/[slug] + /explore/topics/[slug] — see Pitfall: Topics Migration Gap |
| SRCH-04 | User can filter tunes by meter (CM, LM, SM, etc.) | TuneGrid client component following PsalmGrid pattern — 8 distinct meter values confirmed in DB |
</phase_requirements>

---

## Summary

Phase 3 delivers four discovery surfaces: psalm number lookup (already implemented as PsalmSearchWidget), keyword full-text search via PostgreSQL, taxonomy browse via an /explore hub, and a meter filter on the tunes list. The technical domain is PostgreSQL full-text search (tsvector/tsquery), Next.js 15 App Router dynamic pages with async searchParams, and client-side filtering using established patterns from Phase 2.

**Critical data quality finding:** The `topics` table in PostgreSQL has 88 rows with airtable IDs but all `name` values are NULL. The migration script calls `r.get('Name')` but the actual Airtable field is named `Topic (Psalm)`. This migration bug must be fixed as Wave 0 work before the /explore/topics pages can function. Plan must include a targeted re-migration of the Topics - Psalms table.

**Full-text search performance:** Without a GIN index, a cross-table FTS join (psalms + psalm_versions) takes ~166ms. With a GIN expression index on `psalms.kjv_text`, the same query drops to ~1ms. For 150 psalms this is acceptable without index for MVP, but the plan should include creating two GIN expression indexes (one per table) for production readiness.

**Slug collision:** One collision exists in naves_topics — "Mercy Seat" and "Mercy-Seat" both slugify to `mercy-seat`. Resolution: use DB id as tiebreaker suffix (`mercy-seat-{id}`), or use DB id exclusively for all naves slugs. The planner should pick one and apply consistently.

**Primary recommendation:** Implement full-text search via `sql` template tag from `drizzle-orm` (not from `@/db` which exports the postgres.js pool under that name). Create GIN expression indexes via a raw SQL migration run at start of wave. Fix the Topics migration bug first.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Psalm number lookup (SRCH-01) | Browser/Client | — | PsalmSearchWidget is already 'use client' with router.push |
| Keyword full-text search (SRCH-02) | API/Backend (RSC) | Browser (form submit) | PostgreSQL FTS query runs server-side; form GET triggers navigation |
| Taxonomy browse hub /explore (SRCH-03) | Frontend Server (RSC) | — | Static pre-render; all taxonomy counts from DB at build time |
| Taxonomy listing /explore/[taxonomy]/[slug] | Frontend Server (RSC) | — | Static via generateStaticParams; psalm list pre-rendered |
| Tune meter filter (SRCH-04) | Browser/Client | Frontend Server | RSC fetches all tunes; TuneGrid client component filters in-memory |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | 0.45.2 [VERIFIED: package.json] | ORM + sql template tag for FTS queries | Already in project; sql`` tag handles parameter sanitization |
| postgres.js | 3.4.9 [VERIFIED: package.json] | DB driver | Already in project |
| Next.js | 16.2.5 [VERIFIED: package.json] | App Router — dynamic page for /search, static for /explore | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Input | latest [VERIFIED: UI-SPEC] | Search text field | Add via `npx shadcn add input` — not yet installed |
| shadcn Skeleton | latest [VERIFIED: UI-SPEC] | Loading state for /search results | Add via `npx shadcn add skeleton` — not yet installed |
| lucide-react | existing [VERIFIED: src/components] | Search icon on button, X icon on Clear | Already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL FTS (tsvector/tsquery) | Elasticsearch, Typesense | Both require external services; 150 psalms is well within PG FTS capability |
| Client-side tune filter | Server-side filter route | Server round-trip for 172 tune rows is unnecessary; PsalmGrid pattern already proven |
| Slugified URL for naves/topics | DB id in URL | DB id URLs are stable but unreadable; slugified URLs are shareable but require collision handling |

**Installation:**
```bash
npx shadcn add input
npx shadcn add skeleton
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser                    Next.js RSC                  PostgreSQL
  │                              │                           │
  │  GET /search?q=shepherd      │                           │
  ├─────────────────────────────►│                           │
  │                              │  SELECT + to_tsvector()   │
  │                              │  + ts_rank() + ts_headline│
  │                              ├──────────────────────────►│
  │                              │◄──────────────────────────│
  │◄─────────────────────────────│  HTML: result list rows   │
  │                              │                           │
  │  GET /explore                │                           │
  ├─────────────────────────────►│  (BUILD TIME only)        │
  │                              │  SELECT COUNT per taxonomy│
  │                              ├──────────────────────────►│
  │                              │◄──────────────────────────│
  │◄─────────────────────────────│  Static HTML              │
  │                              │                           │
  │  click meter Select          │                           │
  ├─► TuneGrid (client)          │                           │
  │   filters in-memory          │                           │
  │   router.replace(?meter=CM)  │                           │
```

### Recommended Project Structure

```
src/
├── app/
│   ├── search/
│   │   ├── page.tsx          # dynamic RSC — awaits searchParams, runs FTS query
│   │   └── loading.tsx       # 5 skeleton rows shown during navigation
│   └── explore/
│       ├── page.tsx          # static RSC — all taxonomy counts
│       ├── loading.tsx       # skeleton for explore hub
│       ├── topics/
│       │   └── [slug]/
│       │       ├── page.tsx  # static via generateStaticParams
│       │       └── loading.tsx
│       ├── naves/
│       │   └── [slug]/
│       │       ├── page.tsx
│       │       └── loading.tsx
│       ├── messianic/
│       │   ├── page.tsx      # static
│       │   └── loading.tsx
│       └── authors/
│           └── [author]/
│               ├── page.tsx  # static via generateStaticParams
│               └── loading.tsx
├── components/
│   └── TuneGrid.tsx          # 'use client' — meter filter, mirrors PsalmGrid.tsx
└── db/
    └── queries/
        ├── search.ts         # fetchSearchResults(q: string)
        └── explore.ts        # fetchTopicCounts(), fetchNavesCounts(), fetchMessianicPsalms(), fetchByTopic(), fetchByNaves(), fetchByAuthor()
```

### Pattern 1: PostgreSQL Full-Text Search via Drizzle sql template

**What:** Use Drizzle's `sql` template tag to issue raw FTS expressions inside a typed select query.
**When to use:** Any search query needing `to_tsvector`, `to_tsquery`, `ts_rank`, or `ts_headline`.

**IMPORTANT:** Import `sql` from `drizzle-orm`, NOT from `@/db`. The `@/db` module exports the postgres.js connection pool under the name `sql` — using it instead would attempt to execute template strings as raw SQL against the pool directly, causing a runtime error.

```typescript
// Source: [CITED: drizzle-team/drizzle-orm-docs guides/postgresql-full-text-search.mdx]
// src/db/queries/search.ts
import { db } from '@/db'
import { sql } from 'drizzle-orm'   // <-- drizzle-orm, NOT @/db
import { psalms, psalmVersions } from '@/db/schema'
import { desc, asc } from 'drizzle-orm'

export interface SearchResult {
  id: number
  firstLine: string | null
  meter: string | null
  rank: number
  snippet: string
}

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

**Why `plainto_tsquery` over `to_tsquery`:** `plainto_tsquery` accepts plain English phrases without requiring the user to know tsquery syntax (no `&`, `|` operators required). It is the correct function for end-user search boxes. [CITED: PostgreSQL docs]

### Pattern 2: GIN Expression Index via Raw SQL Migration

**What:** Create GIN indexes on expression `to_tsvector(...)` without a generated column — avoids schema migration complexity for a cross-table scenario.
**When to use:** Wave 0 setup step before search goes live.

```sql
-- Run once at start of phase (raw SQL via psql or drizzle db.execute)
CREATE INDEX IF NOT EXISTS idx_psalms_kjv_fts
  ON psalms USING gin(to_tsvector('english', COALESCE(kjv_text, '')));

CREATE INDEX IF NOT EXISTS idx_psalm_versions_lyrics_fts
  ON psalm_versions USING gin(to_tsvector('english', COALESCE(lyrics, '')));
```

**Why not a generated column:** The CONTEXT.md decision requires searching BOTH `psalms.kjv_text` AND `psalm_versions.lyrics` in a single query. A generated `tsvector` column can only reference columns in its own row. A cross-table tsvector requires joining first, so the GIN indexes on each table's column are the correct approach — PostgreSQL can use both indexes via bitmap AND/OR plans.

**Performance verified:** [VERIFIED: psql EXPLAIN ANALYZE on live DB]
- Without GIN index: ~166ms for cross-table join FTS
- With GIN index on `psalms.kjv_text` alone: ~1ms

### Pattern 3: Next.js 15 Dynamic Search Page with Async searchParams

**What:** The `/search` page receives `?q=` via `searchParams` prop which is a Promise in Next.js 15+.
**When to use:** Any App Router page that reads URL query parameters.

```typescript
// Source: [CITED: vercel/next.js docs/app/api-reference/file-conventions/page.mdx]
// src/app/search/page.tsx
type SearchParams = Promise<{ q?: string | string[] }>

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams
  const query = Array.isArray(q) ? q[0] : (q ?? '')

  const results = query ? await fetchSearchResults(query) : []

  return (/* JSX */)
}
```

**Why async searchParams:** Next.js 15 made `params` and `searchParams` async (Promise-wrapped). Using the synchronous pattern from Next.js 14 will trigger a deprecation warning and break in future versions. [CITED: vercel/next.js upgrading/version-15.mdx]

### Pattern 4: TuneGrid Client Component (mirrors PsalmGrid)

**What:** Client component that receives all tunes from RSC, filters client-side by meter using URL param state.
**When to use:** Tune meter filter (SRCH-04).

```typescript
// src/components/TuneGrid.tsx — follow PsalmGrid.tsx structure exactly
'use client'
import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// Meter filter with URL param sync
// onValueChange: (v) => router.replace('/tunes?meter=' + v, { scroll: false })
// 'All Meters' clears param: router.replace('/tunes', { scroll: false })
```

**Key difference from PsalmGrid:** TuneGrid syncs filter state to URL via `router.replace` (for shareability), whereas PsalmGrid uses local `useState` only. The UI-SPEC requires URL param sync on the tune meter filter.

### Pattern 5: Static Explore Pages with generateStaticParams

**What:** All `/explore/[taxonomy]/[slug]` routes are static — all slugs known at build time from DB.
**When to use:** Topic listing, Naves listing, Authors listing pages.

```typescript
// src/app/explore/naves/[slug]/page.tsx
export async function generateStaticParams() {
  const topics = await fetchNavesTopicsWithCounts()
  return topics.map((t) => ({ slug: slugify(t.name ?? '') }))
}
```

**Slug function (from UI-SPEC, verbatim):**
```typescript
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .trim()   // Note: JS .trim() removes whitespace, not dashes — use replace(/^-+|-+$/g, '') for dash trim
}
```

**Slug collision:** [VERIFIED: live DB query] "Mercy Seat" and "Mercy-Seat" both produce `mercy-seat`. Recommended resolution: append DB id suffix for any collision (`mercy-seat-269`, `mercy-seat-477`). Implement via a `buildNavesSlug(id, name)` function that checks for uniqueness.

### Anti-Patterns to Avoid

- **Importing `sql` from `@/db`:** The db/index.ts file exports the postgres.js pool as `sql`. Using it as a Drizzle template tag will fail at runtime. Always `import { sql } from 'drizzle-orm'` in query files.
- **Using `to_tsquery` for user input:** `to_tsquery` requires tsquery syntax; user input like "shepherd king" fails. Use `plainto_tsquery` for free-text user input.
- **Synchronous searchParams in Next.js 15:** `searchParams.q` without `await` returns the Promise object, not the value. Always `const { q } = await searchParams`.
- **`dangerouslySetInnerHTML` without data-attribute scoping:** The UI-SPEC requires `[data-snippet] b { font-weight: 600 }` CSS scoping — apply `data-snippet` attribute to the snippet wrapper so the bold style only affects `ts_headline` output, not other `<b>` tags on the page.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyword search ranking | Custom scoring function | PostgreSQL `ts_rank` | Handles term frequency, position weighting, normalization correctly |
| Search result snippet with highlighted terms | String.indexOf + substring | PostgreSQL `ts_headline` | Handles multi-term, sentence boundaries, HTML escaping |
| Query tokenization & stemming | Split on spaces | `plainto_tsquery` | Handles stop words, stemming (shepherd/shepherds), phrase logic |
| URL parameter sanitization in SQL | Manual escaping | Drizzle `sql` template tag | Parameterized queries prevent SQL injection automatically |
| Slug collision detection | Build-time check in JS | DB query at generateStaticParams time | Only the DB knows all slug values; check there |

**Key insight:** PostgreSQL full-text search is mature and correct for 150-document corpora. The only custom code needed is the glue between Next.js forms and the DB query.

---

## Common Pitfalls

### Pitfall 1: Topics Table Has All Null Names (BLOCKING)

**What goes wrong:** The `/explore/topics` section shows no topic names. All 88 topics in the DB have `name = NULL`. The /explore/topics/[slug] pages cannot be generated. SRCH-03 partially fails.

**Why it happens:** [VERIFIED: Airtable Meta API + DB query] The migration script calls `r.get('Name')` on the `Topics - Psalms` Airtable table, but the actual field is named `Topic (Psalm)`. The `str()` helper returns null for undefined, so all 88 rows insert with `name = NULL`.

**How to fix:** Re-run only the topics migration segment with corrected field name. The migration is idempotent (uses `onConflictDoUpdate` on `airtable_id`), so a targeted re-migration is safe.

```typescript
// Fix in migrate-airtable.ts:
// BEFORE: name: str(r.get('Name')),
// AFTER:  name: str(r.get('Topic (Psalm)')),
```

**Additional schema gap:** The `topics` schema is missing two fields that exist in Airtable: `topicType` (singleSelect: "Main Topic", "Song Type", "When you...") and `description` (singleLineText). These should be added to the schema in Wave 0. Without them, the /explore/topics listing will show names but lose categorization context.

**Warning signs:** `SELECT COUNT(*) FROM topics WHERE name IS NOT NULL` returns 0.

---

### Pitfall 2: `sql` Import Naming Conflict

**What goes wrong:** A query file does `import { db, sql } from '@/db'` and uses `sql` as the Drizzle template tag. It appears to work in development but produces malformed queries or runtime errors.

**Why it happens:** `src/db/index.ts` exports the postgres.js connection pool named `sql` (`export { sql }` at the bottom). This is the raw database client, not the Drizzle template function.

**How to avoid:** In all new query files:
```typescript
import { db } from '@/db'            // Drizzle client
import { sql } from 'drizzle-orm'    // Template tag for raw expressions
```

Never `import { sql } from '@/db'` in any query file.

**Warning signs:** TypeScript will not catch this — both are callable. Runtime behavior will differ: the postgres.js pool's tagged template tries to execute the literal string.

---

### Pitfall 3: Slug Collision on Nave's Topics

**What goes wrong:** Navigating to `/explore/naves/mercy-seat` resolves ambiguously — "Mercy Seat" (id 269) and "Mercy-Seat" (id 477) produce identical slugs.

**Why it happens:** [VERIFIED: DB query] Both names slugify to `mercy-seat`. `generateStaticParams` would emit the same path twice; Next.js uses the last one. One topic becomes unreachable.

**How to avoid:** Use a `buildNavesSlug(id: number, name: string)` function that detects collisions and appends `‑{id}` as a suffix. Run the full slug set at `generateStaticParams` time to detect any collision. Given only 1 collision exists, the simpler approach is: use `‑{id}` suffix **only** for the two colliding entries (269, 477).

**Warning signs:** Two `generateStaticParams` entries with the same `slug` value.

---

### Pitfall 4: Naves Topics Linked via Verses, Not Psalms Directly

**What goes wrong:** A query `SELECT psalm_id FROM verse_naves_topics WHERE naves_topic_id = ?` fails because `verse_naves_topics` links verses, not psalms. The schema is: `verse_naves_topics.verse_id → verses.psalm_id`.

**Why it happens:** [VERIFIED: schema.ts] The join chain is `naves_topics → verse_naves_topics → verses → psalms`. Not `naves_topics → psalms`.

**How to avoid:** Use a multi-join query:
```sql
SELECT DISTINCT v.psalm_id FROM verse_naves_topics vnt
JOIN verses v ON v.id = vnt.verse_id
WHERE vnt.naves_topic_id = ?
```

This is also why the `/explore` hub psalm count for Nave's topics uses `COUNT(DISTINCT v.psalm_id)`, not `COUNT(vnt.verse_id)` (a single psalm can have multiple verses linked to the same topic).

**Warning signs:** Result counts that are much higher than 150 (verse-level) vs psalm-level.

---

### Pitfall 5: FTS Query Against All Rows Without Index During Development

**What goes wrong:** FTS works in development at ~166ms but degrades further under concurrent requests. The GIN indexes must be created before testing at scale.

**Why it happens:** Without indexes, PostgreSQL does a sequential scan converting every row's text to tsvector on each query.

**How to avoid:** Create GIN expression indexes as Wave 0 setup (see Architecture Patterns). These persist across restarts — only needed once on the live DB.

---

## Code Examples

### Full-text search query (Drizzle sql tag)

```typescript
// Source: [CITED: drizzle-team/drizzle-orm-docs guides/postgresql-full-text-search.mdx]
// Parameter sanitization is automatic via the sql template tag
const results = await db.execute(sql`
  SELECT p.id,
    ts_rank(
      to_tsvector('english', COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, '')),
      plainto_tsquery('english', ${userQuery})
    ) AS rank,
    ts_headline('english',
      COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, ''),
      plainto_tsquery('english', ${userQuery}),
      'StartSel=<b>, StopSel=</b>, MaxWords=15, MinWords=5, MaxFragments=1'
    ) AS snippet
  FROM psalms p
  LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
  WHERE to_tsvector('english', COALESCE(p.kjv_text, '') || ' ' || COALESCE(pv.lyrics, ''))
    @@ plainto_tsquery('english', ${userQuery})
  ORDER BY rank DESC
  LIMIT 50
`)
```

### Taxonomy count query for /explore hub

```typescript
// Source: [VERIFIED: schema.ts analysis]
// Topics with psalm count (after migration fix)
const topicCounts = await db
  .select({ id: topics.id, name: topics.name, count: count(psalmTopics.psalmId) })
  .from(topics)
  .leftJoin(psalmTopics, eq(psalmTopics.topicId, topics.id))
  .where(isNotNull(topics.name))
  .groupBy(topics.id, topics.name)
  .orderBy(desc(count(psalmTopics.psalmId)))

// Naves topics with psalm count (must join through verses)
const navesWithPsalmCount = await db.execute(sql`
  SELECT nt.id, nt.name, COUNT(DISTINCT v.psalm_id) AS psalm_count
  FROM naves_topics nt
  JOIN verse_naves_topics vnt ON vnt.naves_topic_id = nt.id
  JOIN verses v ON v.id = vnt.verse_id
  GROUP BY nt.id, nt.name
  ORDER BY psalm_count DESC
`)
```

### GIN index creation (run once at Wave 0)

```sql
-- Source: [VERIFIED: psql EXPLAIN ANALYZE on live DB — 1ms vs 166ms]
CREATE INDEX IF NOT EXISTS idx_psalms_kjv_fts
  ON psalms USING gin(to_tsvector('english', COALESCE(kjv_text, '')));

CREATE INDEX IF NOT EXISTS idx_psalm_versions_lyrics_fts
  ON psalm_versions USING gin(to_tsvector('english', COALESCE(lyrics, '')));
```

### Next.js 15 async searchParams

```typescript
// Source: [CITED: vercel/next.js docs app/api-reference/file-conventions/page.mdx]
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const { q } = await searchParams
  const query = Array.isArray(q) ? q[0] : (q ?? '')
  // ...
}
```

### SiteHeader upgrade to 'use client' for active link

```typescript
// Source: [VERIFIED: src/components/SiteHeader.tsx — currently RSC with static navLinks]
// SiteHeader must become 'use client' to use usePathname()
'use client'
import { usePathname } from 'next/navigation'

// In the nav link render:
const pathname = usePathname()
const isActive = (href: string) => pathname.startsWith(href)
// className: isActive(link.href) ? 'text-foreground bg-muted ...' : 'text-muted-foreground ...'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `searchParams` as synchronous object | `searchParams` as `Promise<...>` — must `await` | Next.js 15 | All search pages must use async pattern |
| `tsvector` as first-class Drizzle column type | Use `customType<{data:string}>` with `dataType() { return 'tsvector' }` | Drizzle 0.32+ | For generated columns; not needed for expression indexes |

**Deprecated/outdated:**
- Synchronous `searchParams.q` (Next.js 14 pattern): causes deprecation warning in 15, breaks in 16
- `to_tsquery` for end-user search boxes: requires tsquery syntax; replace with `plainto_tsquery`

---

## Runtime State Inventory

Step 2.5: SKIPPED — This is a new-feature phase (no rename/refactor/migration involved). The one exception is the Topics migration fix, which is a data correction (updating existing rows from null → correct name), not a rename.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL (psalter-db container) | SRCH-02 FTS | [VERIFIED: docker exec works] | PostgreSQL 16 | None — blocking |
| Docker (psalter-db) | DB access | [VERIFIED: docker exec psalter-db] | Running | None |
| Airtable API (AIRTABLE_PAT) | Topics migration fix | [VERIFIED: Meta API call succeeded] | Active | None — needed for fix |
| shadcn input component | /search form | NOT installed [VERIFIED: ls src/components/ui/] | — | npx shadcn add input |
| shadcn skeleton component | /search loading state | NOT installed [VERIFIED: ls src/components/ui/] | — | npx shadcn add skeleton |

**Missing dependencies with no fallback:**
- None that block core functionality.

**Missing dependencies with fallback:**
- shadcn input and skeleton: install via `npx shadcn add input skeleton` in Wave 0.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.mts) |
| Config file | `/data/home/psalter/vitest.config.mts` |
| Quick run command | `npx vitest run tests/search.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | PsalmSearchWidget navigates to /psalms/[n] for valid input 1-150 | unit | `npx vitest run tests/search.test.ts` | ❌ Wave 0 |
| SRCH-02 | fetchSearchResults('shepherd') returns Psalm 23 with snippet | integration | `npx vitest run tests/search.test.ts` | ❌ Wave 0 |
| SRCH-02 | fetchSearchResults('') returns empty array without DB call | unit | `npx vitest run tests/search.test.ts` | ❌ Wave 0 |
| SRCH-02 | fetchSearchResults('zzznomatch') returns [] | integration | `npx vitest run tests/search.test.ts` | ❌ Wave 0 |
| SRCH-03 | fetchNavesTopicsWithCounts returns 488 topics each with psalm_count | integration | `npx vitest run tests/explore.test.ts` | ❌ Wave 0 |
| SRCH-03 | fetchPsalmsByNavesTopic(topicId) returns psalms with correct join chain | integration | `npx vitest run tests/explore.test.ts` | ❌ Wave 0 |
| SRCH-03 | fetchTopicsWithCounts returns >0 topics with non-null names (post-migration-fix) | integration | `npx vitest run tests/explore.test.ts` | ❌ Wave 0 |
| SRCH-04 | TuneGrid filters to CM meter correctly (client logic unit test) | unit | `npx vitest run tests/tune-grid.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/search.test.ts tests/explore.test.ts tests/tune-grid.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/search.test.ts` — covers SRCH-01, SRCH-02
- [ ] `tests/explore.test.ts` — covers SRCH-03 (topics, naves, messianic, authors queries)
- [ ] `tests/tune-grid.test.ts` — covers SRCH-04 (client-side filter logic, can be unit tested without DOM)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Yes — search query input | Drizzle `sql` template tag provides parameterized queries; `plainto_tsquery` sanitizes FTS input |
| V2 Authentication | No | Public read-only pages |
| V3 Session Management | No | No session state in Phase 3 |
| V4 Access Control | No | All Phase 3 pages are public |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via `?q=` parameter | Tampering | Drizzle `sql` template tag — parameters are always bound, never interpolated into query string [CITED: drizzle docs] |
| XSS via `ts_headline` HTML output | Tampering | `dangerouslySetInnerHTML` is safe here: PostgreSQL generates `<b>` tags from its own lexeme matching, not from user-originated HTML. Scope with `data-snippet` attribute. |
| Open redirect via `?q=` | Elevation | Not applicable — search page stays at /search, no redirect logic |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Topics migration fix (changing `r.get('Name')` to `r.get('Topic (Psalm)')`) will populate all 88 topic names correctly | Common Pitfalls | If the Airtable field has other issues, topics section of /explore may still be empty — verify with count after fix |
| A2 | Authors section on /explore is useful — 8 distinct authors with David (73), Unknown (50) as top entries | Architecture Patterns | If user finds "Unknown" author grouping unhelpful, may want to filter it out or rename |

---

## Open Questions (RESOLVED)

1. **Topics schema fields: add `topicType` and `description` to schema?**
   - RESOLVED: Yes — Plan 03-01 Task 1 adds both `topic_type` and `description` columns to the `topics` table via schema migration.

2. **How to handle `naves_topics` where Nave's psalm count could be misleading**
   - RESOLVED: Show all topics — Plan 03-05 Task 1 renders the full list; the user can decide after seeing the live page.

---

## Sources

### Primary (HIGH confidence)
- `/data/home/psalter/src/db/schema.ts` — schema inspection, all table columns verified
- Docker exec `psalter-db` psql — live DB counts, FTS query performance, slug collision check
- `drizzle-team/drizzle-orm-docs` via Context7 — sql template tag, FTS patterns, tsvector customType
- `vercel/next.js` via Context7 — async searchParams, Next.js 15 upgrade patterns
- Airtable Meta API — `Topics - Psalms` field name verification (`Topic (Psalm)` not `Name`)

### Secondary (MEDIUM confidence)
- `/data/home/psalter/src/components/PsalmGrid.tsx` — pattern to replicate in TuneGrid
- `/data/home/psalter/src/components/SiteHeader.tsx` — confirmed RSC, needs 'use client' upgrade
- `/data/home/psalter/.planning/phases/03-search/03-UI-SPEC.md` — slug function, component inventory, interaction contracts
- `package.json` — confirmed library versions (drizzle-orm 0.45.2, next 16.2.5, postgres 3.4.9)

### Tertiary (LOW confidence)
- None — all key claims verified via tooling.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and live code
- Architecture: HIGH — verified from schema, live DB queries, and existing code patterns
- Pitfalls: HIGH — confirmed via live Airtable API call, DB queries, and code analysis
- FTS performance: HIGH — measured via EXPLAIN ANALYZE on live DB

**Research date:** 2026-05-08
**Valid until:** 2026-06-08 (stable stack — 30 days)
