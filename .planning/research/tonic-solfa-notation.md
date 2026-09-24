# Tonic Sol-fa Notation — Scottish Psalter Reference

Researched 2026-05-12 from: Wikipedia, Curwen Standard Course, A Dictionary of Music & Musicians,
and direct inspection of 6 Scottish Psalter JPEG images (Abbeyville, Ballerma, Bangor, Boston,
Carlisle, Aspurg, Aurelia).

> **See also:**
> - [Lyric-to-Note Alignment](./lyric-to-note-alignment.md) — **canonical** reference for melismas, slurs, underlines, and syllable-to-note mapping. Defers from this doc on all alignment matters.
> - [Scottish Psalter Metrical Structure](./scottish-psalter-structure.md) — sibling reference covering meter taxonomy, tune anatomy, stanza-vs-verse model, syllabification, and line-break principles.

> **Errata 2026-05-30:** Earlier versions of this doc instructed transcribers to "ignore the underline visually" beneath solfège notes. This was **wrong** — the underline is the canonical solfège marker for melisma continuation (one syllable held across multiple notes). Discarding it caused systematic alignment data loss across the corpus. The underline must be **preserved** in transcription. The "Other Symbols" section below has been corrected; the OCR prompt in `src/lib/ocr-solfege-v2.ts` is pending a matching fix. See `lyric-to-note-alignment.md` §3 for the canonical theory.

> **Terminology note:** "Passing note" is used in this doc in **two distinct senses**. Where it appears next to `de`/`re`/`le` etc. it means *chromatic auxiliary tone* (a harmonic concept). Where it appears next to the underline-beneath-notes symbol it means *melisma continuation* (a text-setting concept). These are unrelated despite sharing the term. See `lyric-to-note-alignment.md` §2 for the disambiguation.

---

## Page Structure

```
   229                          ← page / tune number
ABBEYVILLE (C.M.)   W. B. BRADBURY    ← tune name, poetic meter, composer
DOH = C                              ← key (major)
LAH = D  DOH = F                     ← key (minor) — LAH is tonic; DOH is relative major
```

Poetic meters: C.M. = Common Meter (8.6.8.6), S.M. = Short Meter (6.6.8.6),
L.M. = Long Meter (8.8.8.8), and irregular patterns like 76 76 D.

---

## Voice Layout

Four voices inside a `{` curly bracket, **top to bottom = S A T B**:
```
{  Soprano  (highest)
   Alto
   Tenor
   Bass     (lowest)
```

All four lines are always aligned vertically — the same rhythmic position lines up across all voices.

---

## Pitch Syllables

### Major scale (DOH = tonic)
| Written | Name  | Scale degree |
|---------|-------|-------------|
| d       | doh   | 1 (tonic)   |
| r       | ray   | 2           |
| m       | me    | 3           |
| f       | fah   | 4           |
| s       | soh   | 5           |
| l       | lah   | 6           |
| t       | te    | 7 (leading) |

### Octave marks
| Written        | Meaning              | Example printed |
|----------------|----------------------|-----------------|
| plain `d`      | middle (normal) octave | d              |
| `d'`           | **upper** octave (superscript comma = apostrophe after) | d′ |
| `d_1`          | **lower** octave (subscript numeral printed below) | d₁ |
| `d_2`          | two octaves below (rare) | d₂ |

Subscripts are very common in alto, tenor, and bass voices.
Superscripts (apostrophe) are common in soprano and alto.

### Chromatic alterations
The vowel after the syllable changes the pitch:
- **'e'** = sharpen (raise by 1 semitone): `de re fe se le`
- **'a'** = flatten (lower by 1 semitone): `ta la ba ma ra`

| Symbol | Semitone (from tonic) | Common usage |
|--------|----------------------|--------------|
| `de`   | +1 above d           | chromatic passing tone (harmonic — see Errata) |
| `re`   | +1 above r           | chromatic passing tone (harmonic — see Errata) |
| `fe`   | +1 above f (= raised fah) | very common |
| `se`   | +1 above s (= raised soh = leading tone in minor) | harmonic minor |
| `le`   | +1 above l           | chromatic passing tone (harmonic — see Errata) |
| `ta`   | -1 below t (= flat 7th) | **most common flat; used in minor & blues** |
| `la`   | -1 below l (= flat 6th = Ab if DOH=C) | minor scales |
| `ba`   | flat 6th in minor (= la) | alternative name |
| `ma`   | -1 below m (= flat 3rd = Eb if DOH=C) | minor |
| `ra`   | -1 below r (= flat 2nd)  | rare |

Chromatics + octave: write both → `se_1`, `fe_1`, `ta_1`, `re'`

### Minor keys
`LAH = D  DOH = F` means **D minor** (LAH is the tonic; DOH is the relative major root).
- The scale is `l t d r m f/fe s/se l` in the relevant octave
- `f` = natural 6th; `fe` = raised 6th (Dorian / melodic minor ascending)
- `s` = natural 7th; `se` = raised 7th (harmonic minor leading tone)
- The subscript `₁` on bass/tenor notes still works the same way

---

## Rhythm

### Cell structure
```
| ... | = one cell (group of beats between barlines)
```
- **C time (4/4)**: each `|...|` cell = **2 beats** (a minim / half note). Two cells = one full bar.
- **3/4 time**: each `|...|` cell = **3 beats** (a dotted minim). One cell = one full bar.
- `||` = end of phrase or tune

### Beat separator
`:` separates individual beats within a cell.
- 2-beat cell: `d :m` → d on beat 1, m on beat 2
- 3-beat cell: `d :m :s` → d on beat 1, m on beat 2, s on beat 3

