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
- [ ] **POLISH-03**: Lighthouse 90+ pass — *measured 2026-08-13 via Phase 15.2 (Lighthouse v13.4.1, mobile, `--throttling-method=simulate`, `localhost:3005`). **Status: deferred with documented ceiling. Not silently dropped — the ceiling is mechanical, not a measurement failure.** Median-of-5 scores (harness: `scripts/lighthouse-bench.mjs --runs 5`, ephemeral chrome, sequential to fit the 3.7GB VPS) per route, with spread:* `/` (homepage) = **0.68** (spread 0.49–0.78); `/psalms` = **0.69** (spread 0.65–0.80); `/psalms/23` = **0.45** (spread 0.42–0.59). *Each new median falls inside its baseline's min–max spread — the plan's noise rule rejects it as a real change.* Raw JSONs at `.planning/phases/15.2-lighthouse-final-tbt-reduction/15.2-baseline-median5.json` (after Phase 15.1) and `15.2-after-02-median5.json` (after Phase 15.2 Plan 02). Authoritative writeup: `.planning/phases/15.2-lighthouse-final-tbt-reduction/15.2-FINAL-ANALYSIS.md`. **The `qualities`/Turbopack-re-chunk narrative from Phase 15.1 is retracted** — see `.planning/phases/15.2-lighthouse-final-tbt-reduction/15.2-measurement-noise-evidence.md`. The two Lighthouse runs behind that claim have **identical framework chunk hashes** (`0r5n9xaeyh.pb.js` in both) and total script payloads differing by **28 bytes** (273,182 vs 273,210), while the slow run's `benchmarkIndex` was 477.5 (vs 1073 baseline — 2.2× slower CPU), `server-response-time` was 376 ms (5.9×), `network-rtt` was 654 ms (17×). The "regression" was a thrashing VPS run. A zero-code-change control reproduced ±6-point spread on `/psalms` and 3-point spread on `/` — a single VPS, single run, cannot detect anything smaller than a ~10 point change. **Mechanical blocker for 0.90 mobile:** framework-runtime chunk `0r5n9xaeyh.pb.js` = 71 KB transferred, 910–1134 ms scripting on every route, 25 KB "unused" bytes that `next/dynamic` cannot split (they are unhit framework paths in React 19 + Next 16's reconciler/router/RSC decoder, not app code). `next/dynamic` cannot shrink it; it *is* the thing that executes `next/dynamic`. Phase 15.2's only remaining all-routes lever (`SiteHeader`'s `GlobalSearch`/`FeedbackModal`/`useSession` deferral) confirmed by build artefact (no `GlobalSearch`/`FeedbackModal` in `.next/server/app/page.js`) and by tests, but moved TBT variance only — median scores inside baseline spread. The identified next lever is a **server-component `SiteHeader` with client islands** (theme toggle, search trigger, mobile sheet); estimated +5–12 points, moderate confidence, touches every page's chrome and carries real regression risk. Forward options for the user, recorded verbatim in `15.2-FINAL-ANALYSIS.md`: (a) accept current scores and document the ceiling, (b) one more phase scoped to the server-component root layout, (c) Cloudflare WAF rule to bypass bot-challenge on `/`, `/psalms`, `/psalms/[id]` for ~5–10 point recovery on the public URL only (user action in Cloudflare dashboard, out of Claude's authority).
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
| TLIST-01 | Phase 11 | Complete |
| TLIST-02 | Phase 11 | Complete |
| TLIST-03 | Phase 11 | Complete |
| TLIST-04 | Phase 11 | Complete |
| ASSET-01 | Phase 13 | Complete |
| POLISH-01 | Phase 14 | Pending |
| POLISH-02 | Phase 14 | Pending |
| POLISH-03 | Phase 15 → 15.1 → 15.2 | Deferred (median-of-5 0.68/0.69/0.45 vs 0.90 target; ceiling is framework runtime, not code) |
| POLISH-04 | Phase 14 | Pending |
| POLISH-05 | Phase 14 | Complete |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31/31 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-29 after roadmap creation (Phases 6-14 mapped, 31/31 requirements covered)*
