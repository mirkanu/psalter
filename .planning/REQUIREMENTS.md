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

- [x] **AUTH-01**: Precentor can log in with email and password
- [x] **AUTH-02**: Precentor accounts are admin-created only (no public self-registration)

### Precentor Portal

- [x] **PREC-01**: Precentor can create a service event (date + AM/PM)
- [x] **PREC-02**: Precentor can assign psalm + tune pairs to a service event, specifying verses/stanzas per slot
- [x] **PREC-03**: Precentor can edit and reorder psalm slots within a service event
- [x] **PREC-04**: Precentor can view a service set list overview before the service
- [x] **PREC-05**: Precentor service view shows all assigned psalms in sequence with notation pre-loaded on page entry (no per-psalm loading delay)
- [x] **PREC-06**: Precentor can preview a tune's melody via abcjs Web Audio API (requires user gesture)

### Performance

- [ ] **PERF-01**: Every Next.js route that fetches data has a `loading.tsx` file rendering a skeleton matching the page shape — no blank or white screen on navigation. Phase 4.5 covers /psalms, /psalms/[id], /tunes, /tunes/[id]. Phase 6 covers remaining routes (search, explore, daily, homepage).
- [ ] **PERF-02**: All clickable elements (buttons, links, cards) show immediate visual feedback: CSS `:active` state and `useTransition` pending indicator for navigation actions

### Notation (Phase 4.9.2 — Dynamic ABC Polish)

- [x] **NOTATION-01**: Lyrics are split by syllables and aligned to notes via the ABC `w:` field; unsplit lyrics remain available for the Lyrics-only view mode
- [x] **NOTATION-02**: Solfège rendering shows the original JPEG via the Solfège view-mode toggle (dynamic solfège generation deferred to v2 per D-14); Staff/Solfège/Lyrics-only view modes are mutually exclusive
- [x] **NOTATION-03**: ABC score + inline lyrics fit dynamically to viewport width; staff renders as one row per phrase (D-19); A+/A− buttons adjust base size; auto-fit scales proportionally
- [x] **NOTATION-04**: A+/A− font size buttons are always visible (not hidden in lyrics-only mode) and control both score rendering size and inline verse text display; selection persists in localStorage
- [x] **NOTATION-05**: Full-screen mode available for both staff and solfège; sticky bottom bar retains Prev/Exit/Next; Escape exits; tune-half pagination available on mobile landscape
- [x] **NOTATION-06**: Score view controls (Staff/Solfège/Lyrics Only) and media controls (Play, BPM, Transpose) are visually grouped into the unified control bar with vertical dividers between functional regions

### Mobile Singing View (Phase 4.9.3 — Mobile-first Psalm Display)

- [ ] **MOBILE-01**: The default psalm detail page on all viewports opens directly to the notation+lyrics view — no tab selection required; a slim two-line header shows `← Psalm N →` (prev/next + psalm selector on tap) and `Tune (M): TuneName [Edit]` (inline tune switcher); all other UI is hidden
- [ ] **MOBILE-02**: A single FAB (bottom-right) expands to reveal: view switcher (Staff / Lyrics-only / Solfège), tune audio player, and metadata/topics panel — these are the only secondary controls accessible from the psalm page
- [ ] **MOBILE-03**: abc notation never overflows the right edge of the viewport at any zoom level; staffwidth is derived from the container's `offsetWidth` at render time and passed to `ABCJS.renderAbc`; the container is hard-clamped with `max-width: 100%; overflow-x: hidden`; notation re-renders on resize and orientation change

### Psalter Alignment (Phase 4.9.6 — Psalter Alignment Implementation)

