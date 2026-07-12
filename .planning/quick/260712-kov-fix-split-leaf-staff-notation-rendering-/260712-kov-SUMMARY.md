---
phase: quick-260712-kov
plan: 01
subsystem: notation
tags: [abcjs, split-leaf, staff-notation, singing-view]
requires: []
provides:
  - split-leaf-staff-diff diagnostic (tests/diagnostics/split-leaf-staff-diff.mjs)
affects:
  - src/components/notation/NotationRenderer.tsx (staffWidthFactor derivation)
tech-stack:
  added: []
  patterns:
    - Playwright-daemon diagnostic scripts (job-per-mode, reused persistent page, <30s per job)
key-files:
  created:
    - tests/diagnostics/split-leaf-staff-diff.mjs
  modified:
    - src/components/notation/NotationRenderer.tsx
decisions:
  - "Root cause is SIZING (B), not structural (A): staff-system count (4) and notehead count (34) matched exactly between inline Staff and Split-leaf Staff in the diagnostic — the bug is that split-leaf's viewBox aspect ratio diverges sharply from inline's (mobile width ratio ~0.49 vs desktop's ~0.90), because the chromeless staffWidthFactor narrowing (0.55/0.85) was tuned assuming abcjs's lyric-driven note-spacing expansion, which never happens in split-leaf (it has no w: lines)."
  - "Fix: staffWidthFactor uses factor=1 (uncompressed) specifically when chromeless AND split-leaf, leaving inline Staff/Solfège and split-leaf Solfège (JPG) untouched."
metrics:
  duration: ~55 min
  completed: 2026-07-12
---

# Quick Task 260712-kov: Fix Split-leaf Staff Notation Rendering — Summary

Diagnosed and fixed the split-leaf Staff notation rendering bug reported in Phase
04.9.14 UAT ("Split leaf Staff: the staff notation doesn't render correctly —
should be identical to inline rendering except no inline lyrics") by disabling
an unnecessary staffwidth-compression factor that only inline Staff was
accidentally compensating for via lyric-driven note-spacing expansion.

## What was built

1. **`tests/diagnostics/split-leaf-staff-diff.mjs`** — a reusable Playwright-daemon
   diagnostic that loads Psalm 23 (Crimond) at mobile (375×667) and desktop
   (1200×900) viewports, switches between Staff+Inline and Staff+Split-Leaf via
   the Gear popover, and captures per-mode staff-system count (`.abcjs-staff-wrapper`),
   notehead count (`.abcjs-note`), lyric-element count (`.abcjs-lyric`), SVG
   `viewBox`, and rendered client size, plus a screenshot to
   `tests/diagnostics/out/` (gitignored via the existing `out/` rule). Each
   daemon job is kept under the daemon's hard 30s job timeout by splitting work
   into one job per (viewport × mode) and reusing the daemon's persistent
   `page` across calls (no re-navigation needed to switch modes). The script
   also suppresses the first-run onboarding tour
   (`localStorage.psalter_tour_v2 = 'done'` via `page.addInitScript`) — the
   tour's spotlight overlay was intercepting clicks on `[data-singing-gear]`
   and hanging jobs until this was added.

2. **`src/components/notation/NotationRenderer.tsx`** — split-leaf Staff
   (`viewMode === 'staff-split'`, chromeless) now computes `staffWidthFactor = 1`
   instead of the same 0.55 (mobile) / 0.85 (tablet+) narrowing factor used by
   inline Staff.

## Confirmed root cause: (B) Sizing, not (A) Structural

Running the diagnostic against the (pre-fix) production build at
`localhost:3005` gave:

```
[mobile]  inline  systems=4 notes=34 lyrics=34 vb="0 0 467.70 548.32" size=359x421
[mobile]  split   systems=4 notes=34 lyrics=0  vb="0 0 231.66 376.74" size=327x532
[desktop] inline  systems=4 notes=34 lyrics=34 vb="0 0 835.00 548.32" size=880x578
[desktop] split   systems=4 notes=34 lyrics=0  vb="0 0 750.00 376.74" size=848x426
```

Staff-system count (4) and notehead count (34) were **identical** between
inline and split-leaf at both viewports — ruling out root cause (A)
(the `unifiedAbc.split('\n').filter(...)` w:-line strip was NOT mangling music
content; it only removed lyric annotation lines, exactly as intended).

The actual bug: at mobile, split-leaf's viewBox is only ~0.49× as wide as
inline's, while at desktop it's ~0.90× — a viewport-dependent divergence in
**aspect ratio**, not just overall scale. Tracing the render pipeline
(`AbcPlayer.tsx`'s `containerWidth * staffWidthFactor / effectiveScale`
formula) and measuring actual DOM container widths via the diagnostic's
daemon session showed both modes' `scale` (1 vs `baseSize/14`, both ≈1 at
default zoom) and container widths (359px inline vs 327px split — only ~9%
apart, from the split-leaf flex wrapper's extra padding) were nearly
identical. That ~9% difference cannot explain a ~2x viewBox-width gap.

The real mechanism: SingingView always supplies `melismaPositions`, so
`buildUnifiedAbc` takes the Phase 04.9.12 melisma-positions branch, which
emits exactly one pre-fixed music line per phrase — abcjs never auto-wraps
it via `splitMusicIntoSubLines` (that path is skipped entirely in this
branch). The chromeless `staffWidthFactor` narrowing (0.55/0.85) exists
specifically to force abcjs to **wrap** long phrases into more systems by
requesting an artificially narrow staffwidth — a mechanism that has no effect
here since there's nothing left to wrap (each phrase is already one fixed
line). It just compresses note spacing.

