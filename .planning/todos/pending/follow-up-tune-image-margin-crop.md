---
title: Auto-crop white margins from tune score JPEGs (old-100th and others)
type: seed
created: 2026-08-11
origin: phase 13 plan 01 task 3 (human review)
status: pending
---

# Background

During Phase 13 plan 01 task 3, after the human reviewed the side-by-side compression
sample at https://psalter.gsdlabs.dev/tunes-samples/index.html, they observed that
`old-100th-staff-0.jpg` (and similar scores) include "too much background imagery"
in the margins. This is a separate quality-of-output issue from the resize+quality
compression that Phase 13 addresses.

# Why this is a separate phase, not part of 13

1. Some scores have notation **outside** the staff area (tempo markings, composer
   attributions, ornament indications). Auto-cropping risks clipping them.
2. Lyric-to-note alignment in `src/lib/abc-melisma.ts` and
   `src/lib/padWLineToNoteCount.ts` depends on image-dimension inputs. See
   `.planning/research/lyric-to-note-alignment.md` (the binding reference) — image
   dimensions feed into the alignment math that already had three debug cycles.
   Changing dimensions silently would invalidate that alignment.
3. 71 tunes have been hand-approved against the current image geometry; cropping
   would need re-validation against that same set.

# Open questions to research before scoping

- Content-bounds detection: simple threshold on near-white pixels, or smarter
  edge detection? Per-score or universal margin spec?
- Do any approved scores have annotations in the margin that must be preserved?
- Does the OCR pipeline (`ocr-solfege-v2.ts`) or ABC alignment assume a specific
  image aspect ratio or staff-position?
- Is the goal uniform margins (every score gets the same whitespace trim) or
  per-score content bounding boxes?
- How does this interact with `src/components/notation/NotationRenderer.tsx`'s
  display sizing? Currently `<img>` with `max-width:100%` so aspect ratio is
  preserved — cropping changes the aspect ratio.

# Scope of a future phase

- Detect content bounds safely (no clipping of legitimate margin notation)
- Per-score crop policy (or universal with override list)
- Update lyric-to-note alignment math if dimensions change
- Re-run the 71-tune melisma-approval regression check
- Re-stage into `public/tunes-cropped/` (separate from Phase 13's compressed dir)
- New round of human sign-off on real scores

# Links

- Origin: https://psalter.gsdlabs.dev/tunes-samples/index.html
- Phase 13 plan: .planning/phases/13-tune-image-compression/13-01-PLAN.md
- Alignment reference: .planning/research/lyric-to-note-alignment.md
- Schema: `tune_melisma_decisions` in src/db/schema.ts (lines 347-353)
