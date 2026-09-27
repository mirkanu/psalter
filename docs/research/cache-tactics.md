# Cache Tactics — v2.x Public Site

**Scope:** The concrete caching decision for each route on `psalter.gsdlabs.dev`, the three tactics the site uses, and the rules for choosing between them.
**Authoritative source:** the "Final plan" comment on issue [#82](https://github.com/mirkanu/psalter/issues/82) posted 2026-09-27. The "why" (who uses the site, why 1-visitor/day means TTLs don't work without warming) lives in [`docs/research/visitor-workflows.md`](visitor-workflows.md) — read that first.

**Cross-refs:** Plan thread → [issue #82](https://github.com/mirkanu/psalter/issues/82). Visitor facts → [`visitor-workflows.md`](visitor-workflows.md). `unstable_cache` machinery → [PR #83](https://github.com/mirkanu/psalter/pull/83).

---

## 1. Caching architecture in 30 seconds

```
Visitor → Cloudflare edge (proxied CNAME, psalter.gsdlabs.dev)
        → Vercel CDN
        → Next.js app (default: dynamic rendering)
```

- **Vercel is the origin.** It serves rendered HTML, with optional ISR (Incremental Static Regeneration) on top.
- **Cloudflare sits in front.** It acts as both a proxy and a second-layer cache. Its edge cache sits in front of Vercel's CDN.
- **We cache full HTML, not fragments.** User-perceived latency is what matters; fragment-level caching only helps once the HTML shell is already in the visitor's hands.
- **Cloudflare current zone settings:** `cache_level=aggressive`, `browser_cache_ttl=14400` (4 h), `edge_cache_ttl=7200` (2 h). No HTML cache rule exists. T2 below requires adding a Cache Rule with `edge_ttl=31536000` on the matching paths; otherwise the 2 h zone default will expire T2 caches prematurely.

## 2. The three tactics

| # | Tactic | Built by | Held by | Time-out | When cold = bad? |
|---|---|---|---|---|---|
| **T1** | Indefinite ISR | Vercel at deploy time | Vercel's CDN; Cloudflare proxies past | never (until invalidated) | After content change → needs a manual rebuild trigger or `revalidatePath` |
| **T2** | Edge cache indefinite | First visitor | Cloudflare (full HTML) | never | Content change → CF purge that URL |
| **T3** | Edge cache 1 h | First visitor | Cloudflare (full HTML) | 1 h | Tolerant of lag |

### How each tactic actually flows

- **T1 (Indefinite ISR):** Vercel pre-builds HTML at deploy → Vercel serves warm → Cloudflare caches that HTML on first visitor → subsequent visitors hit Cloudflare's edge cache. Cache survives indefinitely; refresh requires `revalidatePath` / `revalidateTag` / full Vercel redeploy.
- **T2 (Edge cache indefinite):** Vercel's ISR is **off** for that route → first request goes Vercel → Cloudflare caches the HTML response → subsequent visitors hit Cloudflare's edge cache indefinitely. Refresh requires a CF purge (Cache Rule action).
- **T3 (Edge cache 1 h):** Same as T2 but the cache expires after 1 h. Cheap; ideal for content that genuinely changes on a slow cadence (e.g. `/daily`).

### Picking a tactic

- **T1** is reserved for routes where the build-time cost is low *and* a cold hit is bad *and* the content is enumerable enough that `generateStaticParams` is feasible. Net: psalm list, psalm detail (sing view), tune list, explore index, the home shell — all of these have a closed set of URLs and stable content.
- **T2** is the default. Routes that fall through the classification table land here. Cloudflare holds the HTML; a single purge invalidates.
- **T3** is rare. Only `/daily` today — it changes daily, a 1 h lag is acceptable, and pre-rendering all 365 days doesn't pay back the build cost.

## 3. Route classification

| Route | Tactic | Notes |
|---|---|---|
| `/` (home) | **T1**, except today's-psalm component which is **T3** | Home renders instantly; show a small "loading" placeholder where today's psalm lives for the <1 s cold case. No cron — daily change surfaces by next visit. |
| `/psalms`, all `/psalms/[id]` | **T1** | One ISR per psalm. No `revalidate`. Mutations trigger `revalidatePath` where they exist; otherwise rely on manual redeploy. |
| `/psalms/[id]/study` | **T2** | Commentary; cold-load acceptable because it isn't a song-time route. |
| `/psalms/[id]?tune=[id]` | **T2** | Rare custom-tune combo; OK to cold-load once, then keep. |
| `/tunes` (index) | **T1** | Stable enum of tunes. |
| `/tunes/[slug]` | **T2** | Each tune's HTML cached indefinitely at CF. |
| `/explore` | **T1** | Static-feel index of topics / authors / messianic. |
| `/explore/[slug]` | **T2** | Detail page per topic/author. |
| `/changelog` | **T1** | Rebuild-on-publish wired via `revalidatePath`. |
| `/daily` | **T3** | 1 h cache, no ISR. Cold visit acceptable. |
| `/precent` (set list) | **Per-user ISR (T1) for the user's most recent 3 sets; full HTML cached owner-only.** Stale-while-revalidate by tag. | Depends on a shared `unstable_cache` helper that wraps heavy DB queries. Tag = `precent-user-<id>`. |
| `/precent/[id]` (set view) | **T2, full HTML, owner-cached** | Not auth-gated at framework level: contains no confidential info, hidden by absence of inbound links. |
| `/precent/[id]/sing/[n]` (sing) | **T2, full HTML, owner-cached** | Same reasoning as `/precent/[id]`. |
| Anything not explicitly classified | **T2 (default)** | Safety net. |

## 4. Why `/precent/[id]/*` are de-auth-gated at the framework level

`/precent/[id]` and `/precent/[id]/sing/[n]` contain no confidential information; they are "hidden" because non-owners have no path to them, not because the framework refuses to render them. Marking them auth-gated at the middleware layer forces an auth check on every request and blocks both Vercel pre-rendering and Cloudflare full-HTML caching.

The listing `/precent` itself **stays auth-gated** because it varies per user and is not enumerable — Vercel can't pre-build a finite set, and Cloudflare can't serve a shared cache. Owner-only via Better Auth middleware (`src/middleware.ts`).

## 5. Invalidation wiring

| Event | Action | Where |
|---|---|---|
| Admin presses "Publish post" on `/changelog` | `revalidatePath('/changelog')` and `revalidatePath('/')` | `src/app/api/changelog/route.ts` (POST handler) |
| Mutation to a precent set | `revalidateTag('precent-user-<id>')` (targeted) and `revalidateTag('precent')` (broad) | `/api/precent/*` routes |
| Neon DB schema/metadata change (rare, every few months) | `vercel --prod redeploy`. A Vercel Deploy Hook will be added later; not wired today because cadence is months. | Manual for now |

No scheduled ISR revalidate anywhere else.

## 6. Repo-level invariant

`AGENTS.md` MUST record:

> **Neon DB content changes are rare (every few months). When you change it, you must trigger a Vercel production redeploy** — otherwise ISR-cached routes (T1) and edge-cached routes (T2/T3) will keep serving the old content indefinitely.

Without this note, future contributors will not know that DB-backed routes rely on deploy-time, not request-time, freshness.

## 7. What we deliberately don't do

- **No scheduled ISR revalidate.** A 1-visitor/day site never benefits from proactive cache warming, and a 24-hour TTL is functionally a no-cache (see visitor-workflows §2). Adding cron would just burn build minutes.
- **No fragment-level caching.** Full HTML only — the cost of stitching fragments together at request time exceeds the savings on this volume.
- **No service worker / offline cache.** Out of scope; revisit when the prefetch work in [issue #80](https://github.com/mirkanu/psalter/issues/80) lands.
- **No central Redis / KV.** All cache state lives in Vercel's build output and Cloudflare's edge. Adding a third cache layer does not earn its keep here.

## 8. Open items / follow-ups

- Vercel Deploy Hook wiring (one endpoint, one row in Cloudflare Cache Rules) — revisit if DB-edit cadence rises above "a few months."
- The `unstable_cache` helper that PR #83 attempted is **currently not in master** (that PR was closed without merge). Per-user precent caching (Layer 1 of the #82 plan) requires reintroducing it. Tracked under a follow-up PR that supersedes #83.
- The prefetch work in [issue #80](https://github.com/mirkanu/psalter/issues/80) stays out of scope here; revisit after cache work lands and we have real-world p95 numbers.
