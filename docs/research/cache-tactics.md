# Cache Tactics — v2.x Public Site

**Domain:** The exact caching posture (Next.js ISR, in-process `unstable_cache`, Cloudflare edge, write-time `revalidatePath`/`revalidateTag`) for every route on `psalter.gsdlabs.dev`, the rules each posture follows, and the things that are deliberately not cached and why.
**Captured:** 2026-10-04 (one month after PR #94, after a database-cost investigation identified that the right rules are already in place; this doc is the stable reference)
**Updated 2026-11-08:** the invalidation contract and the "why a small, explicit set of tactics" argument are unchanged and still binding. What changed underneath them is the **host**: the site left Vercel/Neon for a Hetzner VPS (Cloudflare Tunnel → PM2 → a local Postgres) on 2026-09-07, and the Neon project was terminated on 2026-11-08. Hosting-specific wording has been corrected against the live site, and the measured production headers are recorded below. The one substantive rule that did **not** change: a full-DB re-import still requires a **manual production redeploy** — which is now `bash scripts/deploy.sh` rather than a Vercel push.

**Corrected 2026-11-08 (second pass, after measuring the live build):** the **three**-tactic taxonomy this doc originally described was wrong in two places, and there are in fact **two** tactics. (a) There is no T3 — `/daily` no longer declares a finite TTL, so it is a T1 route like the rest (§4 explains what happened and why it is harmless). (b) T2's `revalidate: 86400` **lowers the effective route revalidate** of the two routes that consume its helpers, so `/psalms/[id]` and `/tunes` are *not* indefinite-ISR in practice — they expire after 24 h (§3.5, with the manifest and header evidence). Both corrections are load-bearing: they change what "invalidate this route" actually means, so they are recorded here rather than left implicit.
**Companion to:** `docs/research/visitor-workflows.md` (the *why* — visitor jobs, traffic shape, mobile-first constraints). This doc is the *how* and the *what lives where*. Implementation PRs (notably #92, #94) reference this doc.

**TL;DR — the caching tactics**

| Tactic | Mechanism | Routes | Invalidated by | Why this shape |
| --- | --- | --- | --- | --- |
| **T1** Indefinite ISR | `dynamic = 'force-static'`, `revalidate = false` at the route segment | `/`, `/psalms`, `/explore` (+ its sub-routes), `/psalms/[id]/study`, `/tunes/[slug]`, `/daily` — **but see §3.5**: `/psalms/[id]` and `/tunes` declare `revalidate = false` yet have an *effective* revalidate of 86400, because T2 lowers it | `revalidatePath('/')` in `/api/changelog`; **manual production redeploy** (`bash scripts/deploy.sh`) for full-DB re-imports | Visitors per page are < 1/day. A long TTL is functionally a no-cache anyway, but T1 guarantees the page is *built* exactly once and served from the Next.js ISR cache in front of the VPS. `revalidate = false` means it stays built until something explicitly invalidates. |
| **T2** Tag-cached reads | `unstable_cache(..., { tags: ['precent'], revalidate: 86400 })` wrapping the three read helpers in `src/db/queries/tunes.ts` | All five T1 pages (read helpers back them) | `revalidateTag('precent', 'max')` on every write in `/api/precent/**` and `/api/dev/melisma-*` | Layered under T1. T1 builds the HTML once at deploy; T2 ensures the underlying read helpers (called during build) return cached DB data instead of hitting Postgres on every build. After deploy, T1 is the only thing that matters; T2 is the in-build time optimisation. **Side effect:** on the two routes that consume these helpers, the same `revalidate: 86400` also becomes the route's *effective* revalidate — see §3.5. |
| ~~**T3** Short-ISR~~ | — | **No T3 exists.** `/daily` is a T1 route: `force-static` with no `revalidate` export, so it is built once and cached indefinitely like the rest. §4 records what used to be here and why its removal is harmless. | | |

The **T2 path globs** — `/psalms/:id/study`, `/tunes/:slug`, `/explore/{authors,topics,naves,messianic}` — are additionally cached at the Cloudflare edge; the `headers()` block in `next.config.ts` emits `s-maxage=31536000` for them (Phase 19 PERF-03, Layer 3 — defence in depth). The **T1 pages** are not edge-cached: Cloudflare passes them through (`cf-cache-status: DYNAMIC`) and they are served from the Next.js ISR cache (`x-nextjs-cache: HIT`).

Measured on production 2026-11-08: `/` → `s-maxage=31536000`, `x-nextjs-cache: HIT`, `cf-cache-status: DYNAMIC`; `/psalms/23` → `s-maxage=86400`, `x-nextjs-cache: HIT`, `cf-cache-status: DYNAMIC`; `/psalms/23/study` → `public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800`, `cf-cache-status: HIT`.

Static assets (`*.js`, `*.css`, `*.woff2`, images) ride Cloudflare's free-tier defaults, which is correct because Next.js already serves them with long `max-age`; touching them adds nothing.

---

## 1. Why a small explicit set of tactics and not a uniform policy

The site gets ~1 visitor/day on average, ~12 on Sundays (`visitor-workflows.md` Fact 2). A uniform "set `revalidate = 3600` everywhere" is **worse** than what we have, because:

1. It rebuilds the static HTML every hour for routes that change yearly (psalms, tunes). Each rebuild re-runs the read helpers, which is exactly the cost we wanted to avoid.
2. It *still misses* most of the 1-visitor/day traffic, because the TTL elapses between hits. A 24 h TTL on a 1-hit/day route is functionally a no-cache.
3. It does not give us anything T1 doesn't already give us, because T1's "indefinite" still has to be invalidated by writes — which we already do.

The asymmetric traffic shape (one page gets ~12 visits on Sunday, everything else gets ~1/day) is what kills uniform policies. A TTL tuned to "Sunday peak" is wrong for weekdays; a TTL tuned to "weekday" is wrong for Sundays. T1 sidesteps the question by never expiring, and T2 makes the one build that produces those pages cheap.

---

## 2. T1 — Indefinite ISR (the static pages)

### 2.1 The mechanism

Each of the static routes declares:

```ts
export const dynamic = 'force-static'
export const revalidate = false
```

at the top of the route segment file, and pre-builds its parameter space via `generateStaticParams` where applicable. `revalidate = false` means "never expire on a timer"; the route stays built until something calls `revalidatePath` or a fresh deploy lands.

**Caveat — `revalidate = false` is the *declared* value, not always the *effective* one.** Two routes that consume the T2-cached read helpers (`/psalms/[id]` and `/tunes`) have their effective revalidate lowered to 86400 by T2, so they do expire on a timer despite declaring `false`. §3.5 has the mechanism and the evidence. The routes below are the ones whose effective revalidate really is `false`.

### 2.2 Per-route detail

| Route | `generateStaticParams` enumerates | Why this is safe | Where the invalidation lives |
| --- | --- | --- | --- |
| `/` | N/A (no params) | The homepage is one HTML. Changelog is the only thing that changes it. | `src/app/api/changelog/route.ts` calls `revalidatePath('/')` and `revalidatePath('/changelog')` on every POST. Anything else requires a production redeploy. |
| `/psalms` | N/A (no params) | A list of ~150 psalm titles. Build once. | Manual production redeploy on `seedPsalms`. |
| `/psalms/[id]` | All 150 psalm IDs at deploy (`generateStaticParams` in the route file) | Bounded set. Each page is a single psalm with its recommended tune(s). | Manual production redeploy on `seedPsalms` *or* `importAirtable`. The `/api/dev/melisma-save` route also calls `revalidatePath('/psalms/${id}')` for live tunings. |
| `/tunes` | N/A (no params) | A list of ~172 tunes. Build once. | Manual production redeploy on `importAirtable` (or equivalent DB import). |
| `/explore` | N/A (no params) | Topic/messianic/author index. Build once. | Manual production redeploy on `seedPsalms`. |

### 2.3 The deployment cost we accepted to get T1

The earlier blanket-ISR attempt (pre-#73, reverted in PR #73) pre-rendered every psalm × every tune cross-product and ballooned the deploy to 2–3 GB, blowing the Vercel free-tier cap (a Vercel-era reason; the deploy-size concern still applies on the current host). T1 is bounded because it relies on `generateStaticParams` to enumerate the param space, not to render every possible product. The 150 psalm pages and 172 tune pages and one each of `/`, `/psalms`, `/explore` is well under 1 GB.

If `generateStaticParams` is ever removed from `/psalms/[id]` or `/tunes` is restructured to a path like `/tunes/[slug]`, **T1 breaks**: the build no longer enumerates a bounded set, and the deploy can balloon again. This is a coupling that future readers must preserve.

### 2.4 The invalidation contract (binding)

- **Per-changelog-post edits** invalidate `/` and `/changelog` automatically via `revalidatePath` in `/api/changelog`. No manual action required.
- **Per-precenting-set edits** invalidate via `revalidateTag('precent', 'max')` in `/api/precent/**` and `/api/dev/melisma-*`. These calls land in the same request that mutates the DB, so the per-user precenting view refreshes in milliseconds.
- **Full-DB re-imports** (`seedPsalms`, `importAirtable`, anything that rewrites the psalms or tunes table) **do not** invalidate T1 automatically. You must trigger a production redeploy after a re-import, or the public site will keep serving the old psalms/tunes. This rule is already documented in `AGENTS.md §Static rendering`, but it is restated here because it is the most common way to get T1 wrong.

---

## 3. T2 — Tag-cached DB read helpers (the build-time optimisation)

### 3.1 The mechanism

Three read helpers in `src/db/queries/tunes.ts` are wrapped with `unstable_cache`:

```ts
export const PRECENT_CACHE_TAG = "precent" as const
export const fetchAllTunes = unstable_cache(..., { tags: [PRECENT_CACHE_TAG], revalidate: 86400 })
export const enrichAlternateTunesToTuneRows = unstable_cache(..., { tags: [PRECENT_CACHE_TAG], revalidate: 86400 })
export const fetchTunesByMeter = unstable_cache(..., { tags: [PRECENT_CACHE_TAG], revalidate: 86400 })
```

`unstable_cache` is **in-process** — it lives in the Next.js server's memory, not in the Cloudflare edge cache and not in Postgres. Every cold start (including every PM2 restart) wipes it.

### 3.2 Why T2 exists at all

T1's static HTML is built **once at deploy**. During the build, Next.js calls the read helpers for every psalm / every tune. Without T2, every build run would issue hundreds of SELECTs against Postgres. With T2, the first call hits Postgres; every subsequent call during the same build hits the in-process cache. The `revalidate: 86400` is a safety net (the build is unlikely to last 24 hours, but if it does, we'd rather rebuild than serve fresh but stale-during-build data).

### 3.3 Why this doesn't make `/tunes` "fast" for end users

A user hitting `/tunes` after a deploy does **not** benefit from T2. T1 is what makes the page fast: the HTML was built at deploy and is served from the Next.js ISR cache. T2 only matters during the *build*. After deploy, T1 is the only thing protecting the user from a slow first hit.

If you ever see a "T2 isn't helping" observation in production, it is the wrong question. T2's job is to make builds cheap; T1's job is to make users fast.

### 3.4 The invalidation contract

Every write in `/api/precent/**` and `/api/dev/melisma-*` calls `revalidateTag('precent', 'max')` *in the same request*. This is a per-process invalidation: the next read on the same server instance skips the cache. It does **not** invalidate T1 (the static HTML), which is correct — the per-user precenting set is read inside `/precent/*` (not a T1 route), so the static HTML is unaffected.

### 3.5 T2 also lowers the effective route revalidate (measured 2026-11-08)

This is the one place where T2 leaks out of the build and affects what a visitor gets, so it needs to be stated explicitly.

`unstable_cache(..., { revalidate: 86400 })` does not only cache the *read helper*. When a route's prerendered HTML is produced by calling such a helper, Next.js derives the route's own revalidate window from the cached data's freshness — so the route ends up with an effective revalidate of **86400**, not the `false` it declares.

Only two routes consume these helpers:

| Route | Consumes (T2-wrapped) | Declared revalidate | Effective revalidate |
| --- | --- | --- | --- |
| `/psalms/[id]` | `fetchTunesByMeter`, `enrichAlternateTunesToTuneRows` | `false` | **86400** |
| `/tunes` | `fetchAllTunes` | `false` | **86400** |
| `/`, `/psalms`, `/explore`, `/daily`, `/psalms/[id]/study`, `/tunes/[slug]` | none of the three | `false` | `false` |

(The three T2 wrappers are `fetchAllTunes`, `enrichAlternateTunesToTuneRows` and `fetchTunesByMeter` — `src/db/queries/tunes.ts:117,208,350`. `/psalms/[id]` also calls `fetchTuneMelismaStatus`, `fetchPsalmVersionTuneTiers` and `fetchTuneCount`, but those are plain `cache()`/unwrapped functions, not T2 wrappers, so they are not part of this.)

**Evidence (live build `.next-build`, 2026-11-08):**

- `prerender-manifest.json` — `initialRevalidateSeconds` is `86400` for **199** routes and `false` for **966**. The 199 are exactly `/psalms/<id>` (150 base + 13 `a` + 13 `b` + 22 psalm-119 verse-range subsections) plus `/tunes`.
- Live response headers — `/psalms/23` and `/tunes` both return `cache-control: s-maxage=86400, stale-while-revalidate=31449600`; `/` and `/daily` return `s-maxage=31536000` (Next's encoding of `revalidate = false`).

**What this means in practice.** `/psalms/<id>` and `/tunes` are rebuilt at most once per 24 h on their own, *in addition to* whatever `revalidatePath`/`revalidateTag` and the deploy do. It is not a problem — the site gets ~1 visitor/day, the Cloudflare edge does not cache these routes (`cf-cache-status: DYNAMIC`), and the content changes yearly anyway. But it does mean "T1 is indefinite" is **not** true of these two routes, and anyone reasoning about invalidation needs to know it.

**If you want these two routes to be genuinely indefinite**, the fix is to stop the T2 wrappers from being the route's freshness source — e.g. give the helpers `revalidate: false` (they are a build-time optimisation; the build never lasts 24 h) or move them behind a `cache()` wrapper that does not participate in route revalidate derivation. That is a code change with a real (if small) performance trade-off, and is **not** required for correctness. It is recorded here as a known divergence, not as a defect.

---

## 4. Why there is no third tactic (the `/daily` page)

### 4.1 What used to be here

This doc originally described a third tactic:

```ts
// src/app/daily/page.tsx — as of PR #94 (2026-09-27)
export const dynamic = 'force-static'
export const revalidate = 3600  // 1 hour
```

The rationale was sound: `/daily` was the only page whose content genuinely changed on a schedule, so a 1-hour TTL let the dawn US-Eastern-Prime-Time visit hit a warm page while bounding staleness to an hour.

### 4.2 What actually happened

The Phase 18 "undo Vercel + Neon" sweep (PR #103, 2026-10-12) removed `export const revalidate = 3600` from `src/app/daily/page.tsx`. It was collateral damage: the sweep's intent was to strip Vercel-specific `export const revalidate = N` exports, but `revalidate = 3600` is a standard Next.js ISR export, not a Vercel-ism.

This doc was written on **2026-10-13** (`4a1100ba`, Phase 19 close-out) — the day *after* that removal — from the Phase 19 plan rather than from the tree, so it documented a state that had already stopped existing. The TTL was not missed because nothing broke; see §4.3.

**Verified 2026-11-08:** `grep -rn "export const revalidate" src/app/` returns eleven `revalidate = false` declarations and **no** finite TTL anywhere. `src/app/daily/page.tsx` declares only `export const dynamic = 'force-static'`, which defaults to `revalidate = false`. The live build's `prerender-manifest.json` gives `/daily` an `initialRevalidateSeconds` of `false`, and the live route returns `s-maxage=31536000` — the same as `/`.

### 4.3 Why the removal is harmless

The original rationale assumed the server chose the day's content. It does not. `src/components/DailyCalendarClient.tsx` picks the displayed month **in the browser**:

```ts
const now = new Date()
const [displayedMonth, setDisplayedMonth] = useState(() => now.getMonth())
const [displayedYear] = useState(() => now.getFullYear())
```

The server prerenders the full set of daily readings from `fetchAllDailyReadings`; the client selects the current month from that set. So the page rolls from November to December at midnight **regardless of the ISR TTL**. The TTL was never what made the calendar current.

### 4.4 Where that leaves `/daily`

`/daily` is a **T1 route** — `force-static`, `revalidate = false`, built once, cached indefinitely, invalidated by `revalidatePath` or a redeploy. Content corrections to the `daily_readings` table therefore need a **production redeploy** (or an explicit `revalidatePath('/daily')`) to appear, rather than appearing within an hour. Given the content changes about once a year, that is the right trade — but it is a change in behaviour from what this doc used to promise, and it is the reason the removal matters enough to be recorded here.

If a finite TTL is ever wanted back, it is a one-line change to `src/app/daily/page.tsx` — but on this evidence it would buy nothing, because the client already picks the month.

---

## 5. The deliberately-not-cached routes

These are the routes that **must not** be cached, the reason, and what guards them.

| Route | Why not cached | Guard |
| --- | --- | --- |
| `/precent/**` | Per-user. The precentor is the only visitor; their set edits must be live. | `force-dynamic` in middleware/route segments. Better Auth session check in `src/middleware.ts` makes it owner-only. |
| `/admin/**` | Same as precent. | `force-dynamic` + owner-only. |
| `/api/**` | Mutation endpoints must be live; read endpoints (`/api/health`, `/api/deploy-info`) don't need caching because they are owner-only or low-traffic. | `force-dynamic` in API route files. |
| `/_next/static/**` | Already long-cached by Next + Cloudflare defaults. | Next.js's default `Cache-Control: public, max-age=31536000, immutable` for hashed assets. |
| `/login`, `/signup` | Auth surfaces; must not leak via shared cache. | `force-dynamic` (or default Next.js behaviour for client-component auth pages). |

If you ever see a CDN cache header on any of these, something is wrong.

---

## 6. What is *not* in scope (and why)

- **Cloudflare HTML caching.** Free tier supports it for non-cookied responses, but we deliberately set no `s-maxage` of our own on any T1 route (Next.js emits its own `s-maxage` derived from the route's revalidate — 31536000 for `false`, 86400 for the T2-lowered routes in §3.5). Adding an explicit edge TTL would help the cross-region warm path. Today's traffic is too small to measure the benefit, and the invalidation contract (which Cloudflare doesn't speak) is non-trivial. Revisit if traffic grows or if a cross-region cold start becomes visible.
- **Extra `s-maxage` on T1 routes.** Same story. The static HTML is already served from the Next.js ISR cache; `s-maxage` only helps if the request lands at a point of presence that doesn't have it warm. T1 + `revalidate = false` is already as good as the edge can offer.
- **`unstable_cache` replacement with Redis / KV.** T2 is in-process because that's good enough for the build. A persistent cache would not change user-visible behaviour, and the read helpers are not on the user-facing hot path.
- **Tag-based invalidation of T1.** The T1 routes are invalidated via `revalidatePath`, not `revalidateTag`. Adding tags would let us invalidate a single psalm page on a per-psalm edit, but the only edits are full-DB re-imports, which require a production redeploy anyway.

---

## 7. Acceptance checks for a future change

Before touching any of this, verify:

- [ ] The 1-visitor/day / 12-visitor-Sunday traffic model still holds. If traffic grows by 10×, the uniform-policy question in §1 needs revisiting.
- [ ] `generateStaticParams` is still enumerated at the route segment for `/psalms/[id]`. If it is removed, T1 breaks the deploy.
- [ ] Every write in `/api/precent/**` and `/api/dev/melisma-*` calls `revalidateTag('precent', 'max')`. A missing call leaves per-user precenting views stale.
- [ ] After a `seedPsalms` or `importAirtable` run, a production redeploy is queued. The deploy, not the script, is what flushes T1.
- [ ] The `/api/changelog` POST still calls `revalidatePath('/')` and `revalidatePath('/changelog')`. Removing those re-introduces the "new changelog post doesn't show on the home banner" bug.
- [ ] If the T2 wrappers in `src/db/queries/tunes.ts` are changed, re-check the effective revalidate of `/psalms/[id]` and `/tunes` (§3.5) — `prerender-manifest.json`'s `initialRevalidateSeconds` and the live `s-maxage` header are the two things to compare.

---

## Related

- `docs/research/visitor-workflows.md` — the *why* behind the caching tactics (visitor jobs, traffic shape, mobile-first).
- Issue #82 — the consolidated caching/prefetch strategy this doc captures.
- Issue #89 — this doc's tracking issue.
- PR #92 — T2 (the `unstable_cache` wrapping).
- PR #94 — T1 and the original T3 (the route-level ISR + `/api/changelog` `revalidatePath` wiring). The T3 TTL was later removed by PR #103 — see §4.
- `AGENTS.md §Static rendering` — the binding rule that a production redeploy is required after database content changes.
