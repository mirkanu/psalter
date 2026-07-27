# Deferred Items — Phase 04.9.15.1

Discovered during Plan 02 execution. Out of scope for this plan (unrelated files, pre-existing failures) — logged per the executor's scope-boundary rule, not fixed.

## Pre-existing test failures (full `npx vitest run`, observed 2026-07-27)

- `tests/search.test.ts` — 3 failures: `DATABASE_URL environment variable is not set`. This worktree has no `.env` file (gitignored, not copied into the worktree checkout). Unrelated to `useSwipeGesture`/`StanzaDotIndicator`.
- `src/lib/abc-melisma.test.ts` — 2 failures (`RangeError: Invalid array length` in `buildWLineFromSolfa`, and a phrase-4 boundary count mismatch: expected 8 got 14). Pre-existing melisma-parsing logic, not touched by this plan.
- ~15 other pre-existing failures across the suite (17 test files failed / 33 passed before this plan's changes) — not enumerated individually; none touch `src/hooks/useSwipeGesture.ts`, `src/components/singing/StanzaDotIndicator.tsx`, or `src/app/globals.css`.

None of these block Plan 02's two new files, which typecheck and pass their own unit tests cleanly.
