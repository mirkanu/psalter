# Architecture: CPRC Scottish Psalter Web App

**Project:** psalter.cprc.co.uk rebuild
**Researched:** 2026-05-07
**Overall confidence:** HIGH (Next.js/PostgreSQL patterns), MEDIUM (ABC sourcing), HIGH (abcjs integration)

---

## 1. PostgreSQL Schema Design

### Design Philosophy

The Airtable base maps cleanly to a normalized relational schema. The key insight is that Airtable's link fields become either foreign keys (for one-to-many) or junction tables (for many-to-many). Do NOT flatten — the richness of the theological cross-reference data is the product's depth.

### Core Tables

```sql
-- The canonical 150 psalms
psalms (
  id            integer PRIMARY KEY,  -- psalm number 1–150
  title         text NOT NULL,
  book          integer NOT NULL,     -- 1–5 (Books of Psalms)
  kjv_text      text,                 -- full KJV prose text
  haddington_intro text,              -- intro note from Haddington commentary
  author        text                  -- traditional attribution
)

-- Metrical versifications (Scottish Psalter 1650)
-- One psalm can have multiple versifications (e.g., Ps 23 has two)
psalm_versions (
  id            serial PRIMARY KEY,
  psalm_id      integer NOT NULL REFERENCES psalms(id),
  version_label text,                 -- e.g. "1650" or "Alternative"
  meter         text NOT NULL,        -- e.g. "CM", "SM", "LM"
  full_text     text                  -- full metrical text for display
)

-- Individual verses for both KJV and metrical text
verses (
  id            serial PRIMARY KEY,
  psalm_id      integer NOT NULL REFERENCES psalms(id),
  verse_number  integer NOT NULL,
  kjv_text      text NOT NULL,
  metrical_text text,
  UNIQUE(psalm_id, verse_number)
)

-- Tunes (~100 traditional tunes)
tunes (
  id            serial PRIMARY KEY,
  name          text NOT NULL UNIQUE,
  meter         text NOT NULL,        -- must match psalm_versions.meter for assignment
  abc_notation  text,                 -- ABC string, NULL until encoded/sourced
  score_jpg_url text,                 -- existing JPG (S3/CDN) during transition
  youtube_url   text,
  soundcloud_url text,
  source_notes  text                  -- provenance of ABC (manual/dataset/OCR)
)

-- Junction: which tunes can be used with which psalm versions
-- (replaces Airtable "Tune assignments" link field)
psalm_version_tunes (
  psalm_version_id integer NOT NULL REFERENCES psalm_versions(id),
  tune_id          integer NOT NULL REFERENCES tunes(id),
  is_primary       boolean DEFAULT false,
  PRIMARY KEY (psalm_version_id, tune_id)
)

-- Service events
events (
  id            serial PRIMARY KEY,
  event_date    date NOT NULL,
  session       text NOT NULL CHECK (session IN ('AM', 'PM', 'Evening', 'Special')),
  precentor     text,
  notes         text,
  UNIQUE(event_date, session)
)

-- Service set list: psalms sung at a service
service_items (
  id            serial PRIMARY KEY,
  event_id      integer NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  position      integer NOT NULL,     -- ordering within service (1, 2, 3...)
  psalm_version_id integer REFERENCES psalm_versions(id),
  tune_id       integer REFERENCES tunes(id),
  verses_sung   text,                 -- e.g. "1-4" or "all"
  UNIQUE(event_id, position)
)
```

### Reference / Cross-reference Tables

