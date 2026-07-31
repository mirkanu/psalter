---
phase: 08-feedback-email-rate-limiting
reviewed: 2026-07-31T19:22:24Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/lib/rate-limit.ts
  - src/lib/rate-limit.test.ts
  - src/lib/feedback-email.ts
  - src/lib/feedback-email.test.ts
  - src/app/api/feedback/route.ts
  - src/app/api/feedback/route.test.ts
  - src/components/FeedbackModal.tsx
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-07-31T19:22:24Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

The rate limiter, feedback-email builder, and API route are well documented and mostly well
tested — the CRLF/header-injection defenses for the email *subject* and *reply-to* are correctly
implemented and covered by tests, and the sliding-window rate limiter's core accept/reject/window
logic is sound. However, tracing the actual runtime paths surfaced one reproducible unhandled
exception on the public `/api/feedback` endpoint (a trivial `null` JSON body crashes the handler
instead of returning a 400), plus several robustness/content-integrity gaps: no cap on request
body size before `req.json()` on a memory-constrained VPS, inconsistent field-truncation order,
unsanitized newlines in `name`/`pageUrl` that let a submitter forge fake "Email:"/"Page:" lines in
the plain-text notification body, and a client-side error handler that discards the API's specific
validation message. One test file also has a coverage gap: the rate limiter's selective per-key
eviction branch in `sweep()` is never actually exercised by any test.

## Critical Issues

### CR-01: `POST /api/feedback` throws an unhandled TypeError on a `null` JSON body

**File:** `src/app/api/feedback/route.ts:31-38`
**Issue:** The route only wraps `await req.json()` in try/catch to handle a JSON *parse* error. It
does not verify that the parsed result is actually an object. `null` is valid JSON (no parse
error), so `body = await req.json()` succeeds and resolves to the JS value `null`. The very next
line, `typeof body.message`, then throws `TypeError: Cannot read properties of null (reading
'message')`, which is not caught anywhere in the function. This is trivially reproducible:
```
curl -X POST -H 'Content-Type: application/json' -d 'null' https://psalter.gsdlabs.dev/api/feedback
```
Next.js's route-handler wrapper will turn the uncaught rejection into an opaque 500 instead of the
route's intended, structured `400 { error: 'message is required' }` response. This is a public,
unauthenticated endpoint, so any client (or a bot) can trigger this with a single-line body,
completely bypassing the app's own error-handling conventions. (Other primitive JSON bodies —
numbers, strings, booleans, arrays — do not crash, because JS autoboxes property access on those;
`null` is the one value that throws.) `route.test.ts` does not cover this case — the "rejects
invalid JSON" test sends a syntactically-invalid string, not `null`.
**Fix:**
```ts
let body: unknown
try {
  body = await req.json()
} catch {
  return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
}
if (typeof body !== 'object' || body === null || Array.isArray(body)) {
  return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
}
const record = body as Record<string, unknown>
const message = typeof record.message === 'string' ? record.message.trim() : ''
// ...update the remaining `body.` references to `record.`
```

## Warnings

### WR-01: No request body size limit before parsing on a memory-constrained VPS

**File:** `src/app/api/feedback/route.ts:33`
**Issue:** `await req.json()` fully buffers the request body into memory before any length check
runs (the `MAX_MESSAGE = 5000` check happens only after parsing succeeds). Next.js App Router
route handlers using the standard `Request`/`Response` API do not impose a default body-size
limit when self-hosted via `next start` (no `bodyParser` config applies here, and this is not
Vercel). This project's own CLAUDE.md documents a hard 3.7GB RAM ceiling for the whole VPS with
~1.8GB free after baseline services — an oversized POST body (bounded only by whatever Cloudflare
Tunnel enforces upstream, which this code does not control or verify) can spike memory on the
single long-lived `next start` process that also serves every other page on the site. The rate
limiter caps *request frequency* (5/min/IP) but does nothing to cap *request size*, so this is a
real gap in defense-in-depth for a documented memory-scarce deployment.
**Fix:** Reject requests whose `Content-Length` exceeds a sane ceiling (e.g. `MAX_MESSAGE` × 4 for
JSON overhead, or a flat ~32KB) before calling `req.json()`:
```ts
const contentLength = Number(req.headers.get('content-length') ?? '0')
if (contentLength > 32_768) {
  return NextResponse.json({ error: 'payload too large' }, { status: 413 })
}
```

### WR-02: `email` is regex-validated before being length-capped, unlike `name`/`pageUrl`

