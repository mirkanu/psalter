---
status: findings
phase: 19-hetzner-perf-ship-layer-3-cloudflare-cache-rule-t2-route-con
files_reviewed: 12
critical: 0
warning: 6
info: 5
total: 11
---

# Phase 19 Code Review

Reviewed: 2026-10-13 by gsd-code-reviewer (depth: standard).
Scope: 12 source files modified during Phase 19 (T2 conversions + /precent de-auth-gate + Cloudflare Cache Rule + DB password rotation).

## Summary

The changeset is well-structured and the de-auth-gate threat model is sound. The 6 warning findings are mostly edge-case path-matching brittleness and a known build-resilience trade-off, not fundamental security or correctness defects. No critical findings.

## Files Reviewed

1. `src/app/tunes/[slug]/page.tsx`
2. `src/app/psalms/[id]/study/page.tsx`
3. `src/app/explore/authors/[author]/page.tsx`
4. `src/app/explore/topics/[slug]/page.tsx`
5. `src/app/explore/naves/[slug]/page.tsx`
6. `src/app/explore/messianic/page.tsx`
7. `src/app/precent/[id]/page.tsx`
8. `src/app/precent/[id]/sing/[pos]/page.tsx`
9. `src/middleware.ts`
10. `next.config.ts`
11. `docker-compose.yml`
12. `docs/research/cache-tactics.md` (informational)

## Critical Findings

_None._

## Warning Findings

### WR-01: `Cache-Control: public, s-maxage=31536000` applied to a `force-dynamic` page

**File:** `src/app/tunes/[slug]/page.tsx` (referenced via `next.config.ts:42-44`)
**Issue:** The `/psalms/:id/sing` source glob emits `public, s-maxage=31536000` to a page that is `force-dynamic` and reads `searchParams`. Cloudflare will cache the *first response* for 1 year. The `/psalms/:id/sing` route also currently 404s (no page exists yet), so the 404 body gets cached for 1 year.
**Fix:** Either (a) drop the `/psalms/:id/sing` source from the `headers()` block until the page is `force-static`, or (b) convert the sing page to `force-static` and read `searchParams` via a different mechanism.

```ts
// next.config.ts — drop the sing glob until the page is force-static
// { source: '/psalms/:id/sing', headers: t2CacheControl },  // REMOVE
```

### WR-02: `generateStaticParams` silently returns `[]` on DB error → entire T2 surface 404s if Neon unreachable at build time

**Files:** 7 page files (`src/app/tunes/[slug]/page.tsx:25`, `src/app/psalms/[id]/study/page.tsx:48`, `src/app/explore/authors/[author]/page.tsx:17`, `src/app/explore/topics/[slug]/page.tsx:23`, `src/app/explore/naves/[slug]/page.tsx:22`, `src/app/precent/[id]/page.tsx:23`, `src/app/precent/[id]/sing/[pos]/page.tsx:48`)
**Issue:** Every `generateStaticParams` wraps the DB call in `try { ... } catch { return [] }`. If Neon is unreachable at build time, Next.js enumerates zero static params, the build completes "successfully" with empty route tables, and every public URL returns 404 for 1 year (until next deploy). No log line marks the failure — silent break.
**Fix:** At minimum, log the error before returning `[]`:
```ts
} catch (err) {
  console.error(`[generateStaticParams] DB unreachable for ${contextDescription}:`, err)
  return []
}
```

### WR-03: `/precent/[id]/sing/[pos]/page.tsx` `generateStaticParams` uses correlated subquery (N+1)

**File:** `src/app/precent/[id]/sing/[pos]/page.tsx:28-49`
**Issue:** The subquery `SELECT COUNT(*)::int FROM set_items WHERE set_items.set_id = ${precentingSets.id}` runs once per precenting_set row. Trivial at 10 sets; could become a build bottleneck at 1000+.
**Fix:** Single GROUP BY query:
```ts
const rows = await db
  .select({ setId: setItems.setId, itemCount: sql<number>`COUNT(*)::int` })
  .from(setItems)
  .groupBy(setItems.setId)
```

### WR-04: Carve-out regex doesn't allow trailing slash — `/precent/123/` is auth-gated while `/precent/123` is public

