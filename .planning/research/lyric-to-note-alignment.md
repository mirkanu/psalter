# Lyric-to-Note Alignment — Canonical Reference

**Created:** 2026-05-30
**Status:** Canonical — supersedes earlier dot-pair-based melisma detection theory documented in `scottish-psalter-structure.md` (2026-05-28).
**Verified ground truth:** Dieuwe de Boer's Crimond rendering at [metricalpsalter.com](https://metricalpsalter.com/), confirmed by sing-test 2026-05-30 against Eleanor Gow's published arrangement.

> **Reading order:** This doc is the **single source of truth** for how syllables map to notes. The other research docs (`tonic-solfa-notation.md`, `scottish-psalter-structure.md`, `tune-digitisation-research.md`) defer to this doc on melisma and alignment matters.

---

## 1. What is a melisma?

A **melisma** is when one syllable of text is sung across **multiple consecutive notes**. The vowel sound sustains while the pitch changes (or stays the same).

Example from Crimond phrase 1: the syllable "my" is sung across a dotted-eighth Bb followed by a sixteenth G — one held vowel, two notes.

### Text-setting taxonomy (formal)

| Style | Definition |
|---|---|
| **Syllabic** | One syllable per note. The default in Scottish psalmody. |
| **Neumatic** | One syllable across 2–4 notes (intermediate; some sources lump into "melismatic"). |
| **Melismatic** | One syllable across many notes (often 5+). |

In Scottish Psalter practice and in this codebase, **"melisma"** is used loosely to mean **any non-syllabic setting** — one syllable across 2+ notes. This doc uses the loose sense throughout unless explicitly noted.

---

## 2. "Passing note" — two senses, distinguish carefully

The phrase "passing note" appears in our reference materials in two distinct music-theory senses. They are NOT the same:

| Sense | Domain | Meaning |
|---|---|---|
| **Sense 1 — harmonic** | Voice-leading | A non-chord tone that connects two chord tones by stepwise motion. Chromatic auxiliaries like `de` (D♯) between `d` and `r` are "passing notes" in this sense. |
| **Sense 2 — Curwen / tonic sol-fa pedagogy** | Text-setting | A note **without its own text syllable** — sung as a continuation of the previous syllable's vowel. Functionally identical to "melisma continuation". Curwen-tradition pedagogy marks these with an **underline** below the note. |

**Our codebase** uses `passing: true` (e.g. `getPassingPositions` in `src/lib/solfege-parser.ts`) in **Sense 2** — melisma continuation. This is text-setting, not harmonic analysis. A future refactor should rename the flag to `melismaContinuation` for clarity; until then, be aware of the overloaded term.

`tonic-solfa-notation.md` line 70 uses "passing note" in Sense 1 (for `de`, `re`, `le` as chromatic auxiliaries). Line 146 of the same doc uses it in Sense 2 (for underlines). This is a historical inheritance from Curwen pedagogy; nothing is wrong with the source — it just needs disambiguation.

---

## 3. Canonical melisma markers — cross-format mapping

The SAME musical concept appears in different forms across the notations we work with:

| Format | Melisma marker | Detection |
|---|---|---|
| **Staff notation** (visual) | **Slur** — curved line above/below the notes of the melisma | Visually inspect score |
| **MusicXML** | `<slur type="start"/>` on the first note of the melisma, `<slur type="stop"/>` on the last note | Parse XML |
| **Solfège (Curwen / tonic sol-fa)** | **Underline** beneath the second (and any subsequent) notes of the melisma | OCR must preserve the underline |
| **ABC notation** | `_` token in the `w:` (lyric) line, one per continuation note | Emitted by the alignment algorithm |
| **Held notes** (any format) | A note whose duration spans multiple beats inherently extends its syllable. See §4. | Read the note duration |

**All four explicit markers represent the SAME thing.** Lose any one of them in transcription, and you lose the ability to render the alignment correctly. This is exactly what happened in our solfège OCR pipeline: the OCR prompt was instructed to discard underlines (see Errata in `tonic-solfa-notation.md` and `src/lib/ocr-solfege-v2.ts:70`).

---

## 4. Two melisma mechanisms — explicit and implicit

Scottish Psalter tunes encode melismas through **two distinct mechanisms** that coexist:

### Mechanism 1 — Explicit (slur / underline)

Multiple **discrete notes** are tied to one syllable via a slur (staff notation) or underline (solfège). Each note has its own attack; only the first carries the syllable.

Example: Crimond phrase 1, "my" = b g (two discrete eighth-note attacks under a slur, one syllable).

