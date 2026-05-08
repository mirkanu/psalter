---
phase: 04-notation
plan: 04
status: complete
subsystem: tune-detail-page
tags: [abcjs, notation, lyrics, responsive]
key-files:
  created:
    - src/components/AbcNotationSection.tsx
  modified:
    - src/db/queries/tunes.ts
    - src/app/tunes/[id]/page.tsx
    - src/components/AbcRenderer.tsx
metrics:
  tasks: 3
  commits: 4
---

# Plan 04-04 Summary

## Objective
Wire AbcRenderer into tune detail page with three-way fallback and verse stanza rendering.

## What Was Built

### Task 1 — fetchTuneDetail extended (commit 6f8ff12)
`src/db/queries/tunes.ts` — psalmVersion now explicitly returns `{ id, lyrics }` columns.

### Task 2 — Tune detail page wired (commit 12cefd4)
- `AbcNotationSection.tsx` created — thin 'use client' wrapper required by Next.js 16 Turbopack (ssr:false dynamic imports must live in client files)
- Three-way fallback: abcNotation → scoreJpgUrl → "Score image not yet available."
- Verse stanzas: for ABC tunes shows verses 2+ (verse 1 is under the staff); for non-ABC tunes shows all verses from 1

### Task 3 — Human verification (approved)
- /tunes/49 (French, CM): SVG notation renders with verse 1 under staff, verses 2+ below
- /tunes/1 (Lancaster): "Score image not yet available." correct; no Verses section (no linked psalmVersions)
- Responsive layout confirmed on production server

## Deviations
1. **AbcNotationSection.tsx** — Next.js 16 Turbopack requires ssr:false dynamic() calls in client files. RSC page imports this wrapper instead of calling dynamic() directly.
2. **abcjs CJS interop fix** (commit 778c2e4) — `import * as abcjsModule from 'abcjs'` with `.default ?? module` fallback for Turbopack bundler compatibility.
3. **Verse display fix** (commit 7d96b88) — stanzas slice logic conditioned on abcNotation presence so verse 1 is visible for non-ABC tunes.

## Self-Check: PASSED
- `next build` exits 0
- `npx vitest run` — 51/52 pass (1 pre-existing fail: TUNE-01 score_jpg_url, Phase 1 disk debt)
- `npx tsc --noEmit` exits 0
- Human verification approved
