# Phase 2: Public Browse - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the complete public-facing browse experience: a homepage with today's daily reading and a psalm search widget; a /psalms card grid listing all 150 psalms; psalm detail pages with 4 tabs (Overview, Lyrics, Study, Messianic); individual tune detail pages; and a /daily reading plan page. All pages are statically pre-rendered at build time — no runtime DB queries on the public read path.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Layout
- Homepage (`/`) shows a devotional dashboard: today's daily reading card + a psalm number/keyword quick-search widget
- Header nav: sticky top bar, site name left, three links right — Psalms · Tunes · Daily Plan
- Neutral stone/slate color palette — calm, devotional tone

### Psalm List Design
- `/psalms` renders a card grid — each card shows psalm number, first line, and meter
- Default sort: by number 1–150
- Book filter: dropdown select at the top of the grid
- Cards link to `/psalms/[id]`

### Psalm Detail Page
- 4 tabs: Overview · Lyrics · Study · Messianic
- **Overview tab:** Bible title, book, Haddington introduction, KJV text as numbered verses
- **Lyrics tab:** Primary metrical version displayed; additional versions collapsed below; associated tune(s) shown at the bottom with links to tune detail page
- **Study tab:** Section headings, Nave's topics, doctrinal cross-references
- **Messianic tab:** Messianic classification, NT verification, messianic verses
- Tune detail pages at `/tunes/[id]` — name, meter, score JPG (Phase 4 adds abcjs), YouTube/audio links

### Daily Reading Plan
- `/daily` — full 365-entry list, today's entry prominently highlighted at top with auto-scroll to row
- Entry shows: day number + psalm number + title, linked to `/psalms/[id]`
- `/daily/[day]` for individual day pages

### Claude's Discretion
- Exact card dimensions and grid breakpoints
- Skeleton placeholder shape/count for loading states
- Tab URL param strategy (`?tab=lyrics` vs hash routing)
- How to handle psalms with no messianic data (hide tab vs show empty state)
- Tune page layout details (score image aspect ratio, audio embed style)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — shadcn/ui components already installed (Button, Card, etc.)
- `src/db/schema.ts` — full Drizzle schema with all tables: psalms, psalmVersions, tunes, verses, dailyReadings, sectionHeadings, topics, navesTopics, moods, doctrines, and all junction tables
- `src/db/index.ts` — postgres.js connection via `process.env.DATABASE_URL`
- `src/lib/utils.ts` — shadcn `cn()` utility
- `src/app/layout.tsx` — Geist font (Sans + Mono), basic flex column body — needs nav added

### Established Patterns
- Next.js 15 App Router — all pages use React Server Components by default
- Tailwind CSS 4 with shadcn Nova preset
- `tw-animate-css` (not `tailwindcss-animate`) for animations
- Static rendering via `generateStaticParams` is the intended approach for public pages per PROJECT.md

### Integration Points
- Public pages read from `psalter-db` PostgreSQL container on port 5435
- `DATABASE_URL` is `postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5435/psalter` (never hardcoded)
- Tune score JPGs served from local Docker volume path stored in `tunes.score_jpg_url`
- No auth layer in Phase 2 — all routes are public

</code_context>

<specifics>
## Specific Ideas

- The homepage devotional dashboard should feel welcoming and immediately useful — "what should I read today?" is the first question a congregation member asks
- Psalm numbers as integers (1–150) are the URL slug — `/psalms/23` not `/psalms/psalm-23`
- Tune pages are secondary browse; primary entry is via psalm → lyrics tab → tune link
- No specific UI framework deviations — stay with shadcn/Tailwind conventions

</specifics>

<deferred>
## Deferred Ideas

- Search (full-text keyword, topic browse, meter filter) — Phase 3
- abcjs live notation rendering — Phase 4
- Audio playback on tune pages — Phase 5 (precentor portal)
- Loading skeletons and click feedback polish — Phase 6

</deferred>