### Half-beat subdivisions (`.` = split a beat into two quavers)
```
d.r  :m     → d + r share beat 1 (each a quaver), m fills beat 2
d   :m.f    → d fills beat 1,  m + f share beat 2
d.r :m.f    → two quaver pairs filling a complete 2-beat cell
s.f :m.r    → same pattern (very common in subdivided runs; may or may not be melismatic — see Underline below)
```
The `.` can also combine with holds:
```
d :—.r      → d fills beat 1 (crotchet); beat 2 = hold first quaver + r second quaver
               = dotted-crotchet + quaver rhythm
—.m :f      → previous note continues for first quaver; m fills second quaver; f fills beat 2
```

### Hold symbol (`—` em dash, or `-` hyphen in some printings)
`—` = continue / prolong the preceding note for this beat position.
```
d :—          → d held for 2 beats (a minim)
d :— :—       → d held for 3 beats (a dotted minim, full bar in 3/4)
— :d          → the note from the PREVIOUS cell continues; d enters on beat 2
d :— |— :m   → d held across the barline for a total of 3 beats, then m
d :—.r        → d dotted (3 quavers), r (1 quaver)
```

**Hold and melisma:** A held note is **also an implicit melisma** in the broad sense — one syllable, multiple beat positions. This is mechanism 2 in [lyric-to-note-alignment.md §4](./lyric-to-note-alignment.md#4-two-melisma-mechanisms--explicit-and-implicit). Unlike underlined melisma continuations (which involve multiple discrete note attacks), held notes have one attack with sustained duration. Both forms coexist in Scottish Psalter tunes.

### Pickup / anacrusis
A cell before the first full barline with a single note:
`:s |d' :s |...`  — the `:s` is a pickup (one beat, the last beat of bar 0).
The colon before the first `|` is just the beat separator — there is no note before it.

### Rest
A **blank space** at a beat position. Relatively rare in psalter settings.
In some editions printed as `0` (zero).

---

## Other Symbols

| Symbol | Meaning |
|--------|---------|
| **Underline** beneath notes | **Melisma continuation marker** — the underlined note has NO text syllable of its own; it is sung as a continuation of the previous note's syllable (one vowel held across the underlined note's pitch). Curwen-tradition pedagogy calls these "passing notes" (the melismatic sense — see Errata at top of doc; NOT the same as the chromatic passing tones `de`/`re`/`le`). **MUST be preserved in transcription** — convention: append `_` to the underlined note's solfège symbol, e.g. `m f_ r_ d` for an underlined `f` and `r`. The `_` suffix marks "this note is a melisma continuation." Losing this marker is destructive; we cannot reconstruct it from rhythm alone. See [lyric-to-note-alignment.md](./lyric-to-note-alignment.md) for the canonical theory and §3 for the cross-format mapping (solfège underline ↔ staff notation slur ↔ MusicXML `<slur>` ↔ ABC w-line `_`). |
| `://` or `:||` / `|:` | Repeat sign |
| `\|\|` at end | Double barline — end of tune or section |
| **Amen** | Separate 2-chord section printed after the final `\|\|`. Each voice has 2 notes. Transcribe as-is. |
| Multi-page tunes | "continued" printed on the next page. Read pages in order. |

---

## Semitone table (reference for parser)

With DOH as tonic = semitone 0:

| Syllable | Semitones | ABC note (DOH=C) |
|----------|-----------|-----------------|
| d        | 0         | C               |
| de       | 1         | C#              |
| r        | 2         | D               |
| re       | 3         | D#              |
| m        | 4         | E               |
| f        | 5         | F               |
| fe       | 6         | F#              |
| s        | 7         | G               |
| se       | 8         | G#              |
| l        | 9         | A               |
| le       | 10        | A#/Bb           |
| ta       | 10        | Bb              |
| t        | 11        | B               |

---

## DOH → ABC key signature

| DOH | K: field | Sharps/flats |
|-----|----------|-------------|
| C   | K:C      | none        |
| G   | K:G      | 1 sharp     |
| D   | K:D      | 2 sharps    |
| A   | K:A      | 3 sharps    |
| E   | K:E      | 4 sharps    |
| B   | K:B      | 5 sharps    |
| F#  | K:F#     | 6 sharps    |
| C#  | K:C#     | 7 sharps    |
| F   | K:F      | 1 flat      |
| Bb  | K:Bb     | 2 flats     |
| Eb  | K:Eb     | 3 flats     |
| Ab  | K:Ab     | 4 flats     |
| Db  | K:Db     | 5 flats     |
| Gb  | K:Gb     | 6 flats     |

For minor keys: K:{LAH}m  (e.g. LAH=D → K:Dm)

---

## Common errors to watch for in OCR

1. **Subscript `₁`** — easy to miss or mistake for punctuation. Always marks a lower-octave note.
2. **`—` vs `-`** — em dash vs hyphen; both mean "hold". The em dash is far more common.
3. **`.` subdivisions** — may look like punctuation; they always mean "split this beat into two quavers".
4. **`se` vs `s`** — in minor keys the raised 7th (leading tone) is `se`, visually close to plain `s`.
5. **`ta` vs `t`** — `ta` (flat 7th) vs `t` (natural 7th); the 'a' suffix is small.
6. **Pickup cell** — do not treat `:s` before the first `|` as a full bar.
7. **Amen chords** — these come AFTER the final `||` and are not part of the main tune. Transcribe them but note they are separate.
