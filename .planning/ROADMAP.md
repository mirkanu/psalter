# Roadmap: CPRC Psalter

## Overview

Rebuild of psalter.cprc.co.uk from Airtable + Softr to a self-hosted Next.js 15 application. Six phases move from data migration through public browsing, search, live notation rendering, and precentor portal — culminating in a performance pass that satisfies the perceived-performance mandate. Every phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2, 4.5): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Drizzle schema, Airtable→PostgreSQL migration, R2 JPG storage
- [x] **Phase 2: Public Browse** - Psalm list/detail (3 tabs), tune pages, daily reading plan, static rendering
- [x] **Phase 3: Search** - Full-text search over lyrics/KJV, topic browse, tune meter filter (completed 2026-05-08)
- [x] **Phase 4: Notation** - abcjs live SVG rendering with hymnal layout, JPG fallback, mobile-responsive (completed 2026-05-08)
- [x] **Phase 4.5 (INSERTED): Psalm Detail Overhaul** - 7-tab psalm page matching psalter.cprc.co.uk; lyrics + score + audio in Overview; abcjs stanza navigation; Staff/Solfège toggle; loading skeletons on psalm and tune routes (completed 2026-05-09)
- [ ] **Phase 4.6 (INSERTED): Psalm Detail UI Polish** - UI review and fix pass on the single psalm view; address layout clutter, spacing, hierarchy, and visual polish surfaced by GSD UI review
- [ ] **Phase 4.7 (INSERTED): Psalm Listing Overhaul** - Redesign /psalms page: dense numbered-box grid, instant free-type search (number lookup + lyric/KJV text search with bold match + relevance sort + Enter to open), collapsible Advanced panel (first-line toggle, meter toggle, meter filter), remove existing filter controls
- [ ] **Phase 5: Precentor Portal** - Better Auth login, service event CRUD, psalm+tune set list builder, live service view with pre-loaded notation
- [ ] **Phase 6: Polish** - OG images, Lighthouse 90+, bundle analysis, click feedback, loading skeletons on remaining routes

## Phase Details

### Phase 1: Foundation
**Goal**: All Airtable data lives in PostgreSQL with integrity verified and tune images served from permanent R2 URLs
**Depends on**: Nothing (first phase)
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04
**Success Criteria** (what must be TRUE):
  1. All 13 Airtable tables are present in PostgreSQL with foreign-key relationships intact and row counts matching Airtable
  2. Every tune score sheet JPG is accessible via a permanent Cloudflare R2 URL (not an expiring Airtable attachment link)
  3. A spot-check of 10+ records across psalms, tunes, verses, and topics shows data fidelity against Airtable
  4. A delta migration script can be re-run immediately before launch to capture post-snapshot Airtable changes without duplicating records
**Plans**: 5 plans

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Infrastructure prerequisites: docker-compose.yml (psalter-db), .env.example, .gitignore, R2 bucket setup (human checkpoint)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Next.js 15 scaffolding: create-next-app, pinned dependencies, shadcn new-york, tw-animate-css, Drizzle client config

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Drizzle schema: all 13 tables + junction tables in src/db/schema.ts, drizzle-kit push to psalter-db [BLOCKING]

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-04-PLAN.md — Migration scripts: two-pass migrate-airtable.ts (R2 upload inline) + r2-upload.ts helper

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 01-05-PLAN.md — Verification: verify-migration.ts, run migration, spot-checks, idempotency test (human checkpoint)

### Phase 2: Public Browse
**Goal**: Any visitor can browse all 150 psalms, read metrical lyrics, explore tunes, and follow the daily reading plan — all served from statically pre-rendered pages
**Depends on**: Phase 1
**Requirements**: PSALM-01, PSALM-02, PSALM-03, PSALM-04, PSALM-05, PSALM-06, TUNE-01, PLAN-01
**Success Criteria** (what must be TRUE):
  1. User can open the psalm list, filter by book and meter, and navigate to any of the 150 psalm detail pages
  2. Each psalm detail page renders all three tabs (Overview with KJV text and Haddington intro, Study with topics and doctrines, Messianic with classification and NT references) and displays metrical lyrics
  3. Each tune detail page shows name, meter, a score image (JPG from R2), and any YouTube or audio links
  4. The 365-day reading plan page is visible and today's entry is visually highlighted without a runtime database query
  5. All public psalm and tune pages are statically pre-rendered at build time (Next.js `generateStaticParams`); no runtime DB queries for read-only browse