```sql
-- 365-day daily reading plan
daily_readings (
  day_of_year   integer PRIMARY KEY CHECK (day_of_year BETWEEN 1 AND 365),
  psalm_id      integer NOT NULL REFERENCES psalms(id),
  reading_notes text
)

-- Topical index (from Topics - Psalms table)
topics (
  id            serial PRIMARY KEY,
  name          text NOT NULL UNIQUE,
  category      text                  -- grouping if present
)

psalm_topics (
  psalm_id      integer NOT NULL REFERENCES psalms(id),
  topic_id      integer NOT NULL REFERENCES topics(id),
  PRIMARY KEY (psalm_id, topic_id)
)

-- Nave's Topical Bible cross-references (verse-level)
naves_topics (
  id            serial PRIMARY KEY,
  name          text NOT NULL
)

verse_naves_topics (
  verse_id      integer NOT NULL REFERENCES verses(id),
  naves_topic_id integer NOT NULL REFERENCES naves_topics(id),
  PRIMARY KEY (verse_id, naves_topic_id)
)

-- Messianic classification
messianic_psalms (
  psalm_id      integer PRIMARY KEY REFERENCES psalms(id),
  messianic_type text,               -- e.g. "Direct Prophecy", "Typological"
  references    text                 -- NT cross-references
)

-- Section headings within a psalm
section_headings (
  id            serial PRIMARY KEY,
  psalm_id      integer NOT NULL REFERENCES psalms(id),
  verse_start   integer NOT NULL,
  heading_text  text NOT NULL
)

-- Doctrinal cross-references
doctrines (
  id            serial PRIMARY KEY,
  name          text NOT NULL UNIQUE
)

psalm_doctrines (
  psalm_id      integer NOT NULL REFERENCES psalms(id),
  doctrine_id   integer NOT NULL REFERENCES doctrines(id),
  PRIMARY KEY (psalm_id, doctrine_id)
)

-- Tune mood tags
moods (
  id            serial PRIMARY KEY,
  name          text NOT NULL UNIQUE  -- e.g. "Majestic", "Penitential"
)

tune_moods (
  tune_id       integer NOT NULL REFERENCES tunes(id),
  mood_id       integer NOT NULL REFERENCES moods(id),
  PRIMARY KEY (tune_id, mood_id)
)

-- Auth: precentor accounts (minimal)
users (
  id            serial PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'precentor' CHECK (role IN ('precentor', 'admin')),
  created_at    timestamptz DEFAULT now()
)
```

### Key Schema Decisions

**Psalm number as PK:** Use the actual psalm number (1–150) as the primary key, not a serial ID. It is stable, meaningful, and simplifies URLs (`/psalm/23`).

**Tune.abc_notation nullable:** Start NULL. The JPG fallback renders until ABC is available. This decouples the migration of data from the sourcing of ABC strings.

**psalm_version_tunes junction:** Many Scottish Psalter psalms have exactly one metrical version with one or two common tunes. Some have alternatives. The junction table models this without over-engineering.

**Verses denormalized by psalm_id:** Direct FK to psalm skips the join through psalm_versions for the common case of displaying KJV verses alongside metrical text.

---

## 2. Next.js App Router Architecture

### Server vs Client Component Boundary

The core rule: data lives on the server, interactivity lives on the client.

```
Server Components (no 'use client'):
  - All page-level components (app/psalm/[id]/page.tsx, etc.)
  - Data fetching via direct Drizzle queries
  - Static content: KJV text, metrical lyrics, theological metadata
  - Tune metadata (name, meter, media links)

Client Components ('use client'):
  - AbcRenderer — abcjs requires DOM, cannot run server-side
  - ServiceBuilder — precentor drag-and-drop set list (interactive)
  - SearchBar — real-time search input with debounce
  - TabBar — psalm detail page tab switching (Overview/Study/Messianic)
  - AudioPlayer — SoundCloud/YouTube embed controls
```

### Data Fetching Strategy

**Direct Drizzle queries in Server Components** — no API layer for read operations. The database is co-located; HTTP round trips are waste.

```typescript
// app/psalm/[id]/page.tsx — Server Component
import { db } from '@/lib/db'
import { psalms, verses, psalmVersions } from '@/lib/schema'

export default async function PsalmPage({ params }) {
  const psalm = await db.query.psalms.findFirst({
    where: eq(psalms.id, parseInt(params.id)),
    with: {
      verses: true,
      versions: { with: { tunes: true } },
      topics: true,
      messianicData: true,
    }
  })
  // Pass to Client Components as props
  return <PsalmDetail psalm={psalm} />
}
```

**Caching strategy by data type:**

| Data | Cache approach | Rationale |
|------|---------------|-----------|
| Psalms, verses, KJV text | `unstable_cache` with long TTL (24h) | Never changes |
| Tunes, ABC notation | `unstable_cache` with tag `tunes` | Changes during ABC population phase |
| Theological metadata (topics, doctrines, messianic) | `unstable_cache` with 24h TTL | Rarely changes |
| Service events | `cache: 'no-store'` or short TTL (60s) | Precentors update before/during service |
| Daily reading plan | `unstable_cache` with 365-day TTL | Static dataset |

Use `revalidateTag('tunes')` in a server action when a tune's ABC notation is added during the population workflow.

**Route Handler (API) usage — only for mutations:**
- `POST /api/events` — create service event
- `POST /api/events/[id]/items` — add psalm+tune to service
- `PATCH /api/tunes/[id]/abc` — add ABC notation (admin only)

