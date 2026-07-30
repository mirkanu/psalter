---
phase: 07-email-foundation-resend-provisioning
plan: 02
subsystem: infra
tags: [resend, email, vitest, tdd, cli]

# Dependency graph
requires:
  - phase: 07-01
    provides: "mail.gsdlabs.dev sending subdomain (SPF/DKIM/MX verified, DMARC published); PSALTER_RESEND_API_KEY / PSALTER_RESEND_FROM_ADDRESS destined for /home/services/.env.production (pending human-action checkpoint at time of this plan's execution)"
provides:
  - "src/lib/email.ts — sendEmail/getFromAddress/isEmailConfigured, fire-and-forget, never throws"
  - "scripts/send-test-email.ts — CLI test-send with --dry-run mode (no key required)"
  - "email:test npm script"
affects: ["07-03", "Phase 8 (feedback notifications)", "Phase 9 (changelog broadcasts)"]

# Tech tracking
tech-stack:
  added: ["resend@^6.18.1"]
  patterns:
    - "Lazy SDK client construction inside the function body (never module scope) so a missing secret cannot break next build or unit tests"
    - "vi.hoisted() for mocking a default-imported SDK class in vitest (vi.mock factories cannot reference outer-scope consts due to hoisting)"
    - "Typed non-throwing result ({ok:true,id} | {ok:false,error}) as the standard shape for fire-and-forget external-API calls in this repo"

key-files:
  created:
    - src/lib/email.ts
    - src/lib/email.test.ts
    - scripts/send-test-email.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "SendEmailInput has no from field — From identity is structurally locked to getFromAddress(), preventing any future caller from spoofing a different sender identity (T-07-09)"
  - "to/subject/replyTo are rejected on any \\r or \\n before the SDK call, closing the CRLF header-injection vector ahead of Phase 8 passing user-supplied values (T-07-10)"
  - "text is a required field alongside html (not optional) — plain-text parts are a known spam-score factor and EMAIL-02 judges real-inbox placement"
  - "send-test-email.ts loads project .env first, then /home/services/.env.production second (dotenv never overwrites an already-set var), so DATABASE_URL stays owned by the project file while Resend secrets come from the shared VPS file"

patterns-established:
  - "Any future Resend-sending code in this repo should follow src/lib/email.ts's shape: lazy client construction, typed non-throwing result, no caller-supplied from, and a CRLF guard on all user-influenced header fields"

requirements-completed: []  # EMAIL-01 spans 07-01/07-02/07-03; do not mark complete until 07-03 verifies real-inbox delivery per phase plan intent

# Metrics
duration: 12min
completed: 2026-07-30
---

# Phase 07 Plan 02: Email Client (Resend wrapper + CLI test-send) Summary

**Built `sendEmail()` — a fire-and-forget, non-throwing Resend wrapper with a hard-locked From identity and CRLF header-injection guards — plus a `--dry-run`-capable CLI script, fully unit-tested (17/17) against a mocked SDK with no live API key required.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-30T12:31:00Z (approx)
- **Completed:** 2026-07-30T12:43:00Z
- **Tasks:** 2 of 2 completed
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `src/lib/email.ts`: `sendEmail`, `getFromAddress`, `isEmailConfigured`, `DEFAULT_FROM_ADDRESS` — client constructed lazily inside `sendEmail` only, so a missing `PSALTER_RESEND_API_KEY` cannot break `next build` or any test import
- 17 unit tests in `src/lib/email.test.ts` covering: from-address resolution, configured-check, missing-key short-circuit (SDK never constructed), success path, exact payload shape assertion, from-spoofing rejection, in-band SDK error handling, thrown-error handling, key-leak prevention (sentinel-key assertion), CRLF injection rejection on `to`/`subject`/`replyTo`, empty `to`/`subject` rejection, and array-`to` passthrough — all pass with the `resend` SDK fully mocked (no network, no key)
- `scripts/send-test-email.ts`: one-command real test send (`npx tsx scripts/send-test-email.ts <recipient> [--dry-run] [--label "..."]`), spam-hardened body (single self-domain link, no images/urgency/marketing language, SPF/DKIM/DMARC verification instructions for the recipient), `--dry-run` mode fully exercised without a live key
- `resend@^6.18.1` added to `dependencies` (verified: not devDependencies; `vitest` untouched by the VPS `NODE_ENV=production` devDependency-pruning issue recorded in STATE.md)
- `email:test` npm script added

## Task Commits

Each task was committed atomically (Task 1 used the TDD RED → GREEN cycle):

1. **Task 1 RED: failing tests for sendEmail wrapper** - `8b53a3b` (test)
2. **Task 1 GREEN: implement Resend client wrapper sendEmail** - `a726ae8` (feat)
3. **Task 2: CLI test-send script scripts/send-test-email.ts** - `2a39e01` (feat)

**Plan metadata:** this commit (docs: SUMMARY)

## Files Created/Modified

