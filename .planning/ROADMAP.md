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
- [x] **Phase 4.7 (INSERTED): Psalm Listing Overhaul** - Redesign /psalms page: dense numbered-box grid, instant free-type search (number lookup + lyric/KJV text search with bold match + relevance sort + Enter to open), collapsible Advanced panel (first-line toggle, meter toggle, meter filter), remove existing filter controls
- [ ] **Phase 4.8 (INSERTED): Explore & Tunes Overhaul** - Playwright audit of psalter.cprc.co.uk/explore and /tunes; replicate both pages at psalter.gsdlabs.dev/explore and /tunes to match the reference site; remove /search route (superseded by inline search on /psalms)
- [ ] **Phase 4.9 (INSERTED): Tune Notation Conversion** - OCR all solfège JPEGs via vision LLM, parse tonic sol-fa → ABC, store ABC strings in DB; all tunes render live in abcjs
- [ ] **Phase 4.9.1 (INSERTED): Interactive abcjs Player** - Replace static AbcRenderer with interactive player: play/pause + note highlighting, transpose dropdown, BPM controls, show-original JPEG toggle; applied to /tunes/[id] and /psalms/[id]
- [x] **Phase 4.9.6 (INSERTED): Psalter Alignment Implementation** - Redesign lyrics data model (Stanza→Line→Syllable + bibleVerseRef); parse current Airtable lyric blobs into the new structured form; implement the alignment + line-break algorithm so DCM tunes render against two CM stanzas correctly, alternate meters align, and amen endings don't consume lyric syllables. Promotes seeds/psalter-alignment-implementation.md; consumes the canonical doc from Phase 4.9.5
- [x] **Phase 4.9.7 (INSERTED): Staff-View Metrical-Line Hotfix** - Fix the regression introduced by Phase 4.9.6 where `mapCycleToPhraseSyllableLines` drops half (or more) of each stanza's metrical lines in the staff view. CM/LM/SM stanzas render only lines 0-1 (out of 4); DCM stanzas only render lines 0-3 (out of 8). Lyrics-only view is unaffected. Mechanical fix: group N=stanzaLines/phrasesPerCycle lines into each phrase slot. Strengthen the regression test that missed it. (completed 2026-05-25)
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
- [x] 04.6-01-PLAN.md — Layout restructure (notation first, tabs below), remove static stanzas, stanza number fix, space-y-6 standardisation

**Wave 2** *(parallel — both depend on Wave 1)*
- [x] 04.6-02-PLAN.md — A−/A+ font size toggle in notation player, AbcRenderer error boundary, psalm detail error.tsx
- [x] 04.6-03-PLAN.md — shadcn Sheet install, SiteHeader hamburger menu (mobile), sticky bottom tab bar, Study tab link colors, Playwright UAT
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
- [x] 04.7-01-PLAN.md — Playwright test stubs (PLR-01/02/03), shadcn Checkbox install, globals.css [data-snippet] b → font-weight: 700

**Wave 1** *(depends on Wave 0)*
- [x] 04.7-02-PLAN.md — PsalmNumberBox + PsalmListingGrid components + page.tsx wiring (query + kjvExcerpt + component swap)

**Wave 2** *(depends on Wave 1)*
- [x] 04.7-03-PLAN.md — loading.tsx dense skeleton update + delete PsalmGrid/PsalmCard + Playwright UAT (human checkpoint)
**UI hint**: yes

### Phase 4.8 (INSERTED): Explore & Tunes Overhaul
**Goal**: The /explore and /tunes pages match the reference site (psalter.cprc.co.uk) in structure and content; the redundant /search route is removed
**Depends on**: Phase 4.7
**Requirements**: EXP-01, EXP-02, TUNE-08, SRCH-05
**Success Criteria** (what must be TRUE):
  1. Playwright crawl of psalter.cprc.co.uk/explore and /tunes documents all sections, links, data, and layout; a written audit report is produced before any code changes
  2. psalter.gsdlabs.dev/explore replicates the reference /explore page: same taxonomy sections (topics, doctrines, messianic, authors, etc.), same navigation structure, content matches the live database
  3. psalter.gsdlabs.dev/tunes replicates the reference /tunes page: same filtering, display, and tune card structure as the reference site
  4. The /search route is removed from psalter.gsdlabs.dev; any nav links pointing to /search are updated or removed; the /psalms page inline search covers the use case
  5. Playwright UAT confirms all four success criteria against the live gsdlabs.dev deployment
