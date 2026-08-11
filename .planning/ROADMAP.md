# Roadmap: CPRC Psalter

## Overview

Rebuild of psalter.cprc.co.uk from Airtable + Softr to a self-hosted Next.js 15 application.

## Milestones

- ✅ **v1.0 Public Psalter** — Phases 1–4.12 (shipped 2026-07-29, see [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md))
- ✅ **v1.1 Precentor Portal & Polish** — Phases 5, 05.1–05.3 (shipped 2026-07-29, see [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md))
- 🚧 **v2.0 Public Beta** — Phases 6–14 (active)

## Phases

**Phase Numbering:**
- Integer phases (6, 7, 8...): Planned v2.0 milestone work, continuing from v1.1's last phase (05.3)
- Decimal phases (N.1, N.2): Urgent insertions (marked with INSERTED)

### v2.0 Public Beta (active)

- [ ] **Phase 6: Security & Data-Safety Prerequisites** - Close the unauthenticated `/dev/*` admin surface and back up tune JPGs before anything else touches them
- [ ] **Phase 7: Email Foundation (Resend Provisioning)** - Provision Resend, verify sending domain, confirm real-inbox delivery
- [x] **Phase 8: Feedback Email & Rate Limiting** (4/4 plans) — completed 2026-08-02 - Feedback submissions notify the owner by email and can't be spammed
- [x] **Phase 9: Changelog** (7/7 plans) — completed 2026-08-07 - Public changelog feed, inline admin authoring, homepage hero, email subscribe/broadcast
- [ ] **Phase 10: Tune Data Fixes** - Ps 148b duplicate, meter-mismatch banner, Backup/Historical data migration + sort, name-based slugs
- [ ] **Phase 11: Tune List & Selector Overhaul** - `/tunes` mirrors `/psalms`, mobile-fit sticky table, inline embed player, shared tune-picker component
- [ ] **Phase 12: Psalm Selector Polish** - Always-collapsed multi-version toggle, meter tags, search bar width fix
- [x] **Phase 13: Tune Image Compression** (3/3 plans) — completed 2026-08-11 - All 320 tune JPEGs compressed at w2000-q82 (91.2% reduction; 1.4 GiB → 126 MiB), archive-only verifier in place, human sign-off on live melisma-approved scores
- [ ] **Phase 14: Launch Polish** - OG images, favicon/404, Lighthouse 90+, remaining skeletons, click-feedback states (margin-crop follow-up from Phase 13 captured as pending todo at `.planning/todos/pending/follow-up-tune-image-margin-crop.md`, not yet inserted into the roadmap)

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

**Deferred at v1.1 close** (see [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md) "Scope Decisions"): Phase 05.4 (Airtable Exit Verification) and Phase 6 (Polish) never started — moved to `## Backlog` below as Phase 999.1 and 999.2. Phase 999.2's scope is now folded into v2.0 Phase 14 (Launch Polish) — see Backlog note below.

</details>

## Phase Details

### Phase 6: Security & Data-Safety Prerequisites
**Goal**: The site's admin surfaces are no longer publicly writable, and the irreplaceable tune-score images are safely backed up before anything else touches them
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Visiting any `/dev/melisma-editor` page or `/api/dev/*` route while logged out (or as a non-admin) is rejected server-side (401/redirect), not rendered or executed
  2. `GET /robots.txt` lists `Disallow: /dev/*`
  3. A tarball backup of `public/tunes/` exists off the live directory, verified to match the source file count and spot-checked for JPEG integrity
