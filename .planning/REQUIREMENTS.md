# Requirements: CPRC Psalter — v2.0 Public Beta

**Defined:** 2026-07-29
**Core Value:** A precentor during worship can instantly find the psalms chosen for a service and follow the live-rendered tune notation with lyrics beneath the notes — hymnal-style — without relying on slow Softr or static images.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Security & Data Safety

- [x] **SEC-01**: `/dev/melisma-editor` and its 8 `/api/dev/*` routes require an authenticated admin session (server-side check, not client-only) — currently live and publicly writable on production — Phase 6
- [x] **SEC-02**: `robots.txt` disallows `/dev/*` — Phase 6
- [x] **SEC-03**: A verified, restorable backup of `public/tunes/` JPGs exists before any compression script touches the originals — Phase 6

### Email Infrastructure

- [x] **EMAIL-01**: Resend API key provisioned (`PSALTER_RESEND_API_KEY`); sending subdomain verified (SPF/DKIM/DMARC) in Cloudflare DNS — Phase 7 (07-01)
- [ ] **EMAIL-02**: Test sends confirmed landing in real Gmail/Outlook inboxes, not just the Resend dashboard log — **partial**: Gmail confirmed (Primary inbox, spf/dkim/dmarc all pass at mail.gsdlabs.dev), Outlook/Microsoft-family explicitly skipped by human decision, not yet attempted — see `.planning/phases/07-email-foundation-resend-provisioning/07-03-DELIVERY-EVIDENCE.md`

### Feedback

- [x] **FEED-01**: Feedback form submissions trigger an email to the site owner (manuelkuhs@gmail.com) on every submission
- [ ] **FEED-02**: Feedback API is rate-limited — **partial**: rate limiting is fully verified live end-to-end at the API level (real deployed endpoint, real per-IP counter, `200 200 200 200 200 429` burst sequence with `Retry-After` header), but the browser-UI rendering of the rate-limit message on the 6th rapid submission was not human-verified live — human explicitly skipped that check as redundant with the API-level proof; see `.planning/phases/08-feedback-email-rate-limiting/08-04-LIVE-EVIDENCE.md`

### Changelog

- [x] **CHLG-01**: `/changelog` page lists posts reverse-chronologically (title, date, body)
- [x] **CHLG-02**: Logged-in admin can write and publish changelog posts inline from the live site — no separate admin panel
- [x] **CHLG-03**: Homepage hero announces the v2.0 release
- [x] **CHLG-04**: Visitor can subscribe to updates via email (single field, single opt-in)
- [x] **CHLG-05**: Publishing a changelog post emails subscribers, with a working unsubscribe link

### Tune Data Fixes

- [x] **TUNE-01**: Ps 148b duplicate row fixed (root cause: two `psalm_version_tunes` rows both flagged `is_primary` for the same version)
- [x] **TUNE-02**: Meter-mismatch warning banner shown in Staff/Solfège/Sing views when the active tune's meter doesn't match the psalm's stated meter (generalizes the Aurelia/Ps 119 case; reuses the existing precenting-set mismatch check)
- [x] **TUNE-03**: Real Backup/Historical tune data migrated from Airtable (`Manuel CPRC backup`, `CPRC historical tune usage` / weighted frequency rollups) into Postgres
- [x] **TUNE-04**: Change Tune list sorted Backup → Historical → other matching-meter tunes; redundant Meter indicator removed (already filtered); old "Backup Tunes"/"Historical Tunes" tabs removed from the tabbed section once the reorder is live
- [x] **TUNE-05**: Tune slugs are name-based (`/tunes/beatitudo`) with full redirect coverage for old numeric URLs (`/tunes/169`)

### Psalm Selector

- [x] **PSEL-01**: Multi-version psalms always collapse on page load (no persisted expand state across visits)
- [x] **PSEL-02**: Non-CM multi-version toggle boxes show a short meter tag (e.g. "LM")
- [x] **PSEL-03**: Search/filter bar width matches the psalm listing grid (no overlap with the bookmark nav tabs on the right)

