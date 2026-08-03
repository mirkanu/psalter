# Deferred Items — Phase 09 (Changelog)

Items discovered during execution that are out of scope for this plan/phase and were
intentionally NOT fixed. Logged per executor scope-boundary rules.

## 09-07

### 14 pre-existing test failures unrelated to changelog code, surfaced by `npm test -- --run` in Task 1

- **Found during:** Task 1, step (b) full test suite run before build
- **Symptom:** `Test Files 9 failed | 56 passed (65)` / `Tests 14 failed | 729 passed | 4 todo (747)`
- **Failing files:**
  - `src/app/api/precent/route.test.ts` (3 tests) — `headers()` called outside a
    request scope (Next.js/vitest App Router test-environment mismatch)
  - `src/app/api/precent/[id]/items/route.test.ts` (1 test) — same `headers()` issue
  - `src/app/api/precent/[id]/reorder/route.test.ts` (2 tests) — same `headers()` issue
  - `src/lib/abc-melisma.test.ts` (2 tests) — melisma passing-note/phrase-boundary assertions
  - `tests/tune-quality-phrase-count.test.ts` (2 tests) — double-length tune phrase-count data assertions
  - `tests/psalm-detail.test.ts` (1 test) — PSALM-05 lyrics/tune linkage data assertion
  - `tests/tune-detail.test.ts` (1 test) — TUNE-01 `score_jpg_url` data assertion
  - `tests/psalm-23-crimond-regression.test.ts` (1 test) — RENDER-07b cross-stanza alignment regression
  - `tests/lib-utilities.test.ts` (1 test) — `syllabifyForAbc` single-syllable assertion
- **Why deferred:** None of these files were touched by any Phase 9 plan (09-01
  through 09-06 — verified via `git log` on the changelog feature commits, which only
  touch `src/app/changelog/*`, `src/app/api/changelog/*`, `src/app/api/subscribe/*`,
  `src/app/api/unsubscribe/*`, `src/lib/changelog-email.ts`, `src/db/schema.ts`,
  `src/db/queries/changelog.ts`, related component/test files). `git log -1` on each
  failing file's own history shows its last change predates Phase 9 entirely (most
  recent: `53748e9`, 2026-07-16). These are pre-existing data/environment-dependent
  test debt (precenting-route `headers()` App Router test-scope mismatch; tune/psalm
  data-shape assertions tied to the live DB's current content; melisma heuristic
  assertions) unrelated to the changelog feature this plan deploys. Per the executor
  scope boundary, only issues directly caused by the current task's changes are
  auto-fixed; pre-existing failures in unrelated files are logged here, not fixed.
- **Confirms:** Zero Phase 9 / changelog test files appear in the failing list — all
  changelog-related tests pass.
- **Suggested follow-up:** Separate quick-task or phase to (a) fix the App Router
  `headers()` test-scope issue in the three `precent` route test files (likely needs
  a Next.js request-context mock/wrapper), and (b) refresh the data-dependent
  assertions in `tune-quality-phrase-count.test.ts`, `psalm-detail.test.ts`,
  `tune-detail.test.ts`, `psalm-23-crimond-regression.test.ts`, and
  `abc-melisma.test.ts` against current DB content.
