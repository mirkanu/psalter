# CPRC Psalter — v1 Requirements

Generated: 2026-05-07
Updated: 2026-05-09 (added PSLT-01–03, TUNE-05–07, PERF-01–02 revisions for Phase 4.5; added PLR-01–03 for Phase 4.7 Psalm Listing Overhaul)

## v1 Requirements

### Data Migration

- [x] **MIGR-01**: All Airtable tables migrated to PostgreSQL with foreign-key relationships intact
- [x] **MIGR-02**: Tune score sheet JPGs downloaded from Airtable and re-hosted on Cloudflare R2 (permanent URLs)
- [ ] **MIGR-03**: Row counts and spot-check records verified against Airtable before cutover
- [x] **MIGR-04**: Delta migration run immediately before launch to capture any post-snapshot Airtable changes

### Psalm Browsing

- [ ] **PSALM-01**: User can browse all 150 psalms (list view, filterable by book and meter)
- [ ] **PSALM-02**: User can view psalm detail — Overview tab (title, book, Haddington introduction, KJV text)
- [ ] **PSALM-03**: User can view psalm detail — Study tab (section headings, Nave's topics, doctrinal cross-references)
- [ ] **PSALM-04**: User can view psalm detail — Messianic tab (messianic classification, NT verification, messianic verses)
- [ ] **PSALM-05**: User can read metrical lyrics (Scottish Psalter versification) for each psalm
- [ ] **PSALM-06**: Psalm pages are statically pre-rendered at build time (no runtime DB queries for public browse)

### Psalm Detail

- [ ] **PSLT-01**: Psalm detail page uses a responsive layout. Tab strip (7 tabs desktop / 8 tabs mobile) renders first. BELOW the tabs: lyrics + notation player always visible on both viewports (left column ~60% on desktop, full-width on mobile); SoundCloud embed in the right column (~40%) on desktop only. On mobile (<768px): a "Tune" tab is prepended as the FIRST tab (containing SoundCloud + tune metadata); the other 7 tabs follow. Neither lyrics nor notation is inside any tab.
- [ ] **PSLT-02**: Below-tabs section shows: metrical lyrics (left column / full-width on mobile) and abcjs notation player with stanza group navigation (groups of up to 4 stanzas, counter "Stanzas 1–4 / 6"), Staff/Solfège toggle, and Show notation/Lyrics only toggle. SoundCloud embed appears in the desktop right column and in the mobile Tune tab. Overview tab shows metadata only: NKJV title, category badges, author, book, meter, precenting comment.
- [ ] **PSLT-03**: 365 Days tab shows the daily reading plan entry for this psalm: day number, calendar date (readingDate), and notes (which holds verse range information from Airtable)

### Tunes

- [ ] **TUNE-01**: User can view tune detail (name, meter, score display, YouTube and audio links)
- [ ] **TUNE-02**: Tune score displays as live abcjs SVG notation when ABC string is available; JPG fallback when not
- [ ] **TUNE-03**: Hymnal-style notation layout: verse 1 lyrics syllable-aligned under staff (abcjs `w:` fields); remaining verses displayed as numbered stanzas below the SVG
- [ ] **TUNE-04**: Notation layout is mobile-responsive (abcjs `responsive: "resize"`, tested at 375px / 768px / 1200px)
- [ ] **TUNE-05**: abcjs notation with inline lyrics appears in the below-tabs section of the psalm detail page (not inside any tab), not only on dedicated tune pages
- [ ] **TUNE-06**: The below-tabs notation player renders up to 4 stanzas as w: lyric lines per abcjs render; Prev/Next buttons page through stanza groups; a counter shows the current group range (e.g. "Stanzas 1–4 / 6")
- [ ] **TUNE-07**: Staff/Solfège toggle in the below-tabs notation player — Staff mode renders the live abcjs SVG; Solfège mode shows the R2 solfège JPG (solfegeJpgUrl from the tunes table); a second toggle (Show notation/Lyrics only) hides the score and shows all stanzas as plain scrollable text

### Psalm Listing

- [ ] **PLR-01**: The psalm list page shows all 150 psalms by default as a dense grid of numbered boxes (large, prominent psalm number); no filters are applied at load; enough psalms are visible on screen at once that a user can scan and select without scrolling
- [ ] **PLR-02**: A free-type search bar above the list instantly filters on every keystroke: typing a number highlights/sorts psalm matches by number proximity (psalm 2 appears first when typing "2"); typing non-numeric text searches metrical lyrics and KJV text, inserts the full matching line (with the search term in bold) into each matching psalm box, and sorts results by relevance; the top result receives a distinct highlight; pressing Enter immediately navigates to the top result's psalm detail page
- [ ] **PLR-03**: An "Advanced" toggle/collapsible sits between the search bar and the psalm grid (collapsed by default); expanding it reveals: (1) checkbox "Show first line" — instantly resizes all boxes to include the psalm's first metrical line; (2) checkbox "Show meter" — shows the meter label (CM, LM, SM, etc.) in the top-right of each box or to the right of the psalm number when first line is hidden; (3) a meter filter dropdown — hides all psalms whose tunes do not match the selected meter; existing static filter controls are removed

### Search

- [x] **SRCH-01**: User can find a psalm by number (instant lookup)
- [x] **SRCH-02**: User can search psalms by keyword across metrical lyrics and KJV text (PostgreSQL full-text)
- [x] **SRCH-03**: User can browse psalms by Nave's topic / thematic tag
- [x] **SRCH-04**: User can filter tunes by meter (CM, LM, SM, etc.)
- [ ] **SRCH-05**: The /search route is removed from the site; any nav links pointing to /search are updated or removed; a 301 redirect from /search → /psalms is added; the inline search on /psalms covers the use case

### Explore

- [ ] **EXP-01**: Playwright crawl of psalter.cprc.co.uk/explore and /tunes documents all sections, links, data, and layout; a written audit report is produced before any code changes (fulfilled by Phase 4.8 UI-SPEC reference site audit)
- [ ] **EXP-02**: /explore page replicates the reference site structure: "When you..." section (topics where topicType='When you...'), Topics, Nave's Topics, Messianic Psalms, Authors — with Separator dividers between each section
- [ ] **TUNE-08**: /tunes page expands tune cards with mood tags and recommended psalm numbers; adds a Mood filter (Select, URL param) alongside the existing Meter filter; expanded TuneGrid reads moods from tuneMoods join and psalm IDs from psalmVersionTunes join

### Daily Reading Plan

- [ ] **PLAN-01**: User can view the 365-day daily reading plan; today's entry is prominently highlighted

### Authentication

- [ ] **AUTH-01**: Precentor can log in with email and password
- [ ] **AUTH-02**: Precentor accounts are admin-created only (no public self-registration)

### Precentor Portal

- [ ] **PREC-01**: Precentor can create a service event (date + AM/PM)
- [ ] **PREC-02**: Precentor can assign psalm + tune pairs to a service event, specifying verses/stanzas per slot
- [ ] **PREC-03**: Precentor can edit and reorder psalm slots within a service event
- [ ] **PREC-04**: Precentor can view a service set list overview before the service
- [ ] **PREC-05**: Precentor service view shows all assigned psalms in sequence with notation pre-loaded on page entry (no per-psalm loading delay)
- [ ] **PREC-06**: Precentor can preview a tune's melody via abcjs Web Audio API (requires user gesture)

### Performance

- [ ] **PERF-01**: Every Next.js route that fetches data has a `loading.tsx` file rendering a skeleton matching the page shape — no blank or white screen on navigation. Phase 4.5 covers /psalms, /psalms/[id], /tunes, /tunes/[id]. Phase 6 covers remaining routes (search, explore, daily, homepage).
- [ ] **PERF-02**: All clickable elements (buttons, links, cards) show immediate visual feedback: CSS `:active` state and `useTransition` pending indicator for navigation actions

---

## v2 Requirements (Deferred)

- User accounts for congregation members (favourites, reading plan tracking) — adds GDPR surface area
- Admin UI (Directus/NocoDB) to replace Airtable editorial interface — post-launch low priority
- abcjs audio playback on public tune pages (v1 scopes audio to precentor portal only)
- Dark mode

---

## Out of Scope

- Four-part SATB harmonisation rendering — copyright legal check required before encoding
- In-app ABC notation editor — admin concern, not user concern
- Mobile app / PWA offline mode
- Social features (sharing, comments)
- Multi-tenancy (other congregations) — out of scope unless explicitly decided otherwise

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| MIGR-01 | Phase 1: Foundation | Complete |
| MIGR-02 | Phase 1: Foundation | Complete |
| MIGR-03 | Phase 1: Foundation | Pending |
| MIGR-04 | Phase 1: Foundation | Complete |
| PSALM-01 | Phase 2: Public Browse | Pending |
| PSALM-02 | Phase 2: Public Browse | Pending |
| PSALM-03 | Phase 2: Public Browse | Pending |
| PSALM-04 | Phase 2: Public Browse | Pending |
| PSALM-05 | Phase 2: Public Browse | Pending |
| PSALM-06 | Phase 2: Public Browse | Pending |
| TUNE-01 | Phase 2: Public Browse | Pending |
| PLAN-01 | Phase 2: Public Browse | Pending |
| SRCH-01 | Phase 3: Search | Complete |
| SRCH-02 | Phase 3: Search | Complete |
| SRCH-03 | Phase 3: Search | Complete |
| SRCH-04 | Phase 3: Search | Complete |
| TUNE-02 | Phase 4: Notation | Pending |
| TUNE-03 | Phase 4: Notation | Pending |
| TUNE-04 | Phase 4: Notation | Pending |
| PLR-01 | Phase 4.7: Psalm Listing Overhaul | Pending |
| PLR-02 | Phase 4.7: Psalm Listing Overhaul | Pending |
| PLR-03 | Phase 4.7: Psalm Listing Overhaul | Pending |
| PSLT-01 | Phase 4.5: Psalm Detail Overhaul | Pending |
| PSLT-02 | Phase 4.5: Psalm Detail Overhaul | Pending |
| PSLT-03 | Phase 4.5: Psalm Detail Overhaul | Pending |
| TUNE-05 | Phase 4.5: Psalm Detail Overhaul | Pending |
| TUNE-06 | Phase 4.5: Psalm Detail Overhaul | Pending |
| TUNE-07 | Phase 4.5: Psalm Detail Overhaul | Pending |
| PERF-01 | Phase 4.5 (partial) + Phase 6 | Pending |
| AUTH-01 | Phase 5: Precentor Portal | Pending |
| AUTH-02 | Phase 5: Precentor Portal | Pending |
| PREC-01 | Phase 5: Precentor Portal | Pending |
| PREC-02 | Phase 5: Precentor Portal | Pending |
| PREC-03 | Phase 5: Precentor Portal | Pending |
| PREC-04 | Phase 5: Precentor Portal | Pending |
| PREC-05 | Phase 5: Precentor Portal | Pending |
| PREC-06 | Phase 5: Precentor Portal | Pending |
| PERF-02 | Phase 6: Polish | Pending |
