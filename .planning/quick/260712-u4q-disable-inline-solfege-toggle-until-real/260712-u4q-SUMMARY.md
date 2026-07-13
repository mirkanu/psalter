---
phase: quick-260712-u4q
plan: 01
subsystem: singing-view
tags: [gear-popover, notation-renderer, solfege, ux-gating]
dependency-graph:
  requires: []
  provides:
    - "GearPopover solfegeInlineAvailable/solfegeSplitAvailable layout-dependent gating"
    - "NotationRenderer distinct inline-Solfege coming-soon branch"
  affects:
    - src/components/singing/GearPopover.tsx
    - src/components/singing/SingingView.tsx
    - src/components/notation/NotationRenderer.tsx
tech-stack:
  added: []
  patterns:
    - "layout-dependent availability derivation (solfegeAvailableForCurrentLayout = isSplit ? split : inline)"
key-files:
  created: []
  modified:
    - src/components/singing/GearPopover.tsx
    - src/components/singing/SingingView.tsx
    - src/components/notation/NotationRenderer.tsx
decisions:
  - "solfegeInlineAvailable is a hardcoded false — not tied to tune data or approval status — since real abcjs tonic sol-fa rendering does not exist"
  - "Split-leaf Solfege (scanned JPG) remains fully enabled and untouched; only the inline path is gated"
metrics:
  duration: 20 min
  completed: 2026-07-13
---

# Phase quick-260712-u4q Plan 01: Disable inline Solfège toggle until real Summary

Split the single `solfegeAvailable` boolean into layout-dependent `solfegeInlineAvailable` (hardcoded false) and `solfegeSplitAvailable` (JPG-driven) gates, closing both paths into inline Solfège and adding a distinct "coming soon" message for stale localStorage state.

## What Was Built

**Task 1 — GearPopover + SingingView wiring:**
- `GearPopover.tsx` `Props` now exposes `solfegeInlineAvailable: boolean` and `solfegeSplitAvailable: boolean` (replacing the single `solfegeAvailable: boolean`).
- Added `solfegeAvailableForCurrentLayout = isSplit ? solfegeSplitAvailable : solfegeInlineAvailable` — the current layout determines which gate applies.
- `handleNotationChange`'s Solfège guard now checks `!solfegeAvailableForCurrentLayout` and shows a "coming soon" toast (no approval wording).
- `handleLayoutChange` gained a guard at the top: switching to Inline while Solfège is active and inline is unavailable is blocked with a toast, closing the second path into inline-solfège (previously `solfege-split → Inline` landed silently on `'solfege'`).
- The Solfège notation button and the Inline layout button are both now `disabled` + grayed (`opacity-40 cursor-not-allowed`) when their respective gate is closed; the Inline button also has `title="Inline Solfège coming soon"`.
- `SingingView.tsx` passes `solfegeInlineAvailable={false}` (with an explanatory comment) and `solfegeSplitAvailable={!!(solfegeJpgUrl || activeSolfegePages.length > 0)}` to `GearPopover`.

**Task 2 — NotationRenderer distinct inline-Solfège message:**
- The `viewArea` if/else-if chain now has a dedicated `viewMode === 'solfege'` branch rendering "Inline Solfège is coming soon" with a short explanatory paragraph, respecting chromeless padding. This only fires for a stale `localStorage` `viewMode:'solfege'` value from before this change — the gear toggle now prevents new inline-solfège selections.
- The existing scanned-JPG Solfège branch condition was narrowed from `viewMode === 'solfege' || viewMode === 'solfege-split'` to `viewMode === 'solfege-split'` only; its body (mainImageBlock, thumbnailStrip, stanzaBlock, `isSplit` layout split, 50% desktop cap) is unchanged.
- `activePages`, `isSolfegeMode`, `isSplitMode` helpers and the Staff/lyrics branches were left untouched per plan constraint — they still reference `'solfege' || 'solfege-split'` internally by design (used by other logic, e.g. `usesSolfege` deriving unrelated behaviour, and `activePages` used inside the split-leaf branch body itself).

## Deviations from Plan

### Auto-fixed Issues (requested by orchestrator, not part of original plan-checker blockers)