### Tune Selector

- [x] **TSEL-01**: Single-psalm view and precent-list view share one tune-picker component (mirrors the existing psalm-picker consolidation)

### Tune Page First-Class Surface

- [ ] **TPAGE-01**: The single-psalm view's tune selector modal and the precent list view's tune selector modal are the SAME component, living permanently under `/tunes` (e.g. `src/components/tune-picker/` or `src/app/tunes/_components/`) — no orphan duplicate modal anywhere in `src/components/`. Re-validates and extends TSEL-01's consolidation goal.
- [ ] **TPAGE-02**: `/tunes/[slug]` renders the same staff-only and solfège-only split-leaf views as `/psalms/[slug]`, sharing `NotationRendererClient` (no lyrics on the tune page). Tune player is included, positioned consistently with the psalm view.
- [ ] **TPAGE-03**: `/tunes/[slug]` uses a tabbed layout with **Details** (metadata + recommended psalms) and **Notation** (staff/solfège split-leaf + player) tabs. URL search-param state is preserved on refresh. Default tab is Details.

### Tune List Display

- [x] **TLIST-01**: `/tunes` display mirrors `/psalms` (staff + solfège split-leaf views, without lyrics)
- [x] **TLIST-02**: Recording column visible by default; default table fits mobile viewport with horizontal scroll fallback
- [x] **TLIST-03**: `/tunes` table header is sticky
- [x] **TLIST-04**: Tune URL icon opens an inline embed player (SoundCloud and/or abc tune player if digitised); CSV export still exports the raw SoundCloud destination URL

### Assets

- [x] **ASSET-01**: All tune JPEGs compressed for faster display, originals backed up (depends on SEC-03) — completed 2026-08-11 (Phase 13)

### Polish (folded in from Backlog Phase 999.2)