### Mechanism 2 — Implicit (held note duration)

A **single long-duration note** holds the syllable across multiple beat positions. There is one attack; the vowel sustains.

Example: Crimond phrase 1, "Lord's" = a4 (one half-note attack covering 2 beats; one syllable).

In solfège notation: `d :—` (d held for 2 beats) is mechanism 2. In ABC: a half note `a4` is mechanism 2.

**Both are melismas in the broad sense.** Mechanism 2 doesn't need a `w:` `_` token in ABC because it's already one note. The `_` token is only needed for mechanism 1, where multiple discrete notes share a syllable.

---

## 5. Beam vs Slur vs Tie — visually similar, musically distinct

These three marks all involve curved or joined lines on the staff. They mean different things:

| Mark | Visual | Meaning | Syllable impact |
|---|---|---|---|
| **Beam** | **Horizontal bar** joining the stems of 2+ short notes (eighth, sixteenth) | Rhythmic grouping — these notes belong to the same beat group | **NO** — pure rhythm; each note still gets its own syllable unless additionally slurred |
| **Slur** | **Curved line** above/below 2+ notes of DIFFERENT pitches | Melisma (vocal) / legato (instrumental) | **YES** — one syllable across the slur span |
| **Tie** | **Curved line** above/below 2 notes of the SAME pitch | Sustain — sing as one longer note | **YES** — one syllable across the tie |

**Critical:** In Crimond phrase 1, "my" is written as a beamed pair WITH a slur. The beam is rhythmic; the slur is the melisma marker. Without the slur, the beamed pair would simply be two short notes carrying two syllables.

A common source of confusion: a beamed pair without a slur looks similar to a beamed pair with a slur if the slur is rendered faintly. Always look for the curved line above/below the noteheads, distinct from the straight beam at the stems.

---

## 6. Slur → syllable assignment algorithm

Reference implementation: Dieuwe de Boer's [scottishmetricalpsalter](https://github.com/dieuwedeboer/scottishmetricalpsalter), `src/lyrics.ts:92-101`:

```typescript
// Walk voice entries (notes) and lyric syllables in parallel.
for each syllable in lyrics:
  if currentNote starts a slur:
    assign syllable to currentNote
    advance to note AFTER the slur-stop  // skip the melisma continuation(s)
  else:
    assign syllable to currentNote
    advance to next note
```

**Plain English:**
1. Walk through the notes left to right
2. For each syllable in the lyric, in order:
   - If the current note is the **start** of a slur: assign the syllable to that note, then **skip** every note covered by the slur (those are the melisma continuations)
   - Otherwise: assign the syllable to the current note, advance by one note

The same rule works for solfège-with-underlines: replace "starts a slur" with "is followed by an underlined note(s)" and skip the underlined continuations.

**This algorithm requires that the source data preserve the slur/underline marker.** If markers are missing (as in our current solfège pipeline), the algorithm cannot run; the system must either re-acquire the source data or fall back to heuristics with known fragility.

---

## 7. Verified ground-truth reference set

