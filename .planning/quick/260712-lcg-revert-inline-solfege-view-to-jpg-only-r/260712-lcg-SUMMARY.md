---
phase: quick-260712-lcg
plan: 01
subsystem: ui
tags: [notation, abcjs, react, solfège, revert]

requires:
  - phase: 04.9.14-02
    provides: the abcjs inline-solfège + approval-gate wiring this plan removes
provides:
  - Inline Solfège reverted to JPG-only rendering, identical to split-leaf Solfège
  - Single ungated solfegeAvailable prop on GearPopover (JPG presence, no approval gate)
  - Orphaned /api/melisma-status route deleted
affects: [singing-view, notation-renderer, gear-popover]

tech-stack:
  added: []
  patterns:
    - "Single JPG render branch handles both inline and split-leaf Solfège in NotationRenderer"

key-files:
  created: []
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/components/singing/SingingView.tsx
    - src/components/singing/GearPopover.tsx
  deleted:
    - src/app/api/melisma-status/route.ts

key-decisions:
  - "Descope inline abcjs solfège for now, revert to JPG-only (user's locked decision from 04.9.14-lcg CONTEXT)"

patterns-established:
  - "Solfège availability is JPG-presence-only, no approval gating anywhere in the singing view"

requirements-completed: [QUICK-260712-lcg]

duration: 20min
completed: 2026-07-12
---

# Quick Task 260712-lcg: Revert Inline Solfège to JPG-only Summary

**Reverted inline Solfège from an abcjs soprano-only staff render (indistinguishable from Staff view) back to the scanned solfège JPG — same rendering path as split-leaf Solfège — and removed the melisma-approval gate that had disabled it.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-12T15:36:43Z
- **Tasks:** 2 completed
- **Files modified:** 3 modified, 1 deleted

## Accomplishments
- `viewMode === 'solfege'` now falls through to the same JPG + thumbnail/pagination branch used by `'solfege-split'` — no abcjs render path, no approval gate, no "not approved yet" message
- `GearPopover` now gates the Solfège toggle with a single `solfegeAvailable` boolean driven purely by solfège JPG presence
- Deleted the now-orphaned `/api/melisma-status` route (zero remaining callers; melisma editor still uses `/api/dev/melisma-decision`, untouched)
- No dead code left: removed `solfegeAbc`/`isTuneApproved` props, `unifiedSolfegeAbc` memo, `melismaStatus` state + fetch effect, `pickAbcWithMarkers`/`sopranoOnly` import, and `solfegeInlineAvailable`/`solfegeSplitAvailable` split

## Task Commits

1. **Task 1: Strip abcjs solfège render path + approval gate from NotationRenderer** - `c00f53d` (fix)
2. **Task 2: Remove solfège gating wiring from SingingView + GearPopover, delete orphaned route** - `0b71bf1` (fix)

## Files Created/Modified
- `src/components/notation/NotationRenderer.tsx` - Removed `solfegeAbc`/`isTuneApproved` props, `unifiedSolfegeAbc` memo, the approval-gate branch, and the abcjs-render branch; `buildUnifiedAbc` body/Staff `unifiedAbc` untouched, only its stale docstring reworded
- `src/components/singing/SingingView.tsx` - Removed `melismaStatus` fetch effect + state, `solfegeAbc` memo, `isTuneApproved` derivation, unused `pickAbcWithMarkers`/`sopranoOnly` import; `GearPopover` now receives a single `solfegeAvailable` prop
- `src/components/singing/GearPopover.tsx` - Collapsed `solfegeInlineAvailable`/`solfegeSplitAvailable` into one `solfegeAvailable` prop; toast message and tooltip no longer reference approval; `staffAvailable` JSDoc reworded to drop stale "approved" wording
- `src/app/api/melisma-status/route.ts` - Deleted (orphaned; melisma editor already used `/api/dev/melisma-decision`)

## Decisions Made
- Followed the plan's locked decision exactly: descope abcjs inline solfège, revert to JPG-only. No re-litigation.

## Deviations from Plan

None - plan executed exactly as written. One incidental fix during verification (not a code deviation): cleared the stale `.next/types/validator.ts` Next.js type-generation cache, which still referenced the just-deleted `melisma-status` route file and caused a spurious `tsc` error unrelated to source code — this is a generated build artifact (gitignored), not a source change, and regenerates automatically on the next `next dev`/`next build`.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Inline Solfège now behaves identically to split-leaf Solfège (scanned JPG), matching pre-04.9.14-02 behavior.
- `tsc --noEmit` is clean of new errors (pre-existing `tests/e2e/*.spec.ts` issues unchanged, out of scope).
- `npm run build` was intentionally NOT run by this executor per orchestrator instruction — a full production rebuild is batched separately after all pending quick-fix tasks in this session complete.

---
*Phase: quick-260712-lcg*
*Completed: 2026-07-12*

## Self-Check: PASSED

All created/modified files confirmed present; deleted route confirmed absent; both task commits (`c00f53d`, `0b71bf1`) confirmed in git log.