- `src/lib/email.ts` — Resend client wrapper; the single sending entry point for all future psalter email
- `src/lib/email.test.ts` — 17 unit tests, SDK fully mocked via `vi.hoisted` + `vi.mock('resend', ...)`
- `scripts/send-test-email.ts` — CLI test-send script with `--dry-run`
- `package.json` — added `resend` dependency and `email:test` script
- `package-lock.json` — lockfile update for `resend` and its transitive deps

## Decisions Made

See `key-decisions` in frontmatter. All decisions were pre-specified by the plan's `<action>` block (exact public surface, hard implementation rules); no new architectural decisions were required during execution beyond the vitest mock-hoisting fix noted below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `vi.mock` hoisting error in the test file**
- **Found during:** Task 1 GREEN verification (first `vitest run` after writing `email.ts`)
- **Issue:** The test file declared `sendMock`/`ResendMock` as top-level `const`s referenced inside the `vi.mock('resend', () => ...)` factory. Vitest hoists `vi.mock` calls to the top of the file, so the factory ran before those `const`s were initialized, throwing `ReferenceError: Cannot access 'ResendMock' before initialization`.
- **Fix:** Wrapped both mocks in `vi.hoisted(() => {...})`, which vitest hoists together with `vi.mock` in the correct order, making the mock functions available inside the factory.
- **Files modified:** `src/lib/email.test.ts`
- **Verification:** `npx vitest run src/lib/email.test.ts` — 17/17 passing after the fix
- **Committed in:** `a726ae8` (part of the Task 1 GREEN commit, since the test file needed this correction to actually validate the implementation)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test-file bug, not a plan or architecture issue)
**Impact on plan:** No scope creep. Fix was required for the plan's own acceptance criteria (`npx vitest run src/lib/email.test.ts` exits 0) to be satisfiable at all.

## Issues Encountered

- **Worktree isolation gap:** `.planning/phases/` and `.planning/config.json` are gitignored per this project's CLAUDE.md convention, so the git worktree spawned for this parallel-execution agent did not contain the phase 07 plan files or `.env`. Copied `.planning/phases/07-email-foundation-resend-provisioning/` from the main checkout (`/home/services/psalter/.planning/...`) into the worktree so the plan file could be read, and copied `/home/services/psalter/.env` into the worktree (also gitignored, never committed) so the full pre-existing vitest suite could run against the real dev database for a true no-regression check. Neither copy is a git operation and neither shows up in `git status`.
- **Pre-existing, out-of-scope test failures:** `npx vitest run` (full suite) shows 14 failures across `src/app/api/precent/**` (Next.js `headers()` called outside request scope — a test-harness/runtime issue unrelated to this plan), `src/lib/abc-melisma.test.ts` (2 pre-existing heuristic mismatches), and several DB-content assertions (`tests/tune-detail.test.ts` `score_jpg_url`, `tests/psalm-detail.test.ts`, `tests/tune-quality-phrase-count.test.ts`, `tests/psalm-23-crimond-regression.test.ts`, `tests/lib-utilities.test.ts`) that predate this plan and do not touch `src/lib/email.ts` or `scripts/send-test-email.ts` in any way. Per the Scope Boundary rule, these were left untouched — `src/lib/email.test.ts` itself is 17/17 green and introduces zero new failures anywhere else in the suite.
- **`PSALTER_RESEND_API_KEY` not yet live:** sibling plan 07-01 is paused at a human-action checkpoint (Resend API-key creation) at the time this plan executed, so `configured=false` in this plan's dry-run output is expected and correct, not a bug — this plan's own acceptance criteria explicitly allow completion via `--dry-run` without a live key.

## User Setup Required

None — no new external service configuration required by this plan. (07-01 already documents the pending Resend API-key checkpoint; 07-03 is expected to perform the real-inbox send once that key lands in `/home/services/.env.production`.)

## Next Phase Readiness

- `sendEmail()` is ready for Phase 8 (feedback notifications) and Phase 9 (changelog broadcasts) to import directly — its fire-and-forget, non-throwing contract means neither future caller needs its own try/catch around a mail send
- `scripts/send-test-email.ts --dry-run` can be rehearsed by anyone right now; a real send just needs `PSALTER_RESEND_API_KEY` present in `/home/services/.env.production` (07-01's pending checkpoint) — no code change required on this plan's side
- 07-03 (real-inbox delivery verification against Gmail/Outlook) can proceed once 07-01's checkpoint clears; it should invoke `scripts/send-test-email.ts <real-address> --label "..."` directly, no new code needed

## Known Stubs

None — `sendEmail` and the CLI script are both fully wired; no placeholder/mock behavior ships in the committed code (mocks exist only inside the test file, which never runs in production).

## Threat Flags

None beyond what this plan's own `<threat_model>` already covers (T-07-09 through T-07-16) — no new surface introduced outside what the plan anticipated.

---
*Phase: 07-email-foundation-resend-provisioning*
*Completed: 2026-07-30*
