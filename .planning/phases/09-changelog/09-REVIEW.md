---
phase: 09-changelog
reviewed: 2026-08-07T17:40:22Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - src/app/api/changelog/[id]/route.test.ts
  - src/app/api/changelog/[id]/route.ts
  - src/app/api/changelog/route.test.ts
  - src/app/api/changelog/route.ts
  - src/app/api/subscribe/route.test.ts
  - src/app/api/subscribe/route.ts
  - src/app/api/unsubscribe/route.test.ts
  - src/app/api/unsubscribe/route.ts
  - src/app/changelog/page.tsx
  - src/app/changelog/unsubscribe/page.tsx
  - src/app/page.tsx
  - src/components/ChangelogComposer.test.tsx
  - src/components/ChangelogComposer.tsx
  - src/components/ChangelogPostCard.test.tsx
  - src/components/ChangelogPostCard.tsx
  - src/components/SiteHeader.tsx
  - src/components/SubscribeForm.test.tsx
  - src/components/SubscribeForm.tsx
  - src/components/UnsubscribeButton.test.tsx
  - src/components/UnsubscribeButton.tsx
  - src/db/queries/changelog.test.ts
  - src/db/queries/changelog.ts
  - src/db/schema.ts
  - src/lib/changelog-broadcast.test.ts
  - src/lib/changelog-broadcast.ts
  - src/types/vite-raw.d.ts
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
critical_resolved: 1
resolution_note: "CR-01 fixed same-day (commit c228c24) — see note under Critical Issues below."
---

# Phase 09: Code Review Report

**Reviewed:** 2026-08-07T17:40:22Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Reviewed the full changelog subsystem: publish/edit API routes, subscribe/unsubscribe API routes, the broadcast fan-out, DB queries/schema, and the client components (composer, post card with the newly-added inline edit feature, subscribe form, unsubscribe button) plus their tests.

The admin-gating story is solid: both `POST /api/changelog` and `PATCH /api/changelog/[id]` independently call `getAdminSessionOr401()` server-side, the client-side session checks are correctly documented as UI-only, and the tests explicitly assert the server gate holds even when the client check would have hidden the UI. Email HTML/text is escaped correctly (`escapeHtml`, header sanitization) and the broadcast recipient list is sourced exclusively from the DB, not from request input. No XSS, SQL injection, or hardcoded-secret issues were found.

The one critical finding is a missing rate limit on `/api/unsubscribe` — a fully public, unauthenticated endpoint that performs a DB write on every call — which breaks the pattern the rest of this phase otherwise follows consistently (subscribe is explicitly rate-limited "matching /api/feedback"; the publish route explicitly documents why it deliberately has none). The remaining findings are maintainability/UX issues: duplicated validation logic between the two changelog routes, and every client component swallowing the server's actual error message in favor of a generic "try again" string with no client-side length caps to prevent the most common failure (MAX_TITLE/MAX_BODY overflow) from happening at all.

## Critical Issues

### CR-01: `/api/unsubscribe` has no rate limiting on a public, unauthenticated DB-write endpoint

> **RESOLVED 2026-08-07 (commit `c228c24`):** Added `checkRateLimit`/`getClientIp` gating,
> 20 requests/60s/IP (higher than `/api/subscribe`'s 5/60s since the token's 122 bits of
> entropy already rules out brute force — this limit exists to stop request-volume abuse,
> not to protect a guessable secret). Live-verified against the real endpoint: 20×`404`
> (invalid token, reached the DB) then `429` on the 21st request.

