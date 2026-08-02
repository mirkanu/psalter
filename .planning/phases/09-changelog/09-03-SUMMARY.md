---
phase: 09-changelog
plan: 03
subsystem: api
tags: [email, resend, vitest, tdd, security]

# Dependency graph
requires:
  - phase: 07-email-foundation-resend-provisioning
    provides: "src/lib/email.ts sendEmail() primitive (non-throwing Resend wrapper)"
  - phase: 08-feedback-email-rate-limiting
    provides: "src/lib/feedback-email.ts escapeHtml/sanitizeHeaderValue idiom this plan mirrors"
provides:
  - "src/lib/changelog-email.ts — pure changelog broadcast email construction + non-throwing send wrapper"
  - "escapeHtml, maskEmail, buildUnsubscribeUrl, buildChangelogEmail, sendChangelogBroadcastEmail, getSiteBaseUrl exports"
affects: [09-01, 09-02, 09-04, 09-05, 09-06, 09-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Email-construction module duplicates escapeHtml/sanitizeHeaderValue verbatim per-file rather than sharing across feedback-email.ts/changelog-email.ts (explicit project convention)"
    - "maskEmail(email) -> 'j***@example.com' for safe logging/display of subscriber addresses"

key-files:
  created: [src/lib/changelog-email.ts, src/lib/changelog-email.test.ts]
  modified: []

key-decisions:
  - "No replyTo on broadcast emails — a broadcast has no meaningful reply target"
  - "maskEmail lives in changelog-email.ts (not a separate module) per PATTERNS.md's default-location guidance"

patterns-established:
  - "Broadcast email fire-and-forget wrapper: try/catch around buildX + sendEmail, logs only result.error/err.message, never recipient/token/body"

requirements-completed: [CHLG-05]

# Metrics
duration: 6min
completed: 2026-08-02
---

# Phase 09 Plan 03: Changelog Broadcast Email Summary

**Pure changelog broadcast email builder (`buildChangelogEmail`) plus a non-throwing send wrapper (`sendChangelogBroadcastEmail`), mirroring Phase 08's feedback-email.ts escaping/CR-LF discipline with a new per-subscriber unsubscribe link.**

## Performance

- **Duration:** 6 min (first commit 16:19:35Z, last commit 16:23:27Z)
- **Started:** 2026-08-02T16:19:35Z
- **Completed:** 2026-08-02T16:23:27Z
- **Tasks:** 2 (both TDD: RED → GREEN)
- **Files modified:** 2 (both newly created)

## Accomplishments
- `escapeHtml`, `maskEmail`, `getSiteBaseUrl`, `buildUnsubscribeUrl` — small pure helpers, each independently tested
- `buildChangelogEmail` — builds subject (`CPRC Psalter update: {title}`, CR/LF-safe, capped at 120 chars), escaped HTML body preserving newlines via `white-space:pre-wrap`, absolute `/changelog` link, and a per-token unsubscribe URL in both HTML and text bodies
- `sendChangelogBroadcastEmail` — fire-and-forget wrapper around Phase 07's `sendEmail`; never throws, whether `sendEmail` resolves `{ ok: false }` or rejects
- 20/20 tests passing; `npx tsc --noEmit` clean for both new files; zero `from 'resend'` occurrences outside `src/lib/email.ts` repo-wide

## Task Commits

Each task followed the RED → GREEN TDD cycle with separate commits:

1. **Task 1: Escaping, header sanitizing, masking, unsubscribe-URL** —
   test `3ed0019` (RED, 7 failing tests) → feat `e4a16bc` (GREEN, 7/7 passing)
2. **Task 2: buildChangelogEmail + sendChangelogBroadcastEmail** —
   test `d5999d8` (RED, 13 new failing tests, 7 prior still passing) → feat `d68d923` (GREEN, 20/20 passing)

_No separate plan-metadata commit — SUMMARY.md is committed as the final commit of this worktree per parallel-executor protocol._

## Files Created/Modified
- `src/lib/changelog-email.ts` — broadcast email construction (`buildChangelogEmail`) + non-throwing send wrapper (`sendChangelogBroadcastEmail`) + shared helpers (`escapeHtml`, `maskEmail`, `getSiteBaseUrl`, `buildUnsubscribeUrl`)
- `src/lib/changelog-email.test.ts` — 20 tests: escaping, masking, unsubscribe-URL construction (env fallback + trailing-slash strip + percent-encoding), subject/body construction, CR/LF and length safety, unsubscribe-link uniqueness per token, and the three `sendChangelogBroadcastEmail` outcomes (success, `ok:false`, throw)

## Decisions Made
- Followed the plan's literal code verbatim for both halves of `changelog-email.ts` (escaping/masking/URL helpers, then `buildChangelogEmail`/`sendChangelogBroadcastEmail`) — no deviation from the drafted implementation.
- Test file's `vi.hoisted` mock for `sendEmail` needed an explicit `SendEmailResult` type parameter on `vi.fn<...>` (not shown in the plan's abbreviated snippet) so that `mockResolvedValue({ ok: false, error: ... })` type-checks against the discriminated union — otherwise `npx tsc --noEmit` fails with TS2353. This is a mechanical typing fix, not a behavior change; documented here as a [Rule 1 - Bug] auto-fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Typed the hoisted `sendEmail` mock against `SendEmailResult`**
- **Found during:** Task 2, running `npx tsc --noEmit` after the GREEN implementation
- **Issue:** The plan's test-file snippet `vi.fn(async () => ({ ok: true, id: 'msg-1' }))` left TypeScript inferring the mock's return type as the literal `{ ok: true; id: string }`, so a later `sendEmailMock.mockResolvedValue({ ok: false, error: '...' })` failed to type-check (`TS2353: Object literal may only specify known properties`)
- **Fix:** Imported `type { SendEmailResult }` from `./email` and typed the hoisted mock as `vi.fn<(...args: unknown[]) => Promise<SendEmailResult>>(...)`
- **Files modified:** `src/lib/changelog-email.test.ts`
- **Verification:** `npx tsc --noEmit` shows zero errors for `src/lib/changelog-email.ts`/`.test.ts`; `npx vitest run src/lib/changelog-email.test.ts` still 20/20 passing after the fix
- **Committed in:** `d68d923` (part of Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug — test-file type annotation)
**Impact on plan:** Purely a TypeScript typing correction inside the test file; zero behavior change to the shipped module. No scope creep.

