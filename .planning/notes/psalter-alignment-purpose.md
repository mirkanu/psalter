---
name: Purpose of the Scottish Psalter knowledge phase (4.9.5)
description: Why we need a canonical metrical-structure doc before fixing staff lyric alignment and line breaks
type: note
date: 2026-05-17
context: /gsd-explore session leading to Phase 4.9.5
---

# Why Phase 4.9.5 exists

Phase 4.9.5 is a **pure knowledge phase**. No code changes. It produces one canonical reference doc — a sibling to `.planning/research/tonic-solfa-notation.md` — that captures how the Scottish Psalter is metrically structured, so subsequent phases can implement alignment correctly.

## The concrete problems this knowledge must unblock

Current staff-view rendering has correctness gaps that we cannot fix confidently without a shared mental model of how the psalter actually works:

1. **Inline lyric ↔ note alignment is not always correct.** We need to know how to syllabify each line and which syllable maps to which note (including slurs/melismas and pickup notes).
2. **Staff line breaks are not always correct.** We need to know where the natural breaks fall (per metrical line? per stanza?) for each meter family.
3. **Double Common Meter (DCM) is rendered wrongly** — both lyric alignment and visual line breaks. A DCM tune (8.6.8.6.8.6.8.6) is sung against two CM stanzas; we currently don't model that.
4. **Amen endings.** Most tunes have a final 2-note "amen" we probably want to skip when aligning lyrics.
5. **Stanza vs Bible-verse confusion.** Lyrics are stored as one multi-line blob with embedded verse numbers. Verse numbers are Bible-verse divisions, not stanza boundaries — a stanza can contain 1–3 verses, and a verse can split across lines or stanzas. We need formal definitions before any parsing/data-model work.
6. **Alternate meters.** The DB already records non-CM versifications and matches them to compatible tunes. But aligning lyrics + breaking lines for these meters needs explicit rules.

## Downstream goals this enables

- A follow-up implementation phase will redesign the lyrics data model (Stanza/Line/Syllable), build a parser for the current blob, and implement the alignment + line-break algorithm.
- A later UX phase will let users select which stanzas to sing — only feasible once stanza-vs-verse is properly modelled.

## Process (mirrors the solfège doc)

1. User briefs Claude conversationally on what he knows.
2. Together identify known unknowns → agreed research questions.
3. Claude researches (likely sources: 1650 Scottish Psalter prefaces, hymnology references, CPRC/Free Church material, the Airtable data itself, the printed JPG score sheets).
4. Converge on `.planning/research/scottish-psalter-structure.md`.

## Explicitly out of scope for 4.9.5

- Data model design
- Parser for the current lyrics blob
- Any code changes
- UI for stanza selection
