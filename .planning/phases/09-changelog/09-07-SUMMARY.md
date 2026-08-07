---
phase: 09-changelog
plan: 07
subsystem: infra
tags: [deployment, pm2, playwright, resend, live-verification]

requires:
  - phase: 09-01
    provides: changelogSubscribers/changelogPosts schema, listing query
  - phase: 09-02
    provides: subscribe API + throttle
  - phase: 09-03
    provides: broadcast email (changelog-email.ts) + unsubscribe API
  - phase: 09-04
    provides: admin composer UI
  - phase: 09-05
    provides: subscribe UI + listing page
  - phase: 09-06
    provides: unsubscribe landing page + homepage hero
provides:
  - Phase 9 code deployed and running live at psalter.gsdlabs.dev (PM2 restart proven to postdate build)
  - Mechanical live proof of all five CHLG success criteria (HTTP/DOM smoke, Playwright daemon smoke, subscribe round trip, throttle, anti-enumeration)
  - Human-confirmed real-inbox delivery and end-to-end unsubscribe click, corroborated by direct psql row-count check
  - .planning/phases/09-changelog/09-07-LIVE-EVIDENCE.md as the permanent evidence record
affects: [phase-10-tune-data-fixes]

tech-stack:
  added: []
  patterns:
    - "Live-evidence doc precedent (Phase 07/08) extended: mechanical proof for everything scriptable, human checkpoint only for the one thing no script can check (real inbox + real unsubscribe click), then a psql spot-check corroborates the human's verdict rather than trusting it blindly"

key-files:
  created:
    - .planning/phases/09-changelog/09-07-LIVE-EVIDENCE.md
  modified: []

key-decisions:
  - "Human's real published post ('V2 (Beta)', changelog_posts.id=31) left in place as genuine release content rather than deleted as test data, per threat register T-09-62 requiring an explicit ask/decision before deleting any live-visible post"
  - "REQUIREMENTS.md CHLG-01..05 were already marked Complete by earlier Phase 9 plans (09-05, 09-06); this plan's live+human verification retroactively validates that status with real evidence rather than needing to flip any checkboxes"

patterns-established:
  - "Post-checkpoint mechanical corroboration: after a human reports a full pass at a checkpoint, re-derive the checkable half of their claim independently (subscriber row count, newest post row) rather than recording only their prose verdict"

requirements-completed: [CHLG-01, CHLG-02, CHLG-03, CHLG-04, CHLG-05]

duration: "~35 min active execution across two sessions (2026-08-03 Task 1 + checkpoint; 2026-08-07 Task 3 continuation after human response), with a multi-day human-response wait in between not counted as execution time"
completed: 2026-08-07
---

# Phase 09 Plan 07: Live Deployment & Verification Summary

**Phase 9 changelog deployed to production and all five CHLG success criteria proven live — mechanically for everything scriptable (HTTP smoke, Playwright DOM checks, subscribe/throttle/anti-enumeration against the real DB), and by human checkpoint plus independent psql corroboration for real-inbox delivery and the unsubscribe click.**

## Performance

- **Duration:** ~35 min active execution (spread across 2026-08-03 and 2026-08-07, separated by a human-response wait at the checkpoint)
- **Started:** 2026-08-03T10:48:16Z (Task 1 test suite run)
- **Completed:** 2026-08-07T17:29:10Z (Task 3 final commit)
- **Tasks:** 3 (2 auto, 1 checkpoint:human-verify)
- **Files modified:** 1 (`09-07-LIVE-EVIDENCE.md`, across two commits)

## Accomplishments
- Phase 9 code deployed to the live `psalter` PM2 process; process start time verified to postdate `.next/BUILD_ID` mtime by ~18s, ruling out a stale bundle
- All mechanically-checkable CHLG criteria proven against the real deployed site and real database: anonymous visitors see zero composer markers, `GET /api/unsubscribe` correctly fails (405), duplicate subscribe POSTs are byte-identical and produce exactly one row (anti-enumeration, T-09-11), and the live per-IP throttle returns the exact `200 200 200 200 200 429` sequence
- Human confirmed the three things no script could check — admin publish through a real logged-in session, real email delivery to a real Gmail inbox with subject/body/line-break intact, and a working unsubscribe click — with a clean, unqualified "All Confirmed working!" verdict across checkpoint steps 2-6
- Independently corroborated the human's verdict via direct psql: `changelog_subscribers` row for `manuelkuhs+psalter-chlg@gmail.com` is `0` post-unsubscribe, and exactly one `changelog_posts` row (id 31, "V2 (Beta)") exists, confirming both the unsubscribe and the publish actually landed in the database, not just in the human's perception of the UI

## Task Commits

1. **Task 1: Deploy, verify freshness, and smoke the public surfaces** - `63213c6` (docs)
2. **Task 2: Human confirmation — admin publish, real inbox delivery, working unsubscribe** - checkpoint, no commit (human responded "All Confirmed working!")
3. **Task 3: Record the verdict and confirm the subscriber row is gone** - `9302d28` (docs)

**Plan metadata:** (this commit, see below)

## Files Created/Modified
- `.planning/phases/09-changelog/09-07-LIVE-EVIDENCE.md` - Full live-deployment evidence: freshness proof, HTTP/DOM/Playwright smoke, subscribe round trip, throttle test, human verification verdict, and post-unsubscribe psql corroboration

## Decisions Made
- The human's real published post ("V2 (Beta)", id 31) is genuine release content created during a live verification pass, not disposable test data — left in place per the threat register's explicit ask-before-delete rule (T-09-62), and this decision was recorded in the evidence doc rather than pausing for another checkpoint, per the calling agent's explicit instruction
- REQUIREMENTS.md's CHLG-01 through CHLG-05 rows were already marked `Complete` by earlier plans (09-05, 09-06) ahead of this plan's live proof; no edit was needed here since the human's full-pass verdict plus psql corroboration validates that pre-existing status rather than contradicting it — nothing was "upgraded" without evidence

## Deviations from Plan

None - plan executed exactly as written. One minor factual note, not a deviation: the checkpoint's `<how-to-verify>` text suggested the example title `CPRC Psalter v2.0` for the admin's test post; the human used their own title ("V2 (Beta)") instead when actually performing the publish step. This is expected human behavior (the checkpoint text was illustrative, not a literal instruction to type that exact string) and does not affect any acceptance criterion — CHLG-02 only requires that a real post be published through the live UI, which it was.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. No new environment variables were introduced by Phase 9.

## Next Phase Readiness
- Phase 9 (Changelog) is fully complete: all 7 plans executed, all 5 CHLG requirements proven live and human-verified, evidence permanently recorded
- The live human-published post ("V2 (Beta)") remains visible on production `/changelog` as real content going forward — future phases should be aware it exists when working near the changelog feature
- No blockers for Phase 10 (Tune Data Fixes)

---
*Phase: 09-changelog*
*Completed: 2026-08-07*
