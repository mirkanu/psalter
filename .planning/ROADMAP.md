# Roadmap: CPRC Psalter

## Overview

Rebuild of psalter.cprc.co.uk from Airtable + Softr to a self-hosted Next.js 15 application.

## Milestones

- ✅ **v1.0 Public Psalter** — Phases 1–4.12 (shipped 2026-07-29, see [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md))
- 🚧 **v1.1 Precentor Portal & Polish** — Phases 5–6 (in progress)

## Phases

<details>
<summary>✅ v1.0 Public Psalter (Phases 1–4.12) — SHIPPED 2026-07-29</summary>

Data migration through full public-facing site with live notation, syllable-aligned staff view, and mobile-optimised psalm display. Full phase-by-phase detail archived in [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).

- [x] Phase 1: Foundation (5/5 plans) — completed 2026-05-07
- [x] Phase 2: Public Browse (5/5 plans) — completed 2026-05-08
- [x] Phase 3: Search (6/6 plans) — completed 2026-05-08
- [x] Phase 4: Notation (4/4 plans) — completed 2026-05-08
- [x] Phase 4.5: Psalm Detail Overhaul (4/4 plans) — completed 2026-05-09
- [x] Phase 4.6: Psalm Detail UI Polish (3/3 plans) — completed 2026-05-09
- [x] Phase 4.7: Psalm Listing Overhaul (3/3 plans) — completed 2026-05-09
- [x] Phase 4.8: Explore & Tunes Overhaul (3/3 plans) — completed 2026-05-10
- [x] Phase 4.9.1: Interactive abcjs Player (1/1 plan) — completed 2026-05-13
- [x] Phase 4.9.2: Dynamic ABC Polish (5/5 plans) — completed 2026-05-14
- [x] Phase 4.9.3: Mobile-first Psalm Display (6/6 plans) — completed 2026-05-25
- [x] Phase 4.9.4: Staff View Refinements & Onboarding (5/5 plans) — completed 2026-05-16
- [x] Phase 4.9.5: Scottish Psalter Metrical Knowledge (2/2 plans) — completed 2026-05-17
- [x] Phase 4.9.6: Psalter Alignment Implementation (7/7 plans) — completed 2026-05-19
- [x] Phase 4.9.7: Staff-View Metrical-Line Hotfix (3/3 plans) — completed 2026-05-25
- [x] Phase 4.9.8: Staff Display Word Alignment Fix (4/4 plans) — completed
- [x] Phase 4.9.9: Staff Alignment — Melisma Support (7/7 plans) — completed
- [x] Phase 4.9.10: PHRASE_BREAK Re-annotation (2/2 plans) — completed 2026-05-29
- [x] Phase 4.9.13: Single Psalm UI Streamlining (3/3 plans) — completed 2026-06-28
- [x] Phase 4.9.14: Single Psalm View Fixes (3/3 plans) — completed
- [x] Phase 4.9.15: Mobile Inline Staff Optimization (5/5 plans) — completed
- [x] Phase 04.9.15.1: Inline Staff Landscape Fit + Swipe Stanza Navigation (3/3 plans) — completed 2026-07-27
- [x] Phase 4.12: Explore Page Rebuild (5/5 plans) — completed 2026-06-14

**Deferred at v1.0 close** (see [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md) "Scope Decisions" and `.planning/STATE.md` Deferred Items):
- Phase 4.9: Tune Notation Conversion — superseded by manual `/dev/melisma-editor` workflow (4.11)
- Phase 04.10: Verified MusicXML Pilot (Crimond) — superseded by 4.11
- Phase 04.11: Solfège Underline OCR — pivoted to manual per-tune editor; ongoing background work, not a release gate
- Phase 4.9.11: Lyric-Count False Positive Fix — not started
- Phase 4.9.12: Melisma positions as tune-level data — 3/4 plans done

</details>

### 🚧 Milestone 2 — Precentor Portal & Polish (In Progress)

