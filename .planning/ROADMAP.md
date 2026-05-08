# Roadmap: CPRC Psalter

## Overview

Rebuild of psalter.cprc.co.uk from Airtable + Softr to a self-hosted Next.js 15 application. Six phases move from data migration through public browsing, search, live notation rendering, and precentor portal — culminating in a performance pass that satisfies the perceived-performance mandate. Every phase delivers a coherent, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Drizzle schema, Airtable→PostgreSQL migration, R2 JPG storage
- [x] **Phase 2: Public Browse** - Psalm list/detail (3 tabs), tune pages, daily reading plan, static rendering
- [ ] **Phase 3: Search** - Full-text search over lyrics/KJV, topic browse, tune meter filter
- [ ] **Phase 4: Notation** - abcjs live SVG rendering with hymnal layout, JPG fallback, mobile-responsive
- [ ] **Phase 5: Precentor Portal** - Better Auth login, service event CRUD, set list builder, live service view
- [ ] **Phase 6: Polish** - Loading skeletons on every route, click feedback, OG images, bundle review

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
- [ ] 03-06-PLAN.md — /tunes page delegation to TuneGrid + loading skeleton
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
**Plans**: TBD
**UI hint**: yes

### Phase 5: Precentor Portal
**Goal**: A logged-in precentor can create service events, assign psalm + tune pairs, and view a live service set list with all notation pre-loaded
**Depends on**: Phase 4
**Requirements**: AUTH-01, AUTH-02, PREC-01, PREC-02, PREC-03, PREC-04, PREC-05, PREC-06
**Success Criteria** (what must be TRUE):
  1. A precentor can log in with email and password; accounts can only be created by an admin (no public self-registration)
  2. A logged-in precentor can create a service event (date + AM/PM), assign ordered psalm + tune pairs specifying verses/stanzas, and edit or reorder those pairs before the service
  3. The service set list overview page shows all assigned psalms in sequence before the service begins
  4. Opening the live service view pre-loads notation for all assigned tunes on page entry — no per-psalm loading delay mid-service
  5. The precentor can trigger melody audio playback for any tune in the portal via the abcjs Web Audio API (requires a user gesture)
**Plans**: TBD
**UI hint**: yes

### Phase 6: Polish
**Goal**: Every route transition shows a skeleton placeholder, every clickable element gives immediate visual feedback, and OG images are in place for social sharing
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02
**Success Criteria** (what must be TRUE):
  1. Navigating to any route in the app never shows a blank or frozen screen — a skeleton/shimmer matching the page shape appears within one frame
  2. Every button, link, and card shows a CSS `:active` state change and a `useTransition` pending indicator when clicked
  3. Each psalm and tune page generates a dynamic OG image (next/og) visible when the URL is shared on social platforms
  4. A bundle analysis confirms no unintended large dependencies; Lighthouse performance score is 90+ on the psalm list and psalm detail pages
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete | 2026-05-07 |
| 2. Public Browse | 5/5 | Complete | 2026-05-08 |
| 3. Search | 5/6 | In Progress|  |
| 4. Notation | 0/TBD | Not started | - |
| 5. Precentor Portal | 0/TBD | Not started | - |
| 6. Polish | 0/TBD | Not started | - |
