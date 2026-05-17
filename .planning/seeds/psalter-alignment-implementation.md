---
title: Psalter alignment implementation — data model + parser + algorithm
trigger_condition: Phase 4.9.5 knowledge doc (.planning/research/scottish-psalter-structure.md) is complete and reviewed
planted_date: 2026-05-17
---

# Psalter Alignment Implementation

## Trigger

Once Phase 4.9.5 has produced the canonical `.planning/research/scottish-psalter-structure.md` reference (meter taxonomy, tune anatomy, stanza-vs-verse model, syllabification + line-break principles), this seed becomes ready to plan.

## Scope (anticipated)

Three intertwined pieces of work:

1. **Lyrics data model redesign** — move from "single multi-line blob with inline verse numbers" to a structured representation. Likely shape:
   ```
   Stanza[] {
     index,
     lines: Line[] {
       text,
       syllables: Syllable[],
       bibleVerseRef  // a line / stanza can span 1–N Bible verses
     }
   }
   ```
   Exact shape to be confirmed against the 4.9.5 doc.

2. **Parser for current Airtable blob** — convert existing lyrics-with-embedded-verse-numbers into the new structured form for all psalms. Handle the cases the 4.9.5 doc enumerates (verses split across lines/stanzas, etc.).

3. **Alignment + line-break algorithm** for the staff view:
   - Syllable ↔ note mapping (including slurs/melismas, anacrusis, skipping amen endings)
   - Visual line breaks for staff notation per meter family
   - **Correct handling of DCM tunes against two CM stanzas** (current breakage)
   - **Correct handling of alternate meters** (current breakage)

## Bugs this must fix

- DCM tunes render with wrong lyric alignment and wrong visual line breaks
- Amen endings sometimes consume a lyric syllable
- Alternate-meter psalms misalign

## Dependencies

- Phase 4.9.5 doc complete
- `tonic-solfa-notation.md` reference (already exists) for the solfège side of rendering
