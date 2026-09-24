# Feature Research

**Domain:** v2.0 Public Beta polish features — changelog, email subscribe, feedback-notify-owner, inline tune embed player
**Researched:** 2026-07-29
**Confidence:** MEDIUM-HIGH (patterns are well-established web conventions; verified against existing codebase patterns and current Resend/SoundCloud docs, not deep per-library doc lookups since no exotic libraries are involved)

> Note: This file was rewritten for the v2.0 Public Beta milestone. The v1.0 Public Psalter milestone's feature research (psalm/tune browse, notation, search, daily plan — all now shipped) is preserved in `.planning/milestones/v1.0-REQUIREMENTS.md` and is no longer the active scope of this file.

## Context

This is **not** a SaaS product. It's a single-owner personal/church site about to be shown to 2-3 outside beta testers plus an existing small congregation. Every recommendation below is calibrated to that scale — tens of readers/subscribers, not thousands. Where a "normal" web pattern exists for enterprise scale, the anti-features section explicitly flags the overkill version and names the proportionate substitute.

The codebase already has real precedent for 3 of the 4 features:
- `FeedbackModal.tsx` + `/api/feedback` — feedback form already exists, currently DB-only (no email)
- `TuneAudioPlayer.tsx` — already does a click-to-expand inline SoundCloud/YouTube iframe on the **tune detail page** (not yet on the **tune list**) — this is the exact interaction pattern the new list-inline player should reuse, not reinvent
- `/admin-only/` route namespace — existing gated-admin pattern the changelog's inline authoring should reuse
- Resend is the project's designated email provider (per stack registry / global CLAUDE.md), but no `PSALTER_RESEND_API_KEY` exists yet — needs provisioning before either changelog-subscribe or feedback-notify can ship

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Changelog: reverse-chronological post list | Any "what's new" page — even a single-owner one — is read top-to-bottom, newest first | LOW | A single DB table (`changelog_entries`: id, title, body markdown/richtext, published_at) + one list page. No categories/tags needed at this scale. |
| Changelog: single entry has a date and a title | Minimum unit of "a changelog" — readers scan dates to know what's new since they last looked | LOW | Date can be `published_at`, no need for a separate "last modified" field. |
| Changelog: homepage teaser/hero linking to latest entry | The milestone explicitly calls for a homepage hero — surfaces "what's new" to returning congregation members without them hunting for a `/changelog` link | LOW | Reuse existing homepage layout; just render latest 1 entry title + date + "See all updates →" link. |
| Feedback → owner email notification | A feedback form that silently writes to a DB nobody checks is a form that doesn't work in practice for a single-owner site — the owner needs to *know* a submission happened | LOW | Send-on-submit via Resend, one email per submission, no digest needed (volume will be a handful/month at most). This closes the gap explicitly named in PROJECT.md ("only saves to DB, no email sent"). |
| Feedback email includes message + optional name/email/page URL | These fields already exist in `FeedbackModal.tsx` — the email must carry all of them or the owner loses context vs. checking the DB directly | LOW | Straight passthrough of existing form fields into the email body; no new form fields needed. |
| Feedback email rate-limiting | Prevents a broken client, bot, or single confused user from spamming the owner's inbox | LOW-MEDIUM | Project already scopes this ("rate-limited" in PROJECT.md). Simple IP or session-based throttle (e.g. N submissions per hour) is sufficient — no need for CAPTCHA/Turnstile at this traffic level. |
| Email subscribe: single email field + submit | The absolute minimum a "subscribe to updates" UX needs — visitors expect one field, one button, nothing else | LOW | Add to changelog page and/or footer. No name field needed. |
| Email subscribe: confirmation on submit | Users expect *some* feedback ("You're subscribed!" / "Check your email to confirm") — silent submission reads as broken | LOW | Simple inline success state, same pattern as `FeedbackModal.tsx`'s `status === 'success'` branch. |
| Email subscribe: unsubscribe link in every email | Table stakes for **any** bulk/marketing-adjacent email, not just at scale — CAN-SPAM / GDPR expectation, and it's the bare minimum of respecting a handful of real people's inboxes | LOW | Resend Broadcasts/Audiences supports this natively (contact `unsubscribed` flag + Resend-hosted unsubscribe link) — don't hand-roll token-based unsubscribe. |
| Inline embed player: click one icon to expand player in place | This is the explicit ask — "clicking one icon should let the user play... inline without leaving the list" | LOW-MEDIUM | Directly reuse the click-to-expand-iframe pattern already built in `TuneAudioPlayer.tsx` (`expanded` state → renders SoundCloud iframe below the trigger). Same interaction, different container (table row vs. detail page section). |
| Inline embed player: closes/collapses again | If a user can expand a row's player, they expect to be able to collapse it again (especially in a table where multiple rows might otherwise all stay expanded) | LOW | Toggle the same `expanded` boolean back to `false`; consider auto-collapsing any previously-expanded row when a new one opens, so the table doesn't grow tall with 5 stacked iframes. |

