---
phase: 09-changelog
plan: 06
subsystem: changelog-unsubscribe-and-homepage
tags: [nextjs, react, unsubscribe, homepage, changelog]
requires:
  - 09-01 (changelogSubscribers schema, changelogPosts query)
  - 09-03 (changelog-email.ts: maskEmail, buildUnsubscribeUrl)
provides:
  - Read-only /changelog/unsubscribe landing page (CHLG-05)
  - UnsubscribeButton client component (click-to-POST removal flow)
  - Homepage v2.0 announcement hero (CHLG-03)
  - Changelog entry in the global site nav
affects:
  - src/app/page.tsx
  - src/components/SiteHeader.tsx
tech-stack:
  added: []
  patterns:
    - "Scanner-safe unsubscribe: GET-only page reads via db.query.findFirst, mutation happens only on a client-side button POST"
    - "Card-shell reuse: homepage hero copies DailyTodayCard's exact class string rather than introducing a third card style"
key-files:
  created:
    - src/components/UnsubscribeButton.tsx
    - src/components/UnsubscribeButton.test.tsx
    - src/app/changelog/unsubscribe/page.tsx
  modified:
    - src/app/page.tsx
    - src/components/SiteHeader.tsx
decisions:
  - "Added afterEach(cleanup) from @testing-library/react to the test file — the project's vitest.config.mts sets globals: false, so @testing-library/react's automatic afterEach cleanup never registers; without an explicit cleanup(), the DOM leaked across the file's 7 render() calls and produced false 'multiple elements found' failures unrelated to the component itself"
  - "Copied .env and .planning/phases/09-changelog/{09-06-PLAN.md, 09-UI-SPEC.md, 09-PATTERNS.md, 09-RESEARCH.md} from the main checkout into this worktree before starting — both .env and .planning/phases/ are gitignored per project convention, so a fresh worktree checkout has neither; without .env, npm run build fails at the page-data-collection step with 'DATABASE_URL environment variable is not set'"
metrics:
  duration: "~35 min"
  completed: 2026-08-03
---

# Phase 09 Plan 06: Unsubscribe Landing Page + Homepage v2.0 Hero Summary

Scanner-safe (GET-only) unsubscribe landing page plus click-to-POST removal button, and a homepage hero + nav entry announcing v2.0 with a link to `/changelog`.

## What Was Built

**Task 1 — `UnsubscribeButton` + `/changelog/unsubscribe` (TDD: test → implementation).**
`src/app/changelog/unsubscribe/page.tsx` reads the `?token=` query param, looks up the matching
`changelogSubscribers` row via a single `db.query.changelogSubscribers.findFirst` (never a write),
and either renders `UnsubscribeButton` with the row's masked email or a dead-end "invalid or
already-used" message when no row matches. `metadata.robots = { index: false, follow: false }`
keeps the token-bearing URL out of search indexes.

`UnsubscribeButton` is a small client-side state machine (`idle | loading | success | gone |
error`): it renders the masked address and an outline-variant `Unsubscribe` button, fires no
network request until clicked, POSTs `{ token }` as JSON to `/api/unsubscribe` on click, and
resolves to one of three terminal UI states — success copy + "Back to Psalter" link, a 404
dead-end with the button removed (no retry), or a 500 retry message with the button still present
and enabled.

7 tests cover: initial render, POST payload shape, 200/404/500 outcomes, in-flight disabled
`Unsubscribing…` label, and zero-fetch-on-mount. All 7 pass.

**Task 2 — Homepage hero + nav entry.** `src/app/page.tsx` gained a `bg-muted
border-l-4 border-l-primary` hero card (the exact shell class string from `DailyTodayCard.tsx`,
reused verbatim to avoid a third homepage card style) prepended above the existing
`grid lg:grid-cols-2` two-column layout — untouched, unrewrapped. The hero has a `New` badge,
"CPRC Psalter v2.0 is here" heading, one line of copy, and a "Read the changelog" outline-button
`Link` to `/changelog`. `src/components/SiteHeader.tsx` gained one `navLinks` array entry
(`{ href: "/changelog", label: "Changelog" }`); `linkClass()`/`isActive()` already generalize to
any entry via `pathname.startsWith(href)`, so no other change was needed.

## Tasks