**Plans**: 5 plans

Plans:
**Wave 1** *(parallel — schema, components, layout, utilities)*
- [x] 02-01-PLAN.md — Schema junction relations + shadcn components (tabs/badge/select/separator/card) + vitest setup + db query helpers
- [x] 02-02-PLAN.md — Root layout with SiteHeader sticky nav + lib/daily.ts + lib/youtube.ts utilities

**Wave 2** *(parallel — depends on Wave 1)*
- [x] 02-03-PLAN.md — /psalms list (book filter) + /psalms/[id] detail with 4 tabs (Overview/Lyrics/Study/Messianic), static
- [x] 02-04-PLAN.md — /tunes list + /tunes/[id] detail (score JPG, YouTube embed, reverse psalm links), static
- [x] 02-05-PLAN.md — Homepage devotional dashboard (TodayCard + PsalmSearchWidget) + /daily 365-row plan + /daily/[day]
**UI hint**: yes

### Phase 3: Search
**Goal**: Users can find psalms and tunes by number, keyword, topic, and meter without navigating the full list
**Depends on**: Phase 2
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04
**Success Criteria** (what must be TRUE):
  1. Typing a psalm number instantly navigates to that psalm's detail page
  2. Searching a keyword returns matching psalms ranked by relevance across metrical lyrics and KJV text (PostgreSQL full-text index)
  3. Browsing the Nave's topic index shows all psalms tagged to a chosen topic
  4. The tune list can be filtered to a single meter (CM, LM, SM, etc.) and shows only matching tunes
**Plans**: 6 plans

Plans:
**Wave 0** *(blocking prerequisites)*
- [x] 03-01-PLAN.md — Topics migration fix (r.get('Topic (Psalm)')), GIN indexes, schema topicType/description, shadcn input+skeleton, test scaffolds [BLOCKING]

**Wave 1** *(parallel — depends on Wave 0)*
- [x] 03-02-PLAN.md — Query layer: src/db/queries/search.ts (FTS) + src/db/queries/explore.ts (taxonomy queries)
- [x] 03-03-PLAN.md — TuneGrid client component (meter filter + URL sync) + SiteHeader upgrade (Search/Explore nav links, usePathname)

**Wave 2** *(parallel — depends on Wave 1)*
- [x] 03-04-PLAN.md — /search dynamic page (FTS results, 3 states) + loading skeleton + globals.css [data-snippet] rule
- [x] 03-05-PLAN.md — /explore hub + /explore/topics/[slug] + /explore/naves/[slug] + /explore/messianic + /explore/authors/[author] + loading skeletons

**Wave 3** *(depends on Wave 1 + Wave 2)*
- [x] 03-06-PLAN.md — /tunes page delegation to TuneGrid + loading skeleton
**UI hint**: yes

### Phase 4: Notation
**Goal**: Tune pages display live abcjs SVG notation with verse 1 lyrics syllable-aligned under the staff; remaining verses appear as numbered stanzas; JPG fallback shown when no ABC string exists
**Depends on**: Phase 2
**Requirements**: TUNE-02, TUNE-03, TUNE-04
**Success Criteria** (what must be TRUE):
  1. Any tune that has an ABC string stored renders as a live SVG via abcjs (not a static image)
  2. Verse 1 lyrics are syllable-aligned under the notation staff using abcjs `w:` fields; remaining verses display as numbered stanzas below the SVG
  3. Tunes without an ABC string still display the R2-hosted JPG score image (no broken layout)
  4. The notation SVG reflows correctly at 375 px, 768 px, and 1200 px viewport widths (`responsive: "resize"`)
**Plans**: 4 plans

Plans:
**Wave 1** *(parallel — independent foundation work)*
- [x] 04-01-PLAN.md — Install abcjs + nlp-syllables; create src/lib/lyrics.ts (extractVerse1, syllabifyForAbc) + unit tests
- [x] 04-02-PLAN.md — scripts/seed-abc-notation.ts: seed 5 tunes (CM/LM/SM coverage) with ABC + embedded w: fields; add TUNE-02 data assertion

**Wave 2** *(depends on Wave 1)*
- [x] 04-03-PLAN.md — src/components/AbcRenderer.tsx ('use client', useRef + useEffect, abcjs.renderAbc with responsive:resize)

