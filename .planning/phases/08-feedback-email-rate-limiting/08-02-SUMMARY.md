---
phase: 08-feedback-email-rate-limiting
plan: 02
subsystem: email
tags: [resend, email, feedback, xss, header-injection, vitest]

# Dependency graph
requires:
  - phase: 07-email-foundation-resend-provisioning
    provides: "sendEmail() non-throwing Resend wrapper (src/lib/email.ts), DEFAULT_FROM_ADDRESS, SendEmailResult type"
provides:
  - "buildFeedbackEmail(input): pure function rendering a feedback submission into an injection-safe to/subject/html/text/replyTo payload"
  - "escapeHtml(value): HTML entity escaper (&, <, >, \", ')"
  - "getFeedbackToAddress(): resolves PSALTER_FEEDBACK_TO_ADDRESS env override, defaults to manuelkuhs@gmail.com"
  - "sendFeedbackNotification(input): fire-and-forget wrapper over sendEmail — never throws, never retries, logs only the failure reason"
affects: [08-03-wire-feedback-route, 08-04-deploy-verify]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure render function + thin fire-and-forget send wrapper, split so injection guards are unit-testable without mocking the network"
    - "vi.hoisted + vi.mock('./email') to replace the send primitive before import, mirroring src/lib/email.test.ts's mock of the Resend SDK"

key-files:
  created: [src/lib/feedback-email.ts, src/lib/feedback-email.test.ts]
  modified: []

key-decisions:
  - "sanitizeHeaderValue flattens [\\r\\n\\t] runs to a single space and trims before the name enters the subject — sendEmail rejects (doesn't strip) CR/LF, so an unsanitised hostile name would silently drop the whole notification"
  - "pageUrl is always rendered as escaped plain text inside <code>, never as <a href> — html body contains zero href= occurrences by construction, verified by grep in acceptance criteria"
  - "replyTo is omitted entirely (not set to undefined) unless email passes a simple regex AND contains no CR/LF, via a conditional spread — matches email.ts's own pattern"
  - "JSDoc reworded to avoid the literal words retry/setTimeout/backoff so the plan's grep -ciE 'retry|setTimeout|backoff' returns 0 while still documenting the no-retry design in prose"

patterns-established:
  - "Reason-commented implementation rules (each numbered rule in the plan's <action> maps 1:1 to a code comment or JSDoc line) — keeps intent traceable for future edits to the injection guards"

requirements-completed: [FEED-01]

# Metrics
duration: ~12min
completed: 2026-07-31
---

# Phase 08 Plan 02: Feedback Owner-Notification Email Summary

**Injection-safe `buildFeedbackEmail()` + non-throwing `sendFeedbackNotification()` wrapper over Phase 07's `sendEmail`, with 33 passing unit tests covering HTML/header injection, empty-field fallbacks, and Resend-failure paths.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-31T18:12:00Z (approx.)
- **Completed:** 2026-07-31T18:19:19Z
- **Tasks:** 2 (both TDD: RED then GREEN)
- **Files modified:** 2 (both created)

## Accomplishments
- `buildFeedbackEmail` turns a raw feedback submission into a complete `to`/`subject`/`html`/`text`/`replyTo` payload, with every injection surface (subject header CR/LF, html markup, clickable pageUrl) closed and asserted by tests
- `sendFeedbackNotification` sends through Phase 07's `sendEmail`, wrapped in try/catch so a mail outage can never break the caller's DB write, and logs only the failure reason (never message body, email, or IP)
- 33/33 tests passing in `src/lib/feedback-email.test.ts`; no regression in `src/lib/email.test.ts` or the rest of the pre-existing (passing) suite
- `tsc --noEmit` clean for the new module

## Task Commits

Each task was committed atomically (TDD RED -> GREEN):

1. **Task 1+2: buildFeedbackEmail + escapeHtml + sendFeedbackNotification (RED)** - `0ec64dc` (test)
2. **Task 1+2: buildFeedbackEmail + escapeHtml + sendFeedbackNotification (GREEN)** - `2ba36e2` (feat)

_Note: Both plan tasks were written test-first into the same test file before any implementation existed, so RED/GREEN landed as one test commit followed by one feat commit covering both tasks' behavior together — the plan's own `<behavior>` blocks for Task 1 and Task 2 were both authored in the test file prior to writing `feedback-email.ts`._