### Route Structure

```
app/
  (public)/
    page.tsx                    — home / today's daily reading
    psalm/
      page.tsx                  — psalm list (all 150)
      [id]/
        page.tsx                — psalm detail (Overview/Study/Messianic tabs)
        loading.tsx             — skeleton
    tune/
      page.tsx                  — tune index
      [id]/
        page.tsx                — tune detail with notation
        loading.tsx             — skeleton
    plan/
      page.tsx                  — 365-day reading plan
    search/
      page.tsx                  — search results
  (precentor)/
    login/
      page.tsx
    dashboard/
      page.tsx                  — upcoming services
      loading.tsx
    events/
      new/page.tsx
      [id]/
        page.tsx                — service detail / set builder
        loading.tsx
  api/
    events/route.ts
    events/[id]/items/route.ts
    tunes/[id]/abc/route.ts
```

Route groups `(public)` and `(precentor)` share no layout conflict and allow separate middleware auth.

### Authentication

Use `next-auth` v5 (Auth.js) with credentials provider for the single precentor role. Session stored as a JWT cookie. Middleware at `middleware.ts` protects the `(precentor)` route group.

```typescript
// middleware.ts
export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*']
}
```

This keeps the auth check at the edge, before any Server Component renders.

---

## 3. ABC Notation Sourcing

### The Problem

~100 traditional Scottish Psalter tunes need ABC notation strings. No existing ABC files exist in the project. Current assets are JPG photos of printed scores.

### Research Findings on Existing ABC Datasets

**Confidence on dataset existence: MEDIUM** — WebSearch was unavailable; findings draw on training-data knowledge of music notation repositories.

#### Option A: Existing ABC Datasets (HIGH priority, investigate first)

The Scottish Psalter tunes are a well-defined set of ~100 traditional psalm tunes. Several repositories are known to contain them:

1. **The Session (thesession.org)** — Largest community ABC database. Primarily Irish/Scottish folk tunes. Scottish psalm tunes (OLD HUNDREDTH, DUNDEE, KILMARNOCK, FRENCH, ST. COLUMBA, etc.) are traditional melodies that overlap with the folk tradition. Many are likely present. The Session's data is CC-BY (attribution required for reuse). Start here.

2. **abcnotation.com tune search** — Community archive. Search by tune name. Traditional Scottish psalm tunes are public domain and commonly uploaded.

3. **Musescore / IMSLP** — Not ABC format natively, but MusicXML export from these sources can be converted to ABC using `music21` (Python) or `abc2xml`. IMSLP hosts 1650 Scottish Psalter editions in the public domain.

4. **Hymnal ABC collections** — Several folk/sacred music enthusiasts have published ABC hymnal collections on GitHub and folk music sites. Search GitHub for `"scottish psalter" ABC` or `"old hundredth" ABC notation`.

5. **NotaMusica / Chant databases** — Less likely to have Reformed psalm tunes but worth checking.

**Recommended first action:** Query The Session API for each of the ~100 tune names. The Session has a REST API: `https://thesession.org/tunes/search?q={name}&format=json`. This can be scripted. Match returned tunes against the psalter meter to verify correctness.

#### Option B: Music OCR on JPG Images (LOW priority, last resort)

Tools: **Audiveris** (Java, open source) and **PhotoScore** (commercial) are the leading OMR (Optical Music Recognition) tools. Both accept image input and output MusicXML, which converts to ABC.

**Practical assessment:**
- JPG photos of printed sheets have variable quality (lighting, angle, resolution)
- OMR accuracy on photos vs. clean scans: typically 60–80% note-correct on good input
- Each output requires manual correction — essentially manual encoding with a head start
- Audiveris is open source and could be run locally; PhotoScore is commercial (~$200)
- **Verdict:** Use only if Option A yields fewer than ~50 tunes. The correction time per tune likely exceeds clean manual encoding.

#### Option C: Manual ABC Encoding (MEDIUM priority, fill gaps)

For any tunes not found in datasets:
- Traditional psalm tunes are single-line melodies, typically 8–16 measures
- An ABC-literate musician can encode one tune in 15–30 minutes from a clean printed score or from memory
- The existing JPG score images serve as the reference
- A single skilled contributor could encode all remaining tunes in a focused weekend session
- Tools: ABC editors include EasyABC (GUI), abcjs online editor (browser), and standard text editors with preview

**Verdict: Option A + C is the practical path.** Script a lookup against The Session for all 100 tune names. Expect ~50–70% hit rate. Hand-encode the remainder from the JPG references. Skip OMR — the correction overhead exceeds direct encoding.

