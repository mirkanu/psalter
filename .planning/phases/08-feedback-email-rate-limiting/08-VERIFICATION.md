---
phase: 08-feedback-email-rate-limiting
verified: 2026-08-02T00:00:00Z
status: passed
score: 7/7 must-haves verified (1 via recorded human override)
overrides_applied: 1
overrides:
  - must_have: "A throttled visitor sees the rate-limit message in the real feedback modal (live-browser confirmation)"
    reason: "Human explicitly declined to manually trip the live-UI rate-limit message during the 08-04 Task 2 checkpoint, judging Task 1's automated live burst test (real deployed /api/feedback endpoint, real per-IP counter, 200 200 200 200 200 429 sequence with Retry-After header) sufficient evidence for the underlying FEED-02 behavior. This is a deliberate, disclosed scope reduction — not an executor shortcut. The plan's own contingency (08-04-PLAN.md Task 3) anticipated exactly this case and required recording it as an open gap rather than fabricating a pass. It is recorded consistently as 'Partial' in REQUIREMENTS.md and in 08-04-LIVE-EVIDENCE.md's 'Open gaps' section (no fabricated pass). The underlying FeedbackModal.tsx code path (res.status === 429 branch, distinct message paragraph) is independently verified by source read and by Plan 08-03's unit tests — only the live-browser eyeball confirmation was skipped, mirroring the Phase 07 EMAIL-02 Outlook precedent exactly."
    accepted_by: "Manuel Kuhs (human decision relayed and recorded verbatim during 08-04 Task 2 checkpoint: \"All confirmed except 5, let's skip that (your smoke test was enough)\")"
    accepted_at: "2026-07-31T19:10:00Z"
---

# Phase 08: Feedback Email & Rate Limiting Verification Report

**Phase Goal:** Every feedback submission reaches the site owner's inbox immediately, and the endpoint can't be spammed
**Verified:** 2026-08-02T00:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Merged from ROADMAP.md Success Criteria (Phase 8) and all four plans' `must_haves.truths`.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Submitting the feedback form sends an email to manuelkuhs@gmail.com containing the submission content, for every submission (ROADMAP SC1 / FEED-01) | ✓ VERIFIED | `src/lib/feedback-email.ts` renders a complete payload (`buildFeedbackEmail`) and sends it via Phase 07's `sendEmail`. Wired into the route (`route.ts:63`, `void sendFeedbackNotification(...)` after successful insert). Live-proven: `08-04-LIVE-EVIDENCE.md` records 5/5 real `PHASE08-SMOKE` emails confirmed by the human in the Gmail Primary inbox, plus one additional live-modal submission with correct subject (`CPRC Psalter feedback from <name>`) and correct Reply-To. |
| 2 | A feedback DB write still succeeds even if the email send fails — fire-and-forget, never blocks the save (ROADMAP SC2) | ✓ VERIFIED | `route.ts:57-65` — `db.insert` is awaited and can 500 the request on its own failure; the notification call is issued only after insert success, is `void`-marked, `.catch()`-guarded, and never awaited. `route.test.ts`: "still returns 200 and saves the row when the notification rejects" and "...when notifyMock resolves ok:false" both pass (14/14 route tests green, re-run live). `sendFeedbackNotification` itself wraps its entire body in try/catch (`feedback-email.ts`), independently verified never to throw (33/33 unit tests green, re-run live). |
| 3 | Submitting the feedback form rapidly above the configured threshold is rejected with a rate-limit response instead of sending unlimited emails (ROADMAP SC3 / FEED-02) | ✓ VERIFIED (API level) | `checkRateLimit('feedback:'+ip, {limit:5, windowMs:60_000})` runs as the literal first two statements of `POST`, before `req.json()` (confirmed by source read: line 20 precedes line 33). Live burst test against the real deployed endpoint: `req1..req5=200, req6=429`, 429 body `{"error":"too many requests","retryAfterSeconds":60}`, `Retry-After: 60` header present (`08-04-LIVE-EVIDENCE.md`). `route.test.ts` independently proves `notifyMock` was called exactly 5 times after a 6-request burst — the throttle stops emails, not just DB rows. |
| 4 | A caller can ask "has this key exceeded N in window W?" and get yes/no + retry-after; keys are independent; a throttled client recovers after the window; the store is bounded; `getClientIp` degrades garbage/forged headers to a safe constant (08-01 primitives) | ✓ VERIFIED | `src/lib/rate-limit.ts` implements exactly this surface (`checkRateLimit`, `resetRateLimit`, `trackedKeyCount`, `getClientIp`, `MAX_TRACKED_KEYS`, `UNKNOWN_CLIENT_IP`). 23/23 unit tests pass (re-run live), including per-key isolation, sliding-window recovery, non-zero retry-after, and the `MAX_TRACKED_KEYS + 500` bounding test. |
| 5 | A feedback submission renders to a complete, injection-safe email payload; the owner address defaults to `manuelkuhs@gmail.com` and is env-overridable; sending never throws (08-02 primitives) | ✓ VERIFIED, with one residual gap noted | `src/lib/feedback-email.ts` — `escapeHtml`, subject CR/LF flattening, no-`href=` invariant, and `replyTo` CRLF/regex guard all present and covered by 33 passing tests. **Residual (WR-03 from 08-REVIEW.md, not fixed):** `name`/`pageUrl` are sanitized for the subject but not for the plain-text/HTML body, so a submitter can inject fake `Email:`/`Page:` lines into the body text the owner reads. This is a content-integrity nuisance, not a header-injection or delivery-blocking defect — the notification still reaches the inbox unmodified in structure (subject/to/reply-to headers remain safe). Tracked as a warning, not a phase blocker. |
| 6 | A successful feedback POST triggers exactly one owner-notification email; the 6th POST from one IP in 60s returns 429 and triggers no further email; a rate-limited visitor sees a distinct "wait a minute" message (08-03 wiring) | ✓ VERIFIED (API + code), ⚠️ PASSED (override) for the live-browser message render | Route-level wiring confirmed by source read and 14/14 passing route tests (exactly-one-notify-call, 5-then-429, notify-called-exactly-5-times). `FeedbackModal.tsx` branches on `res.status === 429` before the generic `!res.ok` throw and renders "You've sent several messages just now. Please wait a minute and try again." — confirmed present in source. The live-browser eyeball confirmation of this specific message was explicitly skipped by human decision at the 08-04 checkpoint; accepted via the override recorded in this report's frontmatter (mirrors the Phase 07 EMAIL-02 precedent). |
| 7 | The running psalter process contains the Phase 8 code, not a stale bundle; the deployed endpoint behaves as coded | ✓ VERIFIED | `08-04-LIVE-EVIDENCE.md`: build completed, `.next/BUILD_ID` mtime `18:41:21`, PM2 process start `18:41:32` (postdates build by ~11s). Independently re-confirmed live during this verification: `pm2 list` shows `psalter` pid `2005136` status `online`, uptime consistent with the recorded restart; `curl http://localhost:3005/psalms` → `200`; current git HEAD (`93342a1`) is a descendant of the Phase 8 wiring commit (`4afad5d`) with no unmerged Phase 8 work outstanding. |