**Plans**: 3 plans (2 waves)
- [x] 06-01-PLAN.md — Relocate dead middleware into src/, extend it over /api/dev/*, add getAdminSessionOr401() helper + robots.ts
- [x] 06-02-PLAN.md — Per-route admin guards on all 8 /api/dev/* routes and 4 /dev pages, plus a 12-surface regression sweep
- [x] 06-03-PLAN.md — Verified off-repo tarball backup of the 326 tune score images

### Phase 7: Email Foundation (Resend Provisioning)
**Goal**: The site can send real email through Resend, from a domain that lands in real inboxes, not spam
**Depends on**: Nothing (independent of Phase 6)
**Requirements**: EMAIL-01, EMAIL-02
**Success Criteria** (what must be TRUE):
  1. `PSALTER_RESEND_API_KEY` is present in the shared env file and a Resend client sends successfully from the psalter sending subdomain
  2. Cloudflare DNS shows SPF, DKIM, and DMARC records verified in the Resend dashboard for the sending subdomain
  3. A test email sent through the new client is confirmed to land in the inbox (not spam) of a real Gmail account and a real Outlook account
**Plans**: 3 plans (2 waves)
- [x] 07-01-PLAN.md — Publish the missing DMARC record + DNS gate script, provision the sending-only PSALTER_RESEND_API_KEY, make the PM2 entrypoint load the shared env safely
- [x] 07-02-PLAN.md — Tested non-throwing sendEmail() wrapper around the Resend SDK (src/lib/email.ts) + CLI test-send script
- [x] 07-03-PLAN.md — Real-inbox delivery proof: Gmail + Outlook sends, SPF/DKIM/DMARC header verification, recorded evidence

### Phase 8: Feedback Email & Rate Limiting
**Goal**: Every feedback submission reaches the site owner's inbox immediately, and the endpoint can't be spammed
**Depends on**: Phase 7
**Requirements**: FEED-01, FEED-02
**Success Criteria** (what must be TRUE):
  1. Submitting the feedback form sends an email to manuelkuhs@gmail.com containing the submission content, for every submission
  2. A feedback DB write still succeeds even if the email send fails (email is fire-and-forget, never blocks the save)
  3. Submitting the feedback form rapidly above the configured threshold is rejected with a rate-limit response instead of sending unlimited emails
**Plans**: 4 plans (3 waves)
- [x] 08-01-PLAN.md — In-memory sliding-window rate limiter + hardened client-IP extraction (src/lib/rate-limit.ts)
- [x] 08-02-PLAN.md — Injection-safe owner-notification email builder + fire-and-forget send wrapper (src/lib/feedback-email.ts)
- [x] 08-03-PLAN.md — Wire 5/60s throttle + 429 and the notification send into POST /api/feedback, plus the modal's rate-limit message
- [x] 08-04-PLAN.md — Deploy, live burst test (5x200 + 429), and human confirmation of real inbox delivery

### Phase 9: Changelog
**Goal**: Visitors can read what's new, the admin can publish updates without a separate admin panel, and subscribers get notified by email
**Depends on**: Phase 7 (subscribe/broadcast slice needs the Resend client)
**Requirements**: CHLG-01, CHLG-02, CHLG-03, CHLG-04, CHLG-05
**Success Criteria** (what must be TRUE):
  1. `/changelog` lists all published posts reverse-chronologically with title, date, and body
  2. A logged-in admin sees an inline "write post" affordance directly on the live `/changelog` page and can publish a post without leaving the site or using a separate tool
  3. The homepage hero announces the v2.0 release
  4. A visitor can enter their email in a single field and subscribe with one action (no confirmation email required)
  5. Publishing a new changelog post emails all subscribers, and that email contains a working unsubscribe link that actually removes the subscriber
**Plans**: 7 plans (3 waves)
- [x] 09-01-PLAN.md — changelog_posts + changelog_subscribers schema, db:push, fetchPublishedPosts()
- [x] 09-02-PLAN.md — Public POST /api/subscribe (rate-limited, enumeration-safe) + POST /api/unsubscribe (token-gated hard delete, no GET)
- [x] 09-03-PLAN.md — src/lib/changelog-email.ts: broadcast email construction, per-token unsubscribe URL, maskEmail
- [x] 09-04-PLAN.md — Admin-gated POST /api/changelog + sequential, failure-tolerant subscriber broadcast
- [x] 09-05-PLAN.md — /changelog page: post list, admin-only inline composer, subscribe form
- [x] 09-06-PLAN.md — Read-only unsubscribe landing page + click-to-POST button, homepage v2.0 hero, Changelog nav entry
- [x] 09-07-PLAN.md — Deploy, live smoke, subscribe/publish/unsubscribe round trip, human inbox confirmation
**UI hint**: yes

### Phase 10: Tune Data Fixes
**Goal**: Tune data is correct and complete — no duplicate rows, meter-mismatch warnings surface everywhere they should, and tune URLs are permanent, readable slugs
**Depends on**: Nothing (independent track, can run parallel with Phases 7-9)
**Requirements**: TUNE-01, TUNE-02, TUNE-03, TUNE-04, TUNE-05
**Success Criteria** (what must be TRUE):
  1. Psalm 148b's tune listing shows exactly one row (no duplicate), because no two `psalm_version_tunes` rows are both flagged `is_primary` for the same version
  2. Viewing a psalm whose active tune's meter doesn't match the psalm's stated meter shows a mismatch warning banner in Staff, Solfège, and Sing views alike (e.g., Aurelia on Ps 119)
  3. Real Backup and Historical tune-usage data from Airtable is present in Postgres, visible where it previously showed placeholder or missing data
  4. Visiting an old numeric tune URL (`/tunes/169`) redirects to the new name-based slug (`/tunes/beatitudo`), and no old link 404s
**Plans**: 5 plans in 3 waves

Plans:
- [x] 10-01-PLAN.md — Schema delta + Ps 148b duplicate-primary fix, made structurally unrepeatable (wave 1)
- [x] 10-02-PLAN.md — Shared meter-mismatch predicate + warning banner in every notation view (wave 1)
- [x] 10-03-PLAN.md — Name-based tune slugs with 308 redirects for old numeric URLs (wave 1)
- [x] 10-04-PLAN.md — Airtable Backup/Historical tune data migrated into Postgres (wave 2)
- [x] 10-05-PLAN.md — Change Tune list tiered Backup → Historical → other; old tabs removed (wave 3)

**UI hint**: yes

### Phase 11: Tune List & Selector Overhaul
**Goal**: `/tunes` looks and works like `/psalms`, fits on mobile, and there's one shared tune-picker component instead of duplicates
**Depends on**: Phase 10 (list sort order and slugs must exist before finalizing display)
**Requirements**: TLIST-01, TLIST-02, TLIST-03, TLIST-04, TSEL-01
**Success Criteria** (what must be TRUE):
  1. `/tunes` shows the same split-leaf staff/solfège toggle views as `/psalms` (without lyrics), sorted Backup → Historical → other matching-meter tunes, with the redundant Meter indicator and old Backup/Historical tabs removed
  2. On a mobile-width viewport, the tune table's Recording column is visible by default and the table either fits or falls back to horizontal scroll cleanly
  3. Scrolling down a long tune list keeps the table header visible (sticky)
  4. Clicking a tune's URL icon expands an inline embed player (SoundCloud or ABC player) in place without navigating away; CSV export of that tune still contains the raw SoundCloud destination URL
  5. The Sing view's tune switcher, the Study tab's Change Tune dialog, and the precentor's tune picker all use one shared, `/tunes`-like selector component (one code change updates all three) — and that shared component shows the Backup → Historical → Other tiering everywhere, not just in the one picker that has it today

**Note** (added 2026-08-08, post-Phase-10): as of Phase 10, only the Study tab's `ChangeTuneDialog` has Backup/Historical tiering (`sortTunesByTier`) — it was the one plan 10-05 named explicitly. The Sing view's `TuneSwitcherSheet` (the picker on the page most visitors actually land on) and the precentor's `TunePickerModal` still have zero tiering. Don't treat "consolidate to one component" as satisfied by picking either existing component as the base and calling it done — the unified component must carry the tiering logic to all three call sites, or this phase silently regresses the Study tab's picker while fixing the other two.
**Plans**: 6 plans in 3 waves
Plans:
**Wave 1**
- [x] 11-01-PLAN.md — Shared NotationRendererClient prop helper; /tunes/[slug] + PsalmTabs adopt it (wave 1)
- [x] 11-02-PLAN.md — Shared TieredTuneRowList unit; ChangeTuneDialog refactored onto it (wave 1)
- [x] 11-03-PLAN.md — /tunes mobile columns, sticky header, widened tune query (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 11-04-PLAN.md — Sing view: tier-data plumbing, tiered TuneSwitcherSheet, notation-helper adoption (wave 2)
- [x] 11-05-PLAN.md — /tunes inline Recording/Score expand player (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 11-06-PLAN.md — Precentor picker tiering: batch tier fetch + tiered TuneTable rows (wave 3)
**UI hint**: yes

### Phase 12: Psalm Selector Polish
**Goal**: The psalm selector on multi-version psalms behaves predictably and its search bar fits the layout
**Depends on**: Nothing (independent of other phases)
**Requirements**: PSEL-01, PSEL-02, PSEL-03
**Success Criteria** (what must be TRUE):
  1. Reloading or revisiting a multi-version psalm page always shows the version toggle collapsed, regardless of prior expand state from a past visit
  2. A non-CM multi-version toggle box shows its meter abbreviation (e.g. "LM") next to the version label
  3. The search/filter bar's width matches the psalm listing grid and no longer overlaps the bookmark nav tabs on the right
**Plans**: 8 plans (3 original + 5 gap-closure from 12-VERIFICATION.md)
Plans:
**Wave 1**
- [x] 12-01-PLAN.md — Session-only multi-version expand state + Book-tab gutter on the sticky search header (PSEL-01, PSEL-03)
- [x] 12-04-PLAN.md — Gap closure: decide the Book-tab visibility rule (Gap 2) and the "Show meter" collapsed-box rule (Gap 3)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 12-02-PLAN.md — Meter abbreviation module + meter tag on the collapsed multi-version toggle (PSEL-02)
- [x] 12-05-PLAN.md — Gap closure: mobile search placeholder fit (Gap 1) + Book I–V tabs on landscape phones (Gap 2) (PSEL-03)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 12-03-PLAN.md — Live Playwright measurement sweep + human sign-off (PSEL-01, PSEL-02, PSEL-03)
- [x] 12-06-PLAN.md — Gap closure: meter-tag visibility respec — gated on Show meter / expand state (Gap 3) (PSEL-02)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 12-07-PLAN.md — Gap closure: diagnose and fix oversized boxes and meter/number overlay (Gap 4) (PSEL-02)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 12-08-PLAN.md — Gap closure: production deploy + developer re-verification of all four gaps
**UI hint**: yes

### Phase 13: Tune Image Compression
**Goal**: Tune score JPEGs load faster without losing legibility, and the originals stay safely backed up
**Depends on**: Phase 6 (backup must exist before compression touches originals)
**Requirements**: ASSET-01
**Success Criteria** (what must be TRUE):
  1. All compressed tune JPEGs are smaller in file size than their originals while remaining legible on a melisma-approved tune spot-check
  2. The pre-compression backup from Phase 6 is confirmed intact and untouched after the compression run
**Plans**: 3 plans in 3 waves
Plans:
**Wave 1**
- [x] 13-01-PLAN.md — Build guarded compression script, query approved-tune images, render four-variant sample comparison page; human picks the setting (wave 1) — completed 2026-08-11
**Wave 2** *(blocked on Wave 1)*
- [x] 13-02-PLAN.md — Pre-swap backup restorability proof, full verifier for all 326 files, full batch compression into staging dir (wave 2) — completed 2026-08-11
**Wave 3** *(blocked on Wave 2)*
- [x] 13-03-PLAN.md — Atomic swap into public/tunes/, archive-only verifier, live-URL sweep, human legibility sign-off and cleanup (wave 3) — completed 2026-08-11

### Phase 14: Launch Polish
**Goal**: The site looks and performs like a finished public product before beta testers arrive — social previews, a real 404, fast Lighthouse scores, and consistent loading/click feedback everywhere
**Depends on**: Phases 6-13 (touches routes and pages finalized by the other phases)
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05
**Success Criteria** (what must be TRUE):
  1. Sharing a psalm or tune page link on social media shows a generated OG image preview (not a blank/default card)
  2. The site has a real favicon and a styled 404 page instead of the Next.js default
  3. A Lighthouse run on the psalm list and psalm detail pages scores 90+ on Performance
  4. Navigating to search, explore, daily, or the homepage never shows a blank screen during load — a skeleton appears within one frame
  5. Every button, link, and card gives an immediate visual `:active`/pending state when clicked
**Plans**: 4 plans in 3 waves
Plans:
**Wave 1**
- [ ] 14-01-PLAN.md — Styled 404 page per UI-SPEC §1 + favicon (icon.svg + apple-icon.png) + metadataBase in layout.tsx (wave 1)
**Wave 2** *(parallel — no plan-to-plan dependencies)*
- [ ] 14-02-PLAN.md — OG images for psalm + tune routes via next/og ImageResponse, 1200x630, edge runtime (wave 2)
- [ ] 14-03-PLAN.md — Homepage skeleton (NEW src/app/loading.tsx) + richer daily skeleton (REPLACE src/app/daily/loading.tsx) + verify explore skeleton (wave 2)
**Wave 3** *(blocked on Waves 1-2 merging + deploying)*
- [ ] 14-04-PLAN.md — Click-feedback mechanical sweep across src/components/ and src/app/**/page.tsx (normalize 0.97→0.98, add active:bg-muted/translate-y-px), exclude Dialog/Sheet/Popover + Button shadcn + disabled, document contract + run Lighthouse 90+ verification against production (wave 3)
**UI hint**: yes