**File:** `src/app/api/unsubscribe/route.ts:18-47`
**Issue:** Every other public-facing write path in this phase is protected: `/api/subscribe` explicitly rate-limits before validation (`src/app/api/subscribe/route.ts:20-30`, "matching /api/feedback... a malformed-body flood must not be a free bypass of the limiter"), and `/api/changelog` explicitly documents why it has *no* limiter ("the route is admin-gated"). `/api/unsubscribe` has neither an admin gate nor a rate limiter, and carries no comment explaining the omission — unlike its siblings, which both justify their choice in writing. As written, an anonymous caller can issue unlimited `POST /api/unsubscribe` requests, each triggering a JSON parse and a DB `DELETE ... RETURNING` round trip, with zero throttling. `checkRateLimit`/`getClientIp` already exist in `@/lib/rate-limit` and are already imported one file away in `src/app/api/subscribe/route.ts`, so this isn't a case of missing infrastructure — the reusable pieces are sitting right next to this file and simply weren't wired in. Given this VPS is explicitly documented as memory-constrained (3.7GB total, `earlyoom` configured to kill the greediest process — see project CLAUDE.md "Hetzner VPS memory constraints"), an unthrottled endpoint that always reaches the DB is a real availability risk, not a theoretical one.
**Fix:**
```ts
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

export const UNSUBSCRIBE_RATE_LIMIT = 20
export const UNSUBSCRIBE_RATE_WINDOW_MS = 60_000

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = checkRateLimit(`unsubscribe:${ip}`, {
    limit: UNSUBSCRIBE_RATE_LIMIT,
    windowMs: UNSUBSCRIBE_RATE_WINDOW_MS,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'too many requests', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    )
  }
  // ...existing body-parsing and delete logic
}
```

## Warnings

### WR-01: Title/body validation is duplicated verbatim between the two changelog routes

**File:** `src/app/api/changelog/route.ts:32-38` and `src/app/api/changelog/[id]/route.ts:33-39`
**Issue:** The trim + required + `MAX_TITLE`/`MAX_BODY` length checks are copy-pasted identically across `POST /api/changelog` and `PATCH /api/changelog/[id]`. The two blocks are byte-for-byte the same today, but nothing enforces that they stay in sync — a future change to one (e.g., trimming rules, a new field, a different max) can silently diverge from the other, and the divergence would only surface as an inconsistent-behavior bug between "publish" and "edit", not a compile error or an obviously-failing test.
**Fix:** Extract a shared validator, e.g. in `src/db/queries/changelog.ts` or a new `src/lib/changelog-validation.ts`:
```ts
export function validateChangelogFields(raw: Record<string, unknown>) {
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const body = typeof raw.body === 'string' ? raw.body.trim() : ''
  if (!title) return { error: 'title is required' } as const
  if (title.length > MAX_TITLE) return { error: 'title too long' } as const
  if (!body) return { error: 'body is required' } as const
  if (body.length > MAX_BODY) return { error: 'body too long' } as const
  return { title, body } as const
}
```
Both routes then call this and branch on `'error' in result`.

### WR-02: Client components discard the server's actual error message and enforce no client-side length limits

**File:** `src/components/ChangelogComposer.tsx:42`, `src/components/ChangelogPostCard.tsx:55`, `src/components/SubscribeForm.tsx:24`, `src/components/UnsubscribeButton.tsx:27`
**Issue:** Every one of these components does `if (!res.ok) throw new Error('server error')` and then renders the same generic string (`"Couldn't publish — please try again."`, `"Couldn't save — please try again."`, `"Something went wrong. Please try again."`) regardless of *why* the server rejected the request. Combined with the fact that neither `ChangelogComposer`'s `<Input>`/`<Textarea>` nor `ChangelogPostCard`'s edit form set a `maxLength` matching `MAX_TITLE` (200) / `MAX_BODY` (20,000), an admin who pastes a long changelog body will submit, get a 400 for "body too long", and see only "try again" — with no indication of what's wrong or how long is too long. Retrying the identical input will fail identically, forever.
**Fix:** Surface the server's `error` field and add matching client-side caps:
```tsx
if (!res.ok) {
  const { error } = await res.json().catch(() => ({ error: 'server error' }))
  throw new Error(error ?? 'server error')
}
// ...
} catch (err) {
  setStatus('error')
  setErrorMessage(err instanceof Error ? err.message : 'server error')
}
```
```tsx
<Input maxLength={MAX_TITLE} ... />
<Textarea maxLength={MAX_BODY} ... />
```