### ABC Format for Hymnal Use

Scottish Psalter tunes need the `w:` field for lyrics. The ABC format supports syllable-aligned lyrics:

```abc
X:1
T: Old Hundredth
C: Louis Bourgeois (1551)
M: 4/4
L: 1/4
K: G
G G A B | c B A G | ... |
w: All peo-ple that on earth do dwell,
w: Sing to the Lord with cheer-ful voice;
```

**Recommendation:** Store ABC notation WITHOUT embedded lyrics in the `tunes.abc_notation` column. The metrical lyrics live in `psalm_versions` and `verses`. At render time, the `AbcRenderer` client component dynamically injects the appropriate verse lyrics into the ABC string via string interpolation before calling `ABCJS.renderAbc`. This keeps tune data and lyric data properly separated in the schema while enabling the hymnal layout at render time.

---

## 4. Score Data Storage and Serving

### ABC Strings in PostgreSQL

Store ABC strings directly in `tunes.abc_notation` as `text`. Rationale:
- ABC strings for single-voice psalm tunes are tiny: typically 200–600 bytes
- No file system management, no CDN configuration, no cache invalidation across storage layers
- Fetched with the tune row in a single query
- Easily editable via admin interface or direct SQL during the sourcing phase

Do NOT store in files or S3. The size does not justify the complexity.

### JPG Score Images During Transition

The existing JPGs are Airtable attachments. Migration path:

1. During data migration, download all Airtable attachment URLs and upload to **Cloudflare R2** (zero egress cost) or **Vercel Blob** (simplest for a Next.js project)
2. Store the resulting CDN URL in `tunes.score_jpg_url`
3. The tune page renders: if `abc_notation` is present → render with abcjs; else → render `<img src={score_jpg_url} />`
4. As ABC strings are added, the JPG gracefully disappears from the UI
5. Once all tunes have ABC, remove the `score_jpg_url` column (or keep it as archival reference)

**Recommended storage: Vercel Blob** — one-line upload during migration script, native Next.js integration, no egress fees for small assets.

---

## 5. Component Boundaries

### Component Hierarchy

```
Page (Server Component)
  └── queries DB with Drizzle
  └── passes serializable props to:
      ├── Static sections (Server Components, no boundary crossing)
      │     PsalmHeader, VerseList, TopicList, MessianicPanel
      └── Interactive sections (Client Components, 'use client')
            ├── AbcRenderer         — owns abcjs lifecycle
            ├── TabBar              — tab state
            ├── SearchBar           — search input + debounce
            └── ServiceBuilder      — drag-and-drop set list
```

### AbcRenderer Component (Critical Detail)

abcjs is browser-only. It calls `document.getElementById` internally and cannot run in a Node.js server context. The Context7 docs confirm the official SSR pattern:

```typescript
// components/AbcRenderer.tsx
'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'  // if needed for module-level side effects

interface Props {
  abcNotation: string       // passed from server
  lyrics?: string[][]       // verse lines to inject (from server)
  responsive?: boolean
}

export function AbcRenderer({ abcNotation, lyrics, responsive = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamic import avoids SSR execution entirely
    import('abcjs').then((ABCJS) => {
      if (!containerRef.current) return
      const abc = lyrics ? injectLyrics(abcNotation, lyrics) : abcNotation
      ABCJS.renderAbc(containerRef.current, abc, {
        responsive: responsive ? 'resize' : undefined,
        add_classes: true,
      })
    })
  }, [abcNotation, lyrics])

  return <div ref={containerRef} className="abcjs-container" />
}
```

**Key:** Use dynamic `import('abcjs')` inside `useEffect` rather than a top-level import. This prevents Next.js from attempting to evaluate abcjs during SSR. The `process.browser` pattern shown in older abcjs docs works but dynamic import is cleaner and more reliable in App Router.

### Data Flow Direction

```
PostgreSQL
    ↓  (Drizzle query, server-side)
Server Component (page.tsx)
    ↓  (serialized props, no functions/class instances)
Client Component
    ↓  (DOM ref)
abcjs renderAbc (browser only)
    ↓  (SVG injected into DOM)
User sees notation
```

The lyrics injection happens at the Client Component boundary: the server passes `abcNotation` (tune melody string) and `lyrics` (verse array from `psalm_versions`/`verses`) as separate props. The client composes them at render time.

---

## 6. Build Order — Phases with Dependency Reasoning

