---
phase: 09-changelog
verified: 2026-08-07T17:45:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 09: Changelog Verification Report

**Phase Goal:** Visitors can read what's new, the admin can publish updates without a separate admin panel, and subscribers get notified by email
**Verified:** 2026-08-07T17:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (mapped to CHLG requirement) | Status | Evidence |
|---|---|---|---|
| 1 | CHLG-01: `/changelog` lists published posts reverse-chronologically with title, date, body | ✓ VERIFIED | `fetchPublishedPosts()` orders `desc(createdAt)` (`src/db/queries/changelog.ts`); `ChangelogPostCard` renders title/date/`whitespace-pre-wrap` body; live `curl https://psalter.gsdlabs.dev/changelog` returns 200 and shows the real published post "V2 (Beta)"; empty state ("No updates yet") coded in `src/app/changelog/page.tsx` |
| 2 | CHLG-02: A logged-in admin can write and publish inline — no separate admin panel | ✓ VERIFIED | `ChangelogComposer` renders inline on `/changelog` gated by `authClient.useSession()` (client visibility only); `POST /api/changelog` independently enforces `getAdminSessionOr401()` as the first statement (verified by `awk` ordering gate and by live `curl` returning 401 for anonymous PATCH-equivalent /publish attempts); human checkpoint confirmed publish worked inline with no navigation, live post `id=31` exists in `changelog_posts` |
| 3 | CHLG-03: Homepage hero announces the v2.0 release | ✓ VERIFIED | `src/app/page.tsx` contains hero block with "CPRC Psalter v2.0 is here" and a `/changelog` link; live `curl https://psalter.gsdlabs.dev/` confirms text is present; Playwright smoke (09-07 evidence) confirms hero href is `/changelog`; SiteHeader nav includes "Changelog" entry (grep-confirmed) |
| 4 | CHLG-04: Visitor can subscribe via a single email field, single opt-in | ✓ VERIFIED | `POST /api/subscribe` inserts with `onConflictDoNothing`, rate-limited 5/60s; live round-trip in 09-07-LIVE-EVIDENCE.md shows two identical `{"ok":true}` responses for the same address producing exactly 1 DB row (anti-enumeration proven); live burst test returned literal `200 200 200 200 200 429` |
| 5 | CHLG-05: Publishing emails subscribers with a working unsubscribe link | ✓ VERIFIED | `broadcastToSubscribers` sends sequentially (no `Promise.all`, grep-gated to 0), sourced only from `changelog_subscribers`; `sendChangelogBroadcastEmail` builds a per-token unsubscribe URL; unsubscribe route is POST-only (no GET export, live `GET /api/unsubscribe` returns 405); human checkpoint confirmed a real email arrived in Primary inbox with subject `CPRC Psalter update: ...`, working unsubscribe link, masked address shown, and post-click DB check shows subscriber row count `0` |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/schema.ts` (changelogPosts, changelogSubscribers) | Two tables, unique constraints | ✓ VERIFIED | Both tables live in Postgres (`to_regclass` confirms), 2 unique constraints on `changelog_subscribers` confirmed live |
| `src/db/queries/changelog.ts` | `fetchPublishedPosts`, `ChangelogPost` type | ✓ VERIFIED | Exists, exports match, test passes (4/4) |
| `src/app/api/subscribe/route.ts` | Rate-limited public subscribe | ✓ VERIFIED | Exists, no GET export, 11/11 tests pass, live-proven |
| `src/app/api/unsubscribe/route.ts` | Token-gated delete, POST-only | ✓ VERIFIED | Exists, no GET export, 9/9 tests pass, live GET returns 405 |
| `src/lib/changelog-email.ts` | Broadcast email construction | ✓ VERIFIED | Exports match (escapeHtml, maskEmail, buildUnsubscribeUrl, buildChangelogEmail, sendChangelogBroadcastEmail, getSiteBaseUrl); 20/20 tests pass |
| `src/lib/changelog-broadcast.ts` | Sequential subscriber fan-out | ✓ VERIFIED | No `Promise.all`, sequential `for...of`, 9/9 tests pass |
| `src/app/api/changelog/route.ts` | Admin-gated publish endpoint | ✓ VERIFIED | `getAdminSessionOr401()` first statement (awk-confirmed), 13/13 tests pass, live 401 confirmed |
| `src/components/ChangelogPostCard.tsx` | Presentational post card | ✓ VERIFIED | Renders pre-wrapped body, deterministic date; extended (additively) with admin-only inline Edit affordance, still server-gated via PATCH route |
| `src/components/ChangelogComposer.tsx` | Admin-only inline publish form | ✓ VERIFIED | `isPending` branched before `role` check (awk-confirmed), 9/9 tests pass |
| `src/components/SubscribeForm.tsx` | Public subscribe form | ✓ VERIFIED | Single email field, identical success copy for new/duplicate, 10/10 tests (shared file with PostCard tests) pass |
| `src/components/UnsubscribeButton.tsx` | Click-to-POST removal | ✓ VERIFIED | 7/7 tests pass, no `variant="destructive"`, masked email display |
| `src/app/changelog/page.tsx` | Public RSC list + composer + subscribe | ✓ VERIFIED | No `redirect()`, no server auth gate, `fetchPublishedPosts()` awaited, live 200 |
| `src/app/changelog/unsubscribe/page.tsx` | Read-only token landing page | ✓ VERIFIED | Zero `db.delete/update/insert` in file, `findFirst` read, live 200 with invalid-token dead-end |
| `src/app/page.tsx` (hero) | v2.0 announcement | ✓ VERIFIED | Hero block present, existing grid untouched, live-confirmed |
| `src/components/SiteHeader.tsx` (nav) | Changelog nav entry | ✓ VERIFIED | `{ href: "/changelog", label: "Changelog" }` present; additively extended with a Log Out entry (unrelated, does not touch changelog logic) |
| `.planning/phases/09-changelog/09-07-LIVE-EVIDENCE.md` | Recorded live proof | ✓ VERIFIED | 255 lines, all required sections present (deploy freshness, HTTP smoke, Playwright, subscribe round-trip, burst throttle, Human Verification, Open Gaps = "None.") |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `schema.ts` | live Postgres | `db:push` | WIRED | `to_regclass` confirms both tables exist live |
| `changelog.ts` query | `schema.ts` | `db.query.changelogPosts.findMany` | WIRED | grep-confirmed, test passes |
| `subscribe/route.ts` | `rate-limit.ts` | `checkRateLimit('subscribe:...')` | WIRED | Live burst test returned `200 200 200 200 200 429` |
| `subscribe/route.ts` | `changelog_subscribers` | `onConflictDoNothing` | WIRED | Live double-POST produced 1 row, identical responses |
| `unsubscribe/route.ts` | `changelog_subscribers` | `db.delete(...).where(eq(...unsubscribeToken...))` | WIRED | Live click (human-verified) + post-click DB check shows row count 0 |
| `changelog/route.ts` | `admin-auth.ts` | `getAdminSessionOr401()` first | WIRED | awk ordering gate + live 401/PATCH-equivalent 401 |
| `changelog-broadcast.ts` | `changelog_subscribers` | `db.select().from(changelogSubscribers)` | WIRED | Only recipient source, test 9 confirms request body cannot influence recipients |
| `changelog-broadcast.ts` | `changelog-email.ts` | `await sendChangelogBroadcastEmail` in `for...of` | WIRED | Sequential test (start/end interleaving) proves no `Promise.all` |
| `ChangelogComposer.tsx` | `/api/changelog` | `fetch POST` on submit | WIRED | Human-verified live publish, post `id=31` in DB |
| `SubscribeForm.tsx` | `/api/subscribe` | `fetch POST` on submit | WIRED | Live round trip confirmed |
| `UnsubscribeButton.tsx` | `/api/unsubscribe` | `fetch POST { token }` | WIRED | Human-verified live click + DB confirms row removed |
| `changelog/page.tsx` | `changelog.ts` query | `await fetchPublishedPosts()` | WIRED | Live page shows real post content |

### Behavioral Spot-Checks (live, against psalter.gsdlabs.dev)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `/changelog` loads publicly | `curl -s -o /dev/null -w '%{http_code}' .../changelog` | 200 | ✓ PASS |
| Anonymous visitor sees no composer | `curl .../changelog \| grep -c data-changelog-composer` | 0 | ✓ PASS |
| Anonymous visitor sees subscribe section | `curl .../changelog \| grep "Get notified of updates"` | present | ✓ PASS |
| Homepage hero present | `curl .../ \| grep "CPRC Psalter v2.0 is here"` | present | ✓ PASS |
| GET cannot unsubscribe | `curl -X GET .../api/unsubscribe` | 405 | ✓ PASS |
| PATCH edit route is admin-gated | `curl -X PATCH .../api/changelog/999` (no auth) | 401 `{"error":"Unauthorized"}` | ✓ PASS |
| Published post visible live | `curl .../changelog \| grep "V2 (Beta)"` | present | ✓ PASS |
| Running process postdates latest source commits | `ps -o lstart= -p $(pm2 pid psalter)` vs `git log` for c0c9d62 (12:41) and 1359cc2 (15:42) | process start 15:44:50, BUILD_ID 15:44:37 — both after both follow-up commits | ✓ PASS |
| Changelog test suite green | `npx vitest run` (11 changelog-related files) | 111/111 tests pass | ✓ PASS |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `src/app/changelog/page.tsx` | `posts` | `await fetchPublishedPosts()` → `db.query.changelogPosts.findMany` | Yes — live DB row `id=31, "V2 (Beta)"` rendered on the deployed page | ✓ FLOWING |
| `src/app/changelog/unsubscribe/page.tsx` | `subscriber` | `db.query.changelogSubscribers.findFirst` by token | Yes — live invalid-token request correctly renders dead-end copy; a real token (human-verified) rendered a masked real address | ✓ FLOWING |
| `SubscribeForm.tsx` → `/api/subscribe` | `email` | Live INSERT into `changelog_subscribers`, confirmed by direct psql row count | Yes | ✓ FLOWING |
| `ChangelogComposer.tsx` → `/api/changelog` | `title, body` | Live INSERT into `changelog_posts`, confirmed by direct psql query | Yes | ✓ FLOWING |
| Broadcast → subscriber inbox | subscriber list | `db.select().from(changelogSubscribers)` → `sendChangelogBroadcastEmail` → Resend | Yes — human confirmed real inbox delivery with correct subject/body/unsubscribe link | ✓ FLOWING |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CHLG-01 | 09-01, 09-05 | `/changelog` lists posts reverse-chronologically | ✓ SATISFIED | REQUIREMENTS.md marked Complete; live page renders real content newest-first |
| CHLG-02 | 09-04, 09-05 | Admin publishes inline, no separate admin panel | ✓ SATISFIED | Server-gated route + human-verified live inline publish |
| CHLG-03 | 09-06 | Homepage hero announces v2.0 | ✓ SATISFIED | Live-confirmed hero text + link |
| CHLG-04 | 09-01, 09-02 | Single-field, single opt-in subscribe | ✓ SATISFIED | Live round trip proves anti-enumeration and single-field UX |
| CHLG-05 | 09-01, 09-02, 09-03, 09-04, 09-06 | Publish emails subscribers, working unsubscribe | ✓ SATISFIED | Human-verified real inbox delivery + working unsubscribe link + DB confirms removal |

No orphaned requirements — all 5 CHLG IDs declared across the seven plan frontmatters are accounted for in REQUIREMENTS.md, and REQUIREMENTS.md maps no additional CHLG IDs to Phase 9 beyond these five.

### Anti-Patterns Found

None. Grep scan across all changelog-touching files (schema, queries, API routes, lib, components, pages) for `TODO|FIXME|XXX|HACK|PLACEHOLDER|not yet implemented|coming soon` returned zero matches. No GET handlers exist on `/api/subscribe`, `/api/unsubscribe`, or `/api/changelog`. No `Promise.all` in the broadcast module. No `dangerouslySetInnerHTML` anywhere in Changelog* components.

### Additive Post-Checkpoint Changes (not CHLG-mapped, reviewed for regression risk)

Two commits landed after the 09-07 human "All Confirmed working!" checkpoint, at explicit user request:

1. **`c0c9d62` — Log Out nav entry in `SiteHeader.tsx`.** Pure UX convenience, unrelated to changelog subsystem logic. Does not touch any CHLG-mapped file's behavior.
2. **`1359cc2` — Admin post-editing (`PATCH /api/changelog/[id]` + inline Edit on `ChangelogPostCard`).** Touches the changelog subsystem but is scoped beyond the original phase (no CHLG requirement covers editing). Reviewed: the PATCH route follows the identical `getAdminSessionOr401()`-first pattern as the publish route (live-verified: anonymous PATCH returns 401), does not re-trigger the broadcast (correct — a typo fix shouldn't re-email subscribers), and does not touch `createdAt` (post retains its list position). The 10 new/updated tests in `ChangelogPostCard.test.tsx` and the 10 new tests in `[id]/route.test.ts` pass. No regression to any of the 5 CHLG truths detected — full changelog test suite (111 tests across 11 files) is green, and the running production process (start time 15:44:50) postdates both follow-up commits, confirming they are live and not just committed.

Both commits are additive and do not weaken any of the five observable truths above.

### Human Verification Required

None outstanding. All items requiring human verification (real inbox delivery, live unsubscribe click, live admin publish through a real browser session) were already completed at the 09-07 checkpoint with a full pass ("All Confirmed working!"), and this verification independently confirmed the mechanical side-effects (DB row counts, live HTTP responses, running-process freshness) still hold.

### Gaps Summary

No gaps. All five CHLG requirements are implemented, tested (111/111 unit/integration tests passing), deployed, and confirmed working end-to-end in production including real email delivery and a real unsubscribe click. The two additive post-checkpoint commits (Log Out nav, admin post-editing) do not weaken any CHLG truth and are live in the currently running process.

---

_Verified: 2026-08-07T17:45:00Z_
_Verifier: Claude (gsd-verifier)_
