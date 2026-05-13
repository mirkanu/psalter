---
title: Syllable alignment via ABC w: field
date: 2026-05-13
context: Phase 4.9.2 exploration
---

# Syllable Alignment Decision

## Finding

abcjs (and the ABC notation standard) handles syllable-to-note alignment declaratively via the `w:` (lyric) field. The library automatically parses and aligns syllables during client-side rendering — no manual computation needed.

Control symbols in `w:` field:
- `-` (word break)
- `_` (syllable hold)
- `*` (skip note)
- `~` (word join)

## Decision

**Store raw ABC strings in database. Render on-demand. Do NOT precompute syllable splits.**

Reasons:
- ABC notation is the canonical source format
- Syllable alignment rules are standardized
- Precomputing adds maintenance burden (re-parsing on edits, storing duplicate data structures)
- Rendering performance is fast (~<50ms per tune) — on-the-fly is acceptable for web
- abcjs visual object provides full syllable-to-note data post-render if needed

## Implication for Phase 4.9.2

Task #1 (lyrics split by syllables) is not a data storage problem — it's ensuring ABC strings have properly formatted `w:` fields so abcjs renders correctly.

## Sources

- abcjs ABC Notation Documentation: https://docs.abcjs.net/overview/abc-notation
- ABC Wiki Lyric Syntax: https://abcwiki.org/abc:syntax
- Render performance characteristics confirm on-demand is standard
