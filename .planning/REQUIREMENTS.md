# Requirements: CPRC Psalter — v2.0 Public Beta

**Defined:** 2026-07-29
**Core Value:** A precentor during worship can instantly find the psalms chosen for a service and follow the live-rendered tune notation with lyrics beneath the notes — hymnal-style — without relying on slow Softr or static images.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Security & Data Safety

- [ ] **SEC-01**: `/dev/melisma-editor` and its 8 `/api/dev/*` routes require an authenticated admin session (server-side check, not client-only) — currently live and publicly writable on production
- [ ] **SEC-02**: `robots.txt` disallows `/dev/*`
- [ ] **SEC-03**: A verified, restorable backup of `public/tunes/` JPGs exists before any compression script touches the originals

### Email Infrastructure

- [ ] **EMAIL-01**: Resend API key provisioned (`PSALTER_RESEND_API_KEY`); sending subdomain verified (SPF/DKIM/DMARC) in Cloudflare DNS
- [ ] **EMAIL-02**: Test sends confirmed landing in real Gmail/Outlook inboxes, not just the Resend dashboard log

### Feedback

- [ ] **FEED-01**: Feedback form submissions trigger an email to the site owner (manuelkuhs@gmail.com) on every submission
- [ ] **FEED-02**: Feedback API is rate-limited

### Changelog

- [ ] **CHLG-01**: `/changelog` page lists posts reverse-chronologically (title, date, body)
- [ ] **CHLG-02**: Logged-in admin can write and publish changelog posts inline from the live site — no separate admin panel
- [ ] **CHLG-03**: Homepage hero announces the v2.0 release
- [ ] **CHLG-04**: Visitor can subscribe to updates via email (single field, single opt-in)
- [ ] **CHLG-05**: Publishing a changelog post emails subscribers, with a working unsubscribe link

### Tune Data Fixes

- [ ] **TUNE-01**: Ps 148b duplicate row fixed (root cause: two `psalm_version_tunes` rows both flagged `is_primary` for the same version)
- [ ] **TUNE-02**: Meter-mismatch warning banner shown in Staff/Solfège/Sing views when the active tune's meter doesn't match the psalm's stated meter (generalizes the Aurelia/Ps 119 case; reuses the existing precenting-set mismatch check)
- [ ] **TUNE-03**: Real Backup/Historical tune data migrated from Airtable (`Manuel CPRC backup`, `CPRC historical tune usage` / weighted frequency rollups) into Postgres
- [ ] **TUNE-04**: Change Tune list sorted Backup → Historical → other matching-meter tunes; redundant Meter indicator removed (already filtered); old "Backup Tunes"/"Historical Tunes" tabs removed from the tabbed section once the reorder is live
- [ ] **TUNE-05**: Tune slugs are name-based (`/tunes/beatitudo`) with full redirect coverage for old numeric URLs (`/tunes/169`)

### Psalm Selector

- [ ] **PSEL-01**: Multi-version psalms always collapse on page load (no persisted expand state across visits)
- [ ] **PSEL-02**: Non-CM multi-version toggle boxes show a short meter tag (e.g. "LM")
- [ ] **PSEL-03**: Search/filter bar width matches the psalm listing grid (no overlap with the bookmark nav tabs on the right)

### Tune Selector

- [ ] **TSEL-01**: Single-psalm view and precent-list view share one tune-picker component (mirrors the existing psalm-picker consolidation)

### Tune List Display

- [ ] **TLIST-01**: `/tunes` display mirrors `/psalms` (staff + solfège split-leaf views, without lyrics)
- [ ] **TLIST-02**: Recording column visible by default; default table fits mobile viewport with horizontal scroll fallback
- [ ] **TLIST-03**: `/tunes` table header is sticky
- [ ] **TLIST-04**: Tune URL icon opens an inline embed player (SoundCloud and/or abc tune player if digitised); CSV export still exports the raw SoundCloud destination URL

### Assets

- [ ] **ASSET-01**: All tune JPEGs compressed for faster display, originals backed up (depends on SEC-03)

### Polish (folded in from Backlog Phase 999.2)

- [ ] **POLISH-01**: OG images
- [ ] **POLISH-02**: Favicon + 404 page
- [ ] **POLISH-03**: Lighthouse 90+ pass
- [ ] **POLISH-04**: Remaining `loading.tsx` skeletons (search, explore, daily, homepage)
- [ ] **POLISH-05**: Click-feedback states

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
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| EMAIL-01 | TBD | Pending |
| EMAIL-02 | TBD | Pending |
| FEED-01 | TBD | Pending |
| FEED-02 | TBD | Pending |
| CHLG-01 | TBD | Pending |
| CHLG-02 | TBD | Pending |
| CHLG-03 | TBD | Pending |
| CHLG-04 | TBD | Pending |
| CHLG-05 | TBD | Pending |
| TUNE-01 | TBD | Pending |
| TUNE-02 | TBD | Pending |
| TUNE-03 | TBD | Pending |
| TUNE-04 | TBD | Pending |
| TUNE-05 | TBD | Pending |
| PSEL-01 | TBD | Pending |
| PSEL-02 | TBD | Pending |
| PSEL-03 | TBD | Pending |
| TSEL-01 | TBD | Pending |
| TLIST-01 | TBD | Pending |
| TLIST-02 | TBD | Pending |
| TLIST-03 | TBD | Pending |
| TLIST-04 | TBD | Pending |
| ASSET-01 | TBD | Pending |
| POLISH-01 | TBD | Pending |
| POLISH-02 | TBD | Pending |
| POLISH-03 | TBD | Pending |
| POLISH-04 | TBD | Pending |
| POLISH-05 | TBD | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 0 (pending roadmap creation)
- Unmapped: 30 ⚠️

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-29 after initial definition*
