# CPRC Psalter — v1.1 Requirements

Generated: 2026-07-29 (fresh doc after v1.0 milestone close — see `.planning/milestones/v1.0-REQUIREMENTS.md` for archived Milestone 1 requirements)

## v1.1 Requirements

### Authentication

- [x] **AUTH-01**: Precentor can log in with email and password
- [x] **AUTH-02**: Precentor accounts are admin-created only (no public self-registration)

### Precentor Portal

- [x] **PREC-01**: Precentor can create a service event (date + AM/PM)
- [x] **PREC-02**: Precentor can assign psalm + tune pairs to a service event, specifying verses/stanzas per slot
- [x] **PREC-03**: Precentor can edit and reorder psalm slots within a service event
- [x] **PREC-04**: Precentor can view a service set list overview before the service
- [x] **PREC-05**: Precentor service view shows all assigned psalms in sequence with notation pre-loaded on page entry
- [x] **PREC-06**: Precentor can preview a tune's melody via abcjs Web Audio API

### Footer & Feedback (Phase 05.2)

- [x] **FOOT-01**: A site footer is present on every page (public and authenticated)
- [x] **FOOT-02**: The About link opens a modal with a short project description
- [x] **FOOT-03**: The Copyright link opens a modal with a copyright notice
- [x] **FOOT-04**: The Feedback link opens a modal form (free text, optional name/email, URL checkbox); submissions stored in DB
- [x] **FOOT-05**: An admin-gated `/admin-only/feedback` page lists all feedback submissions

### Analytics (Phase 05.2)

- [x] **UMAMI-01**: Umami tracking snippet present in root layout; pageviews recorded in dashboard

### Daily Reading Plan (Phase 05.3)

- [x] **DAILY-02**: Opening /daily shows today's reading entry at the top in a visually distinct card
- [x] **DAILY-03**: Monthly calendar grid replaces the flat 365-row list; current day highlighted; prev/next navigation

### Airtable Exit Verification (Phase 05.4)

- [ ] **ADMIN-01**: A gap audit script compares every Airtable table's schema and row count against PostgreSQL and produces a written gap report before any data changes occur
- [ ] **ADMIN-02**: All gaps from the audit are filled surgically: missing columns added, missing rows inserted, no existing data duplicated/overwritten
- [ ] **ADMIN-03**: Every Airtable attachment is verified to exist in R2; missing attachments downloaded before Airtable is cancelled
- [ ] **ADMIN-04**: All Airtable formula and lookup field definitions fetched via Metadata API and stored in a permanent reference file
- [ ] **ADMIN-05**: A `pg_dump` compressed backup stored in `/home/services/psalter/backups/` before Airtable is cancelled
- [ ] **ADMIN-06**: pgweb deployed read-only, Cloudflare Access-gated, showing all tables
- [ ] **ADMIN-07**: A written "safe to cancel Airtable" checklist produced with all items verified

### Performance (Phase 6)

- [ ] **PERF-01**: Every remaining Next.js route that fetches data has a `loading.tsx` skeleton — carried over from v1.0 (Phase 4.5 already shipped `/psalms`, `/psalms/[id]`, `/tunes`, `/tunes/[id]`). Remaining scope: search, explore, daily, homepage.
- [ ] **PERF-02**: All clickable elements show immediate visual feedback (CSS `:active` + `useTransition` pending indicator)

---

## Carried-Over Technical Debt (from v1.0 close)

These items were deferred rather than blocking the v1.0 tag. Not formal v1.1 requirements yet, but should be considered when scoping future phases — see `.planning/milestones/v1.0-REQUIREMENTS.md` "v1.0 Scope Decisions" section and `.planning/STATE.md` Deferred Items table for full detail:

- Melisma/notation OCR pipeline (Phases 4.9, 4.9.11, 4.9.12, 4.10, 4.11) — 102/172 tunes still lack an explicit `approved` decision in `/dev/melisma-editor`; ongoing per-tune manual review, not release-gated
- UAT/verification sign-off gaps on Phases 02, 04.5, 04.7, 04.9.8, 04.9.9, 04.9.14, 05, 05.1, 05.3 — all in production with no reported breakage, but formal checkpoints never closed

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
| AUTH-01 | Phase 05.1: Auth Gate | Complete |
| AUTH-02 | Phase 05.1: Auth Gate | Complete |
| PREC-01 | Phase 5: Precentor Portal | Complete |
| PREC-02 | Phase 5: Precentor Portal | Complete |
| PREC-03 | Phase 5: Precentor Portal | Complete |
| PREC-04 | Phase 5: Precentor Portal | Complete |
| PREC-05 | Phase 5: Precentor Portal | Complete |
| PREC-06 | Phase 5: Precentor Portal | Complete |
| FOOT-01 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-02 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-03 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-04 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| FOOT-05 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| UMAMI-01 | Phase 05.2: Footer, Feedback & Analytics | Complete |
| DAILY-02 | Phase 05.3: /daily Calendar View | Complete |
| DAILY-03 | Phase 05.3: /daily Calendar View | Complete |
| ADMIN-01 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-02 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-03 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-04 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-05 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-06 | Phase 05.4: Airtable Exit Verification | Pending |
| ADMIN-07 | Phase 05.4: Airtable Exit Verification | Pending |
| PERF-01 | Phase 6: Polish (continuation) | Pending |
| PERF-02 | Phase 6: Polish | Pending |