**Score:** 6/7 truths independently VERIFIED, 1/7 accepted via recorded human override (accurately and consistently disclosed across `REQUIREMENTS.md`, `08-04-LIVE-EVIDENCE.md`, and this report) = 7/7 effective.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/rate-limit.ts` | Bounded sliding-window limiter + IP extraction | ✓ VERIFIED | All 6 required exports present (`checkRateLimit`, `resetRateLimit`, `trackedKeyCount`, `getClientIp`, `MAX_TRACKED_KEYS`, `UNKNOWN_CLIENT_IP`); module-scope `Map`; `Math.max(1,...)` retry-after floor; `store.clear()` fail-open sweep; no Redis/Upstash/ioredis reference outside JSDoc prose. |
| `src/lib/rate-limit.test.ts` | Deterministic injected-clock tests | ✓ VERIFIED | 23/23 tests pass live, zero real timers. |
| `src/lib/feedback-email.ts` | Injection-safe email builder + fire-and-forget send | ✓ VERIFIED | All required exports present; zero `href=` in module; `escapeHtml` applied to every interpolated value in the HTML body; `try{...}catch` wraps `sendFeedbackNotification`. |
| `src/lib/feedback-email.test.ts` | Mocked-network unit tests | ✓ VERIFIED | 33/33 tests pass live, `@/lib/email` mocked, no network. |
| `src/app/api/feedback/route.ts` | Rate-limited + notifying endpoint | ✓ VERIFIED | `FEEDBACK_RATE_LIMIT = 5`, `FEEDBACK_RATE_WINDOW_MS = 60_000` exported; `checkRateLimit` precedes `req.json()`; `db.insert` precedes `sendFeedbackNotification`; all 4 pre-existing validation messages preserved. |
| `src/app/api/feedback/route.test.ts` | Route tests, DB + email mocked | ✓ VERIFIED | 14/14 tests pass live. |
| `src/components/FeedbackModal.tsx` | 429-aware submit handler | ✓ VERIFIED | `status` union includes `'rate-limited'`; `res.status === 429` branch precedes the generic `!res.ok` throw; message paragraph present verbatim. |
| `.planning/phases/08.../08-04-LIVE-EVIDENCE.md` | Deployment + burst-test + human-confirmation record | ✓ VERIFIED | 50 lines, contains real timestamps, real burst sequence, real 429 body, and an honest "Open gaps" section (not silently closed). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `route.ts` | `rate-limit.ts` | `getClientIp(req)` + `checkRateLimit('feedback:'+ip,...)` as first two statements | ✓ WIRED | Confirmed by source read: line 20 (`checkRateLimit`) precedes line 33 (`req.json()`). |
| `route.ts` | `feedback-email.ts` | `void sendFeedbackNotification(...).catch(...)` after successful insert | ✓ WIRED | Confirmed by source read: line 57 (`db.insert`) precedes line 63 (`sendFeedbackNotification`); call is unawaited and `.catch`-guarded. |
| `FeedbackModal.tsx` | `/api/feedback` | `fetch` response status 429 branch → `'rate-limited'` status | ✓ WIRED | Confirmed by source read: `if (res.status === 429) { setStatus('rate-limited'); return }` precedes `if (!res.ok) throw ...`. |
| `feedback-email.ts` | `email.ts` (Phase 07) | `import { sendEmail } from './email'` | ✓ WIRED | Confirmed by source read; no independent `new Resend(` client constructed in this module. |
| live `/api/feedback` | `manuelkuhs@gmail.com` inbox | `sendFeedbackNotification → sendEmail → Resend` | ✓ WIRED (human-confirmed) | 5/5 smoke emails + 1 live-modal submission confirmed delivered to Primary inbox by the human at the 08-04 checkpoint. |

### Data-Flow Trace (Level 4)

Not a UI-rendering trace in the component-prop sense — this phase's "data flow" is the request → DB → email pipeline. Traced and confirmed FLOWING end-to-end in production: a real `POST /api/feedback` inserted a row (implicit, not independently re-queried by this verification but proven by the 08-03 route tests' insert-call assertions) and independently produced a real, human-confirmed inbox delivery through the live Resend integration — not a stub, not a static/mocked response at the production boundary.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Site is up and serving the deployed bundle | `curl -s -o /dev/null -w '%{http_code}' http://localhost:3005/psalms` | `200` | ✓ PASS |
| Rate limiter blocks a `null`-body flood the same as any other flood (see CR-01 analysis below) | traced via source read of `route.ts` + `rate-limit.ts` (checkRateLimit precedes body parsing and commits the hit unconditionally on the allowed path) | budget consumed before any crash; 6th request still gets 429 | ✓ PASS (reasoned, not re-executed live beyond the single repro below) |
| `POST /api/feedback` with literal JSON `null` body crashes (CR-01 repro) | `curl -s -i -X POST -H 'Content-Type: application/json' -d 'null' http://localhost:3005/api/feedback` | `HTTP/1.1 500 Internal Server Error` (no JSON error body — an uncaught exception, not a returned 400) | ✗ FAIL (confirmed live, see Anti-Patterns) |
| Full unit test suite for this phase's own files | `npx vitest run src/lib/rate-limit.test.ts src/lib/feedback-email.test.ts src/app/api/feedback/route.test.ts` | 70/70 tests passing (3 files) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| FEED-01 | 08-02, 08-03, 08-04 | Feedback form submissions trigger an email to the site owner on every submission | ✓ SATISFIED | Unit-tested at every layer; live-proven 5/5 real deliveries + 1 live-modal delivery, human-confirmed Primary inbox placement and correct Reply-To. `REQUIREMENTS.md` marks it `Complete` — consistent with codebase evidence. |
| FEED-02 | 08-01, 08-03, 08-04 | Feedback API is rate-limited | ◐ SATISFIED (via override) | API-level throttle fully proven live (real endpoint, real per-IP counter, `200×5 + 429`, correct `Retry-After`). The FeedbackModal message-display code path exists and is unit-tested, but its live-browser rendering was explicitly skipped by human decision. `REQUIREMENTS.md` correctly reflects `Partial`, not `Complete` — consistent across `REQUIREMENTS.md`, `08-04-LIVE-EVIDENCE.md`, and this report. |

No orphaned requirements: `FEED-01` and `FEED-02` are the only two requirement IDs mapped to Phase 8 in `REQUIREMENTS.md`'s traceability table, and both appear in plan frontmatter (`08-01` claims FEED-02; `08-02` claims FEED-01; `08-03` and `08-04` claim both).

### Anti-Patterns Found

Carried forward from `08-REVIEW.md` (1 critical, 6 warnings, 4 info) plus independent live re-confirmation of the critical finding during this verification.

| File | Line | Pattern | Severity | Impact on phase goal |
|---|---|---|---|---|
| `src/app/api/feedback/route.ts` | 38 (`typeof body.message`) | Unhandled `TypeError` on a literal JSON `null` body — CR-01 | Warning (not a phase blocker — see reasoning below) | Live-reproduced: `curl -d 'null'` → `500` with no structured error body, instead of the intended `400`. **Does not undermine "the endpoint can't be spammed":** `checkRateLimit` is the first statement of `POST` and unconditionally commits the hit to the sliding-window log on every allowed call, before `req.json()` is even reached — so repeated `null`-body requests still consume the same 5-per-60s budget as any other request and are still 429'd on the 6th. **Does not undermine "every submission reaches the inbox":** the crash occurs before `db.insert` and before `sendFeedbackNotification` are reached, so it can never generate a spurious email or a false "sent" state — it simply fails loudly (as a 500) instead of gracefully (as a 400) for one specific malformed-input shape. Net effect: a genuine robustness/error-handling defect on a public endpoint (worth fixing — it will generate 500-noise/Sentry alerts for any bot or scanner that POSTs bare `null`), but it neither bypasses rate limiting nor causes unwanted email sends, so it does not block this phase's two stated success criteria. |
| `src/app/api/feedback/route.ts` | 33 | No request body size cap before `req.json()` (WR-01) | Warning | Memory-hygiene concern on a 3.7GB VPS; does not affect email/rate-limit correctness for normal traffic. |
| `src/app/api/feedback/route.ts` | 51-54 | `email` regex-tested before length cap (WR-02) | Warning | Validation-order inconsistency; bounded in practice by WR-01 fix once applied. |
| `src/lib/feedback-email.ts` | 80-90 | `name`/`pageUrl` not newline-sanitized in the email body (WR-03) | Warning | Lets a submitter forge fake `Email:`/`Page:` lines inside the body text; does not break headers or delivery. |
| `src/components/FeedbackModal.tsx` | 49, 89-91 | Generic error swallows the API's specific validation message; no client-side `maxLength` (WR-04) | Warning | UX quality issue, not a delivery or spam-prevention defect. |
| `src/lib/rate-limit.ts` / `rate-limit.test.ts` | 42-52 / 95-107 | `sweep()`'s selective per-key eviction branch has no dedicated test (WR-05) | Warning | Coverage gap on a defensive code path; the store-bound behavior itself is still asserted via the full-clear fallback branch. |
| `src/components/FeedbackModal.tsx` | 31-55 | No abort/mount-guard for in-flight submit on modal close (WR-06) | Warning | Minor UX/console-warning issue, not a delivery or spam defect. |
| Various | — | 4 Info-level findings (duplicated email regex, untrimmed `formatOrNotGiven` return, hardcoded personal address as compiled default, UTF-16 surrogate-splitting subject truncation) | Info | None of these affect goal achievement. |

**No blockers.** CR-01 is the only critical-severity finding from `08-REVIEW.md`; it is a genuine defect worth fixing promptly (recommend a follow-up patch per the review's own suggested fix), but it does not defeat either phase success criterion when traced through the actual request-handling order.

### Human Verification Required

None outstanding for phase-goal purposes. The one item that inherently requires a human (live-browser confirmation of the rate-limit message text) already went through its checkpoint at 08-04 Task 2, and the human's explicit decision to accept the automated API-level proof in its place is recorded as an override in this report's frontmatter — consistent with the Phase 07 EMAIL-02 precedent.

Recommended (non-blocking) follow-ups for the account owner, not required to close this phase:
1. Fix CR-01 (`null`-body crash) per `08-REVIEW.md`'s suggested patch — cheap, and removes a public 500-noise / Sentry-alert source.
2. Whenever convenient, open the live site, trip the rate limit five times in the actual browser UI, and confirm the "wait a minute" message renders as expected, to fully close FEED-02 to `Complete`.
3. Consider WR-03 (newline sanitization in the email body) if forged in-body metadata lines become a real nuisance.

### Gaps Summary

No blocking gaps. All FEED-01 truths are independently verified against the live codebase, the unit test suites (70/70 passing across the three new/modified test files), and real production evidence (5/5 delivered emails, human-confirmed). FEED-02 is fully proven at the API level (live burst test against the real deployed endpoint, correct 429 body and `Retry-After` header, notify-call-count assertions) with only the live-browser rendering of the modal's message text left unconfirmed — a disclosed, human-directed, explicitly-authorized scope reduction, consistently recorded as `Partial` (not silently upgraded to `Complete`) across `REQUIREMENTS.md`, `08-04-LIVE-EVIDENCE.md`, and this report. Recorded here as an accepted override rather than a blocker, mirroring Phase 07's EMAIL-02 handling exactly.

CR-01 (the one critical code-review finding) was independently re-reproduced live during this verification (`curl -d 'null'` → `500`) and traced through the actual request-handling order: because the rate-limit check runs unconditionally before body parsing and the notification send only happens after a successful DB insert, this bug can neither bypass the throttle nor generate a spurious email. It is a real, fixable robustness defect — flagged prominently as a recommended follow-up — but it does not defeat "every submission reaches the inbox" or "the endpoint can't be spammed" as stated in the phase goal.

---

_Verified: 2026-08-02T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