**File:** `src/middleware.ts:46-51`
**Issue:** With Next.js's default `trailingSlash: false`, a request to `/precent/123/` would 308-redirect to `/precent/123`. The regexes don't match a trailing slash, so the request falls through to the session-cookie gate.
**Fix:** Allow optional trailing slash:
```ts
if (
  pathname.match(/^\/precent\/\d+\/?$/) ||
  pathname.match(/^\/precent\/\d+\/sing\/\d+\/?$/)
) {
  return NextResponse.next()
}
```

### WR-05: docker-compose password rotation creates a startup-failure window

**File:** `docker-compose.yml:10`
**Status:** ✅ **Resolved in this session** (post-review fix). The `psalter/.env` line 1 was updated to `postgresql://postgres:5155576a...=@localhost:5435/psalter` (literal hex matching `${PSALTER_DB_PASSWORD}` from shared env) in the same atomic commit (`402cf8f4`). PM2 was restarted and verified serving 200.
**Documented regression:** Next.js `@next/env` literal-overrides shell-expanded `DATABASE_URL` at build time, breaking builds when `${POSTGRES_PASSWORD}` doesn't expand. The literal-hex form is the working pattern until a build-time dotenv-expansion tool is added. See `19-02-db-password-rollback.txt` (gitignored) for forensic record.

### WR-06: `/precent/[id]` carve-out leaks `set.userId` and `precentorName` to anonymous viewers

**File:** `src/app/precent/[id]/page.tsx:114`
**Issue:** The serialized set includes `userId` (internal FK) and `precentorName`. Plan says "the data is the precentor's own set with no confidential content" — true for a single-precentor deployment. Becomes a privacy leak if multi-precentor or notes are added. The 1-year `s-maxage` amplifies the window.
**Disposition:** **Deferred to follow-up phase.** Architectural change needed (tag-based revalidation on `precentingSets` writes, or split ownership data to a session-aware endpoint). Per the threat model and plan, current behaviour is accepted.

## Info Findings

### IN-01: `buildTuneOption` uses `Record<string, any>` (pre-existing)

**File:** `src/app/precent/[id]/sing/[pos]/page.tsx:213`
Pre-existing — not a Phase 19 change. Type safety bypass acknowledged via eslint-disable.

### IN-02: Carve-out regexes recompiled on every middleware invocation

**File:** `src/middleware.ts:47-48`
**Fix:** Hoist to module-scope `const`.

### IN-03: `try { ... } catch { return [] }` repeated 7 times

Same files as WR-02. DRY violation.

### IN-04: Cloudflare Free-plan `contains` over-matches

`19-01-SUMMARY.md` documents this. Not exploitable, but 1-year cache on 404s is wasteful. Future migration to Business plan needed for proper regex.

### IN-05: `/precent/[id]` HTML has `precentorName` baked at deploy time

No revalidate-tag on `precentingSets` writes. Already noted in `cache-tactics.md`. Phase 19 amplifies with 1y TTL.

## Cross-cutting Notes

1. **Carve-out order is correct.** Carve-out at lines 46-51 runs before `/precent` session-cookie check at line 54. `/api/dev` and `/dev` blocks come before the carve-out — correct precedence (non-intersecting).
2. **Carve-out is digit-only.** `/precent/abc`, `/precent/123abc`, `/precent/-1` correctly fall through to session-cookie gate.
3. **`matcher` excludes `/api/precent/*`.** API auth via `getSessionOr401` in route handlers. Correct.
4. **No `headers()` overlap with auth-gated routes.** `Cache-Control: public` on `/precent/:id(\d+)` only applies to numeric IDs. `/precent` (list) and `/precent/abc` not in headers() block.
5. **No new attack surface from `Cache-Control: public`.** Data is the precentor's own service plan. Accept per threat model.

## Rollback Verification

- **Cloudflare Cache Rule DELETE:** documented in `19-01-cache-rule-id.txt`. Cross-project coupling warning: deleting ruleset `d8c78a92…` also kills the debates rule (Free-plan ruleset cap forced ruleset sharing). **Risk not flagged in plan's rollback runbook.**
- **Page-level revert:** `git revert HEAD --no-edit && npm run build && pm2 restart psalter` cleanly reverts. ✓
- **De-auth-gate re-gate:** Same `git revert` undoes both page-level auth removal + middleware carve-out. ✓
- **Rollback gap:** No test confirms rollback is *actually* exercised. Recommend synthetic rollback drill in staging environment before next phase touching this surface.

---

*Reviewer: Claude (gsd-code-reviewer, depth: standard)*  
*Reviewed: 2026-10-13*