- [ ] **POLISH-01**: OG images
- [ ] **POLISH-02**: Favicon + 404 page
- [x] **POLISH-03**: Lighthouse 90+ pass — *verified 2026-08-13 via Google PageSpeed Insights (Lighthouse v13.4.1, emulated Moto G Power, Slow 4G, run from Google's data centers — no VPS CPU contention). Performance **96** (homepage) / **100** (/psalms) / **100** (/psalms/23). Accessibility, Best Practices, SEO = 100 across all three. Full evidence + metric values at `.planning/phases/15.2-lighthouse-final-tbt-reduction/15.2-pagespeed-insights-results.txt`. Earlier "deferred" state was an artefact of VPS CPU contention — the 3.7GB VPS runs three Claude processes + playwright-daemon + gsddashboard + pm2 (load avg 2.56 on ~1 CPU equivalent), which inflated local Lighthouse TBT by 10–100× vs the real measurement. The local Lighthouse harness (`scripts/lighthouse-bench.mjs`) and the framework-chunk noise disproof (`15.2-measurement-noise-evidence.md`) are preserved as supplementary evidence. Phases 15, 15.1, and 15.2 collectively shipped: 7 `*Client.tsx` dynamic-import wrappers (PlayMiniBar, PsalmListingGrid, PsalmPickerModal, PsalmTopBar, OnboardingTour, TuneSwitcherSheet, GearPopover), logo next/image conversion with crisp `sizes=(min-width: 768px) 350px, 175px` selector at q=75, Geist font pruning, PsalmListingGrid hydration-cost batching, SiteHeader.tsx `GlobalSearch`/`FeedbackModal` deferral, scripts/lighthouse-bench.mjs reusable median-of-N harness.*
- [ ] **POLISH-04**: Remaining `loading.tsx` skeletons (search, explore, daily, homepage)
- [x] **POLISH-05**: Click-feedback states — *verified 2026-08-11: 51 active:bg-muted instances across 21 files; Pattern A on 40 Link/button/a elements, Pattern B on 9 card wrappers; 0.97 → 0.98 normalization applied per UI-SPEC §4. See `.planning/phases/14-launch-polish/14-04-click-feedback-contract.md`.*

## v2 Requirements

Deferred to future release, carried over from prior milestones.

- User accounts for congregation members (favourites, reading plan tracking) — adds GDPR surface area
- Admin UI (Directus/NocoDB) to replace Airtable editorial interface — post-launch low priority
- abcjs audio playback on public tune pages (currently scoped to precentor portal only)
- Dark mode is shipped; four-part SATB harmonisation remains deferred pending copyright check

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Double opt-in / confirmed-subscribe email flow | Overkill for a subscriber base in the tens, personally known to the site owner (research: FEATURES.md) |
| Changelog tags/filter UI | No volume of posts yet to justify filtering |
| Feedback digest emails (vs. per-submission) | Digesting delays owner response to time-sensitive feedback at beta-tester volume |
| CAPTCHA/Turnstile on feedback or subscribe forms | Rate-limiting is sufficient at this scale; adds friction for a trusted small audience |
| SoundCloud Widget JS API (vs. plain iframe embed) | Massive complexity increase for a "click icon → inline player" spec; plain iframe already proven in `TuneAudioPlayer.tsx` |
| Headless CMS or WYSIWYG editor for changelog | One author, occasional short posts — a DB table + Markdown textarea is proportionate |
| Redis-backed rate limiting | Single PM2 fork-mode process doesn't need external rate-limit infra at this scale |
| Full Airtable exit / decommissioning | Remains Backlog Phase 999.1 — this milestone only migrates the specific Backup/Historical tune fields needed for TUNE-03/04 |
| Four-part SATB harmonisation rendering | Copyright legal check required before encoding |
| In-app ABC notation editor | Admin concern, not user concern |
| Mobile app / PWA offline mode | Out of scope |
| Social features (sharing, comments) | Out of scope |
| Multi-tenancy (other congregations) | Out of scope unless explicitly decided otherwise |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 6 | Complete |
| SEC-02 | Phase 6 | Complete |
| SEC-03 | Phase 6 | Complete |
| EMAIL-01 | Phase 7 | Complete |
| EMAIL-02 | Phase 7 | Partial — Gmail confirmed; Outlook/Microsoft-family unverified (skipped by human decision, see 07-03-DELIVERY-EVIDENCE.md) |
| FEED-01 | Phase 8 | Complete |
| FEED-02 | Phase 8 | Partial — API-level rate limiting fully verified live; UI message display skipped by human decision (see 08-04-LIVE-EVIDENCE.md) |
| CHLG-01 | Phase 9 | Complete |
| CHLG-02 | Phase 9 | Complete |
| CHLG-03 | Phase 9 | Complete |
| CHLG-04 | Phase 9 | Complete |
| CHLG-05 | Phase 9 | Complete |
| TUNE-01 | Phase 10 | Complete |
| TUNE-02 | Phase 10 | Complete |
| TUNE-03 | Phase 10 | Complete |
| TUNE-04 | Phase 10 | Complete |
| TUNE-05 | Phase 10 | Complete |
| PSEL-01 | Phase 12 | Complete |
| PSEL-02 | Phase 12 | Complete |
| PSEL-03 | Phase 12 | Complete |
| TSEL-01 | Phase 11 | Complete |
| TPAGE-01 | Phase 16 | Pending |
| TPAGE-02 | Phase 16 | Pending |
| TPAGE-03 | Phase 16 | Pending |
| TLIST-01 | Phase 11 | Complete |
| TLIST-02 | Phase 11 | Complete |
| TLIST-03 | Phase 11 | Complete |
| TLIST-04 | Phase 11 | Complete |
| ASSET-01 | Phase 13 | Complete |
| POLISH-01 | Phase 14 | Pending |
| POLISH-02 | Phase 14 | Pending |
| POLISH-03 | Phase 15 → 15.1 → 15.2 | Complete (PSI Perf 96/100/100 on / / /psalms / /psalms/23) |
| POLISH-04 | Phase 14 | Pending |
| POLISH-05 | Phase 14 | Complete |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31/31 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-29 after roadmap creation (Phases 6-14 mapped, 31/31 requirements covered)*