| # | Task | Commit |
|---|------|--------|
| 1 (RED) | Failing tests for UnsubscribeButton | `829b140` |
| 1 (GREEN) | UnsubscribeButton + unsubscribe landing page | `41dced3` |
| 2 | Homepage v2.0 hero + Changelog nav entry | `6e7d36b` |

## Verification

- `npx vitest run src/components/UnsubscribeButton.test.tsx` — 7/7 passing
- `npx tsc --noEmit` scoped to this plan's 5 files — zero errors (whole-project run has 30+
  pre-existing errors in `tests/e2e/*.spec.ts`, unrelated — see Deviations)
- `npm run build` — succeeded; route list includes both `/changelog/unsubscribe` and `/`
- `grep -c "db.delete\|db.update\|db.insert" src/app/changelog/unsubscribe/page.tsx` → `0`
- All Task 1 and Task 2 acceptance-criteria greps from the plan pass
- Full `npx vitest run` (project-wide): 668 passed / 14 failed / 4 todo across 58 files — all 14
  failures are pre-existing and in files this plan never touches (precent-auth `headers()`
  test-scope issue, tune-quality-phrase-count data drift, psalm/tune data-shape tests,
  `syllabifyForAbc` hyphenation) — see Deviations / `deferred-items.md`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Missing `afterEach(cleanup)` in the new test file caused false failures**
- **Found during:** Task 1, first test run (GREEN attempt)
- **Issue:** `vitest.config.mts` sets `globals: false`, so `@testing-library/react`'s automatic
  DOM-cleanup-between-tests (which relies on detecting a global `afterEach`) never registers.
  5 of 7 tests failed with "multiple elements found" because each `render()` call in the file
  left its previous DOM tree mounted.
- **Fix:** Added `cleanup()` from `@testing-library/react` inside an explicit `afterEach`.
- **Files modified:** `src/components/UnsubscribeButton.test.tsx`
- **Commit:** `41dced3`

**2. [Rule 3 — Blocking] Worktree missing gitignored setup files**
- **Found during:** plan startup, and again before `npm run build`
- **Issue:** `.planning/phases/` and `.env` are both gitignored per this project's convention
  (see root `CLAUDE.md`), so a fresh `worktree-agent-*` checkout has neither. The plan file itself
  (`09-06-PLAN.md`) and its context docs (`09-UI-SPEC.md`, `09-PATTERNS.md`, `09-RESEARCH.md`)
  were unreadable, and `npm run build` failed at the page-data-collection step with `Error:
  DATABASE_URL environment variable is not set`.
- **Fix:** Copied both from the main checkout (`/home/services/psalter/.planning/phases/09-changelog/*`
  and `/home/services/psalter/.env`) into the worktree. Neither is a git-tracked change — no
  commit needed or made for either copy.
- **Files modified:** none (local, gitignored, uncommitted setup only)

None of the plan's own file changes (`src/components/UnsubscribeButton.tsx`,
`src/app/changelog/unsubscribe/page.tsx`, `src/app/page.tsx`, `src/components/SiteHeader.tsx`)
required any deviation from the plan's provided code.

## TDD Gate Compliance

Task 1 was `tdd="true"`. Gate sequence confirmed in git log:
1. RED: `829b140 test(09-06): add failing tests for UnsubscribeButton` — 0/7 tests could even
   collect (import-resolution failure, component didn't exist yet)
2. GREEN: `41dced3 feat(09-06): implement UnsubscribeButton + read-only unsubscribe page` — 7/7
   passing

No REFACTOR commit was needed — no cleanup pass warranted after GREEN.

## Known Stubs

None. Both new routes are fully wired: the unsubscribe page reads a real DB table via a real
query, `UnsubscribeButton` calls a real (if not-yet-built-in-this-worktree) API contract
documented in Plan 02's interface, and the homepage hero links to `/changelog`, which the build
confirms is a real route (built by a sibling wave-2 plan).

## Threat Flags

None beyond the plan's own `<threat_model>` (T-09-50 through T-09-55), all of which were
implemented exactly as specified: read-only page, masked email, `robots: noindex`, dead-end copy
indistinguishable between "unknown token" and "already used", token never interpolated into HTML.

## Self-Check: PASSED

All 5 files confirmed present on disk (`test -f`); all 3 commits confirmed in `git log --oneline`
(`829b140`, `41dced3`, `6e7d36b`).
