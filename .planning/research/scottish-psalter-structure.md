# Scottish Psalter Metrical Structure — Reference

**Researched:** 2026-05-17
**Audience:** Claude at planning/execution time + future contributors
**Role:** Canonical reference for the metrical structure of the Scottish Psalter as used by CPRC. Consumed by the alignment-implementation phase to design the data model and rendering algorithm.
**Sources:** See §7. Primary triangulation: user briefing (CPRC precentor), live PostgreSQL data (148 tunes / 184 psalm versions with ABC notation, snapshotted 2026-05-17), 1650 psalter introductions, modern hymnology references.

> **See also:** [Lyric-to-Note Alignment](./lyric-to-note-alignment.md) — **canonical** reference for melismas, slurs, underlines, and the syllable-to-note mapping algorithm. This doc defers to it on all melisma/alignment matters.

> **Errata 2026-05-30:** §2 "Extended final phrases" previously documented a **dot-pair-based melisma detection theory** (claiming `f.,r` → the `r` is a passing note) and a duration-heuristic fallback. **Both are wrong as a theory of the notation.** The solfège `.` is a half-beat rhythm subdivision, NOT a melisma marker. The canonical melisma marker in solfège is the **underline beneath the note**; in staff notation it is the **slur**. Our pipeline lost the underline during OCR (the prompt explicitly discarded it), so the dot-pair heuristic was adopted as a workaround — but it produces correct results only when rhythm coincides with melisma, which is unreliable. The section below has been replaced with the corrected theory. See `lyric-to-note-alignment.md` §3 for the cross-format canonical mapping.

---

## 1. Meter Taxonomy

The Scottish Metrical Psalter (1650) renders all 150 psalms into a fixed set of poetic metres — short syllabic patterns that determine how lyrics align to tunes. The 1650 standardisation onto a CM-dominated palette was a deliberate accessibility choice: *"the Psalter of 1564 was a faithful translation of the original, [but] its variety of metre was too difficult for the common people"* [CPRC-1650]. Today, *"every Psalm in the Psalter has been put to common meter, with thirteen Psalms put to alternate meters as well"* [1650psalter].