## Issues Encountered
- This worktree does not carry `.env` (gitignored, not copied into git worktrees), so `DATABASE_URL` is unset here. Running the full `npx vitest run` suite (not just this plan's test file) surfaced 16 pre-existing test failures across unrelated files (`tests/search.test.ts` — missing `DATABASE_URL`; `src/lib/abc-melisma.test.ts` — pre-existing melisma logic bugs; several Playwright e2e `.spec.ts` files with pre-existing TypeScript errors). None touch `src/lib/changelog-email.ts` or are caused by this plan's changes. Logged to `.planning/phases/09-changelog/deferred-items.md` (local, gitignored — not committed, per repo convention that `.planning/phases/` is operational history) rather than fixed, per the executor's scope-boundary rule.
- `.planning/phases/09-changelog/*.md` planning docs (PLAN/RESEARCH/PATTERNS/UI-SPEC/VALIDATION for all 7 plans) exist in the main checkout at `/home/services/psalter/.planning/phases/09-changelog/` but are gitignored, so they were not present in this fresh worktree. Copied them in at the start of execution so this plan (and the plan file itself) could be read; this is expected/standard for gitignored `.planning/phases/` content in a worktree and not a plan defect.

## User Setup Required

None — no external service configuration required. This plan builds pure/tested library code only; it does not touch environment variables, `src/lib/email.ts`, or any Resend configuration (all already provisioned in Phase 07).

## Next Phase Readiness
- `src/lib/changelog-email.ts`'s exports (`buildChangelogEmail`, `sendChangelogBroadcastEmail`, `maskEmail`) are ready for Plan 09-XX's `/api/changelog` publish route (broadcast loop over `changelogSubscribers`) and the unsubscribe page (`maskEmail` for displaying the subscriber's address before confirming unsubscribe).
- No blockers. This plan has no dependencies on other Wave 1 plans (`depends_on: []`) and nothing else in Phase 9 depends on it being merged first at the code level, though the publish route (a later plan) will `import` from this file.

---
*Phase: 09-changelog*
*Completed: 2026-08-02*