**1. [Rule 2 — plan-checker warning 1] GearPopover.handleMainMusicNotes stale-localStorage third entry path**
- **Found during:** Task 1
- **Issue:** `handleMainMusicNotes` reads raw `localStorage.getItem('psalter-score-mode')` and could silently restore `viewMode: 'solfege'` (inline) without going through either gated button — a third, ungated entry path into the disabled inline state.
- **Fix:** Added a guard: `if (stored === 'solfege' && !solfegeInlineAvailable) { onViewModeChange('staff') }` else restore as before.
- **Files modified:** `src/components/singing/GearPopover.tsx`
- **Commit:** 563ec63

**2. [Rule 1 — plan-checker warning 2] Misleading toast wording when already on Split-Leaf**
- **Found during:** Task 1
- **Issue:** `handleNotationChange`'s toast always said "switch to Split-Leaf to view the scanned Solfège" — misleading when the user is already on Split-Leaf and the tune simply has no JPG.
- **Fix:** Branched the toast description on `isSplit`: already-on-split-leaf case now reads "Solfège isn't available for this tune"; the inline case keeps the original "switch to Split-Leaf" wording.
- **Files modified:** `src/components/singing/GearPopover.tsx`
- **Commit:** 563ec63

### Verification note (not a code deviation)

The plan's Task 2 automated verify includes a negative grep `! grep -q "viewMode === 'solfege' || viewMode === 'solfege-split'"`. This string still exists twice in the file — in the untouched `activePages` helper (line 200) and `isSolfegeMode` helper (line 209) — which the plan's own `<action>` explicitly says NOT to touch ("Do NOT touch: the `activePages` / `isSolfegeMode` / `isSplitMode` helpers"). The literal branch-condition change was verified directly instead: `} else if (viewMode === 'solfege') {` now exists as its own branch (line 1164) and `} else if (viewMode === 'solfege-split') {` follows it (line 1178) — the old combined condition `} else if (viewMode === 'solfege' || viewMode === 'solfege-split') {` no longer exists as a branch guard. This is a plan-verify-script false positive, not a missed task.

None of the actual `<done>` criteria are affected — both tasks' `<done>` criteria are met.

## Verification

- `grep` gates for Task 1: all pass (`solfegeInlineAvailable`, `solfegeSplitAvailable`, `solfegeAvailableForCurrentLayout` present in GearPopover; `solfegeInlineAvailable={false}` present in SingingView; old `solfegeAvailable=` prop absent from SingingView).
- `grep` gates for Task 2: branch conditions and "coming soon" message text confirmed present via targeted `} else if (viewMode === 'solfege') {` / `} else if (viewMode === 'solfege-split') {` checks (see verification note above for the one overly-broad negative check).
- `npx tsc --noEmit -p .` — no errors in `GearPopover.tsx`, `SingingView.tsx`, or `NotationRenderer.tsx`. Remaining tsc errors are all pre-existing, unrelated `tests/*.spec.ts` / `tests/e2e/*.spec.ts` failures (Playwright type/module issues), out of scope per plan.
- Manual/live verification is DEFERRED per orchestrator instruction — a production rebuild is batched after this and one more pending quick-fix task. Live check steps are documented in the plan's `<verification>` section (gear popover Inline/Split-Leaf gating on `/psalms/78`, stale-localStorage coming-soon message).

## Known Stubs

None — this plan intentionally introduces a "coming soon" placeholder message (not a stub in the negative sense) as its explicit purpose: inline Solfège rendering does not exist yet and is documented as permanently disabled until real abcjs tonic sol-fa support is built.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. This plan is purely UI-gating logic within existing client components.

## Self-Check: PASSED

- FOUND: src/components/singing/GearPopover.tsx (solfegeInlineAvailable, solfegeSplitAvailable, solfegeAvailableForCurrentLayout, inlineLayoutDisabled all present)
- FOUND: src/components/singing/SingingView.tsx (solfegeInlineAvailable={false}, solfegeSplitAvailable={...} present)
- FOUND: src/components/notation/NotationRenderer.tsx (`viewMode === 'solfege'` coming-soon branch and `viewMode === 'solfege-split'` JPG branch present)
- FOUND commit 563ec63 (Task 1)
- FOUND commit d5b56a8 (Task 2)