- [ ] **DATA-01**: `psalm_versions.lyrics_structured` jsonb column exists, typed `StructuredLyrics | null`; canonical editable lyric form going forward (per Phase 4.9.6 D-01)
- [ ] **DATA-02**: `psalm_versions.lyrics` column renamed to `lyrics_imported_raw` (immutable Airtable snapshot, never written after one-shot parse) (per D-02)
- [ ] **DATA-03**: One-shot parser script (`scripts/parse-lyrics-structured.ts`) parses every existing `lyrics_imported_raw` blob into `lyrics_structured`; quarantines failures to `parse-failures.md` (per D-04)
- [ ] **DATA-04**: Parser failure report emitted as `.planning/phases/04.9.6-psalter-alignment-implementation/parse-failures.md` listing each quarantined psalm-version with reason and offending line
- [ ] **DATA-05**: Round-trip test asserts `normalise(serialise(parse(blob))) === normalise(blob)` for every non-quarantined corpus row, run against committed fixture `tests/fixtures/lyrics-corpus-snapshot.json` (per D-05)
- [ ] **RENDER-01**: DCM stanza-cycle gating is driven by `tunes.double_length === true`, NOT by `meter === 'CMD'` or any meter-string comparison (per D-11)
- [ ] **RENDER-02**: `groupStanzasIntoCycles` and `mapCycleToPhraseSyllableLines` consume structured `Stanza[]` and produce cycles sized 2 when `doubleLength` else 1 (per D-12)
- [ ] **RENDER-03**: Mid-stanza Bible-verse boundaries render as inline `<sup className="verse-number">{ref}</sup>` immediately before the first syllable of the new verse; reuses existing globals.css `.verse-number` class with no new CSS (per D-07, UI-SPEC)
- [ ] **RENDER-04**: New alignment renderer activates per-psalm-version, gated on `lyrics_structured` non-null AND psalm-version not in quarantine; quarantined rows continue through the legacy blob path (per D-15)
- [ ] **RENDER-05**: Alternate-meter psalms (e.g. Psalm 124 Second Version + Old 124th `10.10.10.10.10`) align syllable-to-note correctly via structured `Line[]` count matching ABC phrase boundaries (per D-14)
- [ ] **RENDER-06**: Psalm 23 + Crimond regression canary: automated test asserts the `w:` syllable lines match a recorded golden, and no synthesised Amen tail appears (per D-13, D-16)

### Single Psalm UI Streamlining (Phase 04.9.13)

- [ ] **UI-04**: The single psalm UI is streamlined — the Gear menu becomes a compact anchored Popover (main toggle Music Notes / Lyrics Only, with conditional Staff/Solfege and psalm-only Split-leaf/Inline sub-toggles, Study button replacing the 'About this psalm' section, Restart tour retained); the split-leaf view renders a 5-col desktop grid (notation 60% / stanzas 40%) with an independently-scrolling stanza list and a full-width mobile solfège image (flush to screen edges); multi-page tunes render a ChevronLeft/ChevronRight thumbnail strip with the current page highlighted `ring-2 ring-foreground`. Redundant 'Play recording' button removed.
- [ ] **UI-05**: The player bar narrows and right-aligns into a floating card on desktop (mobile unchanged), with an abc ↔ SoundCloud toggle (localStorage-persisted `psalter-audio-source`) and a 'Lyrics shown are metrical; recording may use a different text.' disclaimer in SC mode. Available on both /psalms/[id] (fixed bar in SingingView) and /tunes/[id] (static page-flow instance). The psalm page is constrained to max-w-4xl mx-auto matching /tunes/[id], with fixed PsalmTopBar + GlassBottomBar content constrained via an inner max-w-4xl wrapper (bars remain full-width fixed).

### Staff-View Metrical-Line Hotfix (Phase 4.9.7)

- [x] **RENDER-07**: Staff view renders ALL metrical lines of each stanza in the visible cycle, not just the first `phrasesPerCycle` lines. `mapCycleToPhraseSyllableLines` groups `linesPerStanza / phrasesPerCycle` metrical lines into each phrase slot, preserving the `string[][]` B1 contract.

