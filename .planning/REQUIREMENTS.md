# CPRC Psalter — v1 Requirements

Generated: 2026-05-07

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

### Tunes

- [ ] **TUNE-01**: User can view tune detail (name, meter, score display, YouTube and audio links)
- [ ] **TUNE-02**: Tune score displays as live abcjs SVG notation when ABC string is available; JPG fallback when not
- [ ] **TUNE-03**: Hymnal-style notation layout: verse 1 lyrics syllable-aligned under staff (abcjs `w:` fields); remaining verses displayed as numbered stanzas below the SVG
- [ ] **TUNE-04**: Notation layout is mobile-responsive (abcjs `responsive: "resize"`, tested at 375px / 768px / 1200px)

### Search

- [ ] **SRCH-01**: User can find a psalm by number (instant lookup)
- [ ] **SRCH-02**: User can search psalms by keyword across metrical lyrics and KJV text (PostgreSQL full-text)
- [ ] **SRCH-03**: User can browse psalms by Nave's topic / thematic tag
- [ ] **SRCH-04**: User can filter tunes by meter (CM, LM, SM, etc.)

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

- [ ] **PERF-01**: Every Next.js route has a `loading.tsx` skeleton — no blank screen on navigation
- [ ] **PERF-02**: All clickable elements show immediate visual feedback (CSS `:active`, `useTransition` for navigation)

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
| SRCH-01 | Phase 3: Search | Pending |
| SRCH-02 | Phase 3: Search | Pending |
| SRCH-03 | Phase 3: Search | Pending |
| SRCH-04 | Phase 3: Search | Pending |
| TUNE-02 | Phase 4: Notation | Pending |
| TUNE-03 | Phase 4: Notation | Pending |
| TUNE-04 | Phase 4: Notation | Pending |
| AUTH-01 | Phase 5: Precentor Portal | Pending |
| AUTH-02 | Phase 5: Precentor Portal | Pending |
| PREC-01 | Phase 5: Precentor Portal | Pending |
| PREC-02 | Phase 5: Precentor Portal | Pending |
| PREC-03 | Phase 5: Precentor Portal | Pending |
| PREC-04 | Phase 5: Precentor Portal | Pending |
| PREC-05 | Phase 5: Precentor Portal | Pending |
| PREC-06 | Phase 5: Precentor Portal | Pending |
| PERF-01 | Phase 6: Polish | Pending |
| PERF-02 | Phase 6: Polish | Pending |
