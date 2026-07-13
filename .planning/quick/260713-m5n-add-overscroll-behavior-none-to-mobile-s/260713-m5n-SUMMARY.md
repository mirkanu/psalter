---
phase: quick-260713-m5n
plan: 01
subsystem: ui
tags: [css, tailwind, overscroll, scroll, ios, notation-renderer]
requires:
  - phase: quick-260713-lf9
    provides: "iOS scroll-hide JS clamp (scrollTop → [0, scrollHeight-clientHeight]) + 4px delta threshold in SingingView.tsx"
  - phase: quick-260713-kkg
    provides: "asymmetric split-leaf sizing (notation flex-none capped 50%, lyrics flex-1)"
provides:
  - "overscroll-behavior-y: none on every mobile-flickable scroll region in the singing view — iOS Safari no longer generates rubber-band overshoot/snap-back scrollTop oscillation on a hard flick"
affects: [singing-view, notation-renderer, mobile-chrome]
tech-stack:
  added: []
  patterns: ["Tailwind core utility overscroll-y-none for disabling native iOS bounce physics"]
key-files:
  created: []
  modified:
    - src/components/notation/NotationRenderer.tsx
decisions:
  - "Used overscroll-y-none (hard stop) not overscroll-y-contain — the bug is the element's OWN bounce oscillating, not scroll chaining to a parent, so `none` is the correct fix per MDN research cited in the plan"
  - "Applied unconditionally (no md: gate) — overscroll-behavior is a no-op for non-elastic desktop pointer scrolling, so gating would add complexity for zero benefit"
metrics:
  duration: 10 min
  completed: 2026-07-13
---

# Quick Task 260713-m5n: Add overscroll-behavior-none to mobile singing-view scroll regions Summary

Added Tailwind's `overscroll-y-none` utility (compiles to `overscroll-behavior-y: none`) to
all six flickable scroll containers in `NotationRenderer.tsx`'s chromeless singing-view render
path, disabling iOS Safari's native rubber-band bounce at the source rather than filtering its
downstream scroll events in JS.

## What Was Done

Quick task 260713-lf9 added a JS clamp (`scrollTop` → `[0, scrollHeight-clientHeight]`) plus a
4px delta threshold to the scroll-hide handler in `SingingView.tsx`, which fixed GENTLE flicks.
Real-device testing confirmed a HARD flick still flickered the scroll-hide bars: the hard
flick's rubber-band overshoot produces large intermediate `scrollTop` deltas that pass the 4px
filter and read as genuine direction reversals.

This task applies the standards-based fix instead: `overscroll-behavior-y: none` disables the
scroll container's native elastic bounce entirely (a firm stop at the boundary), so iOS never
generates the erratic intermediate `scrollTop` values regardless of flick force — eliminating
the flicker at its source.

### Task 1 (completed, committed)

Added `overscroll-y-none` to all six scroll containers in
`src/components/notation/NotationRenderer.tsx`:

1. `lyricsBelow` (Show Original mode, staff non-split)
2. Staff split-leaf NOTATION slot
3. Staff split-leaf LYRICS slot
4. Staff split stanzaBlock (StanzaList wrapper)
5. Solfège stanzaBlock ternary — all three `overflow-y-auto` string branches (the `chromeless ? ''` empty branch has no scroll, left untouched)
6. Outer `data-notation-viewarea` (both `isSplit` true/false branches inside `cn()`)

Purely additive CSS — no existing class token was removed, reordered, or altered. No changes
to `src/components/singing/SingingView.tsx`; the 260713-lf9 JS clamp + 4px threshold remains
in place as defense-in-depth for engines without `overscroll-behavior` support.

### Task 2 (checkpoint:human-verify — NOT executed by this agent)

This is a `checkpoint:human-verify` gate requiring a real iOS device. Desktop Chromium
(including the shared Playwright daemon) cannot reproduce true iOS Safari elastic/touch
overscroll physics, so the outcome ("hard flick no longer flickers the bars") cannot be
verified in this environment — exactly as with 260713-lf9's JS fix. The orchestrator will
rebuild/deploy and hand off to the user for real-device confirmation.

## Verification Performed (code-level only)

- `grep -o "overscroll-y-none" NotationRenderer.tsx | wc -l` → 9 occurrences (>=6 required;
  the solfège ternary contributes 3, the outer viewarea contributes 2 on one line so
  `grep -c` line-count reports 7 but `-o` occurrence-count confirms 9)
- No `overscroll-behavior` arbitrary-value property present — core Tailwind utility only
- `git diff --stat src/components/singing/SingingView.tsx` → empty (untouched)
- `npx tsc --noEmit -p .` → no errors attributed to `NotationRenderer.tsx`
- Full diff reviewed — purely additive, exactly matches the plan's six specified edit locations byte-for-byte

## Deviations from Plan

None — plan executed exactly as written.

## Commits

- `7fc0aeb` — fix(quick-260713-m5n): add overscroll-y-none to singing-view scroll containers

## Outcome Verification Status

**NOT YET CONFIRMED.** The actual bounce-elimination outcome requires a human to hard-flick to
both scroll boundaries (top and bottom) on a real iOS device in mobile Safari, across staff
split-leaf, solfège split-leaf, and lyrics-only modes, and confirm:
- A firm stop at the boundary (no elastic rubber-band)
- No scroll-hide top/bottom/mini bar flicker during the hard flick
- Gentle scrolling still feels responsive, no added lag
- Desktop mouse-wheel scrolling unaffected

Trade-off accepted per plan: losing the tactile edge-bounce on these regions is the intended
new behaviour, not a regression.

## Self-Check: PASSED

- FOUND: src/components/notation/NotationRenderer.tsx (modified, 9 occurrences of overscroll-y-none confirmed via grep)
- FOUND: commit 7fc0aeb in git log