### Staff View Word Alignment (Phase 4.9.8)

- [x] **RENDER-08**: Staff view renders every metrical line on its own sub-staff with words aligned to every note position (no trailing empty notes). All CM/LM/SM tunes are migrated to carry 3 `% PHRASE_BREAK` markers (DCM/DLM/DSM carry 7); `phrasesForMeter` returns 4 for CM/LM/SM/8.7.8.7/7.6.7.6 and 8 for DCM/DLM/DSM; `splitMusicIntoSubLines` defensively filters bare-rest pseudo-bars (z2 trailing rest bug). Verified across all 150 psalms via Playwright sweep. — Verified 04.9.10: 150/150 pass post-Path-NH re-annotation (final clean run 2026-05-29T17:41Z).

### Mobile Inline Staff Optimization (Phase 4.9.15)

- [x] **MOBILE-04**: The repeated clef/key-signature/time-signature glyph group shrinks to 60% as a single tightly-packed unit (glyphs and inter-glyph gaps both compress together) on EVERY row of the mobile inline Staff view — including row 1, per explicit user override during execution of the original "row 1 stays full size" scope; the freed horizontal space is reclaimed by the following notation/lyrics.
- [x] **MOBILE-05**: A+/A− buttons control inline-Staff lyric font size only (not staff notation scale); range 8–120px, step 2px, with 40px as a soft threshold beyond which the one-phrase-per-row/single-screen-fit rule may be relaxed.
- [x] **MOBILE-06**: Verse numbers appear in the inline Staff view's `w:` lyric lines as a plain digit glued to the first syllable (e.g. "1Before"), matching the existing legacy-blob convention.
- [x] **MOBILE-07**: Non-last rows in the inline Staff view fill available width with no wasted whitespace (row-stretch/justification bug fixed for rows 1 and 2, not just the last row).
- [x] **MOBILE-08**: The inline Staff view is gated behind `tuneMelismaDecisions.status === 'approved'`; the Gear menu's Staff-inline option is grayed out for non-approved tunes, and JPEG split-leaf is shown with a toast if a non-approved tune is reached via navigation.

### Footer & Feedback (Phase 05.2)

- [x] **FOOT-01**: A site footer is present on every page (public and authenticated); it contains: About link, Copyright link, Feedback link, and "Made by GSD Labs" linking to gsdlabs.dev
- [x] **FOOT-02**: The About link opens a modal with a short project description (consistent with the old site's tone: personal project, CPRC Ballymena, resources for psalm singing)
- [x] **FOOT-03**: The Copyright link opens a modal with a copyright notice
- [x] **FOOT-04**: The Feedback link opens a modal form with: free-text "Suggestions, feedback, or corrections?" textarea; optional Name field; optional Email field; "Include current page URL" checkbox (checked by default); submissions stored in the database
- [x] **FOOT-05**: An admin-gated `/admin-only/feedback` page lists all feedback submissions with name, email, message, page URL, and timestamp

### Analytics (Phase 05.2)

- [x] **UMAMI-01**: The Umami tracking snippet is present in the root layout; the psalter site appears in the Umami dashboard and pageviews are recorded

### Daily Reading Plan (Phase 05.3)

- [ ] **DAILY-02**: Opening /daily shows today's reading entry at the top of the page in a visually distinct highlighted card (today's date, day number, psalm reference, notes); no scrolling required to find it
- [ ] **DAILY-03**: Below the today card, a monthly calendar grid replaces the flat 365-row list; each day cell shows the day number and psalm reference; the current day is highlighted; prev/next month navigation is present; clicking a day reveals that day's full reading entry

### Airtable Exit Verification (Phase 05.4)