**Plans**: 3 plans

Plans:
**Wave 1** *(parallel)*
- [x] 04.8-01-PLAN.md — /explore: add "When you..." section (topicType='When you...'), exclude from Topics, fix h1 font-semibold
- [x] 04.8-02-PLAN.md — /tunes: mood filter (URL param), expanded tune cards (mood tags + recommended psalms), updated fetchAllTunes query

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 04.8-03-PLAN.md — Remove /search route, update SiteHeader nav, add /search→/psalms redirect, full Playwright UAT

Cross-cutting constraints:
- All h1 headings must use font-semibold (not font-bold) — UI-SPEC typography rule
- All new DB queries use Drizzle relational API (with:) not raw SQL — existing pattern
- topicType='When you...' is the exact DB string (confirmed in DB)

### Phase 4.9 (INSERTED): Tune Notation Conversion
**Goal**: All tunes have an ABC string in the database so every tune page renders live abcjs notation; Staff/Solfège toggle works for all tunes without fallback to JPG-only
**Depends on**: Phase 4.8
**Requirements**: TUNE-09
**Success Criteria** (what must be TRUE):
  1. A migration script OCRs every solfège JPEG using a vision LLM and extracts the tonic sol-fa text
  2. A parser converts tonic sol-fa (with DOH/LAH key header, `:` beat divisions, `|` barlines) to valid ABC notation strings
  3. All ABC strings are stored in the `tunes.abc_notation` column in the DB
  4. Spot-check of 10+ tunes confirms correct note sequences and key signatures in the abcjs SVG render
  5. The migration script is retained in `scripts/` (not deleted) for future re-use
**Plans**: 3 plans

Plans:
**Wave 1** *(parallel)*
- [ ] 04.9-01-PLAN.md — ocr-solfege.ts: iterate all DB tunes, find solfège JPEGs by slug, call Claude haiku vision (escalate to sonnet on parseOnly fail), write solfege-ocr.json per-tune
- [ ] 04.9-02-PLAN.md — apply-abc-notation.ts: read solfege-ocr.json, re-validate with parseOnly(), bulk-update tunes.abc_notation; --dry-run and --overwrite flags

**Wave 2** *(depends on Wave 1)*
- [ ] 04.9-03-PLAN.md — Playwright UAT: spot-check 10+ tunes at /tunes/[id]; confirm abcjs renders correctly; update progress table