### Phase 5: Precentor Portal
**Goal**: A precentor can create Precenting Sets (Date, Type, optional Note), build an ordered list of psalm+tune pairs with optional verse ranges, and run a live precenting mode that navigates the set with immediate tune/psalm edits reflected in-view
**Depends on**: Phase 4.5
**Requirements**: PREC-01, PREC-02, PREC-03, PREC-04, PREC-05, PREC-06
**Success Criteria** (what must be TRUE):
  1. A "Precent" top-level nav item lists all Precenting Sets with columns Date, Type, Precentor (hardcoded "Manuel"); a prominent "+ New" button opens the creation form
  2. Creating a Precenting Set requires Date and Type (AM Service / PM Service / Other, mandatory); Note is optional free text; DB auto-tracks Created and Last Modified separately from Date
  3. After creation, fields display as read-only with edit affordances; an "Add Psalm" button opens the "Select psalm" modal; selecting a psalm shows an inline verse range input (empty by default, visually inviting) that confirms and adds the psalm as a table row
  4. The psalms table shows Psalm, Verses, Meter, Tune (defaulting to the psalm's default tune or empty); clicking any Tune cell opens a TunePickerModal pre-filtered to the psalm's meter; rows where the selected tune's meter does not match the psalm's meter are highlighted with a visible "Warning: meter mismatch" indicator
  5. Rows are reorderable via drag-and-drop using dnd-kit (pointer-event-based, works on mobile); clicking Psalm or Verses opens their respective edit modal; each row has a delete icon (with confirmation) and a play icon (opens precenting mode at that psalm)
  6. A prominent "Start Precenting" button (light orange) opens the standard single-psalm view in precenting mode: a thin amber bar between the site header and psalm header shows position (e.g. "3/4") with "Precenting Mode" label; left/right navigation arrows (also amber) move through the set in order; clicking Psalm or Tune immediately updates that set entry and loads the new selection; back arrow hidden on first psalm, forward arrow hidden on last
**Plans**: 5 plans
**UI hint**: yes

Plans:
**Wave 1** *(foundation — install deps, schema + DB push, nav, Wave 0 test stubs)*
- [x] 05-01-PLAN.md — Install dnd-kit + Calendar, add precenting_sets + set_items tables + [BLOCKING] drizzle-kit push, Precent nav item, all 6 Wave 0 test stubs (RED)

**Wave 2** *(depends on Wave 1)*
- [x] 05-02-PLAN.md — Set CRUD API + /precent list page + CreateSetForm + PrecentingSetList + loading.tsx (PREC-01)

**Wave 3** *(depends on Wave 2)*
- [x] 05-03-PLAN.md — Item API routes + PsalmListingGrid/TuneGrid reuse props + PsalmPickerModal + TunePickerModal (PREC-02)

**Wave 4** *(depends on Wave 3)*
- [x] 05-04-PLAN.md — Reorder API + /precent/[id] detail page + SetDetail + dnd-kit SetItemsSortableList/SetItemRow (mismatch/play/delete) (PREC-03, PREC-04)

**Wave 5** *(depends on Wave 4)*
- [x] 05-05-PLAN.md — Precenting mode page + PrecentingBar + SingingView wrap + loading.tsx + Playwright UAT green (PREC-05, PREC-06)

### Phase 05.1: Auth Gate (INSERTED)

**Goal**: Protect all /precent/* routes behind Better Auth login; admin-created accounts only; logged-in user name automatically populates the Precentor field on Precenting Sets; no public self-registration path exists
**Depends on:** Phase 5
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. A precentor can log in with email and password via Better Auth; session persists across page reloads
  2. All /precent/* routes redirect unauthenticated users to the login page; no precentor data is accessible without a valid session
  3. The Precentor field on Precenting Sets is automatically populated from the logged-in user's display name (no manual entry)
  4. An admin can create precentor accounts via a CLI script or minimal admin UI; no self-registration route exists
**Plans**: 5 plans
**UI hint**: yes

Plans:
**Wave 1**
- [x] 05.1-01-PLAN.md — Install better-auth, auth tables + push, auth.ts/client/route handler, seed admin account, Wave 0 test stubs

**Wave 2** *(depends on Wave 1)*
- [x] 05.1-02-PLAN.md — [BLOCKING] precenting_sets user_id FK migration (backfill to admin, drop precentor_name) + middleware route protection + /login page + LoginForm

**Wave 3** *(depends on Wave 2)*
- [x] 05.1-03-PLAN.md — Ownership/admin guards on all 5 precent API routes + shared precent-auth helper (D-22)

**Wave 4** *(depends on Wave 3)*
- [x] 05.1-04-PLAN.md — Session-filtered /precent pages (precentor name via JOIN) + admin viewing-as dropdown + /dev/accounts admin UI

**Wave 5** *(depends on Wave 4)*
- [x] 05.1-05-PLAN.md — Playwright UAT across all 4 success criteria + human verify checkpoint (autonomous=false)

### Phase 05.2: Footer, Feedback & Analytics (INSERTED)

**Goal**: Every page has a site footer with project context, a working feedback form, and Umami analytics tracking in place
**Depends on**: Phase 05.1
**Requirements**: FOOT-01, FOOT-02, FOOT-03, FOOT-04, FOOT-05, UMAMI-01
**Success Criteria** (what must be TRUE):
  1. A site footer appears on every public and authenticated page; it contains: About link (opens modal), Copyright link (opens modal), Feedback link (opens modal), and "Made by GSD Labs" linking to gsdlabs.dev
  2. The About modal contains a short project description blurb consistent with the old site's tone
  3. The Copyright modal contains a copyright notice
  4. The Feedback modal shows: a free-text "Suggestions, feedback, or corrections?" textarea; optional Name field; optional Email field; a checkbox "Include current page URL" checked by default; Submit button; submissions are stored in the database
  5. An admin-gated `/admin-only/feedback` page lists all feedback submissions with name, email, message, page URL, and timestamp
  6. The Umami tracking snippet is present in the root layout and pageviews are visible in the Umami dashboard
**Plans**: 3 plans
**UI hint**: yes

Plans:
**Wave 1** *(foundation — provision Umami, install Textarea, schema + push, RED UAT stub)*
- [x] 05.2-01-PLAN.md — Provision Umami website ID + install Textarea + feedback_submissions schema + [BLOCKING] drizzle-kit push + RED Playwright UAT stub

**Wave 2** *(depends on Wave 1)*
- [x] 05.2-02-PLAN.md — SiteFooter + FeedbackModal + unauthenticated /api/feedback route + wire SiteFooter & Umami Script into layout.tsx

**Wave 3** *(depends on Wave 1 + Wave 2)*
- [x] 05.2-03-PLAN.md — Admin /admin-only/feedback list page + build + pm2 restart + Playwright UAT GREEN + human verify (autonomous=false)

### Phase 05.3: /daily Calendar View (INSERTED)

**Goal**: The daily reading plan page is genuinely useful day-to-day — today's reading is immediately visible and the full 365-day plan is browsable by month rather than as a flat list
**Depends on**: Phase 05.2
**Requirements**: DAILY-02, DAILY-03
**Success Criteria** (what must be TRUE):
  1. Opening /daily shows today's reading entry prominently at the top of the page — visually distinct (highlighted card with today's date, day number, psalm reference, and notes); no scrolling required to find it
  2. Below the today card, a monthly calendar grid replaces the flat 365-row list; each day cell shows the day number and psalm reference; the current day is highlighted; prev/next month navigation buttons are present
  3. Clicking a day cell navigates to or reveals that day's full reading entry
**Plans**: 3 plans
**UI hint**: yes

Plans:
**Wave 1**
- [x] 05.3-01-PLAN.md — Add starting_verse/ending_verse columns + [BLOCKING] drizzle-kit push + Airtable backfill script + Wave 0 test scaffolds

**Wave 2** *(depends on Wave 1)*
- [x] 05.3-02-PLAN.md — formatPsalmRef/calendarDateToDayOfYear helpers + query type + DailyTodayCard server component (DAILY-02)

**Wave 3** *(depends on Wave 2)*
- [x] 05.3-03-PLAN.md — DailyCalendarClient grid + /daily page rewrite + loading.tsx + delete DailyPlanClient + Playwright UAT (DAILY-03, human checkpoint)

### Phase 05.4: Airtable Exit Verification (INSERTED)

**Goal**: Every byte of Airtable data is accounted for in PostgreSQL and R2 before the Airtable subscription is cancelled; a permanent backup and read-only DB viewer are in place
**Depends on**: Phase 05.1
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07
**Success Criteria** (what must be TRUE):
  1. A gap audit script compares every Airtable table's schema and row count against PostgreSQL and produces a written gap report — no data changes happen before this report is reviewed
  2. All gaps identified in the report are filled: missing columns added to existing tables, missing rows inserted, no existing rows duplicated
  3. Every Airtable attachment is verified to exist in R2; any missing attachments are downloaded before Airtable is cancelled
  4. Airtable Metadata API has been queried and all formula and lookup field definitions are stored in a permanent reference file on Hetzner (`.planning/research/airtable-formula-fields.md` or similar)
  5. A `pg_dump` compressed backup (`psalter-full-YYYYMMDD.sql.gz`) is stored in `/home/services/psalter/backups/` on Hetzner before Airtable is cancelled
  6. pgweb is deployed read-only (connected to the existing psalter PostgreSQL database), accessible at a Cloudflare Access-gated URL, and shows all tables including both Airtable-migrated and site-native tables
  7. A written "safe to cancel Airtable" checklist is produced and all items are checked off before the subscription is cancelled
**Plans**: TBD (3-4 plans)
**UI hint**: no

### Phase 6: Polish
**Goal**: OG images in place for social sharing; Lighthouse 90+ on key pages; bundle clean; every remaining route transition shows a skeleton; all clickable elements give immediate visual feedback
**Depends on**: Phase 05.4
**Requirements**: PERF-02, OG images (next/og), Lighthouse 90+
**Success Criteria** (what must be TRUE):
  1. Each psalm and tune page generates a dynamic OG image (next/og) visible when the URL is shared on social platforms
  2. A bundle analysis confirms no unintended large dependencies; Lighthouse performance score is 90+ on the psalm list and psalm detail pages
  3. Navigating to any route not covered by Phase 4.5 skeletons (search, explore, daily, homepage) never shows a blank screen — a skeleton appears within one frame
  4. Every button, link, and card shows a CSS `:active` state change and a `useTransition` pending indicator when clicked
**Plans**: TBD (3-4 plans)
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Precentor Portal | 5/5 | Complete | 2026-06-15 |
| 05.1. Auth Gate | 5/5 | Complete | 2026-06-15 |
| 05.2. Footer, Feedback & Analytics | 3/3 | Complete | 2026-06-20 |
| 05.3. /daily Calendar View | 3/3 | Complete | 2026-06-21 |
| 05.4. Airtable Exit Verification | 0/TBD | Not started | - |
| 6. Polish | 0/TBD | Not started | - |
