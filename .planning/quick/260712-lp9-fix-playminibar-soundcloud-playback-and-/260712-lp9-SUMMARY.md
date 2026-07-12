---
phase: quick-260712-lp9
plan: 01
subsystem: singing-view
tags: [play-mini-bar, soundcloud, iframe-sandbox, fixed-positioning, desktop-layout]
requires: []
provides:
  - "SoundCloud iframe sandbox restored to allow-scripts allow-same-origin"
  - "Desktop PlayMiniBar right edge aligned to GlassBottomBar content column"
affects:
  - src/components/singing/PlayMiniBar.tsx
tech-stack:
  added: []
  patterns:
    - "Tailwind arbitrary-value calc() with underscore-escaped whitespace for CSS calc() operators"
key-files:
  created: []
  modified:
    - src/components/singing/PlayMiniBar.tsx
decisions:
  - "allow-same-origin restored on SoundCloud iframe sandbox as a documented, knowing exception (cross-origin embed — grants SoundCloud's own origin, not ours)"
  - "Desktop md:right-4 replaced with calc(max(0px,(100vw - 56rem)/2) + 0.5rem) to align with GlassBottomBar's max-w-4xl column; mobile unprefixed classes and the unrelated isFixed variant left untouched"
metrics:
  duration: "~20 min"
  completed: 2026-07-12
---

# Quick Task 260712-lp9: Fix PlayMiniBar SoundCloud playback and desktop positioning Summary

Restored `allow-same-origin` on the SoundCloud iframe sandbox (fixing a WR-03 regression that killed playback) and replaced the desktop `md:right-4` viewport-pinned offset with a calc() that aligns the mini-bar's right edge to the GlassBottomBar content column, directly above the Gear icon.

## What Was Built

### Task 1: Restore SoundCloud iframe sandbox (`allow-scripts allow-same-origin`)

`src/components/singing/PlayMiniBar.tsx` — the SoundCloud `<iframe>`'s `sandbox` attribute changed from `"allow-scripts"` (WR-03 fix, which broke playback) back to `"allow-scripts allow-same-origin"`. Replaced the old WR-03 comment with a rationale documenting this as a deliberate, low-risk, cross-origin exception (see code comment for full detail — `w.soundcloud.com` is cross-origin to `psalter.gsdlabs.dev`, so `allow-same-origin` grants the frame only its own origin's storage, not access to our DOM/cookies).

Commit: `d82cc9c`

### Task 2: Align desktop PlayMiniBar right edge to content column

`src/components/singing/PlayMiniBar.tsx` — the `isInline` variant's `md:right-4` (pinned 16px from the far viewport edge) replaced with:
```
md:right-[calc(max(0px,(100vw_-_56rem)/2)_+_0.5rem)]
```
This matches GlassBottomBar's centered `max-w-4xl` (56rem) column plus its `px-2` (0.5rem) inner padding, so the floating card's right edge lines up with the Gear icon instead of floating far right of it (previously measured 144px off at 1200px viewport width, 264px off at 1440px).

Only the `isInline` block's `md:right-4` token changed. The mobile unprefixed `fixed inset-x-0` layout is untouched, and the separate `isFixed` variant (tune-page floating bar, out of scope) still has its own unmodified `md:right-4`.

Commit: `12b4b26`

## Deviations from Plan

None — plan executed exactly as written for Tasks 1 and 2.

## Verification Performed

**Task 1 automated grep:** `grep -c 'sandbox="allow-scripts allow-same-origin"'` → 1 match. PASS.

**Task 2 automated grep + tsc:**
- `md:right-[calc(max(0px,(100vw_-_56rem)/2)_+_0.5rem)]` present. PASS.
- `isInline` line no longer contains `md:right-4`. PASS.
- Mobile `isInline && 'fixed inset-x-0` line still present, unchanged. PASS.
- `isFixed` block (line ~131) still contains its own separate `md:right-4` — confirmed untouched. PASS.
- `npx tsc --noEmit -p .` surfaces zero lines mentioning `PlayMiniBar`. PASS.

