---
phase: quick
plan: 260512-qmy
subsystem: ocr-pipeline, solfege-parser
tags: [bug-fix, ocr, parser, tdd]
dependency_graph:
  requires: []
  provides: [correct-old-124th-page-order, correct-glasgow-octaves]
  affects: [src/lib/ocr-solfege-v2.ts, src/lib/solfege-parser.ts]
tech_stack:
  added: []
  patterns: [tdd-red-green, three-step-file-swap]
key_files:
  created: [tests/solfege-parser-dotted-comma.test.ts]
  modified: [src/lib/ocr-solfege-v2.ts, src/lib/solfege-parser.ts]
decisions:
  - "Image JPGs gitignored per public/tunes/.gitignore — only OCR prompt source change committed for Task 1"
  - "Test assertion corrected: in key G, r=A4='a' and m=B4='b' (not 'd'/'e') — test 2 updated to use key C for clarity"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-12"
---

# Quick Task 260512-qmy: Fix OCR Pipeline Bugs — Old 124th Page Order Swap + Glasgow Octaves Summary

**One-liner:** Swapped Old 124th solfege JPEG page order on disk and fixed dotted-comma rhythm notation causing Glasgow soprano notes to be an octave too low (A3 instead of A4).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Swap Old 124th solfege page files and improve multi-page OCR prompt | 60c8d9e | src/lib/ocr-solfege-v2.ts (+ disk swap of 2 JPGs) |
| 2 (RED) | Add failing tests for dotted-comma octave bug | bddfbd8 | tests/solfege-parser-dotted-comma.test.ts |
| 2 (GREEN) | Fix dotted-comma octave bug in parseVoiceLine | 7c03c35 | src/lib/solfege-parser.ts, tests/solfege-parser-dotted-comma.test.ts |

## What Was Fixed

### Task 1: Old 124th Page Order
The two solfege JPEG files for Old 124th were numbered in the wrong order — `solfege-0.jpg` was the continuation page and `solfege-1.jpg` was the title page. Claude Vision was reading the continuation before the first page.

- Three-step copy swap performed: `solfege-0.jpg` is now the title/first page (1145468 bytes), `solfege-1.jpg` is the continuation (1137513 bytes).
- Note: Files are gitignored by `public/tunes/.gitignore` — only the OCR prompt source change is committed.
- `TRANSCRIPTION_PROMPT` updated from `"Multi-page tunes: read all pages in order, left to right."` to explicit: `"images are provided in page order (Image 1 first, Image 2 second). Transcribe Image 1 completely — every line from top to bottom — before moving to Image 2. Never interleave or skip lines."`

### Task 2: Glasgow Dotted-Comma Octave Bug
Input `m.,r` (dotted mi then ray) was parsed incorrectly. After `split('.')`, the second subToken was `",r"`. `parseSyllable(",r")` treated the leading comma as an octave-down marker, producing D3/A3 instead of correct D4/A4.

Fix in `parseVoiceLine` (solfege-parser.ts ~line 258):
```ts
// Before:
const subTokens = slot.split('.').map(s => s.trim()).filter(Boolean)

// After:
const rawSubs = slot.split('.')
const subTokens = rawSubs.map((s, i) => {
  let tok = s.trim()
  if (i > 0 && tok.startsWith(',')) tok = tok.slice(1).trim()
  return tok
}).filter(Boolean)
```

Verification: Glasgow soprano line `:s_1 |d :— :r |m.,r:d :m |s.,l:s :f |m :— :m |r :— :f |m.,r:d :t_1 |d :—||` with DOH=G now produces `PASS: true` — no `A` (A3) in output, correct `a` (A4) present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion corrected for key G chromatic math**
- **Found during:** Task 2 GREEN phase
- **Issue:** Test 2 asserted `r` in key G = `d` (D4), but tonic G + ray(2) = A4 = `a`. The note letter `d` is B-flat in context; actual D4 = `d` only in key C. Test was musically incorrect.
- **Fix:** Rewrote test 2 to use key C where m=E4='e' and r=D4='d' — unambiguous assertions.
- **Files modified:** tests/solfege-parser-dotted-comma.test.ts
- **Commit:** 7c03c35 (amended in same GREEN commit)

## Verification Results

- `ls -la public/tunes/old-124th-solfege-*.jpg` — both files exist, sizes swapped (0=1145468, 1=1137513)
- `grep "Image 1 first, Image 2 second" src/lib/ocr-solfege-v2.ts` — match on line 72
- Glasgow verification: `PASS: true`, no `A` (A3) in note tokens
- `npx tsc --noEmit` — no TypeScript errors
- `npx vitest run tests/solfege-parser-dotted-comma.test.ts` — 2/2 tests pass

## Known Stubs

None.

## Threat Flags

None — file swap is local filesystem only, no network exposure introduced.

## Self-Check: PASSED

- src/lib/ocr-solfege-v2.ts: exists, prompt updated
- src/lib/solfege-parser.ts: exists, subToken fix applied
- tests/solfege-parser-dotted-comma.test.ts: exists, 2 tests pass
- Commits 60c8d9e, bddfbd8, 7c03c35: all present in git log
