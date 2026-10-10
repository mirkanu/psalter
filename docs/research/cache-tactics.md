# Cache Tactics — v2.x Public Site

**Domain:** The exact caching posture (Vercel ISR, in-process `unstable_cache`, Cloudflare edge, write-time `revalidatePath`/`revalidateTag`) for every route on `psalter.gsdlabs.dev`, the rules each posture follows, and the things that are deliberately not cached and why.
**Captured:** 2026-10-04 (one month after PR #94, after a Neon-cost investigation identified that the right rules are already in place; this doc is the stable reference)
**Companion to:** `docs/research/visitor-workflows.md` (the *why* — visitor jobs, traffic shape, mobile-first constraints). This doc is the *how* and the *what lives where*. Implementation PRs (notably #92, #94) reference this doc.

**TL;DR — the three tactics**

| Tactic | Mechanism | Routes | Invalidated by | Why this shape |
| --- | --- | --- | --- | --- |
| **T1** Indefinite ISR | `dynamic = 'force-static'`, `revalidate = false` at the route segment | `/`, `/psalms`, `/psalms/[id]`, `/tunes`, `/explore` | `revalidatePath('/')` in `/api/changelog`; **manual Vercel production redeploy** for full-DB re-imports | Visitors per page are < 1/day. A long TTL is functionally a no-cache anyway, but T1 guarantees the page is *built* exactly once and shipped from Vercel's edge. `revalidate = false` means it stays built until something explicitly invalidates. |
| **T2** Tag-cached reads | `unstable_cache(..., { tags: ['precent'], revalidate: 86400 })` wrapping the three read helpers in `src/db/queries/tunes.ts` | All five T1 pages (read helpers back them) | `revalidateTag('precent', 'max')` on every write in `/api/precent/**` and `/api/dev/melisma-*` | Layered under T1. T1 builds the HTML once at deploy; T2 ensures the underlying read helpers (called during build) return cached DB data instead of hitting Neon on every build. After deploy, T1 is the only thing that matters; T2 is the in-build time optimisation. |
| **T3** Short-ISR, cold-OK | `dynamic = 'force-static'`, `revalidate = 3600` | `/daily` | TTL only | Content genuinely changes every day; cold visit is acceptable because the visitor has no expectation of "live" data. One-hour TTL is the smallest window that holds the day in cache for the dawn US-ET primetime window. |

There is **no T2 for HTML** (no Cloudflare HTML cache, no Vercel `s-maxage`). Cloudflare is in pass-through mode — `cf-cache-status: DYNAMIC` on every request. Static assets (`*.js`, `*.css`, `*.woff2`, images) ride Cloudflare's free-tier defaults, which is correct because Vercel already serves them with long `max-age`; touching them adds nothing.

---

## 1. Why exactly three tactics and not a uniform policy

The site gets ~1 visitor/day on average, ~12 on Sundays (`visitor-workflows.md` Fact 2). A uniform "set `revalidate = 3600` everywhere" is **worse** than what we have, because:

1. It rebuilds the static HTML every hour for routes that change yearly (psalms, tunes). Each rebuild re-runs the read helpers, which is exactly the cost we wanted to avoid.
2. It *still misses* most of the 1-visitor/day traffic, because the TTL elapses between hits. A 24 h TTL on a 1-hit/day route is functionally a no-cache.
3. It does not give us anything T1 doesn't already give us, because T1's "indefinite" still has to be invalidated by writes — which we already do.

The asymmetric traffic shape (one page gets ~12 visits on Sunday, everything else gets ~1/day) is what kills uniform policies. A TTL tuned to "Sunday peak" is wrong for weekdays; a TTL tuned to "weekday" is wrong for Sundays. T1 sidesteps the question by never expiring, and T3 says "for the one route that genuinely changes daily, accept the hourly rebuild cost because cold visits are tolerable".

---

## 2. T1 — Indefinite ISR (the five static pages)

### 2.1 The mechanism

Each of the five routes declares:

```ts
export const dynamic = 'force-static'
export const revalidate = false
```

at the top of the route segment file, and pre-builds its parameter space via `generateStaticParams` where applicable. `revalidate = false` means "never expire on a timer"; the route stays built until something calls `revalidatePath` or a fresh deploy lands.

### 2.2 Per-route detail

| Route | `generateStaticParams` enumerates | Why this is safe | Where the invalidation lives |
| --- | --- | --- | --- |
| `/` | N/A (no params) | The homepage is one HTML. Changelog is the only thing that changes it. | `src/app/api/changelog/route.ts` calls `revalidatePath('/')` and `revalidatePath('/changelog')` on every POST. Anything else requires a Vercel redeploy. |
| `/psalms` | N/A (no params) | A list of ~150 psalm titles. Build once. | Manual Vercel redeploy on `seedPsalms`. |
| `/psalms/[id]` | All 150 psalm IDs at deploy (`generateStaticParams` in the route file) | Bounded set. Each page is a single psalm with its recommended tune(s). | Manual Vercel redeploy on `seedPsalms` *or* `importAirtable`. The `/api/dev/melisma-save` route also calls `revalidatePath('/psalms/${id}')` for live tunings. |
| `/tunes` | N/A (no params) | A list of ~172 tunes. Build once. | Manual Vercel redeploy on `importAirtable` (or equivalent DB import). |
| `/explore` | N/A (no params) | Topic/messianic/author index. Build once. | Manual Vercel redeploy on `seedPsalms`. |

### 2.3 The deployment cost we accepted to get T1

The earlier blanket-ISR attempt (pre-#73, reverted in PR #73) pre-rendered every psalm × every tune cross-product and ballooned the deploy to 2–3 GB, blowing the Vercel free-tier cap. T1 is bounded because it relies on `generateStaticParams` to enumerate the param space, not to render every possible product. The 150 psalm pages and 172 tune pages and one each of `/`, `/psalms`, `/explore` is well under 1 GB.

If `generateStaticParams` is ever removed from `/psalms/[id]` or `/tunes` is restructured to a path like `/tunes/[slug]`, **T1 breaks**: the build no longer enumerates a bounded set, and the deploy can balloon again. This is a coupling that future readers must preserve.

### 2.4 The invalidation contract (binding)

- **Per-changelog-post edits** invalidate `/` and `/changelog` automatically via `revalidatePath` in `/api/changelog`. No manual action required.
- **Per-precenting-set edits** invalidate via `revalidateTag('precent', 'max')` in `/api/precent/**` and `/api/dev/melisma-*`. These calls land in the same request that mutates the DB, so the per-user precenting view refreshes in milliseconds.
- **Full-DB re-imports** (`seedPsalms`, `importAirtable`, anything that rewrites the psalms or tunes table) **do not** invalidate T1 automatically. You must trigger a Vercel production redeploy after a re-import, or the public site will keep serving the old psalms/tunes. This rule is already documented in `AGENTS.md §Static rendering`, but it is restated here because it is the most common way to get T1 wrong.

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

`unstable_cache` is **in-process** — it lives in the Next.js server's memory, not in Vercel's edge cache and not in Neon. Every cold start (including every Vercel deploy) wipes it.

### 3.2 Why T2 exists at all

T1's static HTML is built **once at deploy**. During the build, Next.js calls the read helpers for every psalm / every tune. Without T2, every build run would issue hundreds of SELECTs against Neon. With T2, the first call hits Neon; every subsequent call during the same build hits the in-process cache. The `revalidate: 86400` is a safety net (the build is unlikely to last 24 hours, but if it does, we'd rather rebuild than serve fresh but stale-during-build data).

### 3.3 Why this doesn't make `/tunes` "fast" for end users

A user hitting `/tunes` after a deploy does **not** benefit from T2. T1 is what makes the page fast: the HTML was built at deploy and is served from Vercel's edge. T2 only matters during the *build*. After deploy, T1 is the only thing protecting the user from a slow first hit.

If you ever see a "T2 isn't helping" observation in production, it is the wrong question. T2's job is to make builds cheap; T1's job is to make users fast.

### 3.4 The invalidation contract

Every write in `/api/precent/**` and `/api/dev/melisma-*` calls `revalidateTag('precent', 'max')` *in the same request*. This is a per-process invalidation: the next read on the same server instance skips the cache. It does **not** invalidate T1 (the static HTML), which is correct — the per-user precenting set is read inside `/precent/*` (not a T1 route), so the static HTML is unaffected.

---

## 4. T3 — Short-ISR (the daily-changing page)

### 4.1 The mechanism

`/daily` is the only route with a finite TTL:

```ts
export const dynamic = 'force-static'
export const revalidate = 3600  // 1 hour
```

### 4.2 Why `/daily` is the only T3 route

Only one piece of content on the site changes on a known, predictable schedule: the daily reading (different psalm per day). All other content is either truly static (psalms, tunes) or per-user dynamic (precenting sets). A 1-hour TTL means that the dawn US-Eastern-Prime-Time visit hits a cached page, and a US-Pacific-anchored evening visit hits a page that's at most 1 hour stale. A longer TTL would risk serving yesterday's psalm in the morning; a shorter TTL would defeat the cache for the small Sunday-morning user cluster.

`/daily` is also the one place where a cold visit is genuinely acceptable: the visitor is opening the app at a time of their choosing, and the page is mostly text. A 1-second cold hit is fine.

### 4.3 The invalidation contract

`/daily` invalidates only on TTL expiry. There is no write hook — content changes via deploy (or via a daily cron, if that is ever added). If a daily-reading entry is corrected in Neon, the next visit will pick it up at most 1 hour later.

---

## 5. The deliberately-not-cached routes

These are the routes that **must not** be cached, the reason, and what guards them.

| Route | Why not cached | Guard |
| --- | --- | --- |
| `/precent/**` | Per-user. The precentor is the only visitor; their set edits must be live. | `force-dynamic` in middleware/route segments. Better Auth session check in `src/middleware.ts` makes it owner-only. |
| `/admin/**` | Same as precent. | `force-dynamic` + owner-only. |
| `/api/**` | Mutation endpoints must be live; read endpoints (`/api/health`, `/api/deploy-info`) don't need caching because they are owner-only or low-traffic. | `force-dynamic` in API route files. |
| `/_next/static/**` | Already long-cached by Vercel + Cloudflare defaults. | Vercel's default `Cache-Control: public, max-age=31536000, immutable` for hashed assets. |
| `/login`, `/signup` | Auth surfaces; must not leak via shared cache. | `force-dynamic` (or default Next.js behaviour for client-component auth pages). |

If you ever see a CDN cache header on any of these, something is wrong.

---

## 6. What is *not* in scope (and why)

- **Cloudflare HTML caching.** Free tier supports it for non-cookied responses, but we have no `s-maxage` set on any T1 route. Adding it would help the cross-region warm path. Today's traffic is too small to measure the benefit, and the invalidation contract (which Cloudflare doesn't speak) is non-trivial. Revisit if traffic grows or if a cross-region cold start becomes visible.
- **Vercel `s-maxage` on T1 routes.** Same story. Vercel already serves the static HTML from its edge; `s-maxage` only helps if the request lands on a region that doesn't have it warm. T1 + `revalidate = false` is already as good as Vercel can offer.
- **`unstable_cache` replacement with Redis / KV.** T2 is in-process because that's good enough for the build. A persistent cache would not change user-visible behaviour, and the read helpers are not on the user-facing hot path.
- **Tag-based invalidation of T1.** The five T1 routes are invalidated via `revalidatePath`, not `revalidateTag`. Adding tags would let us invalidate a single psalm page on a per-psalm edit, but the only edits are full-DB re-imports, which require a Vercel redeploy anyway.

---

## 7. Acceptance checks for a future change

Before touching any of this, verify:

- [ ] The 1-visitor/day / 12-visitor-Sunday traffic model still holds. If traffic grows by 10×, the T1/T3 split needs revisiting (T1 stays; T3 might want a longer TTL).
- [ ] `generateStaticParams` is still enumerated at the route segment for `/psalms/[id]`. If it is removed, T1 breaks the deploy.
- [ ] Every write in `/api/precent/**` and `/api/dev/melisma-*` calls `revalidateTag('precent', 'max')`. A missing call leaves per-user precenting views stale.
- [ ] After a `seedPsalms` or `importAirtable` run, a Vercel production redeploy is queued. The deploy, not the script, is what flushes T1.
- [ ] The `/api/changelog` POST still calls `revalidatePath('/')` and `revalidatePath('/changelog')`. Removing those re-introduces the "new changelog post doesn't show on the home banner" bug.

---

## Related

- `docs/research/visitor-workflows.md` — the *why* behind T1/T2/T3 (visitor jobs, traffic shape, mobile-first).
- Issue #82 — the consolidated caching/prefetch strategy this doc captures.
- Issue #89 — this doc's tracking issue.
- PR #92 — T2 (the `unstable_cache` wrapping).
- PR #94 — T1 + T3 (the route-level ISR + `/api/changelog` `revalidatePath` wiring).
- `AGENTS.md §Static rendering` — the binding rule that a Vercel redeploy is required after Neon content changes.