### WR-03: `PATCH /api/changelog/[id]` imports constants from the sibling POST route module

**File:** `src/app/api/changelog/[id]/route.ts:12`
**Issue:** `import { MAX_TITLE, MAX_BODY } from '../route'` pulls the constants from `changelog/route.ts` — the file that also defines the `POST` handler and, as a module-load side effect, imports `@/db`, `@/db/schema`, `@/lib/admin-auth`, and `@/lib/changelog-broadcast`. Loading `[id]/route.ts` therefore always evaluates the entire `route.ts` module graph as a byproduct of grabbing two numeric constants. This works (the existing test suite confirms it), but it's an unconventional pattern for Next.js route handler files — `route.ts` is expected to export only HTTP method handlers plus the small set of route-config values (`dynamic`, `revalidate`, etc.) — and it creates a hidden coupling: any future change that makes `route.ts` throw at import time (e.g., a broken top-level import) will also break the `[id]` route, even though the two are validating unrelated requests.
**Fix:** Move `MAX_TITLE`/`MAX_BODY` into a small shared module (e.g. `src/lib/changelog-validation.ts`, alongside the WR-01 fix) and have both route files import from there instead of from each other.

## Info

### IN-01: `PATCH /api/changelog/[id]` accepts non-canonical numeric id formats

**File:** `src/app/api/changelog/[id]/route.ts:20-24`
**Issue:** `Number(rawId)` combined with `Number.isInteger(id)` accepts values `Number()` happens to coerce to an integer but that aren't plain decimal digits, e.g. `/api/changelog/0x2A` → `42`, or `/api/changelog/1e1` → `10`. This isn't exploitable (the resulting id still resolves through a parameterized `eq()` lookup against a normal integer PK), but it's looser than "invalid post id" validation implies, and could confuse anyone reasoning about what URLs are valid.
**Fix:** Validate against a strict digit pattern before coercing: `if (!/^\d+$/.test(rawId)) return NextResponse.json({ error: 'invalid post id' }, { status: 400 })`.

### IN-02: Brittle source-text regex test in `ChangelogComposer.test.tsx`

**File:** `src/components/ChangelogComposer.test.tsx:126-129`
**Issue:** This test imports the component's raw source text via `?raw` and asserts on regex matches against the literal source (`/role !== .admin./`, counting `return null` occurrences). It's checking an important invariant (no code path renders the composer for non-admins), but it does so by pattern-matching source text rather than observed behavior — a harmless refactor (e.g., switching from `role !== 'admin'` to `role != 'admin'`, or restructuring the early-return guards without changing behavior) would break this test even though nothing is actually broken. The behavioral coverage already exists in the preceding `describe` blocks (rendering nothing for pending/anon/non-admin sessions), which makes this test redundant as well as fragile.
**Fix:** Consider dropping this test in favor of the existing behavioral assertions, or if the source-scan is intentionally defense-in-depth, loosen the regex and document why a source-text check is being kept alongside behavioral tests.

### IN-03: Unsubscribe landing page has no error handling around its DB read

**File:** `src/app/changelog/unsubscribe/page.tsx:30-34`
**Issue:** Every API route in this phase wraps its DB call in try/catch and returns a controlled JSON error. This server component's `db.query.changelogSubscribers.findFirst(...)` call is unguarded — if the DB is unreachable, the page throws during render and falls through to Next's generic error boundary instead of the same "This unsubscribe link is invalid..." messaging (or a dedicated "try again" state) the rest of the page already uses for the not-found case.
**Fix:**
```ts
let subscriber = null
if (token) {
  try {
    subscriber = await db.query.changelogSubscribers.findFirst({
      where: eq(changelogSubscribers.unsubscribeToken, token),
    })
  } catch (err) {
    console.error('[unsubscribe-page] lookup failed:', err)
  }
}
```

---

_Reviewed: 2026-08-07T17:40:22Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
