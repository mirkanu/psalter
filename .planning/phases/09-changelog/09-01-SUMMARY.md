---
phase: 09-changelog
plan: 01
subsystem: database
tags: [drizzle, postgres, vitest, tdd]

# Dependency graph
requires: []
provides:
  - changelog_posts table (live in psalter Postgres)
  - changelog_subscribers table (live in psalter Postgres, unique on email + unsubscribe_token)
  - fetchPublishedPosts() query helper (src/db/queries/changelog.ts)
affects: [09-02, 09-03, 09-04, 09-05, 09-06, 09-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Query-per-file convention: src/db/queries/changelog.ts mirrors daily.ts (db.query.<table>.findMany + trailing exported Awaited<ReturnType<...>> type)"
    - "Real-DB integration test convention: seed TEST-CHLG- prefixed rows in beforeAll, delete in afterAll, no mocking (matches tests/db-queries.test.ts)"

key-files:
  created:
    - src/db/queries/changelog.ts
    - src/db/queries/changelog.test.ts
  modified:
    - src/db/schema.ts

key-decisions:
  - "No relations() block for either table — neither has a foreign key, matching feedbackSubmissions precedent"
  - "No unsubscribedAt soft-delete column — unsubscribe hard-deletes the row per RESEARCH.md Assumptions Log A1"

patterns-established:
  - "Changelog schema section appended at end of schema.ts under a `// ─── Changelog ───` banner, following the file's existing section-comment convention"

requirements-completed: [CHLG-01, CHLG-04, CHLG-05]

# Metrics
duration: 13min
completed: 2026-08-02
---

# Phase 9 Plan 01: Changelog Database Foundation Summary

**Live Postgres tables `changelog_posts` and `changelog_subscribers` (with real UNIQUE constraints on email + unsubscribe_token) plus a newest-first `fetchPublishedPosts()` query, proven by a real-DB TDD test.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-08-02T16:13:00Z
- **Completed:** 2026-08-02T16:26:26Z
- **Tasks:** 3 completed
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments
- Added `changelogPosts` and `changelogSubscribers` Drizzle table definitions to `src/db/schema.ts`
- Pushed both tables to the live `psalter-db` Postgres container via `drizzle-kit push` (purely additive, no data-loss prompt)
- Verified directly via `psql` (not just the push tool's own log) that `changelog_subscribers` carries exactly two UNIQUE constraints (`email`, `unsubscribe_token`) plus its primary key
- Implemented `fetchPublishedPosts()` in `src/db/queries/changelog.ts`, proven newest-first by a real-DB TDD test with zero leaked rows afterward

## Task Commits

Each task was committed atomically:

1. **Task 1: Add changelogPosts and changelogSubscribers tables to schema.ts** - `b64f1d3` (feat)
2. **Task 2: Push the new tables to the live psalter database** - no commit (database-state-only task, no source files changed per plan spec)
3. **Task 3: Add fetchPublishedPosts() query + real-DB ordering test** - `2f195e2` (test, RED) then `66a7664` (feat, GREEN)

## Files Created/Modified
- `src/db/schema.ts` - Added `changelogPosts` (id, title, body, createdAt) and `changelogSubscribers` (id, email UNIQUE, unsubscribeToken UNIQUE, createdAt) table definitions
- `src/db/queries/changelog.ts` - `fetchPublishedPosts()` returning posts ordered `desc(createdAt)`, plus exported `ChangelogPost` row type
- `src/db/queries/changelog.test.ts` - Real-DB integration test: newest-first ordering, strictly-descending full-set check, field-shape check, empty-state check; seeds/cleans `TEST-CHLG-` prefixed rows

## Database Verification (Task 2)

Ran `npm run db:push` (with `DATABASE_URL` exported inline, since `/home/services/psalter/.env` is outside this worktree and is gitignored). Output: `[✓] Changes applied` with no data-loss confirmation prompt.

Direct psql verification:

```
$ docker exec psalter-db psql -U postgres -d psalter -t -c "SELECT conname, contype FROM pg_constraint WHERE conrelid = 'changelog_subscribers'::regclass ORDER BY conname;"
 changelog_subscribers_email_unique             | u
 changelog_subscribers_pkey                     | p
 changelog_subscribers_unsubscribe_token_unique | u
```

- `to_regclass('public.changelog_posts')` → `changelog_posts`
- `to_regclass('public.changelog_subscribers')` → `changelog_subscribers`
- `count(*) FROM pg_constraint WHERE conrelid='changelog_subscribers'::regclass AND contype='u'` → `2`
- `count(*) FROM information_schema.columns WHERE table_name='changelog_posts' AND column_name IN ('id','title','body','created_at')` → `4`

## Decisions Made
- Followed the plan's exact schema text (no relations blocks, no soft-delete column) — no deviation from the written table definitions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied `.env` into the worktree so vitest could load `DATABASE_URL`**
- **Found during:** Task 3 (writing the RED test)
- **Issue:** `.env` is gitignored and lives only in the main repo checkout (`/home/services/psalter/.env`); this worktree had no `.env`, so `vitest.config.mts`'s `dotenv.config({ path: '.env' })` found nothing and `src/db/index.ts` threw `DATABASE_URL environment variable is not set` before any test could even collect.
- **Fix:** `cp /home/services/psalter/.env <worktree>/.env`. Stays gitignored, never staged/committed.
- **Files modified:** none tracked (`.env` is not committed)
- **Verification:** `npx vitest run src/db/queries/changelog.test.ts` collected and ran correctly afterward
- **Committed in:** N/A (gitignored file, not part of any commit)

**2. [Rule 3 - Blocking] Copied the missing `09-changelog` plan directory into the worktree**
- **Found during:** Plan load, before Task 1
- **Issue:** `.planning/phases/` is gitignored per this project's global CLAUDE.md convention; the worktree snapshot predated `09-01-PLAN.md` and the rest of the phase-09 planning docs being written in the main repo, so `.planning/phases/09-changelog/` did not exist in the worktree at all.
- **Fix:** `cp -r /home/services/psalter/.planning/phases/09-changelog <worktree>/.planning/phases/`
- **Files modified:** none tracked (`.planning/phases/` is gitignored)
- **Verification:** `09-01-PLAN.md` and its sibling docs (`09-RESEARCH.md`, `09-PATTERNS.md`, etc.) all readable afterward
- **Committed in:** N/A (gitignored directory, not part of any commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — missing files blocking task execution, both gitignored/environment-local, neither touches tracked source)
**Impact on plan:** Zero impact on shipped code. Both fixes were worktree-environment setup gaps, not plan or code defects.

## Issues Encountered
- `npx tsc --noEmit` and `npx vitest run` (full suite) both show pre-existing, unrelated failures: 51 typecheck errors confined to `tests/e2e/*.spec.ts` (duplicate-declaration errors from standalone Playwright scripts, not part of the Next.js build) and 14 pre-existing test failures in `src/app/api/precent/**` (`headers() was called outside a request scope` — a Next.js test-harness issue unrelated to auth logic itself). Confirmed both are present identically via `git stash` before this plan's changes, so out of scope per the deviation-rules scope boundary — logged here, not fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `changelog_posts` and `changelog_subscribers` are live in the production `psalter-db` Postgres instance with correct unique constraints, unblocking every downstream Phase 9 plan (subscribe/unsubscribe routes, admin authoring, `/changelog` page, broadcast email)
- `fetchPublishedPosts()` is ready to be consumed by the `/changelog` route in a later plan
- No blockers identified

---
*Phase: 09-changelog*
*Completed: 2026-08-02*