**File:** `src/app/api/feedback/route.ts:46-54`
**Issue:** `name` and `pageUrl` are truncated with `.slice(0, MAX_SHORT)` immediately after
`.trim()`, before any further processing (lines 46, 49). `email`, however, is trimmed but *not*
truncated before being tested against the regex on line 53 — truncation only happens afterward, on
line 54, and only if the untruncated value already matched. This is an inconsistent validation
order: an attacker-supplied `email` field can be arbitrarily long (bounded only by the overall
request-body issue in WR-01) and still gets run through a regex match before any cap is applied.
**Fix:**
```ts
const emailRaw = typeof body.email === 'string' ? body.email.trim().slice(0, MAX_SHORT) : ''
const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)
const email = emailRaw && emailValid ? emailRaw : null
```

### WR-03: Unsanitized newlines in `name`/`pageUrl` allow forged lines in the plain-text notification body

**File:** `src/lib/feedback-email.ts:62-64, 80-90`
**Issue:** `sanitizeHeaderValue` (line 58) is applied to `name` only when building the email
**subject** (line 71). The plain-text body (lines 80-90) uses `formatOrNotGiven(name)` /
`formatOrNotGiven(pageUrl)` directly — the raw, un-sanitized values. `route.ts` only trims
leading/trailing whitespace (`.trim()`), which does not remove *internal* newlines. A submitter
can set `name` to:
```
Alice\nEmail: fake@evil.example\nPage: https://attacker.example/phish
```
and the resulting plain-text email body becomes:
```
From: Alice
Email: fake@evil.example
Page: https://attacker.example/phish
Email: alice@example.com
Page: https://psalter.gsdlabs.dev/psalms/23
```
This does not break out of SMTP/Resend headers (that path is correctly guarded), but it does let
an anonymous submitter forge fake structured metadata lines inside the body a human owner reads
and may act on (e.g. clicking through to an "attacker" page believing it's the real submitted
page). The HTML alternative escapes the same text via `escapeHtml`, which prevents markup
injection but does not strip the newlines either — most HTML email clients will collapse them
visually (no `white-space: pre` on that block), but the plain-text alternative (used by text-only
clients/previews) shows the forged lines as genuine new lines.
**Fix:** Route `name`, `email`, and `pageUrl` through `sanitizeHeaderValue` (or an equivalent
newline-stripping helper) before building both the text and HTML bodies, not just the subject:
```ts
const displayName = name ? sanitizeHeaderValue(name) : null
const displayPageUrl = pageUrl ? sanitizeHeaderValue(pageUrl) : null
// use displayName / displayPageUrl in both `text` and `html`, in addition to `safeName` for subject
```

### WR-04: FeedbackModal discards the API's specific validation error and has no client-side length cap

**File:** `src/components/FeedbackModal.tsx:49, 89-91`
**Issue:** `if (!res.ok) throw new Error('server error')` discards the JSON body the API returns
(`{ error: 'message is required' }`, `{ error: 'message too long' }`, `{ error: 'invalid JSON
body' }`, `{ error: 'internal error' }`) and always shows the generic "Something went wrong"
message. The `Textarea` for the message also has no `maxLength` matching the server's
`MAX_MESSAGE = 5000` cap, so a user who pastes a long message gets a dead-end generic error with
no indication of what to fix.
**Fix:**
```tsx
if (!res.ok) {
  const body = await res.json().catch(() => null)
  throw new Error(body?.error ?? 'server error')
}
```
and add `maxLength={5000}` to the `Textarea`, with a visible character counter if desired.

### WR-05: `sweep()`'s selective per-key eviction branch has no test coverage

**File:** `src/lib/rate-limit.ts:42-52`, `src/lib/rate-limit.test.ts:95-107`
**Issue:** `sweep()` is only ever invoked from the one call site at `store.size >= MAX_TRACKED_KEYS`
(rate-limit.ts:68). The "sweeps expired keys" test (rate-limit.test.ts:102-107) only ever has 2
keys in the store, so that guard is always false and `sweep()` is never actually called in that
test — the expiry behaviour it demonstrates comes entirely from the inline `.filter()` inside
`checkRateLimit`, not from `sweep()`. The "bounds the store to MAX_TRACKED_KEYS" test
(rate-limit.test.ts:95-100) does drive the store to capacity and does call `sweep()`, but every key
is inserted with the identical fixed timestamp `T0`, so `newest <= cutoff` is false for every entry
and the per-key `store.delete(key)` line is never taken — the test passes purely via the
`store.clear()` fallback branch (line 49). The result: the line `if (newest <= cutoff)
store.delete(key)` — the mechanism that's supposed to let genuinely-stale keys get reclaimed
without nuking the whole map — is dead code from the test suite's perspective. A regression there
(e.g. flipping the comparison, or an off-by-one on `cutoff`) would not be caught.
**Fix:** Add a test that fills the store to `MAX_TRACKED_KEYS` with a first batch of keys at an
old timestamp, then adds one more key at a timestamp past the window, and asserts that the old,
truly-expired keys are gone while the store did *not* go through a full clear (e.g. assert
`trackedKeyCount()` reflects only the survivors, or spy on `console.warn` to confirm the
full-clear branch did *not* fire).