**eslint baseline check:** `npx eslint src/components/singing/PlayMiniBar.tsx` reports 3 pre-existing `react-hooks/set-state-in-effect` errors (lines 47, 53, 74 — unrelated `useEffect` blocks for tour/localStorage restore, not touched by this plan). Confirmed via `git stash` that these 3 errors exist identically at the Task-1-only commit (before the Task 2 edit), i.e. they predate this quick task entirely and are out of scope per the plan's verification note ("pre-existing repo errors, if any, are out of scope"). No NEW eslint errors introduced.

**Isolated SoundCloud sandbox test (Playwright daemon, run against the real `w.soundcloud.com` widget URL directly — no app rebuild needed):**

Loaded the tune URL `https://soundcloud.com/connorq/psalm-86-tune-st-anne-smv` in two side-by-side iframes on a blank page, one per sandbox value, waited 7s, then inspected each frame:

| sandbox | localStorage | body length | play button |
|---|---|---|---|
| `allow-scripts allow-same-origin` (fixed) | accessible | 9389 chars | **present** |
| `allow-scripts` (broken / WR-03 state, for contrast) | **SecurityError** | 478 chars (empty shell) | **absent** |

This reproduces the planning-time evidence table exactly and confirms Task 1's fix is effective for real SoundCloud content, independent of the running app build.

## Task 3: Pending Rebuild + Human Verification

Task 3 is a `checkpoint:human-verify` gate. Per this session's constraints, the live positioning/playback assertions against `http://localhost:3005` were **not** attempted because that instance is a production build that will not reflect the Task 1/2 source edits until rebuilt (rebuild is being batched separately across pending quick-fix tasks on this memory-constrained VPS). Running those assertions now would measure stale code and produce false signal.

What was done instead, per the given constraints:
1. **Sandbox fix** — verified in full isolation via the daemon (see table above) since it doesn't depend on the app build at all. Result: PASS, matches plan's expected evidence.
2. **Positioning fix** — not measured live against localhost:3005 (would be stale). Confirmed instead via the Task 2 automated grep that the `md:right-[calc(...)]` token is correctly in place in source.
3. **`tests/e2e/play-mini-bar.spec.ts`** — left unmodified. Persisting the live positioning assertions (per plan Task 3 instructions) requires real bounding-box measurements against a rebuilt app, which this session cannot obtain. Deferred to a follow-up once the batched rebuild lands.

**Remaining steps for Task 3 (from the plan's `<how-to-verify>`), to run after the app is rebuilt:**
1. Rebuild/restart the app so `http://localhost:3005` (or `psalter.gsdlabs.dev`) reflects these two commits.
2. Re-run the sandbox isolation test (or reuse the result above — it does not depend on rebuild) to confirm PASS.
3. Via the Playwright daemon, navigate to `/psalms/86`, click `[data-singing-play]`, and measure `[data-play-mini-bar]`, `[data-singing-gear]`, `[data-glass-bottom-bar] > div` bounding boxes at:
   - **1200x800:** assert `|playBar.right - gear.right| <= 8` (target ~1040) — was 1184 (broken).
   - **1440x900:** assert `|playBar.right - gear.right| <= 8` (target ~1160) — was 1424 (broken).
   - **375x700 (regression guard):** assert `playBar.left <= 2` and `playBar.right >= 373` (still full-width).
4. Persist those three assertions into `tests/e2e/play-mini-bar.spec.ts`, replacing any stale `right-4`/`bottom-[56px]` expectations.
5. Visually confirm on a real browser at `psalter.gsdlabs.dev/psalms/86` (or localhost:3005 after rebuild): SoundCloud mode shows a working play button and actually plays audio; desktop mini-bar sits directly above the Gear icon; mobile stays full-width with no regression.
6. Resume-signal: type "approved" once all of the above are confirmed, or describe what is off.

## TDD Gate Compliance

Not applicable — this plan is `type: quick`/execute with `type="auto"` tasks 1-2, not a plan-level TDD gate.

## Self-Check

- FOUND: `src/components/singing/PlayMiniBar.tsx` (modified, both tasks present)
- FOUND: commit `d82cc9c` (Task 1)
- FOUND: commit `12b4b26` (Task 2)

## Self-Check: PASSED