**No universal tune-to-psalm pairing exists across Scottish Presbyterian congregations** — *"individualism [has] won the day with the Presbyterian Churches each having their own Psalter"* [CPRC-1650]. CPRC maintains its own curated pairings (stored as the default-tune per psalm in this app's database), separate from the printed psalter's recommended pairings (not yet ingested — see §7 Open items).

### 1a. Full Scottish-Psalter metrical tradition

| Meter | Pattern | Rhyme scheme | Example tune | Citation |
|---|---|---|---|---|
| CM (Common Meter) | 8.6.8.6 | ABAB (iambic tetrameter / trimeter) | Crimond | [Wiki-CM], [Hymnary] |
| LM | 8.8.8.8 | iambic tetrameter quatrain | Old 100th | [Wiki-Metre] |
| SM | 6.6.8.6 | mixed iambic | Stracathro | [Wiki-Metre] |
| CMD (a.k.a. DCM) | 8.6.8.6.8.6.8.6 | ABABCDCD | Petersham, Old 44th | [Wiki-CM], [Wiki-Metre] |
| LMD | 8.8.8.8.8.8.8.8 | doubled LM | — (none in this corpus) | [Wiki-Metre] |
| 76 76 D | 7.6.7.6.7.6.7.6 | — | Aurelia | [Wiki-Metre] |
| 87 87 | 8.7.8.7 | — | — | [Wiki-Metre] |
| 66 66 88 (a.k.a. HM, Hallelujah Metre) | 6.6.6.6.8.8 | — | — | [Wiki-Metre] |
| 66 66 D | 6.6.6.6.6.6.6.6 | doubled SM-family | — | [Wiki-Metre] |
| 10 10 10 10 10 (a.k.a. "124th") | 10.10.10.10.10 | — | Old 124th | [Wiki-Metre] |

**Notes:**
- **CMD vs DCM:** Wikipedia uses both labels interchangeably for the doubled-CM pattern [Wiki-CM]. In CPRC speech the term "DCM" is rarely used as a label — the structural fact ("this tune is double-length, sing two stanzas to it") is what matters.
- **Anacrusis** (partial-measure pickup before a tune's first full bar) is a standard hymnological concept but **does not appear in this corpus's digitised ABC** — see §2.
- The metres above cover all distinct labels observed in our DB plus the closely-related doubled and named variants from [Wiki-Metre]'s historic taxonomy.

### 1b. Subset present in this app's data (verified 2026-05-17)

**Tunes — meter inventory** (172 total, 148 with ABC):

| meter | n |
|---|---|
| CM | 128 |
| *(NULL / empty)* | 14 |
| SM | 9 |
| LM (long meter, 88 88) | 8 |
| 66 66 88 | 4 |
| 87 87 | 4 |
| 76 76 D | 3 |
| 10 10 10 10 10 | 1 |
| 66 66 | 1 |

**Psalm versions — meter inventory** (184 total):

| meter | n |
|---|---|
| CM | 170 |
| SM | 5 |
| LM (long meter, 88 88) | 4 |
| 66 66 88 | 2 |
| 66 66 D | 1 |
| 87 87 | 1 |
| 10 10 10 10 10 | 1 |

**Observations:**
- **No `CMD` / `DCM` label** appears in the `tunes.meter` column. DCM is encoded out-of-band via Airtable's `Double length` boolean, which is **not yet migrated** to Postgres — required upstream of any alignment-engine work.
- **14 tunes have NULL / empty meter labels** (Bingham, Ballymena, Elrig, Eventide, Gabe, Going Home, Hawarden, Holly, Lafayette, Maitland, Penitence, Traditional, plus 2 control rows). Per CPRC review these are **data-quality gaps**, not a structural category. Out of scope for this doc beyond noting them.
- **Tune-meter / lyric-meter divergences:** Lyric side has `66 66 D` (n=1) with no matching tune. Tune side has `76 76 D` (n=3) but no matching lyric meter — exposing the Aurelia↔Ps119:153–160 pairing as a meter mismatch (see §2 worked example).

**Re-query and refresh §1b on any major data refresh.**

### 1c. Alternate-meter assignments per the printed psalter

The Brown 1991 reprint of the 1775 edition (Internet Archive) carries a **Metrical Index** that lists every selection departing from CM [Brown-1991]:

| Meter | Psalms (printed-psalter assignments) |
|---|---|
| SM | 25(1st), 45(2nd), 50(1st), 67(1st), 70(1st) |
| LM | 6(1st), 100(1st), 102(2nd), 145(2nd) |
| 6.6.6.6.D | 143(2nd) |
| 6.6.6.6.8.8 (HM) | 136(2nd), 148(2nd) |
| 87.8.7 | 136(1st) |
| 10.10.10.10.10 | 124(2nd) |

That's 14 alternate-meter selections — closely matching [1650psalter]'s informal "thirteen Psalms put to alternate meters" claim, with the slight discrepancy attributable to whether 1st-vs-2nd versions are counted separately. This printed-psalter index is the **primary source** for §5's Psalm 124 + Old 124th worked example.

---

## 2. Tune Anatomy

A Scottish Psalter tune is a 4-voice (SATB) harmonisation of a CM/LM/SM/etc. metrical phrase structure. In CPRC corporate practice tunes are sung **unison and a cappella** (strict — no instruments); 4-part harmony is an aspirational goal, with some individuals already singing harmony [user briefing §Q5].

**Phrase structure** mirrors the meter directly: a CM tune has **4 phrases** (one per syllable-count group: 8, 6, 8, 6). A DCM tune has **8 phrases**. LM has 4 (8-8-8-8). The hymnary entry for Crimond, for example, describes it as "a four-phrase hymn tune" [Hymnary], matching its CM classification.

### Anacrusis (pickup notes before the first full measure)

Anacrusis is a standard hymnological notational concept — a partial measure of pickup notes leading into the first downbeat. **It does not appear in this corpus's digitised ABC.** A targeted scan of all 148 tunes with `abc_notation` found **zero** instances of a partial-measure first bar (see `.planning/phases/04.9.5-scottish-psalter-metrical-knowledge/abc-scan-notes.md` for method).

This means one of:
1. The Scottish Psalter tradition writes full opening measures (and any "pickup" feel is handled by phrasing, not by partial-bar notation).
2. The digitisation process normalised partial measures away.

Either way, **the rendering engine does not need anacrusis support for the current ABC corpus.** If a future re-digitisation re-introduces anacruses, §2 must be revisited.

### Amen endings

In CPRC practice, **amens are never sung at the end of psalm tunes** [user briefing §Q4]. Historical printed JPGs may visually contain a 2-note amen coda; the app preserves these JPGs as historical artifacts but **never renders, plays, or extracts the amen** from ABC. An exhaustive scan of CM tune tails (30 sampled) found **zero** explicit amen patterns in the ABC — the digitisation correctly reflects CPRC convention.

### Repeats

Two distinct phenomena should not be conflated:

- **Playback repeats** (ABC `|: ... :|`): **none present in the corpus.** All 148 ABCs have zero repeat-sign substrings. If the printed source contains repeat indications, they were dropped in digitisation; treat the JPG as authoritative for repeat marks. If a tune ever requires a true repeat, render it using standard repeat notation in the score view (do not visually duplicate the bars) and play the section twice in playback.

- **Variant-tune-for-repeated-lyric-line:** in some printed psalter sources, what looks like a "repeat" is actually a second melodic variant for a lyric line that is sung twice (lyric repeats, tune does not). The current DB column `tunes.additional_score_urls` is empty across all 172 tunes, so this phenomenon is **not represented anywhere in the data** as of 2026-05-17. Flagged as an open data investigation.

### DCM tune ↔ two CM stanzas (worked example)

The canonical DCM use case: an 8-phrase tune (CMD = 8.6.8.6.8.6.8.6) is sung against two CM stanzas of the lyrics (4 phrases × 2 = 8 phrases total). The lyric stanzas remain as-printed; only the tune doubles.

**Worked example:** *Old 44th* (currently `meter='CM'` in our DB but historically a DCM tune in Scottish Psalter tradition — confirmed by the CPRC precentor [user-briefing]). ABC length 247 chars places it in the CM-tagged top quartile (see `data-snapshot.md` §4); the authoritative DCM signal is the Airtable `Double length` boolean. Sing through Old 44th once; the singers cover two consecutive CM stanzas of the psalm during that single pass.

Because DCM-ness is encoded in Airtable's `Double length` column and not yet migrated, the rendering engine cannot currently detect that Old 44th requires two stanzas of lyrics per tune-pass. **This is the root cause of the DCM mis-render bug** that the downstream alignment-implementation phase must fix. See §7 Open items.

A second name-evidence DCM candidate in the data is *Petersham* (`name='Petersham (CMD, EPC tune)'`, `meter='CM'`). Use Old 44th as the primary teaching example; Petersham as the secondary.

### Melismas and extended phrases

Many tunes in the corpus have **more note heads per phrase than the metrical syllable count requires**. Concretely confirmed in the ABC data (2026-05-28 Playwright sweep, 84/150 psalms affected):

| Tune | Meter | Phrase | Expected syllables | Actual notes |
|---|---|---|---|---|
| Crimond | CM | 1 | 8 | 10 (2 melismas: "my", "herd") |
| Crimond | CM | 4 | 6 | 12 |
| Old 100th | LM | 4 | 8 | 24 |
| Crediton | CM | 4 | 6 | 12 |

The extra notes are **melismas** — one syllable sung across multiple consecutive notes. **Confirmed by CPRC precentor (2026-05-28): all displayed notes are part of the main phrase and are sung to words.** They are not cadential figures or encoding errors.

**Canonical melisma theory:** see [lyric-to-note-alignment.md](./lyric-to-note-alignment.md). The short version:

- A melisma is encoded by a **slur** in staff notation, by an **underline** in solfège, and by a `_` token in the ABC `w:` line.
- A held note (`—` in solfège, long-duration note in ABC) is also an implicit melisma — one syllable across multiple beats with a single attack.
- The solfège `.` (half-beat subdivision) is **rhythm only** — it does NOT mark a melisma. A `b g` dot-pair could be two separate syllables OR a one-syllable melisma; only the underline disambiguates.
- The canonical detection algorithm is in `lyric-to-note-alignment.md` §6: slur-start → assign syllable to slur-start note → skip every note up to slur-stop.

**Verified example:** Crimond phrase 1 = "The Lord's my shepherd, I'll not want;" (8 syllables on 10 notes). "my" and "herd" each span a beamed `b g` pair under a slur. See `lyric-to-note-alignment.md` §8 for the full per-syllable per-note mapping, verified against Eleanor Gow's published arrangement and Dieuwe de Boer's MusicXML rendering.

**`w:` token semantics (ABC):** `_` holds the previous syllable across an additional note (correct for melisma continuation). `*` skips the note with no lyric (wrong). Use `_`.

### Status of earlier dot-pair / duration-heuristic approach

The "dot-pair detection + duration heuristic" approach previously documented here (and partially implemented in `src/lib/abc-melisma.ts` and `getPassingPositions` in `src/lib/solfege-parser.ts`) is **a workaround for OCR data loss, not a theory of the notation**. It was adopted because the OCR prompt was instructed to discard underlines, so dot-pairs were the only proxy signal left. Results are correct only when rhythm and melisma happen to coincide.

**Long-term path:** see `lyric-to-note-alignment.md` §9 — re-acquire the lost data either by updating the OCR prompt to preserve underlines, or by ingesting MusicXML (from Hymnary or de Boer's repo) where slurs are already present.

**Coverage status:** 144/172 tunes have `solfege_ocr_text` in DB. All current solfège transcriptions are missing underline information.

### Anti-example: meter mismatch is a data error, not a structural pattern

The pairing **Aurelia (76 76 D) ↔ Psalm 119:153–160 (CM)** exists in the DB (`psalm_version_tunes` row 184) but is a **CPRC curation mistake**, not an intentional "long tune covers two CM stanzas" practice [user briefing §Q2]. The lyric (8 lines × CM = 8-6-8-6-8-6-8-6 syllables) and tune (76 76 D = 7-6-7-6-7-6-7-6 syllables) differ on every odd phrase (8 vs 7).

**Doc rule:** When `tune.meter` does not match `lyric.meter` and the mismatch is not the sanctioned DCM↔2×CM relation, treat it as a **data-quality warning**, not a performance practice. A small visual indicator should surface on affected psalm pages (feature seed for a future phase).

---

## 3. Stanza vs Bible-Verse Model

Two orthogonal divisions coexist in any psalm:

- **Stanza** — a **metrical** unit defined by the tune's phrase structure. For CM, a stanza is 4 lines (8.6.8.6 syllables). For DCM, 8 lines.
- **Bible verse** — a **Scripture** division inherited from the underlying biblical text, independent of metrical structure.

The relationship between them is **N-to-N**: any stanza may contain one or more verse boundaries, and any verse may span one or more stanzas (or even start/end mid-stanza). The 1650 versifiers used *"contraction and dilation of Hebrew words and phrases"* [CPRC-1650] to fit the biblical text to the metre — this is what creates the misalignment.

**Three concrete cases the rendering engine must handle:**

1. **1 stanza : 1 verse** — clean case, no special handling.
2. **1 stanza : N verses** — a stanza contains a verse boundary mid-way. Most common case (see worked example below).
3. **1 verse : N stanzas** — a long Hebrew verse is dilated across multiple stanzas. Verse number appears at stanza start, no further verse numbers until next verse begins.

### Worked example: Psalm 23 (CM) — mid-stanza verse split

Live DB content (`psalm_versions.id = 35`, first stanza):

```
1The Lord's my shepherd, I'll not want.
2He makes me down to lie
In pastures green: he leadeth me
the quiet waters by.
```

**Parse:**
- Verse numbers (`1`, `2`) are embedded **inline** with no separator (`2He`, not `2 He`).
- Stanza 1 contains **two verses**: verse 1 is just line 1 (*"The Lord's my shepherd, I'll not want."*), verse 2 starts at line 2 (*"He makes me down to lie..."*) and runs through line 4.
- Stanzas are separated by blank lines (`\n\n`).

**Parsing rule:** Verse-number tokens are `^(\d+)` at the start of any word, with no whitespace between the number and the following word. The parser must extract these without modifying the underlying lyric flow. **How the parsed verse boundaries are surfaced visually (superscript, inline number, side gutter, hover, etc.) is a rendering-layer decision deferred to the alignment-implementation phase** — out of scope for this doc.

The full Psalm 23 lyric (verses 1–6 in 6 stanzas, with similar mid-stanza splits in other stanzas) is the canonical test case for the alignment engine. **Ground-truth visual reference for Psalm 23 + Crimond:** Eleanor Gow's published arrangement (image saved at `/tmp/reference-ps23.png`, user-confirmed correct 2026-05-30) and Dieuwe de Boer's MusicXML rendering at [metricalpsalter.com](https://metricalpsalter.com/) (sing-tested by user, exact match). See [lyric-to-note-alignment.md](./lyric-to-note-alignment.md) §7 for the full verified reference catalogue and §8 for the per-syllable per-note mapping.

---

## 4. Syllabification Principles

Per-line syllable counts are fixed by meter:

| Meter | Line 1 | Line 2 | Line 3 | Line 4 | Line 5 | Line 6 | Line 7 | Line 8 |
|---|---|---|---|---|---|---|---|---|
| CM | 8 | 6 | 8 | 6 | — | — | — | — |
| LM | 8 | 8 | 8 | 8 | — | — | — | — |
| SM | 6 | 6 | 8 | 6 | — | — | — | — |
| CMD | 8 | 6 | 8 | 6 | 8 | 6 | 8 | 6 |
| 76 76 D | 7 | 6 | 7 | 6 | 7 | 6 | 7 | 6 |

**Elisions** reduce the naive syllable count. The 1650 metrical text relies on these to fit Hebrew/English content into fixed syllable counts [CPRC-1650]; standard CM counting [1650psalter] applies *after* elision. Common forms in the 1650 text:

| Elision | Counted as | Example |
|---|---|---|
| `'s` (e.g. `Lord's`) | 1 syllable | `Lord's` = "Lordz", 1 syll |
| `'ll` | absorbed | `I'll` = 1 syll |
| `'n` (`ev'n`) | absorbed | `ev'n` = 1 syll |
| `'r` (`pray'r`) | absorbed | `pray'r` = 1 syll |

**Worked example — Psalm 23 stanza 1, syllable-by-syllable against CM:**

```
Line 1 (8 syllables): "The | Lord's | my | shep- | herd, | I'll | not | want."
                        1     2       3    4      5       6     7     8
Line 2 (6 syllables): "He | makes | me | down | to | lie"
                       1     2       3    4      5    6
Line 3 (8 syllables): "In | pas- | tures | green: | he | lead- | eth | me"
                        1    2      3       4        5     6      7     8
Line 4 (6 syllables): "the | qui- | et | wa- | ters | by."
                        1     2     3    4     5      6
```

When this lyric is sung to Crimond (CM, 4-phrase, F major, *"a four-phrase hymn tune"* [Hymnary]), each syllable maps to a melodic phrase position. The rendering engine **must** preserve elisions in the syllabified output; otherwise note-to-syllable alignment will drift.

**Principle, not algorithm:** The actual syllabification algorithm (segmenting `"shepherd"` into `"shep-"` + `"herd"`, etc.) is **out of scope** for this doc — handled in the alignment-implementation phase. This section establishes the *contract*: a CM stanza's 4 lines have exactly 8/6/8/6 syllables after elisions are applied.

**CPRC divergence:** *None.* CPRC follows standard CM syllable counting.

---

## 5. Line-Break Principles

Staff line-breaks in the printed tune correspond to phrase boundaries in the metre.

| Meter | Phrases | Staff lines | Typical layout |
|---|---|---|---|
| CM | 4 | 2 | 2 phrases per staff line |
| LM | 4 | 2 | 2 phrases per staff line |
| SM | 4 | 2 | 2 phrases per staff line |
| CMD | 8 | 4 | 2 phrases per staff line × 4 |
| 76 76 D | 8 | 4 | 2 phrases per staff line × 4 |
| 10 10 10 10 10 | 5 | varies | usually 1–2 phrases per staff line |

**Worked example — Psalm 124 Second Version (alternate meter 10 10 10 10 10) + Old 124th tune:**

The `10 10 10 10 10` meter has **5 phrases of 10 syllables each** — an asymmetric (odd) phrase count that breaks the usual CM-family symmetry. Wikipedia's hymn-metre taxonomy explicitly enumerates this as *"124th: 10.10.10.10.10"* [Wiki-Metre], and the Brown 1991 reprint's Metrical Index confirms the pairing as a primary printed-psalter source: *"10.10.10.10.10 — 124 (2ND VERSION)"* [Brown-1991]. Our DB has exactly one tune (Old 124th) and one psalm version at this meter — they pair canonically.

The rendering engine must handle **odd-phrase-count meters**: the half-stanza boundary doesn't fall cleanly between phrases 2 and 3 (it lies *across* phrase 3). Line-break placement for such meters must defer to the printed JPG, not infer symmetry.

**CPRC divergence:** *None at the line-break level.* CPRC follows the printed psalter's line-break placement; deviations (if any) come from the choice of which tune to pair with which psalm, not from how a given tune is rendered.

---

## 6. Worked Examples — Quick Index

Per D-01 in CONTEXT.md, worked examples are embedded inline at the point of explanation rather than collected in a separate section. This index points to each one:

- **CM canonical (Psalm 23 stanza 1 + Crimond, syllable-by-syllable mapping)** → §4
- **DCM ↔ two CM stanzas (Old 44th + any CM psalm; Petersham as secondary)** → §2
- **Mid-line verse split (Psalm 23 stanza 1 contains verses 1 and 2)** → §3
- **Alternate meter (Psalm 124 Second Version + Old 124th, 10 10 10 10 10)** → §5
- **Amen-skip (CPRC convention: not sung, not rendered)** → §2
- **Anacrusis (concept-only — absent from this corpus)** → §2
- **Meter-mismatch anti-example (Aurelia ↔ Ps 119:153–160, a CPRC curation error)** → §2

---

## 7. Sources

Inline citations use `[tag]` shorthand; the full source list is below.

1. **[CPRC-1650]** *The Scottish Metrical Version of the Psalms (1650)*. CPRC, https://cprc.co.uk/articles/scottishmetricalpsalter/ (retrieved 2026-05-17).
2. **[WestminsterStd-1650]** *1650 Scottish Metrical Psalter*. The Westminster Standard, https://thewestminsterstandard.org/1650-scottish-metrical-psalter/ (retrieved 2026-05-17).
3. **[1650psalter]** *Introduction*. 1650psalter.com, https://1650psalter.com/introduction/ (retrieved 2026-05-17).
4. **[IA-facsimile]** *Scottish Psalter (1650) — facsimile*. Internet Archive, https://archive.org/details/scotishpsalter (retrieved 2026-05-17; no "Rules for Singing" section located in the three editions hosted there — Risk R3 closed as "not present in surveyed editions; deferred until a different facsimile surfaces").
11. **[Brown-1991]** *The Psalms of David in Metre, with Notes by John Brown of Haddington* (1991 reprint of the 1775 Edinburgh edition by Presbyterian Heritage Publications). Internet Archive, https://archive.org/download/scotishpsalter/1650_brown_psalms-in-meter_djvu.txt (retrieved 2026-05-17). The Metrical Index at p. 497 is the primary printed-psalter source for §1c's alternate-meter assignments and §5's Psalm 124 worked example.
5. **[Wiki-CM]** *Common metre*. Wikipedia, https://en.wikipedia.org/wiki/Common_metre (retrieved 2026-05-17).
6. **[Wiki-Metre]** *Metre (hymn)*. Wikipedia, https://en.wikipedia.org/wiki/Metre_(hymn) (retrieved 2026-05-17).
7. **[Hymnary]** Hymnary.org — per-tune entries. https://hymnary.org (retrieved 2026-05-17; specific tune URLs cited inline as needed).
8. **[CPRC-index]** *Articles index*. CPRC, https://cprc.co.uk/articles/ (retrieved 2026-05-17 — 10 related psalmody articles available for theological context but not embedded inline in this doc).
9. **[user-briefing]** CPRC precentor briefing session, 2026-05-17. Captured in `.planning/phases/04.9.5-scottish-psalter-metrical-knowledge/briefing-notes.md`.
10. **[psalter-db]** Live PostgreSQL snapshot, 2026-05-17. Captured in `.planning/phases/04.9.5-scottish-psalter-metrical-knowledge/data-snapshot.md`. The §1b inventory is a frozen image of that snapshot.

### Open items requiring downstream work

These are surfaced as seeds for future phases — **out of scope** for this doc:

- **Data migration:** Import Airtable Tunes `Double length` boolean → `tunes.double_length` column. Required before the alignment-implementation phase can render DCM correctly.
- **Data migration:** Label the 14 unlabelled tunes in Airtable (Bingham, Ballymena, Elrig, etc.).
- **Data migration:** Ingest printed-psalter recommended tune pairings (location TBD — printed JPGs vs separate index).
- **Feature seed:** Meter-mismatch visual warning UI on psalm pages (Aurelia↔Ps119 is the motivating case).
- **Feature seed:** SATB / 4-part harmony rendering — long-term, currently unison-only in CPRC corporate practice.
- **Data investigation:** Classify any multi-JPG-per-tune cases as duplicate-views vs variant-tunes-for-repeated-lyric-lines.
- **Source transcription:** Hand-transcribe "Rules for Singing" from the 1650 facsimile front matter [IA-facsimile].

**Re-query data and update §1b on any major data refresh.**