Inline Staff (which still carries `w:` lyric lines) is saved from this
compression by an accidental side effect: `AbcPlayer.tsx`'s documented
"MOBILE-03" behaviour — abcjs widens note spacing to fit long lyric syllables
under a too-narrow `staffwidth`, i.e. abcjs **ignores** the requested width
when the content (notes + lyrics) can't fit it. Split-leaf has no lyrics to
trigger that escape hatch, so the same narrow factor produces genuinely
compressed, oddly-tall-relative-to-width notation — visually "zoomed in" with
fewer systems fitting the screen (confirmed in
`tests/diagnostics/out/mobile-split.png` vs `mobile-inline.png`).

## Fix applied

`staffWidthFactor` in `NotationRenderer.tsx` now short-circuits to `1`
(uncompressed) whenever `chromeless && isSplitMode(viewMode)` — i.e. only for
split-leaf Staff in the singing view. Chromeless inline Staff keeps its
existing 0.55/0.85 narrowing (its ≥3/≥4-system wrapping behavior in the
non-melisma-positions code path, and its lyric-driven compensation, are both
unchanged). Non-chromeless callers (`/tunes/[id]`, `/study`) were already at
`staffWidthFactor = 1` regardless of split/inline, so they're unaffected.
Inline Solfège and split-leaf Solfège (JPG-based, no abcjs) are untouched —
this prop isn't consumed by that render path.

No changes were made to how `w:` lines or `_` melisma tokens are generated,
per the binding project rule — `unifiedAbcNoLyrics`'s structural line-strip
was already confirmed correct by the diagnostic and was left as-is.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - blocking issue] Onboarding tour overlay hung diagnostic jobs**
- **Found during:** Task 1 (diagnostic development)
- **Issue:** The Playwright daemon's browser context persists across all
  jobs/sessions. On a page with no prior `psalter_tour_v2` localStorage key,
  the first-run OnboardingTour's spotlight overlay renders over
  `[data-singing-gear]`, and Playwright's actionability check on `.click()`
  waits indefinitely (hitting the daemon's hard 30s job timeout, which also
  triggers an unwanted browser relaunch).
- **Fix:** Added `page.addInitScript(() => localStorage.setItem('psalter_tour_v2', 'done'))`
  before each fresh navigation in the diagnostic script, so the tour never
  mounts in the "unseen" state.
- **Files modified:** `tests/diagnostics/split-leaf-staff-diff.mjs`
- **Commit:** 5ee384f

No other deviations — Task 2's fix matches the plan's root-cause-(B) branch
guidance (audit `staffWidthFactor`; keep inline Staff/Solfège and split-leaf
Solfège untouched), adapted to the specific mechanism the diagnostic
uncovered.

## Verification status

- `npx tsc --noEmit -p .`: **TSC_OK** — no new errors introduced by the fix
  (only pre-existing `tests/*.spec.ts` type issues remain, out of scope).
- **Live diagnostic re-verification is DEFERRED.** Per the orchestrator's
  explicit runtime note, `localhost:3005` is serving a pre-fix build (no
  `next dev`/rebuild running; the orchestrator batches one rebuild after all
  pending quick-fix tasks complete). Re-running
  `tests/diagnostics/split-leaf-staff-diff.mjs` right now would necessarily
  show the SAME pre-fix numbers above — it cannot reflect this source change
  until the batched rebuild happens.
- **Expected effect after rebuild:** split-leaf Staff's viewBox width should
  grow substantially closer to inline's at both viewports (mobile
  `231.66 → ~327` internal target width instead of the compressed value,
  i.e. no artificial narrowing), collapsing the aspect-ratio gap that made
  split-leaf look "zoomed in" with fewer systems visible per screen. Systems
  (4) and notehead (34) counts are expected to remain unchanged (already
  matching pre-fix) since this fix only touches width compression, not the
  ABC content or phrase/note structure.
- **Task 3 (`checkpoint:human-verify`) has NOT been attempted** — it requires
  a rebuilt server and is reported back to the orchestrator/user as pending,
  per instructions, alongside the other quick tasks in this batch.

## Known Stubs

None — this is a pure rendering-parameter fix; no new UI surface, no
data/stub concerns.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes.
This fix only alters a client-side layout constant consumed by an existing
render path.

## Self-Check

- `tests/diagnostics/split-leaf-staff-diff.mjs`: FOUND
- `src/components/notation/NotationRenderer.tsx`: FOUND (modified, diff present)
- Commit `5ee384f` (test): FOUND in `git log`
- Commit `6e19a28` (fix): FOUND in `git log`

## Self-Check: PASSED
