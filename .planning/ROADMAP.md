# Roadmap: CPRC Psalter

## Overview

Rebuild of psalter.cprc.co.uk from Airtable + Softr to a self-hosted Next.js 15 application.

## Milestones

- ✅ **v1.0 Public Psalter** — Phases 1–4.12 (shipped 2026-07-29, see [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md))
- ✅ **v1.1 Precentor Portal & Polish** — Phases 5, 05.1–05.3 (shipped 2026-07-29, see [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md))

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

<details>
<summary>✅ v1.1 Precentor Portal & Polish (Phases 5, 05.1–05.3) — SHIPPED 2026-07-29</summary>

Authenticated precentor portal, service set lists, site footer/feedback/analytics, daily-reading calendar view. Full phase-by-phase detail archived in [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md).

- [x] Phase 5: Precentor Portal (5/5 plans) — completed 2026-06-15
- [x] Phase 05.1: Auth Gate (5/5 plans) — completed 2026-06-15
- [x] Phase 05.2: Footer, Feedback & Analytics (3/3 plans) — completed 2026-06-20
- [x] Phase 05.3: /daily Calendar View (3/3 plans) — completed 2026-06-21

**Deferred at v1.1 close** (see [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md) "Scope Decisions"): Phase 05.4 (Airtable Exit Verification) and Phase 6 (Polish) never started — moved to `## Backlog` below as Phase 999.1 and 999.2.

</details>

## Backlog

Deferred at v1.1 milestone close (2026-07-29) — never started, no plans executed. Not blocking; pick up via `/gsd-phase` + `/gsd-discuss-phase` whenever prioritised.

### Phase 999.1: Airtable Exit Verification (BACKLOG)

**Goal**: Every byte of Airtable data is accounted for in PostgreSQL and R2 before the Airtable subscription is cancelled; a permanent backup and read-only DB viewer are in place
**Source phase**: 05.4 (INSERTED)
**Deferred at**: 2026-07-29 during v1.1 milestone close
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07
**Success Criteria** (what must be TRUE):
  1. A gap audit script compares every Airtable table's schema and row count against PostgreSQL and produces a written gap report — no data changes happen before this report is reviewed
  2. All gaps identified in the report are filled: missing columns added to existing tables, missing rows inserted, no existing rows duplicated
  3. Every Airtable attachment is verified to exist in R2; any missing attachments are downloaded before Airtable is cancelled
  4. Airtable Metadata API has been queried and all formula and lookup field definitions are stored in a permanent reference file on Hetzner (`.planning/research/airtable-formula-fields.md` or similar)
  5. A `pg_dump` compressed backup (`psalter-full-YYYYMMDD.sql.gz`) is stored in `/home/services/psalter/backups/` on Hetzner before Airtable is cancelled
  6. pgweb is deployed read-only (connected to the existing psalter PostgreSQL database), accessible at a Cloudflare Access-gated URL, and shows all tables including both Airtable-migrated and site-native tables
  7. A written "safe to cancel Airtable" checklist is produced and all items are checked off before the subscription is cancelled
**Plans**: [ ] Not planned (0 plans)

### Phase 999.2: Polish (BACKLOG)

**Goal**: OG images in place for social sharing; Lighthouse 90+ on key pages; bundle clean; every remaining route transition shows a skeleton; all clickable elements give immediate visual feedback
**Source phase**: 6
**Deferred at**: 2026-07-29 during v1.1 milestone close
**Requirements**: PERF-02, PERF-01 (remaining routes), OG images (next/og), Lighthouse 90+
**Success Criteria** (what must be TRUE):
  1. Each psalm and tune page generates a dynamic OG image (next/og) visible when the URL is shared on social platforms
  2. A bundle analysis confirms no unintended large dependencies; Lighthouse performance score is 90+ on the psalm list and psalm detail pages
  3. Navigating to any route not covered by Phase 4.5 skeletons (search, explore, daily, homepage) never shows a blank screen — a skeleton appears within one frame
  4. Every button, link, and card shows a CSS `:active` state change and a `useTransition` pending indicator when clicked
**Plans**: [ ] Not planned (0 plans)
