# Visitor Workflows Research — v2.x Public Site

**Domain:** How real visitors use `psalter.gsdlabs.dev`, and which trade-offs that puts on every UX, performance, caching, and prefetch decision
**Researched:** 2026-09-27
**Confidence:** HIGH for the user-jobs taxonomy (direct user description, corroborated by route inspection). HIGH for the caching-state facts (verified against source tree at the same date).

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

**Display preference.** Most singers cannot read music and use the **lyrics-only** view. Today the default view is `staff` (set in `SingingView.tsx`, hard-coded in both `useState<ViewMode>('staff')` and the localStorage fallback in `readStoredViewMode()`). The default is a deliberate trade-off: staff-inline is the long-term goal for the congregation (church-wide music-literacy push), so we keep it as the default even though most singers will change it once. **This trade-off is the reason this doc exists — see §4.**

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
| `/psalms/[id]` (sing view) | Singer on phone | **YES** — every Sunday service hits it; also the modal-picker target | `export const dynamic = 'force-dynamic'` (verified, `src/app/psalms/[id]/page.tsx:1`). No ISR. |
| `/precent/[id]/sing/[pos]` | Precentor on laptop | **YES** — every service, every psalm in the set | `force-dynamic` (verified). Auth-gated; cold path also pays the Better Auth login POST + DB write. |
| `/psalms/[id]/study` | Singer on phone (rare) | No — infrequent | `force-dynamic` |
| `/precent/[id]` (set detail) | Precentor on laptop | No — used <1× per service to *create* a set, then never revisited | `force-dynamic` |
| `/precent` (list) | Precentor on laptop | No — cheap list view | `force-dynamic` |
| `/psalms` (list) | Singer on phone | No — singer goes here once per session to start; cheap once warm | `force-dynamic` |
| `/explore/*` | Singer on phone (devotions) | No — low traffic | `force-dynamic` |
| `/daily*` | Singer on phone (devotions) | No — low traffic | `force-dynamic` |
| `/tunes*` | Precentor on laptop | No — rare workflow | `force-dynamic` |

**Verified observation:** every public route currently declares `export const dynamic = 'force-dynamic'`. No Next.js ISR is active anywhere on the site. Caching therefore happens below the framework: in the helper functions (`db/queries/*.ts`) via `unstable_cache`, and at the Cloudflare CDN layer in front of Vercel. The previous ISR experiment that produced 2-3 GB deploys was abandoned before this doc was written.

**Verified warm-path behaviour:** production TTFB on `/precent/42/sing/1` is ~77 ms warm vs ~1,560 ms cold; `/psalms/42` is ~64 ms warm vs ~1,243 ms cold (per the recent comparison captured in issue #82 thread). Both the edge layer and the in-process `unstable_cache` contribute to the warm path; the cold path is dominated by Chromium cold-launch on the precent view and the Vercel-edge → Neon region handshake.

---

## 3. What this means for caching, prefetch, and ISR

**Trade-offs are forced by §1's facts, not negotiable.**

- **A 24-hour TTL is functionally no-cache** (Fact 2). Edge or in-process cache misses almost every request; the only requests that hit a cache are back-to-back (warm path) and Sunday peaks (warm path). This argues **against** relying on long-TTL caches for hit-rate and **for** warming strategies (client prefetch on idle/tap, `revalidateTag` on edit, pre-warmed Vercel routes, persistent edge cache for the literal subset of routes a single user actually visits).
- **Prefetch on hover is the wrong primitive** (Fact 5). On a phone there is no hover; on the desktop banner the user is being told this is the wrong device for them. The `Link` prefetch-on-hover behaviour Next.js gives by default is wasted budget. Prefetch should fire on **idle-after-render** (the sing view is now stable, so the modal-picker target psalm is the most likely next psalm) and on **tap-imminent** (the first touch on the modal trigger). PR #79 begins this work.
- **The modal psalm picker (Mode C) and the precenting left/right buttons (Mode A)** are the two transitions that must be prefetched. Both push the user to a `/psalms/[id]` or `/precent/[id]/sing/[pos]` URL that costs 1+ second cold. A 50 ms prefetch pays for itself on the first tap.
- **The sing view itself should be a Vercel `revalidate` route** with a short TTL (or build-time `generateStaticParams` plus tag invalidation) — but only after the deploy-size problem from the previous ISR experiment is solved. The 2-3 GB build artefact was caused by per-page data that doesn't actually need to live in the static bundle; the layer model in issue #82 (DB cache + edge `revalidate` + client prefetch) is designed to keep the static bundle small enough for the free plan.
- **Lyrics-only rendering is dramatically cheaper than staff-inline** (no ABC notation payload, no staff SVG). The default-view decision affects the whole bundle, not just runtime cost. See §4.
- **The mobile-first design constraint also drives prefetch selection** (Fact 5): on phones the only prefetch signal we have is **idle-after-render** and **tap-imminent**. There is no hover. The precentor desktop view is the only place where hover-prefetch is even possible, and the left/right buttons there are already being tapped within seconds of page load — tap-imminent prefetch covers it.

For the concrete layer-by-layer plan, see issue #82 (*Cold-vs-warm latency — consolidated caching + prefetch strategy*) and PR #83 (`unstable_cache` machinery), PR #79 (non-blocking `Link` wrapper). This doc is the *why*; #82 is the *how*.

---

## 4. Open question — default view mode

**Status: still open as a separate decision; flagged in issue #82.** The current default is `staff` (verified: `SingingView.tsx` hard-codes `'staff'` in both the initial state and the localStorage fallback). Arguments:

- **For `lyrics-only` default:** most visitors can't read music; making them click once on every fresh device to reach the view they actually use is friction. Lyrics-only renders faster and produces a smaller bundle, which matters because Fact 5 means the sing view is opened on phones over often-flaky church Wi-Fi.
- **For `staff` default:** the congregation's long-term music-literacy goal is to teach people to *see* the staff while they sing. Defaulting to lyrics-only may quietly undermine that goal by hiding staff notation from casual singers. Keeping staff as the default also keeps the sing-view layout identical for staff-literate users (no visual jump when they navigate between psalms).

This doc does not pick a side. It records the trade-off and points at issue #82 as the canonical decision thread.

---

## 5. Cross-references

- **Issue #82** — *Cold-vs-warm latency — consolidated caching + prefetch strategy* (consolidated from former issues #80 and #81). This doc is the user-side input to that plan.
- **Issue #72** — *precent slowness* (predecessor of #82; closed as superseded).
- **PR #83** — `unstable_cache` machinery (Layer 1 of the #82 plan).
- **PR #79** — non-blocking `Link` wrapper (Layer 4 of the #82 plan).
- **`src/components/PsalmPickerModal.tsx`** — single component serving Mode A (precent set nav) and Mode C (sing-view jump). Mode B (alternate-tune swap) is currently unused.
- **`src/components/DesktopOptimisedBanner.tsx`** — the desktop banner that names Fact 5 in plain language.
- **`src/middleware.ts`** — Better Auth matcher for `/precent` and `/dev`.
- **`.planning/research/ARCHITECTURE.md` and `STACK.md`** — for the framework, build, and deploy model.
- **`.planning/research/FEATURES.md` and `PITFALLS.md`** — for the feature backlog and known sharp edges.

This doc only describes *who uses the site, how, and what that implies*. It is intentionally narrow so it can be cited from issues and PRs without dragging in unrelated decisions.
