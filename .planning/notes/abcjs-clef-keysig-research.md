---
name: abcjs clef/key-signature repetition research
description: Why we chose to shrink (not hide) the repeated clef/key-sig block on wrapped mobile staff rows
type: note
date: 2026-07-16
context: Phase 4.9.15 exploration (mobile inline staff optimization)
---

## The question

On narrow mobile viewports, the inline staff view repeats the clef + key signature at the start of every wrapped row. This eats horizontal space that could go to notes/lyrics. Original idea: display it once (e.g. as its own tiny centered top row) and omit it from subsequent rows.

## Research findings

- **abcjs has no reliable native option to fully suppress repeated clef/key signature on wrapped continuation lines.** Standard music engraving convention (which abcjs follows) deliberately redraws clef and key signature at the start of every staff system, so a reader can jump into any line without scrolling back to the top.
- A `clef.hide`-style option exists in abcjs config, but community reports (GitHub issue #437) show it's buggy when combined with `wrap: true` and a mid-tune key/clef change — subsequent systems can render the wrong/stale clef instead of correctly suppressing it. Still open as of abcjs v5.12.0.
- Cautionary key-signature suppression exists only in third-party ABC tooling (abc2svg/abcm2ps `%%keywarn 0`), not in abcjs core.
- Other notation/hymnal apps built on standard engraving norms (MuseScore, Sibelius, PDF hymnals) also leave clef+key repeated on every system — this isn't something apps commonly deviate from.
- The practical mitigation used elsewhere is shrinking staff scale / tightening margins, not omitting the glyph block. Achieving a true "hide after row 1" would require post-processing the rendered SVG to remove the clef/key glyph group on rows 2+, which is fragile and not abcjs-native.

## Decision

Chose to shrink the repeated clef/key-signature block significantly rather than hide it after the first row, to avoid the SVG post-processing fragility and stay aligned with standard engraving convention. Recorded here so this doesn't get re-litigated without cause — see Phase 4.9.15 in ROADMAP.md.