**Wave 3** *(depends on Wave 2)*
- [x] 04-04-PLAN.md — Wire AbcRenderer into /tunes/[id]/page.tsx (next/dynamic ssr:false + Suspense); three-way fallback; human-verify TUNE-04 at 375/768/1200px
**UI hint**: yes

### Phase 4.5 (INSERTED): Psalm Detail Overhaul
**Goal**: Restructure the psalm detail page from 4 tabs to 7 tabs matching psalter.cprc.co.uk exactly; move lyrics + score + audio into the Overview tab; add abcjs notation with stanza navigation and Staff/Solfège toggle; add loading.tsx skeletons to /psalms, /psalms/[id], /tunes, and /tunes/[id] routes
**Depends on**: Phase 4
**Requirements**: PSLT-01, PSLT-02, PSLT-03, TUNE-05, TUNE-06, TUNE-07, PERF-01
**Success Criteria** (what must be TRUE):
  1. Psalm detail has exactly 7 tabs in order: Overview | 365 Days | Study | Messianic | Parallel | Backup Tunes | Historical Tunes
  2. Below the tab strip: metrical lyrics (left column ~60% on desktop, full-width on mobile) and abcjs notation player always visible; SoundCloud embed in the desktop right column (~40%) and in the mobile Tune tab. Overview tab shows metadata only: NKJV title, category badges, author, book. Neither lyrics nor notation is inside any tab.
  3. The notation player below the tabs shows up to 4 stanzas as w: lyric lines per abcjs render; Prev/Next buttons page through stanza groups; counter shows e.g. "Stanzas 1–4 / 6"; Staff/Solfège and Show notation/Lyrics only toggles present above the score
  4. Toggling to Solfège shows the R2 solfège JPG (solfegeJpgUrl) in place of the abcjs SVG; toggling back shows the SVG
  5. Navigating to /psalms, /psalms/[id], /tunes, /tunes/[id] shows a skeleton placeholder instantly before data loads (loading.tsx files present and rendering)
**Plans**: 4 plans

Plans:
**Wave 1**
- [x] 04.5-01-PLAN.md — Extend fetchPsalmDetail query (dailyEntry + primaryTune + backup/historical tunes); add PsalmDetailSkeleton component; add loading.tsx on /psalms, /psalms/[id], /tunes, /tunes/[id]

**Wave 2** *(depends on Wave 1)*
- [x] 04.5-02-PLAN.md — Rewrite PsalmTabs.tsx to implement all 7 tabs with correct data from extended query

**Wave 3** *(depends on Wave 2)*
- [x] 04.5-03-PLAN.md — Create PsalmNotationPlayer.tsx: stanza navigation, abcjs rendering per stanza, fallback to solfège JPG when no ABC

**Wave 4** *(depends on Wave 3)*
- [x] 04.5-04-PLAN.md — Add Staff/Solfège toggle to PsalmNotationPlayer; human-verify all 7 tabs + notation + toggle on mobile
**UI hint**: yes

### Phase 4.6 (INSERTED): Psalm Detail UI Polish
**Goal**: The single psalm view is clean, readable, and visually coherent — layout clutter removed, spacing and hierarchy fixed, mobile and desktop both polished
**Depends on**: Phase 4.5
**Requirements**: UI-01 (psalm detail layout), UI-02 (score area presentation), UI-03 (mobile readability)
**Success Criteria** (what must be TRUE):
  1. GSD UI review of /psalms/[id] passes all 6 pillars (or all findings addressed)
  2. Score controls (Staff/Solfège/Show notation/Lyrics only) are visually grouped and clearly separated from lyrics content
  3. The page has no obvious clutter, overcrowded sections, or broken spacing at 375px, 768px, and 1280px
  4. Typography hierarchy is clear: psalm title > section labels > body text
**Plans**: 3 plans

Plans:
**Wave 1**
- [ ] 04.6-01-PLAN.md — Layout restructure (notation first, tabs below), remove static stanzas, stanza number fix, space-y-6 standardisation

**Wave 2** *(parallel — both depend on Wave 1)*
- [ ] 04.6-02-PLAN.md — A−/A+ font size toggle in notation player, AbcRenderer error boundary, psalm detail error.tsx
- [ ] 04.6-03-PLAN.md — shadcn Sheet install, SiteHeader hamburger menu (mobile), sticky bottom tab bar, Study tab link colors, Playwright UAT
**UI hint**: yes