### WR-06: No cleanup for an in-flight submit when the modal closes mid-request

**File:** `src/components/FeedbackModal.tsx:31-55`
**Issue:** `handleSubmit` has no `AbortController`/mount-check guard. If the dialog is closed
(`open` flips to `false` from the parent, or via `handleClose`) while `fetch('/api/feedback')` is
still pending, the eventual `setStatus(...)` call in the `then`/`catch` continuation will fire
after the component has unmounted (Radix `Dialog` unmounts `DialogContent` from the tree when
closed), producing a React "Can't perform a state update on an unmounted component" warning and
leaving a dangling network request with no way to reflect its outcome to the user.
**Fix:** Guard the async continuation with an `isMounted`/`AbortController` pattern:
```tsx
const controller = new AbortController()
useEffect(() => () => controller.abort(), [])
// pass { signal: controller.signal } to fetch, and swallow AbortError in the catch block
```

## Info

### IN-01: Email-format regex duplicated in two files

**File:** `src/app/api/feedback/route.ts:53`, `src/lib/feedback-email.ts:35`
**Issue:** The exact same regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` is defined independently in both
files. If one is ever tightened/loosened (e.g. to reject a new edge case), the other will silently
drift out of sync.
**Fix:** Export `EMAIL_RE` (or an `isValidEmail()` helper) from one module (e.g.
`feedback-email.ts`) and import it in `route.ts`.

### IN-02: `formatOrNotGiven` returns the un-trimmed value despite checking `value.trim()`

**File:** `src/lib/feedback-email.ts:62-64`
**Issue:** `return value && value.trim() ? value : '(not given)'` tests the trimmed value's
truthiness but returns the original `value`, not the trimmed one. Currently harmless because every
caller (`route.ts`) already trims `name`/`email`/`pageUrl` before they reach this module, but the
function itself doesn't guarantee that contract, so a future direct caller passing padded input
would get whitespace-padded output.
**Fix:** `return value && value.trim() ? value.trim() : '(not given)'`.

### IN-03: Owner's personal email hardcoded as compiled-in default

**File:** `src/lib/feedback-email.ts:16`
**Issue:** `DEFAULT_FEEDBACK_TO_ADDRESS = 'manuelkuhs@gmail.com'` ships the owner's personal Gmail
address as a source-code fallback. It's correctly overridable via
`PSALTER_FEEDBACK_TO_ADDRESS`, so this isn't a "secret" and doesn't break anything functionally,
but per this repo's own README convention (public-by-default AI-generated project, and psalter.cprc
material may end up on a public GitHub repo per project CLAUDE.md), a hardcoded personal address
baked into source is worth a deliberate call-out rather than an implicit default.
**Fix:** Consider requiring `PSALTER_FEEDBACK_TO_ADDRESS` to be set via the shared VPS env file
(per project convention) and failing loudly (or falling back to a non-personal placeholder) if
unset, rather than embedding the real address as a compiled-in literal.

### IN-04: Subject truncation can split a UTF-16 surrogate pair

**File:** `src/lib/feedback-email.ts:72-75`
**Issue:** `.slice(0, MAX_SUBJECT_LENGTH)` operates on UTF-16 code units. If `name` contains
characters outside the BMP (e.g. certain emoji) positioned near the 120-character boundary, the
slice can cut a surrogate pair in half, producing a subject with a dangling unpaired surrogate
(renders as a replacement character `�` in most clients).
**Fix:** Low priority given this is an internal notification subject, not user-facing content, but
if addressed, use an array-based grapheme-safe truncation (e.g. `Array.from(subject).slice(0,
MAX_SUBJECT_LENGTH).join('')`) instead of `String.prototype.slice`.

---

_Reviewed: 2026-07-31T19:22:24Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