### Dependency Graph

```
PostgreSQL schema + Drizzle ORM
    ↓ (everything depends on this)
Data migration from Airtable
    ↓
Public browse (psalms, tunes, verses)
    ↓
Search / filtering
    ↓               ↓
ABC sourcing      Auth (precentor login)
    ↓                    ↓
Notation render   Service event management
    ↓                    ↓
Hymnal layout     Service set list view with notation
                         ↓
                  Precentor worship view
```

### Recommended Phase Order

**Phase 1: Foundation — Schema + ORM + Migration**
- Define Drizzle schema for all tables
- Write Airtable export → PostgreSQL migration script
- Download and upload all JPG attachments to Vercel Blob
- Verify data integrity (row counts, FK validity)
- **Why first:** Everything else depends on real data in the database. No component can be meaningfully built without it.

**Phase 2: Public Read Layer — Psalm and Tune Browse**
- Psalm list page (`/psalm`)
- Psalm detail page with tabs (Overview: KJV text + metrical lyrics; Study: topics/doctrines; Messianic)
- Tune index and tune detail (JPG score display, YouTube/SoundCloud links)
- 365-day reading plan (`/plan`)
- `loading.tsx` skeletons for all routes
- **Why second:** Core public value of the site. Unblocked as soon as Phase 1 data is present. Validates the schema design against real display requirements.

**Phase 3: Search**
- Full-text search across psalm titles, KJV text, metrical text, topics
- PostgreSQL `tsvector` / `to_tsquery` full-text search (no external search service needed at this scale)
- **Why third:** Depends on Phase 2 routes for navigation integration. Independent of auth and notation.

**Phase 4: ABC Notation Population + Rendering**
- Script to query The Session API for each of the ~100 tunes by name
- Manual encoding workflow for gaps (text files, admin SQL import)
- `AbcRenderer` client component with dynamic abcjs import
- Replace JPG display with abcjs render when `abc_notation` present
- **Why fourth:** Depends on Phase 2 tune pages. ABC sourcing can run in parallel with Phase 3. Notation is the flagship feature — polish it once the base is stable.

**Phase 5: Authentication + Precentor Features**
- Next-auth v5 credentials provider
- Middleware protection for `(precentor)` routes
- Service event create/edit (`/events/new`)
- Service set list builder (psalm+tune assignment, ordering)
- Service view: all assigned psalms with AbcRenderer for each
- **Why fifth:** Depends on Phase 4 for the notation in the worship view. Precentor feature is the most interactive, highest-complexity phase — build it on a stable foundation.

**Phase 6: Polish + Performance**
- `<Suspense>` boundaries on all data-loading sections
- Optimistic updates for service item mutations
- OG images per psalm page (next/og)
- Dark mode (next-themes)
- **Why last:** Polish applies to existing features; no new dependencies.

### Phases with Most Dependencies (Risk Flags)

| Phase | Risk | Mitigation |
|-------|------|------------|
| Phase 1 — Migration | Airtable has undocumented field types; attachment download may hit rate limits | Export to CSV first, validate schema against CSV before writing migration script |
| Phase 4 — ABC sourcing | 100 tunes is a content task, not just engineering | Timebox The Session API lookup (1 day). If < 50 matches, plan a manual encoding sprint. Do not block Phase 5 on 100% ABC coverage — partial coverage is shippable. |
| Phase 5 — Service builder | Complex interactive state (ordering, drag-and-drop) | Use `@dnd-kit/sortable` for drag-and-drop. Keep service state server-authoritative with optimistic UI updates. |

---

## Sources

- abcjs SSR pattern: https://github.com/paulrosen/abcjs/blob/main/docs/overview/faq.md (Context7, HIGH confidence)
- abcjs lyrics via `w:` field and responsive options: Context7 /paulrosen/abcjs (HIGH confidence)
- Next.js unstable_cache + revalidateTag: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/incremental-static-regeneration.mdx (Context7, HIGH confidence)
- Next.js Server Component + Drizzle direct query pattern: https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/06-fetching-data.mdx (Context7, HIGH confidence)
- Next.js authentication + middleware: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/authentication.mdx (Context7, HIGH confidence)
- Drizzle ORM many-to-many with junction tables: Context7 /drizzle-team/drizzle-orm-docs (HIGH confidence)
- The Session ABC database: training data knowledge, MEDIUM confidence — verify at https://thesession.org/tunes/search
- OMR tools (Audiveris, PhotoScore): training data knowledge, MEDIUM confidence