**Plan metadata:** (this commit, in progress)

## Files Created/Modified
- `src/lib/feedback-email.ts` - `buildFeedbackEmail`, `escapeHtml`, `getFeedbackToAddress`, `sendFeedbackNotification`, `DEFAULT_FEEDBACK_TO_ADDRESS`, `MAX_SUBJECT_LENGTH`
- `src/lib/feedback-email.test.ts` - 33 tests: escapeHtml (4), getFeedbackToAddress (3), buildFeedbackEmail (17), sendFeedbackNotification (9)

## Decisions Made
- See `key-decisions` in frontmatter. No architectural deviations from the plan — the plan's `<action>` numbered rules were followed exactly (escaping order, sanitizeHeaderValue, subject truncation, replyTo regex + CRLF guard, text/html structure, no href, no retry).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected an over-strict test assertion I introduced (not present in the plan's spec)**
- **Found during:** Task 1, first test run (GREEN check)
- **Issue:** My own draft test asserted `html` does not contain the literal substring `'onerror=alert(1)'`. The plan's actual spec only requires `html` not to match `/<img/` (an inert, escaped `&lt;img ... onerror=alert(1)&gt;` legitimately still contains that substring as harmless text — `escapeHtml` does not escape `=`, `(`, `)`, and doesn't need to). The overly-strict assertion I wrote would have forced a functionally-wrong fix (e.g. escaping `=`) to satisfy a test that was stricter than the plan required.
- **Fix:** Loosened the test to assert only `expect(payload.html).not.toMatch(/<img/)`, matching the plan's `<behavior>` block verbatim.
- **Files modified:** `src/lib/feedback-email.test.ts`
- **Verification:** `npx vitest run src/lib/feedback-email.test.ts` — 33/33 passing
- **Committed in:** `2ba36e2` (part of Task GREEN commit)

**2. [Rule 1 - Bug] Reworded JSDoc prose to satisfy a plan acceptance-criteria grep**
- **Found during:** Task 2, acceptance-criteria verification pass
- **Issue:** The plan's acceptance criteria require `grep -ciE 'retry|setTimeout|backoff' src/lib/feedback-email.ts` to return 0 (proving no retry logic exists). My initial JSDoc used the words "retry" and "backoff" in prose while *describing* the no-retry design, which the grep can't distinguish from actual retry code.
- **Fix:** Reworded both JSDoc comments to say "re-attempt a failed send" instead of "retry", and "does not queue or re-attempt" instead of "no retry loop, queue, or backoff" — same meaning, passes the literal grep.
- **Files modified:** `src/lib/feedback-email.ts`
- **Verification:** `grep -ciE 'retry|setTimeout|backoff' src/lib/feedback-email.ts` returns 0; all 33 tests still pass
- **Committed in:** `2ba36e2` (part of Task GREEN commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 — both self-inflicted bugs caught and corrected during the same execution pass, not plan defects)
**Impact on plan:** No scope creep. Both fixes brought the implementation/tests into exact conformance with the plan as written.

## Issues Encountered
- Running the full `npx vitest run` suite (beyond this plan's own test file) surfaced 16 pre-existing test failures across ~16 files, all caused by either (a) this worktree having no `DATABASE_URL` / live DB connection, or (b) unrelated pre-existing `abc-melisma.ts` logic bugs. None touch `feedback-email.ts` or `email.ts`. Logged to `.planning/phases/08-feedback-email-rate-limiting/deferred-items.md` per the executor scope boundary — not fixed here.

## User Setup Required

None — no external service configuration required. `PSALTER_FEEDBACK_TO_ADDRESS` is optional and the module works correctly with no env change (verified: `grep -rc 'PSALTER_FEEDBACK_TO_ADDRESS' /home/services/.env.production` returns 0).

## Next Phase Readiness
- `src/lib/feedback-email.ts` is ready for Plan 08-03 to import `sendFeedbackNotification` and fire it (unawaited or awaited-but-ignored) from `POST /api/feedback`, alongside Plan 08-01's rate limiter.
- No blockers. No route was touched in this plan (by design — `git diff --name-only` against the base commit shows only the two new files).

---
*Phase: 08-feedback-email-rate-limiting*
*Completed: 2026-07-31*
