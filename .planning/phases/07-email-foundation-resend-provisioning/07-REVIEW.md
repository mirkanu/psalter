---
phase: 07-email-foundation-resend-provisioning
reviewed: 2026-07-31T12:30:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - package.json
  - scripts/send-test-email.ts
  - scripts/start-with-db-wait.sh
  - scripts/verify-email-dns.sh
  - src/lib/email.test.ts
  - src/lib/email.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-07-31T12:30:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the Resend email wrapper (`src/lib/email.ts`), its test suite, the CLI test-send script, the DNS verification script, and the rewritten env-loading logic in `scripts/start-with-db-wait.sh`. No hardcoded secrets, no eval/exec injection, and no API-key leakage were found in any file — confirmed empirically (ran the test suite, ran the CLI script in `--dry-run`, and probed the wrapper directly). The CRLF/header-injection guards in `email.ts` are real and tested against `to`, `subject`, and `replyTo`.

The one area that needed hands-on verification was the shell script's env-loading rewrite. I reproduced the documented "never kill startup" claim in a sandbox and confirmed it holds for `set -e` interaction, but found it has two related fragility gaps: (1) a malformed line partway through a sourced file can silently truncate loading of everything after it, and (2) there is no post-load assertion that the values the app actually needs (`DATABASE_URL`, `PSALTER_RESEND_API_KEY`, etc.) are non-empty before the app is started. Neither is a crash risk (that part of the fix works as advertised), but both are latent-misconfiguration risks that would surface as confusing runtime errors rather than a clear startup failure.

The `email.ts` wrapper also has one real (if low-probability) unhandled-edge-case bug: `data!.id` on a successful-looking Resend response with `data: null` produces a misleading internal error string instead of a clear diagnostic, though it is safely caught and does not violate the "never throws" contract.

## Warnings

### WR-01: Non-null assertion on `data!.id` produces a misleading error when Resend returns `data: null` without an `error`

**File:** `src/lib/email.ts:91`
**Issue:** When `resend.emails.send()` resolves with `{ data: null, error: null }` (a malformed/unexpected SDK response, e.g. from a future SDK version or an unusual API edge case), `data!.id` throws `TypeError: Cannot read properties of null (reading 'id')`. This is caught by the outer `try/catch`, so `sendEmail` still honors its "never throws" contract — but the caller receives `{ ok: false, error: "Cannot read properties of null (reading 'id')" }`, which looks like an internal bug in this codebase rather than an upstream API anomaly. I verified this behavior directly against the real module (mocked SDK):
```
{"ok":false,"error":"Cannot read properties of null (reading 'id')"}
```
**Fix:**
```ts
if (error) {
  console.error('[email] send failed:', error.message)
  return { ok: false, error: error.message }
}
if (!data) {
  console.error('[email] send failed: Resend returned no data and no error')
  return { ok: false, error: 'unexpected empty response from Resend' }
}
return { ok: true, id: data.id }
```

### WR-02: Sourcing a shared env file with a syntax error can silently truncate everything after the bad line

**File:** `scripts/start-with-db-wait.sh:11-16`
**Issue:** The comment claims "a malformed shared file can never kill startup under `set -e`" — I confirmed this part is true (a syntax error in the sourced file does not abort the parent script while `set +e` is active). However, I also confirmed that a parse error in the sourced file (e.g. an unterminated quote) aborts parsing of the *rest of that file*, so every variable assignment after the bad line is silently skipped — not just the bad line itself:
```
$ ./test.sh
/tmp/bad.env: line 2: unexpected EOF while looking for matching `"'
reached end, GOOD_VAR=1 ANOTHER_VAR=
```
`GOOD_VAR` (before the bad line) loaded; `ANOTHER_VAR` (after it) did not, with no distinct error tying the missing variable to the parse failure beyond a bash line-number message. If `/home/services/.env.production` ever has a malformed line above `PSALTER_RESEND_API_KEY` or `DATABASE_URL`, those variables would silently end up unset, and the app would fail later with a confusing "DATABASE_URL is not defined" style error instead of a clear env-loading failure.
**Fix:** After sourcing, assert the variables this app actually depends on are non-empty, and fail loudly (with a clear message) if not:
```bash
set +e
set -a
[ -f /home/services/.env.production ] && . /home/services/.env.production
[ -f /home/services/psalter/.env ] && . /home/services/psalter/.env
set +a
set -e