### Differentiators (Competitive Advantage)

Note: "competitive advantage" is a soft framing for a site with no real competitor — read this section as "goes beyond bare minimum and genuinely helps the small audience," not "beats a rival product."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Changelog: inline admin authoring (write a post directly on the live site) | For a single-owner site, a full CMS/admin panel for one content type is overkill — but a simple "if I'm logged in as admin, show an inline 'New Post' form at the top of `/changelog`" is genuinely faster than SSH+DB-insert or a separate admin route | LOW-MEDIUM | Reuse the existing `/admin-only/` gate pattern already used for the feedback viewer. Markdown textarea + title + publish is enough — no rich WYSIWYG editor needed. |
| Inline embed player: fallback to site's own abcjs notation when no SoundCloud link exists | This is the project's actual differentiator (live abcjs rendering is the whole "Core Value" of the app per PROJECT.md) — surfacing it as a lightweight inline preview in the tune list, not just full detail pages, reinforces that value in a place beta testers will browse first | MEDIUM | The codebase already has abcjs synth/playback machinery for the singing view (`AbcAudioControls.tsx`, `AbcPlayer.tsx`, `abc-soundfont.ts`) — this is about *reusing* that existing playback engine in a smaller inline context, not building new audio playback. Gate this on the tune being one of the 70 melisma-approved tunes (same gate the singing view already uses) — for the other 102, keep the SoundCloud/YouTube-or-nothing path. |
| Feedback email: reply-to set to submitter's email (if provided) | Lets the owner hit "Reply" in their normal email client to respond directly to a beta tester — meaningfully lowers friction for a 2-3 person beta loop where every piece of feedback matters | LOW | Resend supports `reply_to` on send; trivial to wire when `email` field is non-null on the submission. |
| Changelog entry types/emoji tag (Fixed / Added / Improved) | Helps a technical reader (or the owner reviewing their own history) scan quickly, without needing full taxonomy/filtering UI | LOW | A single enum column + small colored badge is proportionate; do NOT build a tag filter UI for this (see anti-features). |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Double opt-in (confirm-your-email) subscribe flow | "Best practice" for newsletter deliverability/compliance at scale | At ~10s of subscribers who are personally known to the owner (congregation + 2-3 beta friends), the extra email round-trip is friction with no real payoff — deliverability reputation isn't a concern at this volume, and Resend's own sending domain already handles authentication (SPF/DKIM) | Single opt-in: submit email → immediately added to Resend audience → confirmation shown inline on the page. Keep the unsubscribe link (that one *is* table stakes, not overkill) but skip the "click to confirm" email step. |
| Full CMS / rich WYSIWYG editor for changelog | Feels like "what a real blog has" | Massive overkill for a single author writing occasional release notes — adds a new dependency (Tiptap/Editor.js/etc.), new failure surface, and design/QA burden for a feature used by exactly one person | Plain markdown textarea (already a familiar pattern if any other admin text field in the app uses one) rendered with a lightweight markdown-to-HTML lib on read. |
| Changelog tags/categories with filter UI | Blogs "should" have taxonomy | With a handful of posts a year, there's nothing to filter — a filter UI with zero practical use is pure surface area | At most, a single-word inline badge per entry (see Differentiators) with no filtering. Revisit only if post volume grows past ~30-50 entries. |
| Feedback digest email (daily/weekly rollup) instead of per-submission | Avoids "email overload" — a pattern that matters at high submission volume | At beta-tester + small-congregation volume, submissions will be rare enough (likely single digits per week at most) that a digest just delays the owner's ability to act on time-sensitive feedback, and adds a cron/scheduling dependency for no benefit | Send immediately, one email per submission. Revisit only if volume becomes genuinely high (unlikely for this site's audience ceiling). |
| CAPTCHA / Cloudflare Turnstile on feedback or subscribe forms | Standard anti-spam hardening for public forms | The whole app already sits behind Cloudflare (per infra), and at this traffic/visibility level, bot submissions are unlikely to be a real problem before it's noticed and addressed reactively | Simple rate-limiting (already scoped in PROJECT.md) is sufficient for launch; add Turnstile later only if spam is actually observed. |
| SoundCloud Widget JS API (`SC.Widget`, event binding, custom play/pause controls) | Looks like the "proper" way to integrate SoundCloud, offers programmatic control (play/pause/seek, currently-playing events) | Massive complexity increase (loading external widget script, managing widget instances per row, wiring custom UI controls) for a feature whose entire spec is "click icon → inline player appears, plays" — the plain `<iframe src="https://w.soundcloud.com/player/?url=...">` embed (already used in `TuneAudioPlayer.tsx`) does this with zero extra JS | Reuse the existing plain-iframe embed approach from `TuneAudioPlayer.tsx` as-is, just relocated into a table row. Only reach for the Widget API if a future requirement needs cross-row play/pause coordination or playback analytics. |
| Multiple simultaneously-expanded inline players in the tune list | Seems like it "just works" if each row manages its own expanded state independently | Several autoplaying/audible iframes at once is a bad UX (overlapping audio) and a table that silently grows very tall as more rows expand — surprising behavior nobody asked for | Track a single "currently expanded row id" at the table level; expanding a new row auto-collapses the previous one. |
| Newsletter-style rich HTML email templates (React Email component library, branded header/footer, etc.) | Looks more "professional" | For a handful of subscribers who are personally known to the owner, a plain-text-leaning email with the changelog entry title/body and a link back to the site is completely sufficient — investing in a template system is effort disproportionate to a single-owner project | Simple HTML email (can still use Resend's basic HTML support) with entry title, short body/excerpt, and a "Read more" link. Skip React Email component tooling unless email frequency grows significantly. |

## Feature Dependencies

```
Changelog list/detail pages
    └──requires──> changelog_entries DB table + migration
    └──requires──> /admin-only/ auth gate (already exists) ──for──> inline admin authoring

Email subscribe (changelog)
    └──requires──> PSALTER_RESEND_API_KEY provisioned (does not exist yet)
    └──requires──> Resend Audience created (one audience: "changelog updates")
    └──requires──> Changelog entries existing (nothing to notify about otherwise)
    └──enhances──> Changelog (adds "notify me" loop on top of read-only posts)

Feedback → owner email
    └──requires──> PSALTER_RESEND_API_KEY provisioned (shared with subscribe feature — provision once)
    └──requires──> existing /api/feedback route (already exists, DB-only today) — extend, don't replace
    └──requires──> rate-limiting logic (new, small)

Inline embed player (tune list)
    └──requires──> existing soundcloudUrl/youtubeUrl columns on tunes table (already exist)
    └──requires──> TuneTable.tsx "Recording" column (already exists, currently external-link-only)
    └──reuses──> TuneAudioPlayer.tsx's click-to-expand iframe pattern (already built, on detail page only)
    └──optionally requires (for abcjs fallback)──> tune must be in the 70 melisma-approved set
    └──optionally reuses──> existing abcjs synth/playback code (AbcAudioControls.tsx, abc-soundfont.ts)

PSALTER_RESEND_API_KEY provisioning
    └──blocks──> both Email subscribe AND Feedback-notify-owner
    └──should be provisioned ONCE, shared by both features (same Resend project-scoped key pattern as other GSD projects)
```

### Dependency Notes

- **Both new email features share one provisioning step.** Neither `PSALTER_RESEND_API_KEY` nor `PSALTER_RESEND_FROM_ADDRESS` exist in `/home/services/.env.production` yet (confirmed by grep — other projects like YNAB, KIDAI, PORTFOLIO, DEBATES, PRC, OPENOTTER all have their own scoped keys, psalter has none). This is a one-time infra step that should happen before either the changelog-subscribe or feedback-notify work starts, since both depend on it.
- **Feedback-notify-owner should extend, not replace, the existing `/api/feedback` route and `feedback_submissions` table.** The DB-write behavior is already correct and should stay (it's the audit trail / precentor-viewable history in `/admin-only/feedback`); email is an additive side-effect on successful submission.
- **Inline embed player is the smallest lift of the four features** because 90% of the interaction pattern (click-to-expand iframe, SoundCloud src construction, YouTube embed fallback) is already implemented in `TuneAudioPlayer.tsx` — this is a relocation/adaptation into `TuneTable.tsx`'s row markup, not new capability. The only genuinely new piece is the "or abcjs notation, if available" branch, and even that reuses existing playback code from the singing view rather than building new audio infrastructure.
- **abcjs-fallback in the inline player conflicts with the "no SSR" rule** already documented in CLAUDE.md — any component rendering abcjs inline in the tune list must be client-only (`'use client'` + `dynamic(..., { ssr: false })`), same as every other abcjs usage in this codebase. This isn't a new constraint, just a reminder it applies here too.
- **Changelog homepage hero enhances but does not require subscribe.** Ship the read-only changelog (list + detail + homepage teaser) first; subscribe is a layer on top once there's actually content to be notified about.

## MVP Definition

### Launch With (v2.0 Public Beta)

- [ ] Changelog list page (`/changelog`) — reverse-chronological, title + date + body per entry — essential, it's explicitly named in the milestone scope
- [ ] Changelog single-entry view (or expand-in-place on the list — either is fine at this post volume) — essential for anyone sharing a direct link to one update
- [ ] Changelog homepage hero linking to latest entry — essential, explicitly scoped
- [ ] Changelog inline admin authoring (reusing `/admin-only/` gate) — essential per milestone scope; without it, publishing a changelog entry requires a DB console, which defeats the purpose for a single non-technical-adjacent owner workflow
- [ ] Email subscribe: single field, single-opt-in, Resend Audience-backed, unsubscribe link — essential per milestone scope
- [ ] Feedback → owner email on every submission, via Resend, reply-to set when submitter email present — essential, closes the explicitly named gap ("only saves to DB, no email sent")
- [ ] Feedback email rate-limiting — essential, explicitly scoped ("rate-limited")
- [ ] Inline embed player in tune list: SoundCloud (or YouTube fallback) click-to-expand, reusing `TuneAudioPlayer.tsx` pattern — essential per milestone scope
- [ ] `PSALTER_RESEND_API_KEY` + `PSALTER_RESEND_FROM_ADDRESS` provisioned in `/home/services/.env.production` — essential prerequisite for both email features

### Add After Validation (v2.x)

- [ ] Inline embed player: abcjs-notation fallback for melisma-approved tunes without a SoundCloud link — add once the plain SoundCloud/YouTube version is confirmed working; it's the more complex branch and not blocking for beta testers to evaluate the core loop
- [ ] Changelog entry type badges (Fixed/Added/Improved) — small nice-to-have, add once there's enough post history to make scanning useful
- [ ] Auto-collapse other rows when a new inline player expands — polish item, add if beta testers report multiple-players-open feeling awkward

### Future Consideration (v2+, likely never needed at this scale)

- [ ] Double opt-in / confirmed-subscribe email flow — defer indefinitely; only reconsider if subscriber count grows into the hundreds and deliverability becomes a measurable concern
- [ ] Changelog tags/categories with filter UI — defer until post volume exceeds ~30-50 entries
- [ ] Feedback digest emails — defer unless submission volume becomes genuinely high
- [ ] CAPTCHA/Turnstile on public forms — defer until spam is actually observed in practice
- [ ] SoundCloud Widget JS API integration — defer unless a future requirement needs cross-row playback coordination

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Feedback → owner email notification | HIGH | LOW | P1 |
| Inline embed player (SoundCloud/YouTube, no abcjs fallback yet) | HIGH | LOW | P1 |
| Changelog list + detail + homepage hero | HIGH | LOW | P1 |
| Changelog inline admin authoring | MEDIUM-HIGH | LOW-MEDIUM | P1 |
| Email subscribe (single opt-in + unsubscribe) | MEDIUM | LOW | P1 |
| Resend provisioning (`PSALTER_RESEND_API_KEY`) | — (infra prerequisite) | LOW | P1 |
| Feedback email rate-limiting | MEDIUM | LOW | P1 |
| Feedback reply-to wiring | MEDIUM | LOW | P2 |
| Inline embed player: abcjs fallback | MEDIUM | MEDIUM | P2 |
| Changelog entry type badges | LOW | LOW | P3 |
| Double opt-in subscribe flow | LOW (at this scale) | MEDIUM | P3 (defer) |
| Changelog tags/filter UI | LOW (at this scale) | MEDIUM | P3 (defer) |

**Priority key:**
- P1: Must have for v2.0 Public Beta launch
- P2: Should have, add shortly after if time allows within the milestone
- P3: Nice to have / explicitly deferred — do not build for this milestone

## Reference: How Existing Codebase Patterns Map to New Features

| New feature | Existing pattern to reuse | File |
|---|---|---|
| Feedback email notification | Extend existing submit handler | `src/app/api/feedback/route.ts` (implied by `FeedbackModal.tsx`'s POST to `/api/feedback`) |
| Feedback form UI (already correct, no changes needed) | — | `src/components/FeedbackModal.tsx` |
| Inline embed player click-to-expand | Directly reuse this exact pattern | `src/components/TuneAudioPlayer.tsx` |
| Inline embed player row integration point | Existing "Recording" column, currently external-link-only | `src/components/TuneTable.tsx` (lines ~486-488, ~574-588) |
| abcjs playback engine (for future inline notation fallback) | Existing synth/playback code | `src/components/singing/AbcAudioControls.tsx`, `src/lib/abc-soundfont.ts`, `src/components/AbcPlayer.tsx` |
| Changelog admin gate | Existing gated-admin route namespace | `src/app/admin-only/feedback/` (pattern to mirror for a new `admin-only` changelog authoring surface, or an inline gate directly on `/changelog`) |
| Data model precedent for a new simple table | Existing schema conventions | `src/db/schema.ts` (add `changelog_entries` alongside existing tables) |

## Sources

- Existing codebase: `src/components/FeedbackModal.tsx`, `src/components/TuneAudioPlayer.tsx`, `src/components/TuneTable.tsx`, `src/app/tunes/[id]/page.tsx`, `src/db/schema.ts`, `src/app/admin-only/` — read directly to ground recommendations in what's already built, not generic patterns
- `/home/services/gsddashboard/server/gsd/provisioning/stackRegistry.js` and `/home/services/.env.production` — confirmed Resend is the project-wide email provider convention and that no psalter-scoped key exists yet
- [SoundCloud HTML5 Widget API docs](https://developers.soundcloud.com/docs/api/html5-widget) — confirmed plain iframe embed (already used in this codebase) is the standard, low-complexity approach; the JS Widget API is for programmatic control not needed here
- [SoundCloud Widget-JS-API GitHub repo](https://github.com/soundcloud/Widget-JS-API) — confirmed scope/complexity of the "proper" widget API, supporting the anti-feature call
- WebSearch results on Resend Audiences/Broadcasts pattern for Next.js newsletter subscribe/unsubscribe (Mike Bifulco's Resend Broadcasts writeup, Apify news-aggregator tutorial, Steve Light's newsletter automation post) — confirmed `resend.contacts.create()` / `resend.contacts.update({ unsubscribed: true })` against an Audience is the standard low-complexity pattern, and that Resend's free tier (3,000 emails/month) comfortably covers this project's scale — MEDIUM confidence (WebSearch-sourced, not Context7/official-docs-verified line-by-line, but consistent across multiple independent sources)
- General web convention knowledge (training data) for changelog page structure, feedback-form-to-owner-email patterns, and proportionate scope for single-owner/small-audience sites — MEDIUM confidence, cross-checked against what's realistic for a 2-3 person beta audience rather than asserted as universal best practice

---
*Feature research for: CPRC Psalter v2.0 Public Beta — changelog, email subscribe, feedback-notify-owner, inline tune embed player*
*Researched: 2026-07-29*
