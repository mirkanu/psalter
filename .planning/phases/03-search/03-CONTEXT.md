# Phase 3: Search - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers all discovery surfaces: keyword/full-text search, a topic explore page spanning all available taxonomies, Nave's topic browse, and a tune meter filter. Users should be able to find any psalm or tune without manually browsing lists.

Key note: The Airtable database must be 100% represented in the PostgreSQL schema and surfaced in the UI. Currently missing from the schema: Creeds table, structured Quoted-in-NT data, and Nave's sub-topic hierarchy. These are deferred to a future phase but must be tracked as a debt item.

</domain>

<decisions>
## Implementation Decisions

### Search Entry Point & Layout
- Dedicated `/search` page with URL param `?q=` — shareable and bookmarkable
- Results display as compact list rows: psalm number + first line + matched text snippet (PostgreSQL `ts_headline`)
- Submit-on-enter (not live-as-you-type) — one DB call per search
- PostgreSQL `tsvector` across both metrical lyrics AND KJV text, ranked by `ts_rank`

### Topic & Taxonomy Design
- Individual psalm detail pages already show Nave's topics and doctrines in the Study tab — no new tab needed
- `/explore` page: browse psalms by all available taxonomies — Topics (Themes), Nave's Topics, Messianic, Authors
- Each taxonomy shown as a browsable list; clicking a taxonomy value shows all matching psalms
- `/explore/topics/[slug]` — psalms tagged to a specific Topic
- `/explore/naves/[slug]` — psalms linked to a specific Nave's topic (via verse links)
- `/explore/messianic` — all psalms with messianic classification
- `/explore/authors/[author]` — all psalms by a given author
- Nave's sub-topic hierarchy not in schema — show flat list; add schema hierarchy as a tracked debt item
- Creeds and Quoted-in-NT not in schema — noted as debt, deferred to future phase

### Tune Meter Filter
- Add meter filter dropdown to `/tunes` list page (same shadcn Select pattern as PsalmGrid book/meter filters)
- Server-rendered: pass all tunes to client, filter client-side (same pattern as /psalms)
- Existing `/tunes` meter data already available in Drizzle schema

### Claude's Discretion
- Exact URL slug strategy for topic/Nave's names (slugify or use DB id)
- Pagination strategy on explore listing pages (if topic has many psalms)
- Loading skeleton shape for search results and explore pages

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/PsalmGrid.tsx` — client-side filter pattern with shadcn Select; reuse for tune meter filter
- `src/components/PsalmSearchWidget.tsx` — psalm number navigation widget (SRCH-01 already implemented)
- `src/components/ui/` — Badge, Card, Select, Separator, Tabs all installed
- `src/db/schema.ts` — `topics`, `navesTopics`, `doctrines`, `messianicPsalms`, `psalmTopics`, `verseNavesTopics` all present
- `src/db/queries/psalms.ts` — existing query patterns to build on

### Established Patterns
- RSC pages fetch data server-side; pass to client components for interactivity
- Client components use `useSearchParams` + `router.replace` for URL param state
- shadcn Select `onValueChange` wraps setter in arrow function (see PsalmGrid pattern)
- Static `generateStaticParams` for high-traffic public pages; search results are dynamic (runtime queries)

### Integration Points
- SiteHeader (`src/components/SiteHeader.tsx`) — add Search and Explore nav links
- `/tunes/page.tsx` — add meter filter (currently no client filtering)
- New routes needed: `/search`, `/explore`, `/explore/topics/[slug]`, `/explore/naves/[slug]`, `/explore/messianic`, `/explore/authors/[author]`
- PostgreSQL full-text: add `tsvector` generated column or use `to_tsvector()` in query; `ts_headline()` for snippets

</code_context>

<specifics>
## Specific Ideas

- User wants the new site to broadly mirror the existing psalter.cprc.co.uk structure and UX, but the existing site (Softr/client-rendered) could not be scraped. Design sensibly and user will refine after seeing live.
- The /explore page is a user-requested addition beyond SRCH-01–04. It should feel like a "discovery hub" — multiple taxonomy dimensions on one page, each expandable or linked to a filtered list.
- Airtable completeness is a recurring concern: ensure every data field in the schema is eventually surfaced in the UI. Create a tracking note for: Nave's sub-topic hierarchy, Creeds, Quoted-in-NT.

</specifics>

<deferred>
## Deferred Ideas

- Nave's sub-topic (parent-child) hierarchy — not in schema; needs `parent_id` on `naves_topics` + re-migration
- Creeds taxonomy — not in Airtable migration; needs new table + Airtable data check
- Quoted-in-NT as structured browse (NT references currently stored as free text in `messianic_psalms.nt_verification`)
- Tune moods browse on /explore — moods are linked to tunes not psalms; could add `/explore/moods/[slug]` in a later phase
- Full-text search on tunes (name, meter) — Phase 3 covers psalm search only per SRCH-01/02

</deferred>