### Phase 4.9.1 (INSERTED): Interactive abcjs Player
**Goal**: Replace the static AbcRenderer with a fully interactive music player that displays the soprano melody, supports playback with current-note highlighting (abcjs WebAudio synth), key transposition (±6 semitones), tempo (BPM) controls, and a "show original score" toggle that swaps the live SVG for the JPEG scan
**Depends on**: Phase 4.9
**Requirements**: PLAYER-01, PLAYER-02, PLAYER-03, PLAYER-04, PLAYER-05
**Success Criteria** (what must be TRUE):
  1. On /tunes/[id] for a tune with ABC, pressing Play produces audible sound and the note being played is visually highlighted in the SVG
  2. Changing the Transpose dropdown re-renders the SVG with a new key signature (visualTranspose option)
  3. BPM +/- buttons change the displayed BPM and the audible playback rate
  4. "Show original score" toggle swaps the abcjs SVG for the original JPEG (staff or solfège, whichever is the active scan); toggle again to swap back
  5. The same interactive player appears on /psalms/[id] (replacing AbcRenderer inside PsalmNotationPlayer's staff view) without breaking stanza Prev/Next or the existing Staff/Solfège/Lyrics view toggle
  6. All controls remain reachable and tappable at 375 px viewport width with no horizontal overflow
**Plans**: 1 plan

Plans:
**Wave 1**
- [x] 04.9.1-01-PLAN.md — Build AbcPlayer + AbcPlayerSection components; wire into /tunes/[id] and PsalmNotationPlayer; Playwright UAT (5 tests) + human visual verify checkpoint
**UI hint**: yes

### Phase 4.9.2 (INSERTED): Dynamic ABC Polish — COMPLETE (2026-05-14)
**Goal**: Live ABC notation is fully functional and visually polished — lyrics split by syllables and rendered inline with staff, all renders fit dynamically to screen, full-screen mode available for both staff and solfège with verse navigation, score button layout is consistent and intentional
**Depends on**: Phase 4.9.1
**Requirements**: NOTATION-01, NOTATION-02, NOTATION-03, NOTATION-04, NOTATION-05, NOTATION-06
**Success Criteria** (what must be TRUE):
  1. Lyrics are split by syllables and aligned to notes via the ABC `w:` field; unsplit lyrics remain available as reference and for lyrics-only display
  2. Solfège rendering is dynamically generated from ABC (not a static JPEG); a "Show Original" toggle displays the original JPEG alongside generated solfège
  3. ABC score + inline lyrics fit dynamically to viewport width; default is 2 lines of staff (4 for double-length tunes); A+/A- buttons adjust base size, auto-fit scales proportionally
  4. A+/A- font size buttons are always visible (not hidden in lyrics-only mode) and control both the score rendering size and the inline verse text display
  5. Full-screen mode available for both staff and solfège; retains Prev/Next verse buttons for navigation on mobile (landscape preferred)
  6. Score controls (Staff/Solfège/Lyrics Only) and media buttons (Play YouTube/SC) are visually grouped, clearly labeled, and use distinct icons to prevent confusion
**Plans**: 5 plans
**UI hint**: yes
**Design dependency**: Hymnal layout mockup needed before implementation (see `/gsd-sketch`)

Plans:
**Wave 1**
- [x] 04.9.2-01-PLAN.md — Pure-function foundation: lib/abc-phrases, lib/abc-phrase-meter-map, lib/lyrics.buildAbcWithSyllables + unit tests

**Wave 2** *(parallel — both depend on Wave 1)*
- [x] 04.9.2-02-PLAN.md — Annotation script: backfill % PHRASE_BREAK markers into 75 existing tunes.abc_notation rows (human checkpoint)
- [x] 04.9.2-03-PLAN.md — Primitives: AbcPlayer scale prop, --staff-base-size CSS, FullscreenOverlay component

**Wave 3** *(depends on Wave 1 + Wave 2)*
- [x] 04.9.2-04-PLAN.md — NotationRenderer + NotationRendererClient (dynamic ssr:false wrapper)

**Wave 4** *(depends on Wave 2 + Wave 3)*
- [x] 04.9.2-05-PLAN.md — Wire into /psalms/[id] + /tunes/[id], delete legacy components, Playwright UAT, human visual verify (human checkpoint)

### Phase 4.9.3 (INSERTED): Mobile-first Psalm Display
**Goal**: Rethink the single psalm page as a singing instrument — notation + integrated lyrics fill the entire viewport immediately on open; all secondary UI hidden behind a minimal chrome; abc overflow permanently fixed
**Depends on**: Phase 4.9.2
**Requirements**: MOBILE-01, MOBILE-02, MOBILE-03
**Success Criteria** (what must be TRUE):
  1. Opening any psalm page on a 375px mobile viewport shows the abcjs notation + lyrics immediately with no tabs, metadata blocks, or controls visible — just a slim psalm/tune header and a FAB
  2. The top bar shows `← Psalm N →` (prev/next navigation) with the psalm label tapping to the psalm selector; below it shows `Tune (M): TuneName [Edit]` for inline tune switching
  3. The FAB expands to reveal: view switcher (Staff / Lyrics-only / Solfège), audio player, and metadata/topics panel
  4. abc notation never overflows the right edge of the viewport at any zoom level — staffwidth is derived from container offsetWidth at render time and the container is hard-clamped with overflow-x: hidden
  5. On orientation change and resize, notation re-renders at the correct width
**Plans**: 6 plans

Plans:
**Wave 1**
- [x] 04.9.3-01-PLAN.md — AbcPlayer overflow clamp + orientation/visualViewport listeners; create /psalms/[id]/study legacy route shell; create 4 Playwright UAT script stubs (RED)

**Wave 2** *(depends on Wave 1)*
- [x] 04.9.3-02-PLAN.md — NotationRenderer refactor: optional controlled viewMode + baseSize props; chromeless mode; mobile default 13px

**Wave 3** *(parallel — both depend on Wave 2)*
- [x] 04.9.3-03-PLAN.md — singing/types.ts + PsalmTopBar + TuneSubBar + PsalmSelectorSheet + TuneSwitcherSheet (4 chrome components + shared types)
- [x] 04.9.3-04-PLAN.md — AbcAudioControls (extracted) + MetadataPanel + PsalmActionsFAB (FAB + bottom Sheet with View/Audio/About sections)

**Wave 4** *(depends on Wave 3)*
- [x] 04.9.3-05-PLAN.md — SingingView client root + wire /psalms/[id]/page.tsx + loading.tsx skeleton + extend psalms.ts queries

**Wave 5** *(depends on Wave 4)*
- [x] 04.9.3-06-PLAN.md — Run Playwright UAT scripts to GREEN + /study regression check + human visual verify (checkpoint)
**UI hint**: yes — run /gsd-ui-phase before planning to produce UI-SPEC.md layout contracts

### Phase 4.9.4 (INSERTED): Staff View Refinements & Onboarding
**Goal**: The Staff psalm view is polished into a singing-ready instrument — compact header with the tune name promoted alongside the psalm number, a glass-style bottom bar that reorganises font controls / play / settings, dynamic zoom that survives viewport changes, and a first-run mini tour that teaches the three core interactions
**Depends on**: Phase 4.9.3
**Requirements**: TBD (to be derived during /gsd-discuss-phase)
**Success Criteria** (what must be TRUE):
  1. The Staff view header shows `Psalm N` and the tune name on a single row (tune name in smaller font, preceded by a music icon); no pencil icon, no `Tune ([meter])` label
  2. On first visit to the Staff view a lightweight in-app product tour highlights (i) the top prev/next arrows, (ii) tapping `Psalm N` to open the psalm selector, (iii) tapping the tune name to change tune; the tour persists a "seen" flag and does not re-trigger on subsequent visits
  3. When the viewport changes (window resize on desktop, orientation change on mobile) the zoom level is recomputed dynamically so screen fill/density approximates the user's previous setting while continuing to respect the no-horizontal-overflow rule from Phase 4.9.3
  4. The bottom bar has a glass appearance — translucent background with backdrop blur — and contains the A+/A- font-size controls anchored left and the stanzas indicator centred
  5. The bottom-right control set is split into two icons: a Play icon that toggles a secondary glass mini-bar (sliding up out of it) containing the existing media playback controls, and a Gear icon at the very bottom-right corner that opens the existing drawer minus the moved player controls
  6. All controls remain reachable and tappable at 375 px viewport width with no horizontal overflow; the original FAB/burger drawer behaviour is fully replaced
**Plans**: 5 plans
- [x] 04.9.4-01-header-restructure-PLAN.md — PsalmTopBar two-slot centre group (tune promoted, pencil/Tune-label removed)
- [x] 04.9.4-02-bottom-chrome-restructure-PLAN.md — GlassBottomBar + PlayMiniBar + GearDrawer; lift AbcAudioControls isPlaying; delete TuneSubBar/PsalmActionsFAB; update loading.tsx
- [x] 04.9.4-03-dynamic-zoom-PLAN.md — referenceWidthRef + debounced resize/orientationchange proportional zoom heuristic
- [x] 04.9.4-04-onboarding-tour-PLAN.md — OnboardingTour custom React portal (4 steps, localStorage psalter_tour_v1)
- [x] 04.9.4-05-playwright-uat-PLAN.md — Quick + Full UAT scripts at 375/768/1024; study regression; human visual sign-off
**UI hint**: yes — run /gsd-ui-phase before planning to produce UI-SPEC.md layout contracts

### Phase 4.9.5 (INSERTED): Scottish Psalter Metrical Knowledge
**Goal**: Co-author a canonical reference document — `.planning/research/scottish-psalter-structure.md` — that captures the metrical structure of the Scottish Psalter (CM, DCM, LM, SM, alternate meters), tune anatomy (anacrusis, amen endings, repeats, DCM-to-two-CM-stanzas mapping), the formal stanza-vs-Bible-verse model, syllabification principles, and staff line-break principles, so subsequent phases can implement correct inline lyric ↔ note alignment and visual line breaks
**Depends on**: Phase 4.9.4
**Requirements**: TBD (to be derived during /gsd-discuss-phase — likely a single "DOC" requirement)
**Success Criteria** (what must be TRUE):
  1. `.planning/research/scottish-psalter-structure.md` exists as a sibling reference to `tonic-solfa-notation.md` and is the single source of truth for the metrical/structural questions enumerated in the goal
  2. The doc enumerates every meter family actually present in this psalter's data (Airtable-validated), with syllable counts per line and rhyme pattern for each
  3. The doc explains tune anatomy concretely: anacrusis, amen endings (and why we skip them when aligning), repeats, and how a Double-Meter tune is sung against two single-meter stanzas
  4. The doc formally defines "stanza" vs "Bible verse" and documents the cases where they diverge (verse spanning multiple stanzas, stanza containing multiple verses, verse split across lines)
  5. The doc states the syllabification principles and staff line-break principles needed for the follow-up implementation phase to design an alignment algorithm and data model — without itself specifying either the algorithm or the data model
  6. The process explicitly mirrors `tonic-solfa-notation.md`: user briefing → agreed research questions → research pass → convergence; no code changes ship in this phase
**Plans**: 2 plans
Plans:
- [x] 04.9.5-01-PLAN.md — Briefing capture, data re-snapshot, ABC scans, source reading, draft authoring
- [x] 04.9.5-02-PLAN.md — Self-review, revision, user sign-off, cross-link, commit
**UI hint**: no — knowledge phase, no UI work

### Phase 4.9.6 (INSERTED): Psalter Alignment Implementation
**Goal**: Fix the live DCM mis-render, mid-stanza-verse-split, alternate-meter mis-align, and amen-ending bugs by redesigning the lyrics data model into a structured `Stanza→Line→Syllable` form with `bibleVerseRef` per line, parsing all existing Airtable lyric blobs into that form, and implementing the alignment + line-break algorithm against `tune.double_length` (not against `meter='CMD'`).
**Depends on**: Phase 4.9.5 (canonical doc), quick task 260517-u35 (`tunes.double_length` migration)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, RENDER-01, RENDER-02, RENDER-03, RENDER-04, RENDER-05, RENDER-06
**Success Criteria** (what must be TRUE):
  1. New structured lyrics representation lives in the DB (or is computed deterministically from the existing blob via a parser), preserving 1-stanza:N-verses and 1-verse:N-stanzas relationships per `.planning/research/scottish-psalter-structure.md` §3
  2. Parser handles every existing psalm version's lyric blob without data loss; round-trip test passes (parsed → re-serialized matches input modulo whitespace)
  3. Staff view renders the correct lyric stanza(s) for any psalm/tune pairing: for `tune.double_length=true` two consecutive lyric stanzas appear under one tune-pass; otherwise one stanza per tune-pass (DCM bug fixed)
  4. Mid-stanza verse boundaries are surfaced visually without disrupting metrical line flow (rendering surface choice deferred-but-implemented in this phase)
  5. Alternate-meter psalms (Ps 124 Second Version + Old 124th `10.10.10.10.10`, etc.) align syllable-to-note correctly with the printed-psalter's line-break placement
  6. No regression on Psalm 23 + Crimond canonical case (syllable-by-syllable mapping per doc §4)
  7. Amens are not present in the digitised ABCs and the renderer does not synthesise them (CPRC convention per doc §2)
**Plans**: 7 plans
**UI hint**: yes — staff/lyrics rendering changes; run /gsd-ui-phase before planning

Plans:
**Wave 1**
- [x] 04.9.6-01-PLAN.md — Schema (lyrics_imported_raw + lyrics_structured jsonb), StructuredLyrics types, register DATA-*/RENDER-* requirements

**Wave 2** *(parallel — both depend on Wave 1)*
- [x] 04.9.6-02-PLAN.md — TDD: parseLyrics + serialiseLyrics (F-1..F-7 handling, Psalm 23 case, round-trip)
- [x] 04.9.6-04-PLAN.md — TDD: stanza-cycles driven by tune.double_length boolean; delete splitStanzaIntoPhrasePortions

**Wave 3** *(depends on Wave 2)*
- [x] 04.9.6-03-PLAN.md — [BLOCKING] drizzle-kit push + corpus snapshot + one-shot backfill + round-trip corpus test
- [x] 04.9.6-05-PLAN.md — NotationRenderer: branch on lyricsStructured; legacy fallback per D-15; extend fetchPsalmDetail
- [x] 04.9.6-06-PLAN.md — TDD: StanzaList accepts Stanza[]; inline sup.verse-number for mid-stanza bibleVerseRef

**Wave 4** *(depends on Wave 3)*
- [x] 04.9.6-07-PLAN.md — Regression UAT: Psalm 23 + Crimond canary, DCM pairing, alternate-meter, amen-skip negative test + Playwright UAT (human checkpoint)

### Phase 4.9.7 (INSERTED): Staff-View Metrical-Line Hotfix
**Goal**: Fix the regression introduced by Phase 4.9.6 where `mapCycleToPhraseSyllableLines` drops metrical lines beyond `phrasesPerCycle`. CM/LM/SM stanzas (4 metrical lines, T=2 phrases) currently render only lines 0–1 in the staff view; DCM stanzas (8 metrical lines, T=4 phrases) only render lines 0–3. The lyrics-only view is unaffected because `StanzaList` renders `Stanza[]` directly without going through the buggy mapper. Restore the pre-Phase-4.9.6 behaviour: each staff phrase carries `linesPerStanza / phrasesPerCycle` metrical lines, joined and syllabified together (CM 8.6.8.6 → 2 lines per phrase; DCM → 2 lines per phrase; alternate meters → 1 line per phrase when stanza lines == T).
**Depends on**: Phase 4.9.6 (the function being fixed lives in `src/lib/stanza-cycles.ts`)
**Requirements**: RENDER-07 (new — staff view shows ALL metrical lines of each stanza)
**Success Criteria** (what must be TRUE):
  1. Psalm 23 + Crimond staff view shows all 4 metrical lines of each stanza ("The Lord's my shepherd..." through "...the quiet waters by.") under the tune
  2. Psalm 100 + Old 100th (LM) staff view shows all 4 metrical lines of each stanza, no overflow/garbled syllables
  3. Any DCM psalm shows all 8 metrical lines of the 2-stanza cycle (4 lines per stanza × 2 stanzas in cycle)
  4. Alternate-meter Psalm 124 Second Version + Old 124th (10.10.10.10.10, T=5 phrases, 5 lines per stanza) shows all 5 lines
  5. Lyrics-only view continues to render all lines (no regression)
  6. The Plan 07 Psalm 23 + Crimond regression test from Phase 4.9.6 is strengthened to assert every metrical line of the stanza appears in `mapCycleToPhraseSyllableLines` output for CM
  7. Playwright UAT diff against live psalter.gsdlabs.dev confirms staff view now shows full stanza content
**Plans**: 3 plans
**UI hint**: yes — staff view rendering change; lyrics-only and UI-SPEC contracts unchanged from 4.9.6

Plans:
**Wave 1**
- [x] 04.9.7-01-PLAN.md — TDD: strengthen CM/DCM/LM regression tests (RED), apply D-02 fix to mapCycleToPhraseSyllableLines (GREEN), register RENDER-07

**Wave 2** *(depends on Wave 1)*
- [x] 04.9.7-02-PLAN.md — Build + pm2 restart psalter; extended Playwright UAT against psalter.gsdlabs.dev asserting D-09 (CM "waters by", LM "rejoice", DCM last line); human visual sign-off

**Wave 3** *(depends on Wave 2)*
- [x] 04.9.7-03-PLAN.md — Per-line inner-array contract (RENDER-07b): fix cross-stanza spill; one metrical line = one sub-staff entry; Playwright per-syllable-node SVG assertion; human sign-off

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
Phases execute in numeric order: 1 → 2 → 3 → 4 → 4.5 → 4.6 → 4.7 → 4.8 → 4.9 → 4.9.1 → 4.9.2 → 4.9.3 → 4.9.4 → 4.9.5 → 4.9.6 → 4.9.7 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete | 2026-05-07 |
| 2. Public Browse | 5/5 | Complete | 2026-05-08 |
| 3. Search | 6/6 | Complete | 2026-05-08 |
| 4. Notation | 4/4 | Complete | 2026-05-08 |
| 4.5. Psalm Detail Overhaul | 4/4 | Complete | 2026-05-09 |
| 4.6. Psalm Detail UI Polish | 3/3 | Complete | 2026-05-09 |
| 4.7. Psalm Listing Overhaul | 3/3 | Complete | 2026-05-09 |
| 4.8. Explore & Tunes Overhaul | 3/3 | Complete | 2026-05-10 |
| 4.9. Tune Notation Conversion | 0/3 | Not started | - |
| 4.9.1. Interactive abcjs Player | 1/1 | Complete | 2026-05-13 |
| 4.9.2. Dynamic ABC Polish | 5/5 | Complete | 2026-05-14 |
| 4.9.3. Mobile-first Psalm Display | 6/6 | Complete | 2026-05-25 |
| 4.9.4. Staff View Refinements & Onboarding | 5/5 | Complete | 2026-05-16 |
| 4.9.5. Scottish Psalter Metrical Knowledge | 2/2 | Complete | 2026-05-17 |
| 4.9.6. Psalter Alignment Implementation | 7/7 | Complete | 2026-05-19 |
| 4.9.7. Staff-View Metrical-Line Hotfix | 3/3 | Complete | 2026-05-25 |
| 5. Precentor Portal | 0/TBD | Not started | - |
| 6. Polish | 0/TBD | Not started | - |