: "${DATABASE_URL:?DATABASE_URL missing after env load — check .env.production and .env for syntax errors}"
```

### WR-03: Project `.env` can silently override shared secrets it shouldn't own

**File:** `scripts/start-with-db-wait.sh:12-14`
**Issue:** `/home/services/psalter/.env` is sourced *after* `/home/services/.env.production`, and plain shell `source` semantics mean any variable re-declared in the second file unconditionally wins — including `PSALTER_RESEND_API_KEY` / `PSALTER_RESEND_FROM_ADDRESS`, which per `src/lib/email.ts`'s own doc comment are supposed to be owned exclusively by the shared secrets file ("not in this project's `.env`"). Nothing in code enforces that ownership boundary; a stray leftover `PSALTER_RESEND_API_KEY=...` line accidentally left in the project `.env` (e.g. from local dev testing) would silently take precedence in production with no warning.
**Fix:** Either don't re-source project `.env` variables that match the `PSALTER_`-shared-secret naming convention, or add an explicit check/warning if those specific vars are redefined in the project file. At minimum, add a comment at the project `.env`'s expected schema noting `PSALTER_RESEND_*` must never be set there.

### WR-04: `to` array is not validated per-element, only for overall length

**File:** `src/lib/email.ts:41-44, 57-60`
**Issue:** `hasContent()` only checks `to.length > 0` for arrays; it never checks that each entry is non-empty. An input like `to: ['', 'valid@example.com']` passes both `hasContent` and the CRLF check (empty string contains no `\r`/`\n`) and is forwarded to the Resend SDK as-is, relying entirely on Resend to reject the blank recipient. This works today but is an unvalidated pass-through of unchecked data past this module's own validation boundary.
**Fix:**
```ts
function hasContent(to: string | string[]): boolean {
  if (Array.isArray(to)) return to.length > 0 && to.every((v) => v.trim().length > 0)
  return to.trim().length > 0
}
```

## Info

### IN-01: `main()` in the CLI script has no top-level rejection handler

**File:** `scripts/send-test-email.ts:106`
**Issue:** `main()` is invoked without `.catch(...)`. `sendEmail` is documented to never throw, so this is low-risk in practice, but if any other code in `main` (e.g. `getFromAddress`, argument handling) ever throws unexpectedly, the failure becomes an unhandled promise rejection rather than a clean, explicit non-zero exit with a readable message.
**Fix:**
```ts
main().catch((err) => {
  console.error('FAILED', err instanceof Error ? err.message : err)
  process.exit(1)
})
```

### IN-02: `verify-email-dns.sh` doesn't distinguish a missing DNS record from a failed `dig` invocation

**File:** `scripts/verify-email-dns.sh:29, 45`
**Issue:** `actual=$(dig ...)` discards `dig`'s own exit status. If `dig` is missing or a network error occurs, `actual` is empty and the script reports `FAIL <label> (expected: ..., got: )`, indistinguishable from a genuine DNS misconfiguration. This is a minor diagnostics gap for an ops script, not a functional bug (the four record checks already work correctly with the current design).
**Fix:** Capture and check `dig`'s exit status separately, e.g. `actual=$(dig ... ) || { echo "FAIL ${label} (dig invocation failed)"; ... }`.

### IN-03: Test coverage gap — whitespace-only subject not directly tested

**File:** `src/lib/email.test.ts:251-263`
**Issue:** The "rejects empty subject" test only covers `subject: ''`. The implementation correctly also rejects whitespace-only subjects (`!subject.trim()` at `email.ts:53`), but there's no test asserting that behavior, so a future refactor could regress it silently.
**Fix:** Add a case with `subject: '   '` asserting `result.ok === false`.

---

_Reviewed: 2026-07-31T12:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