| Source | Coverage | Format | Verification | Confidence |
|---|---|---|---|---|
| **Dieuwe de Boer MusicXML** ([repo](https://github.com/dieuwedeboer/scottishmetricalpsalter/tree/master/docs/tunes)) | 7 tunes: **Crimond, Felix, Spohr, Richmond, Tallis** (CM); **Old100th, Tallis' Canon** (LM) | MusicXML with explicit `<slur>` markup | Crimond + Psalm 23 sing-tested against Eleanor Gow's published arrangement 2026-05-30 — exact match | **Canonical** (per-tune verification pending for the other 6) |
| **Eleanor Gow's Crimond arrangement** (3/4 Scottish Psalter 1650 setting) | 1 tune (Crimond) | Published visual score | User confirmation 2026-05-30: "I have sung it and it's perfect" | **Canonical for Crimond** |
| **Hymnary.org MusicXML** ([fetch endpoint](https://hymnary.org/media/fetch/{id})) | ~50 of our CM tunes (fetch IDs in `src/lib/hymnary-lookup.ts`) | MusicXML — **slur quality VARIES per tune** | Audited 2026-05-30: Crimond (id 132196) = slurs but no lyrics; Dundee (id 99321) = slurs + lyrics + syllabic markup; Bangor (id 98966) = same as Dundee | **Mixed** — verify per use |
| **iOS Scottish Psalter app** | TBD | Screenshots | User to provide representative samples | **Pending** |
| **Sing Psalms Music PDF** (Free Church of Scotland, [praise-resources](https://freechurch.org/praise-resources/)) | All Sing Psalms tunes | Printed PDF with aligned lyrics | Not yet sing-tested | **Pending audit** |

### Tunes NOT yet verified

Verification gaps exist for ~45 CM tunes (Dundee, Bangor, Wiltshire, Martyrdom, St. Anne, Coleshill, Dunfermline, etc.). Each must be either:
1. Sourced from Hymnary AND have slurs present in the MusicXML, OR
2. Sing-tested against a verified printed score, OR
3. Manually annotated from a verified score.

Until verified, alignments for these tunes carry the same heuristic-based uncertainty as before.

---

## 8. Worked example — Psalm 23 + Crimond (CM, F major)

**Lyric (stanza 1, line 1):** "The Lord's my shepherd, I'll not want;"
**Syllable count:** 8 (CM phrase 1 expects 8)

**De Boer's Crimond phrase 1 has 10 notes, with 2 explicit melismas:**

| # | Note (ABC-ish) | Syllable | Mechanism |
|---|---|---|---|
| 1 | c (quarter) | The | syllabic |
| 2 | a (half) | Lord's | implicit melisma (long note) — §4 mechanism 2 |
| 3 | b♭ (dotted-eighth) | my | start of slur — §4 mechanism 1 |
| 4 | g (sixteenth) | — (continuation) | inside slur (`_` in w-line) |
| 5 | c' (quarter) | shep | syllabic |
| 6 | b♭ (dotted-eighth) | herd, | start of slur — §4 mechanism 1 |
| 7 | g (sixteenth) | — (continuation) | inside slur (`_` in w-line) |
| 8 | f (quarter) | I'll | syllabic |
| 9 | e (half) | not | implicit melisma (long note) |
| 10 | f (quarter) | want; | syllabic |

**w-line (abcjs format):**
```
w: The Lord's my _ shep herd, _ I'll not want;
```

**Stored ABC body (phrase 1, with corrected PHRASE_BREAK at note 10):**
```
c2 a4 b g | c'4 b g f4 e2 f4
```

Currently our DB stores phrase 1 ending at note 8 (after `f4`), which truncates the second melisma. The correct PHRASE_BREAK position is after note 10 (`f4` end of measure 3).

---

## 9. Implications for our codebase

1. **The OCR pipeline currently discards melisma data** (`src/lib/ocr-solfege-v2.ts:70` tells the Vision model to ignore underlines). Long-term fix: update the prompt to preserve underlines as e.g. `_` suffix on the affected note; re-run OCR.

2. **The current `getPassingPositions` heuristic in `src/lib/solfege-parser.ts`** detects dot-pairs (rhythm) and treats them as melismas. This is musically wrong — `.` is rhythm-only — but was the best available proxy given the OCR data loss. It produces correct results only by coincidence (when rhythm and melisma happen to align).

3. **The `padWLineToNoteCount` middle-dot fallback in `src/components/notation/NotationRenderer.tsx`** is a separate concern (rendering pad token) and is unaffected by this doc.

4. **The MusicXML-via-Hymnary pipeline** (already partly built, see `src/lib/hymnary-lookup.ts`) is the more reliable forward path for tunes whose Hymnary MusicXML preserves slurs. The de Boer algorithm in §6 ports directly.

5. **The codebase's `passing: true` flag** should be renamed to `melismaContinuation: true` in a future refactor. Until then, treat `passing` as Curwen-pedagogy sense (sense 2 in §2), not harmonic-passing-note (sense 1).

---

## 10. Errata history

- **2026-05-30** — Initial creation. Supersedes the dot-pair-based melisma theory in `scottish-psalter-structure.md` §"Extended final phrases" (2026-05-28), which was based on the (incorrect) assumption that the solfège `.` dot marks melisma. The dot is rhythm-only; the underline marks melisma.

---

## Cross-references

- `tonic-solfa-notation.md` — solfège syntax (with corrected line 146 directing underline preservation, not erasure)
- `scottish-psalter-structure.md` — metrical structure (with corrected §"Extended final phrases" referring here for canonical melisma theory)
- `tune-digitisation-research.md` — source-of-truth catalog (Hymnary/de Boer/iOS/Sing Psalms)
- `src/lib/abc-melisma.ts` — current implementation (heuristic — pending replacement per §9.1)
- `src/lib/solfege-parser.ts` — `getPassingPositions` (heuristic — pending replacement)
- `src/lib/ocr-solfege-v2.ts` — OCR prompt (pending fix per §9.1)
