---
phase: quick
plan: 260607-gju
subsystem: solfege-parser
tags: [bug-fix, solfege, amen-stripping, alignment]
dependency_graph:
  requires: []
  provides: [correct-totalEvents-for-CM-tunes]
  affects: [abc-melisma.ts/buildWLineFromSolfa, all ~63 tunes with Amen in soprano]
tech_stack:
  added: []
  patterns: [double-pass Amen stripping with colon guard]
key_files:
  modified:
    - src/lib/solfege-parser.ts
decisions:
  - "Used a second pass over the already-stripped string with a colon-guard (no ':' = Amen-like) and length cap (<=10) to avoid over-stripping legitimate mid-tune content"
  - "Applied fix only inside getPassingPositions — the only location with this pattern"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-07"
  tasks_completed: 2
  files_modified: 1
---

# Quick Task 260607-gju: Dunfermline / Psalm 106 Amen-Strip Fix Summary

One-liner: Double-pass Amen-strip in `solfege-parser.ts` removes both the trailing `||` and the preceding bare pitch tokens that had inflated `totalEvents` for ~63 CM tunes.

## What Was Done

### Task 1: Fix Amen double-strip in solfege-parser.ts

The soprano string for tunes like Dunfermline ends with:
```
... | d :— | — || d | d ||
                   ^Amen^
```

The original single-pass strip (`lastIndexOf('||')`) found the outermost `||` and sliced to it, leaving `d | d` (the Amen notes) in the cleaned string. This inflated `totalEvents` from 28 to 30 for CM tunes, causing `buildWLineFromSolfa` to assign 8 note slots to phrase 4 instead of 6, desynchronising lyrics from notes.

**Fix applied in `src/lib/solfege-parser.ts` (inside `getPassingPositions`):**

After removing the final `||`, a second pass checks whether the tail after the new last `||` is Amen-like — no beat-colon (`:`) and length ≤ 10 characters. If so, that tail is also stripped. The colon guard is critical: legitimate mid-tune cells always use `:` to separate beat slots; Amen notes never do.

### Task 2: Rebuild and Playwright verification

- Copied fixed file to main checkout (`/data/home/psalter/src/lib/solfege-parser.ts`)
- Ran `npm run build` — succeeded cleanly
- Restarted `pm2 restart psalter`
- Playwright verified Psalm 106 (Dunfermline): all 4 phrases render with correct lyric alignment; phrase 4 has 6 note slots as expected
- Spot-checked Psalm 23 (Crimond): renders correctly, no regression

## Deviations from Plan

### Auto-fixed Issues

None.

### Process notes

- Pre-existing TypeScript errors in `tests/e2e/abc-player.spec.ts` and `tests/tune-notation.spec.ts` existed before this change. Confirmed by reverting and re-running `tsc --noEmit`. Not introduced by this fix.
- Psalter runs via PM2 (not Docker as mentioned in plan). Used `npm run build && pm2 restart psalter` instead of Docker rebuild.

## Verification Results

1. `npx tsc --noEmit`: pre-existing test file errors only; no errors in source library — PASS
2. Playwright screenshot of `/psalms/106`: 10 SVG elements, all 4 phrases with lyrics — PASS
3. Playwright screenshot of `/psalms/23` (Crimond): 10 SVG elements, correct alignment — PASS

## Known Stubs

None.

## Threat Flags

None. The fix operates on internal OCR-generated data; no external input surface introduced.

## Self-Check: PASSED

- File `/data/home/psalter/.claude/worktrees/agent-a050bb3eb572ae357/src/lib/solfege-parser.ts` — exists with fix applied
- Commit `6d8f7dc` — verified in git log
- Screenshot `/tmp/psalm-106-fixed.png` — shows correct 4-phrase rendering