- [ ] **ADMIN-01**: A gap audit script compares every Airtable table's schema and row count against PostgreSQL and produces a written gap report before any data changes occur
- [ ] **ADMIN-02**: All gaps from the audit are filled surgically: missing columns added to existing tables, missing rows inserted — no existing correct data is duplicated or overwritten
- [ ] **ADMIN-03**: Every Airtable attachment is verified to exist in R2; any missing attachments are downloaded to R2 before Airtable is cancelled
- [ ] **ADMIN-04**: All Airtable formula and lookup field definitions are fetched from the Airtable Metadata API and stored in a permanent reference file (`.planning/research/airtable-formula-fields.md`) before Airtable is cancelled
- [ ] **ADMIN-05**: A `pg_dump` compressed backup (`psalter-full-YYYYMMDD.sql.gz`) is stored in `/home/services/psalter/backups/` before Airtable is cancelled
- [ ] **ADMIN-06**: pgweb is deployed in read-only mode connected to the existing psalter PostgreSQL database, accessible behind Cloudflare Access, showing all tables (Airtable-migrated and site-native)
- [ ] **ADMIN-07**: A written "safe to cancel Airtable" checklist is produced with all items verified before the subscription is cancelled

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
| AUTH-01 | Phase 5: Precentor Portal | Complete |
| AUTH-02 | Phase 5: Precentor Portal | Complete |
| PREC-01 | Phase 5: Precentor Portal | Complete |
| PREC-02 | Phase 5: Precentor Portal | Complete |
| PREC-03 | Phase 5: Precentor Portal | Complete |
| PREC-04 | Phase 5: Precentor Portal | Complete |
| PREC-05 | Phase 5: Precentor Portal | Complete |
| PREC-06 | Phase 5: Precentor Portal | Complete |
| PERF-02 | Phase 6: Polish | Pending |
| FOOT-01 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-02 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-03 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-04 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-05 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| UMAMI-01 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| DAILY-02 | Phase 05.3: /daily Calendar View | Pending |
| DAILY-03 | Phase 05.3: /daily Calendar View | Pending |
| ADMIN-01 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-02 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-03 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-04 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-05 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-06 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-07 | Phase 05.4: Airtable Exit Verification | Pending |
| NOTATION-01 | Phase 4.9.2: Dynamic ABC Polish | Complete |
| NOTATION-02 | Phase 4.9.2: Dynamic ABC Polish | Complete |
| NOTATION-03 | Phase 4.9.2: Dynamic ABC Polish | Complete |
| NOTATION-04 | Phase 4.9.2: Dynamic ABC Polish | Complete |
| NOTATION-05 | Phase 4.9.2: Dynamic ABC Polish | Complete |
| NOTATION-06 | Phase 4.9.2: Dynamic ABC Polish | Complete |
| MOBILE-01 | Phase 4.9.3: Mobile-first Psalm Display | Pending |
| MOBILE-02 | Phase 4.9.3: Mobile-first Psalm Display | Pending |
| MOBILE-03 | Phase 4.9.3: Mobile-first Psalm Display | Pending |
| DATA-01 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| DATA-02 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| DATA-03 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| DATA-04 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| DATA-05 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| RENDER-01 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| RENDER-02 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| RENDER-03 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| RENDER-04 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| RENDER-05 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| RENDER-06 | Phase 4.9.6: Psalter Alignment Implementation | Pending |
| RENDER-07 | Phase 4.9.7: Staff-View Metrical-Line Hotfix | Complete |
| RENDER-08 | Phase 4.9.8: Staff Display Word Alignment Fix | Complete |
| MOBILE-04 | Phase 4.9.15: Mobile Inline Staff Optimization | Complete |
| MOBILE-05 | Phase 4.9.15: Mobile Inline Staff Optimization | Complete |
| MOBILE-06 | Phase 4.9.15: Mobile Inline Staff Optimization | Complete |
| MOBILE-07 | Phase 4.9.15: Mobile Inline Staff Optimization | Complete |
| MOBILE-08 | Phase 4.9.15: Mobile Inline Staff Optimization | Complete |