## Backlog

Deferred, not part of the active v2.0 milestone. Pick up via `/gsd-phase` + `/gsd-discuss-phase` whenever prioritised.

### Phase 999.1: Airtable Exit Verification (BACKLOG)

**Goal**: Every byte of Airtable data is accounted for in PostgreSQL and R2 before the Airtable subscription is cancelled; a permanent backup and read-only DB viewer are in place
**Source phase**: 05.4 (INSERTED)
**Deferred at**: 2026-07-29 during v1.1 milestone close
**Note**: v2.0 Phase 10 migrates the specific Backup/Historical tune fields needed for TUNE-03/04, but does not close out full Airtable decommissioning — that remains here.
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

### ~~Phase 999.2: Polish (BACKLOG)~~ — folded into v2.0 Phase 14

~~**Goal**: OG images in place for social sharing; Lighthouse 90+ on key pages; bundle clean; every remaining route transition shows a skeleton; all clickable elements give immediate visual feedback~~

This scope (PERF-01, PERF-02, OG images, Lighthouse 90+, remaining skeletons, click-feedback) was folded into v2.0 as Phase 14 (Launch Polish) rather than run as a separate backlog phase — see `.planning/REQUIREMENTS.md` POLISH-01 through POLISH-05.

## Progress

**Execution Order (v2.0):**
Phases 7 and 10 have no dependencies on Phase 6 or each other and may be worked in any order; Phase 8 and Phase 9 depend on Phase 7; Phase 11 depends on Phase 10; Phase 13 depends on Phase 6; Phase 14 depends on all prior v2.0 phases.

| Phase | Plans Complete | Status | Completed |
|-------|-----------------|--------|-----------|
| 6. Security & Data-Safety Prerequisites | 0/TBD | Not started | - |
| 7. Email Foundation (Resend Provisioning) | 0/TBD | Not started | - |
| 8. Feedback Email & Rate Limiting | 4/4 | Complete | 2026-08-02 |
| 9. Changelog | 7/7 | Complete   | 2026-08-07 |
| 10. Tune Data Fixes | 5/5 | Complete    | 2026-08-08 |
| 11. Tune List & Selector Overhaul | 6/6 | Complete    | 2026-08-09 |
| 12. Psalm Selector Polish | 8/8 | Complete    | 2026-08-10 |
| 13. Tune Image Compression | 0/TBD | Not started | - |
| 14. Launch Polish | 0/TBD | Not started | - |
