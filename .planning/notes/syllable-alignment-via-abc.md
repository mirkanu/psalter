---
title: Syllable alignment via ABC w: field
date: 2026-05-13
context: Phase 4.9.2 exploration
---

# Syllable Alignment Decision

## Finding

abcjs (and the ABC notation standard) handles syllable-to-note alignment declaratively via the `w:` (lyric) field. The library automatically parses and aligns syllables during client-side rendering — no manual computation needed.

**Alignment is purely positional (ordinal), not proportional or duration-based.** The Nth syllable token in the `w:` field lands under the Nth singable note, regardless of that note's duration (minim, crotchet, quaver — all consume exactly one syllable slot). This is why CM tunes are interchangeable: the 8.6.8.6 *note-count* invariant holds across all of them even though no two share the same rhythm.

Control symbols in `w:` field:
- `-` (hyphen — splits a word across consecutive notes: `shep-herd`)
- `_` (underscore — melisma: hold previous syllable across one more note)
- `*` (asterisk — skip note: note gets no syllable, rendered silently)
- `~` (tilde — word join: connect two tokens as one word)
- `|` (pipe — barline resync: advance the lyric pointer to the next barline, correcting any off-by-one drift within the preceding measure)

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