### Phase 4.7 (INSERTED): Psalm Listing Overhaul
**Goal**: The /psalms listing page is fast to scan and navigate — a dense grid of numbered boxes lets users spot any psalm instantly; real-time search across numbers, lyrics, and KJV text narrows results with bold inline matches; an Advanced panel exposes display options and meter filtering without cluttering the default view
**Depends on**: Phase 4.6
**Requirements**: PLR-01, PLR-02, PLR-03
**Success Criteria** (what must be TRUE):
  1. The default /psalms page shows all 150 psalms as a dense grid of numbered boxes (large psalm numbers, many visible at once) with no filters applied on load and existing filter controls removed
  2. The search bar filters on every keystroke: number input sorts by numeric proximity; text input queries lyrics + KJV, injects the best matching line (search term bold) into each matching box, sorted by relevance; the top result box is visually highlighted; pressing Enter navigates to the top result
  3. An "Advanced" collapsible (collapsed by default) sits between the search bar and the grid; it exposes: "Show first line" checkbox (dynamically resizes boxes), "Show meter" checkbox (shows CM/LM/SM etc. in box), and a meter filter dropdown (hides non-matching psalms)
  4. GSD UI review of /psalms passes all 6 pillars (or all findings addressed)
**Plans**: 3 plans

Plans:
**Wave 0**
- [ ] 04.7-01-PLAN.md — Playwright test stubs (PLR-01/02/03), shadcn Checkbox install, globals.css [data-snippet] b → font-weight: 700

**Wave 1** *(depends on Wave 0)*
- [ ] 04.7-02-PLAN.md — PsalmNumberBox + PsalmListingGrid components + page.tsx wiring (query + kjvExcerpt + component swap)

**Wave 2** *(depends on Wave 1)*
- [ ] 04.7-03-PLAN.md — loading.tsx dense skeleton update + delete PsalmGrid/PsalmCard + Playwright UAT (human checkpoint)
**UI hint**: yes

### Phase 5: Precentor Portal
**Goal**: A logged-in precentor can create service events, build an ordered set list of psalm+tune pairs, and run a live service view that pre-loads all notation
**Depends on**: Phase 4.5
**Requirements**: AUTH-01, AUTH-02, PREC-01, PREC-02, PREC-03, PREC-04, PREC-05, PREC-06
**Success Criteria** (what must be TRUE):
  1. A precentor can log in with email and password; accounts are created by an admin only (no public self-registration)
  2. A logged-in precentor can create a service event (date + AM/PM), assign ordered psalm+tune pairs specifying verses/stanzas, and edit or reorder those pairs before the service
  3. The service set list overview page shows all assigned psalms in sequence before the service begins
  4. Opening the live service view pre-loads notation for all assigned tunes on page entry — no per-psalm loading delay mid-service
  5. The precentor can trigger melody audio playback for any tune in the portal via the abcjs Web Audio API (requires a user gesture)
**Plans**: TBD (5-6 plans)
**UI hint**: yes

### Phase 6: Polish
**Goal**: OG images in place for social sharing; Lighthouse 90+ on key pages; bundle clean; every remaining route transition shows a skeleton; all clickable elements give immediate visual feedback
**Depends on**: Phase 5
**Requirements**: PERF-02, OG images (next/og), Lighthouse 90+
**Success Criteria** (what must be TRUE):
  1. Each psalm and tune page generates a dynamic OG image (next/og) visible when the URL is shared on social platforms
  2. A bundle analysis confirms no unintended large dependencies; Lighthouse performance score is 90+ on the psalm list and psalm detail pages
  3. Navigating to any route not covered by Phase 4.5 skeletons (search, explore, daily, homepage) never shows a blank screen — a skeleton appears within one frame
  4. Every button, link, and card shows a CSS `:active` state change and a `useTransition` pending indicator when clicked
**Plans**: TBD (3-4 plans)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 4.5 → 4.6 → 4.7 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete | 2026-05-07 |
| 2. Public Browse | 5/5 | Complete | 2026-05-08 |
| 3. Search | 6/6 | Complete | 2026-05-08 |
| 4. Notation | 4/4 | Complete | 2026-05-08 |
| 4.5. Psalm Detail Overhaul | 4/4 | Complete | 2026-05-09 |
| 4.6. Psalm Detail UI Polish | 0/3 | Not started | - |
| 4.7. Psalm Listing Overhaul | 0/3 | Not started | - |
| 5. Precentor Portal | 0/TBD | Not started | - |
| 6. Polish | 0/TBD | Not started | - |
