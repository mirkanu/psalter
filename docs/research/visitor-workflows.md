# Visitor Workflows Research — v2.x Public Site

**Domain:** How real visitors use `psalter.gsdlabs.dev`, and which trade-offs that puts on every UX, performance, caching, and prefetch decision
**Researched:** 2026-09-27
**Confidence:** HIGH for the user-jobs taxonomy (direct user description, corroborated by route inspection). HIGH for the caching-state facts (verified against source tree at the same date).

**Updated 2026-11-08 — hosting and caching state moved on; the user-jobs taxonomy did not.**
The five facts in the TL;DR and the persona analysis in §1 are still current and still binding.
The *caching state* they sit on is not: the site left Vercel/Neon and returned to a Hetzner VPS
(Cloudflare Tunnel → PM2 → a local Postgres) on 2026-09-07, and ISR was switched on for the
public psalm/tune/explore routes after this doc was written. §2 now records the verified
directives from the current source tree; the §4 default-view question was also settled since
(Phase 21, D-01) and is annotated below.

**Corrected 2026-11-08 (second pass):** §2 previously said the public content routes are
"never revalidated". That is true of `/psalms`, `/psalms/[id]/study`, `/tunes/[slug]` and
`/explore/*`, but **not** of `/psalms/[id]` or `/tunes` — T2's `unstable_cache` lowers those two
routes' effective revalidate to 86400. This doc had already recorded the contradicting
evidence (`s-maxage=86400` for `/psalms/[id]`, issue #95) without reconciling it with the
"never revalidated" wording. The two claims are now consistent; see §2 and
`docs/research/cache-tactics.md` §3.5.

**TL;DR — the five facts that matter**

1. **Nobody comes to read psalms.** Every visit is a *sing* visit. Pages exist to support the sing view, not the other way round.
2. **Traffic is tiny.** ~1 visitor/day on average, ~12 on Sundays. Any TTL-based cache (Next.js `revalidate`, CDN TTL, in-memory LRU) is functionally no-cache because the cache will evict before the second hit lands.
3. **The sing view is the only latency-critical path.** Every other route tolerates 1-second cold hits. The sing view must be warm or sub-100 ms cold — anything else makes a church service visibly pause.
4. **The precentor is the only person who uses `/precent`.** It is owner-only (Better Auth session check in `src/middleware.ts`). Optimising it for *other* visitors wastes time.
5. **The site is mobile-first.** ~90 % of visitors are on phones. All routes are designed for phone viewports first; on desktop, a banner is rendered at the top of every page saying **"This website is optimised for use on phones."** (`src/components/DesktopOptimisedBanner.tsx`, rendered in `src/app/layout.tsx`). Anything that assumes a desktop mouse — hover-to-prefetch, hover-to-reveal menus, fine click targets — is the wrong shape for the actual user.

These five facts drive every caching / prefetch / ISR / default-view choice on this site. If a future proposal contradicts one of them, the proposal is wrong, not the fact.

---

## 1. The two visitor personas

### 1.1 The "normal" singer (congregation member)

The 1-visitor/day and 12-visitor/Sunday traffic comes almost entirely from this person. They want to *sing*, not browse. **They are on a phone, in a church pew, often with one hand holding the device and the other resting on a Bible or hymnal.** Any interaction design that requires a precise tap, a hover, or a desktop-sized viewport is wrong for this user.

**They pick a psalm in one of three ways:**

| Flow | When | Route(s) | Mobile notes |
| --- | --- | --- | --- |
| **Known psalm** | Sunday services; the minister has chosen the psalms. The singer just needs to follow along. | `/psalms` list → `/psalms/[id]` (sing view). "Power users" open the global search from the top-bar magnifier (mobile: hamburger sheet). | The psalm list is a single-column scroll on phones. The search modal opens full-screen on mobile (verified in `GlobalSearchClient`). |
| **Mood / topic match** | Personal devotions; they want a psalm that fits their Bible reading or mood. | `/explore` (topics, messianic, authors) → psalm detail | `/explore` is a phone-first grid; tapping a topic card drills into the psalm list for that topic. |
| **Sequential reading** | Personal devotions; they want to sing through the psalter in order. | `/daily` | `/daily` resolves to a single psalm per day; one tap to sing. |

In **all three flows**, after the first psalm the singer uses the **modal psalm picker inside the sing view** to jump to the next psalm (Mode C navigation in `PsalmPickerModal`). This is the highest-traffic transition in the site, and the one most sensitive to latency. On phones this modal opens as a near-full-screen sheet, so prefetching on idle (not just hover) is what makes it feel instant — hover prefetch would never fire.

**Tune behaviour.** They rarely change the recommended tune. Power-user singers may swap to an alternate tune for a specific psalm (Mode A flow inside the same modal), but the modal is fundamentally a *navigate-to-next-psalm* control, not a tune selector. Most of the time the singer takes the recommended tune as-is. (The precentor is the one who overrides tunes, while building a set; the singer in the pew trusts the chosen tune.)

**Display preference.** Most singers cannot read music and use the **lyrics-only** view. The default view is now `legacy` for fresh visitors (Phase 21, D-01 — `SingingView.tsx` initialises `useState<ViewMode>('legacy')`), with `staff` remaining the localStorage fallback. The default is a deliberate trade-off: staff-inline is the long-term goal for the congregation (church-wide music-literacy push), so the layout stays available even though most singers will change it once. **This trade-off is the reason this doc exists — see §4.**

**Study view.** Infrequently, a singer will switch to the psalm study view (`/psalms/[id]/study`) to read the commentary for the psalm they are singing.

### 1.2 The precentor (Manuel)

Owner-only (Better Auth middleware, `src/middleware.ts` matcher includes `/precent` and `/precent/:path*`). The only person who hits `/precent` is Manuel, and he is on a laptop or tablet (not a phone) when he does so. The precentor flow is the **one place on the site where desktop-first design is appropriate** — precenting sets are built in advance on a larger screen, then used during the service on the same larger screen. Treat the whole `/precent` subtree as a private admin surface.

**Two workflows:**

1. **Build a precenting set** (usually 4 psalms), occasionally override the recommended tune for one of them. Done ~1 hour before a Sunday service. This is the only workflow where tune choice matters, and it is precentor-only.
2. **Lead the service.** Open the set at `/precent/[id]/sing/[pos]`, then **navigate between the set's psalms with the left/right buttons in the sing view** (Mode A flow in `PsalmPickerModal`). Every transition is a full server render of a new `/precent/[id]/sing/[pos]` page — this is the most-tapped transition during a service. The precentor is physically standing at the front of a church with this view open; latency here is the most visible latency on the entire site.

A rare third flow is **tune review** at `/tunes` — used while working toward the long-term goal of one unique tune per psalm versification (~170 versifications, currently ~70 recommended tunes). This is also precentor-only and laptop-only.

---

## 2. Critical-route inventory (with verified caching state)

| Route | Persona | Latency-critical? | Cache behaviour today |
| --- | --- | --- | --- |
| `/psalms/[id]` (sing view) | Singer on phone | **YES** — every Sunday service hits it; also the modal-picker target | `force-static` + `revalidate = false` + `generateStaticParams` (verified, `src/app/psalms/[id]/page.tsx`) — prerendered at deploy time (T1). **Effective revalidate is 86400, not `false`** — T2's `unstable_cache` lowers it; see `cache-tactics.md` §3.5. |
| `/precent/[id]/sing/[pos]` | Precentor on laptop | **YES** — every service, every psalm in the set | `force-dynamic` (verified). Auth-gated; cold path also pays the Better Auth login POST + DB write. |
| `/psalms/[id]/study` | Singer on phone (rare) | No — infrequent | `force-static` + `revalidate = false` + `generateStaticParams` (T1) |
| `/precent/[id]` (set detail) | Precentor on laptop | No — used <1× per service to *create* a set, then never revisited | `force-dynamic` |
| `/precent` (list) | Precentor on laptop | No — cheap list view | `force-dynamic` |
| `/psalms` (list) | Singer on phone | No — singer goes here once per session to start; cheap once warm | `force-static` + `revalidate = false` (T1) |
| `/explore/*` | Singer on phone (devotions) | No — low traffic | `force-static` + `revalidate = false` + `generateStaticParams` (T1) |
| `/daily*` | Singer on phone (devotions) | No — low traffic | `/daily` is `force-static`; `/daily/[day]` is `force-dynamic` (it has `generateStaticParams` *and* `force-dynamic` — the latter wins). |
| `/tunes*` | Precentor on laptop | No — rare workflow | `force-static` + `revalidate = false` + `generateStaticParams` (T1). `/tunes` (the list) also has an **effective revalidate of 86400** — T2's `unstable_cache` lowers it; see `cache-tactics.md` §3.5. `/tunes/[slug]` is genuinely `false`. |

**Verified observation (2026-11-08):** the public content routes — `/psalms`, `/psalms/[id]`,
`/psalms/[id]/study`, `/tunes`, `/tunes/[slug]`, `/explore/*` — are now `force-static` with
`revalidate = false` and `generateStaticParams`: they are **prerendered at deploy time**. The
`/precent` subtree stays `force-dynamic` because it is session-scoped. That split means **a
database change is not visible until a redeploy** — see the ISR section of `AGENTS.md`.

**Correction (2026-11-08, second pass):** an earlier version of this paragraph said these
routes are "**never revalidated**". That is true of `/psalms`, `/psalms/[id]/study`,
`/tunes/[slug]` and `/explore/*`, but **not** of `/psalms/[id]` or `/tunes` — the two routes
that consume the T2-cached read helpers in `src/db/queries/tunes.ts`. T2's
`unstable_cache(..., { revalidate: 86400 })` lowers those two routes' *effective* revalidate
to **86400**, so they rebuild at most once per 24 h on their own. Measured:
`prerender-manifest.json` gives `initialRevalidateSeconds` = 86400 for 199 routes (150 base
psalms + 13 `a` + 13 `b` + 22 psalm-119 verse-range subsections, plus `/tunes`) and `false`
for 966. `docs/research/cache-tactics.md` §3.5 has the mechanism and the evidence.

Caching below the framework still applies: in the helper functions (`db/queries/*.ts`) via
`unstable_cache`, and at the Cloudflare edge in front of the VPS. The Cloudflare Cache Rule
layer (Phase 19, Layer 3) adds `s-maxage` on the T2 route globs; `/psalms/[id]` was measured
returning `x-nextjs-cache: HIT` with `s-maxage=86400` (issue #95).

**Verified warm-path behaviour:** production TTFB on `/precent/42/sing/1` is ~77 ms warm vs ~1,560 ms cold; `/psalms/42` is ~64 ms warm vs ~1,243 ms cold (per the recent comparison captured in issue #82 thread). Both the edge layer and the in-process `unstable_cache` contribute to the warm path; the cold path is dominated by Chromium cold-launch on the precent view and the app → Postgres round trip.

---

## 3. What this means for caching, prefetch, and ISR

**Trade-offs are forced by §1's facts, not negotiable.**

- **A 24-hour TTL is functionally no-cache** (Fact 2). Edge or in-process cache misses almost every request; the only requests that hit a cache are back-to-back (warm path) and Sunday peaks (warm path). This argues **against** relying on long-TTL caches for hit-rate and **for** warming strategies (client prefetch on idle/tap, `revalidateTag` on edit, pre-warmed routes, persistent edge cache for the literal subset of routes a single user actually visits).
- **Prefetch on hover is the wrong primitive** (Fact 5). On a phone there is no hover; on the desktop banner the user is being told this is the wrong device for them. The `Link` prefetch-on-hover behaviour Next.js gives by default is wasted budget. Prefetch should fire on **idle-after-render** (the sing view is now stable, so the modal-picker target psalm is the most likely next psalm) and on **tap-imminent** (the first touch on the modal trigger). PR #79 begins this work.
- **The modal psalm picker (Mode C) and the precenting left/right buttons (Mode A)** are the two transitions that must be prefetched. Both push the user to a `/psalms/[id]` or `/precent/[id]/sing/[pos]` URL that costs 1+ second cold. A 50 ms prefetch pays for itself on the first tap.
- **The sing view is now a prerendered route** (`force-static` + `revalidate = false` + `generateStaticParams`), so it is served as static HTML from the edge without touching the database at request time. The cost of that choice is **staleness**: a psalm or tune edit does not appear until a redeploy. (Strictly, `/psalms/[id]` and `/tunes` also rebuild themselves every 24 h because T2 lowers their effective revalidate — so an edit can surface within a day without a redeploy. A redeploy is still the only way to make it appear *now*, and the only reliable way for a full re-import. See §2 and `cache-tactics.md` §3.5.) The `revalidatePath` / `revalidateTag` calls wired into `/api/precent/**` handle the paths that matter at request time, but a full re-import of the database still needs `bash scripts/deploy.sh`.
- **Lyrics-only rendering is dramatically cheaper than staff-inline** (no ABC notation payload, no staff SVG). The default-view decision affects the whole bundle, not just runtime cost. See §4.
- **The mobile-first design constraint also drives prefetch selection** (Fact 5): on phones the only prefetch signal we have is **idle-after-render** and **tap-imminent**. There is no hover. The precentor desktop view is the only place where hover-prefetch is even possible, and the left/right buttons there are already being tapped within seconds of page load — tap-imminent prefetch covers it.

For the concrete layer-by-layer plan, see issue #82 (*Cold-vs-warm latency — consolidated caching + prefetch strategy*) and PR #83 (`unstable_cache` machinery), PR #79 (non-blocking `Link` wrapper). This doc is the *why*; #82 is the *how*.

---

## 4. Default view mode — settled in Phase 21

**Status: decided in Phase 21 (D-01).** The default is now `legacy` for fresh visitors
(verified: `SingingView.tsx` initialises `useState<ViewMode>('legacy')`; the localStorage
fallback remains `'staff'`). This doc's original question — `lyrics-only` vs `staff` — was the
pre-Phase-21 framing and no longer describes the choice that was actually made. The original
arguments are kept below because they still explain *why* the default is a live question.
Arguments:

- **For `lyrics-only` default:** most visitors can't read music; making them click once on every fresh device to reach the view they actually use is friction. Lyrics-only renders faster and produces a smaller bundle, which matters because Fact 5 means the sing view is opened on phones over often-flaky church Wi-Fi.
- **For `staff` default:** the congregation's long-term music-literacy goal is to teach people to *see* the staff while they sing. Defaulting to lyrics-only may quietly undermine that goal by hiding staff notation from casual singers. Keeping staff as the default also keeps the sing-view layout identical for staff-literate users (no visual jump when they navigate between psalms).

This doc does not pick a side — Phase 21 (D-01) did, choosing `legacy` for fresh visitors. The original trade-off is recorded above because it still explains why the default is a live question, and issue #82 remains the canonical thread for the caching work that surrounds it.

---

## 5. Cross-references

- **Issue #82** — *Cold-vs-warm latency — consolidated caching + prefetch strategy* (consolidated from former issues #80 and #81). This doc is the user-side input to that plan.
- **Issue #72** — *precent slowness* (predecessor of #82; closed as superseded).
- **PR #83** — `unstable_cache` machinery (Layer 1 of the #82 plan).
- **PR #79** — non-blocking `Link` wrapper (Layer 4 of the #82 plan).
- **`src/components/PsalmPickerModal.tsx`** — single component serving Mode A (precent set nav) and Mode C (sing-view jump). Mode B (alternate-tune swap) is currently unused.
- **`src/components/DesktopOptimisedBanner.tsx`** — the desktop banner that names Fact 5 in plain language.
- **`src/middleware.ts`** — Better Auth matcher for `/precent` and `/dev`.
- **`AGENTS.md`** — the canonical project guide: framework, build, deploy model and backup/recovery.
- **`docs/archive/ARCHITECTURE.md`, `STACK.md`, `FEATURES.md`, `PITFALLS.md`** — historical records of the framework, feature backlog and known sharp edges. Archived and no longer authoritative.

This doc only describes *who uses the site, how, and what that implies*. It is intentionally narrow so it can be cited from issues and PRs without dragging in unrelated decisions.
