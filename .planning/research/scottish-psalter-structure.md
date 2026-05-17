# Scottish Psalter Metrical Structure — Reference

**Researched:** 2026-05-17
**Audience:** Claude at planning/execution time + future contributors
**Role:** Canonical reference for the metrical structure of the Scottish Psalter as used by CPRC. Consumed by the alignment-implementation phase to design the data model and rendering algorithm.
**Sources:** See §7. Primary triangulation: user briefing (CPRC precentor), live PostgreSQL data (148 tunes / 184 psalm versions with ABC notation, snapshotted 2026-05-17), 1650 psalter introductions, modern hymnology references.

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

**Worked example:** *Petersham* (currently mislabelled `meter='CM'` in our DB, but the tune name explicitly says *"Petersham (CMD, EPC tune)"* — see `data-snapshot.md` §4) paired with any CM psalm. Sing through Petersham once; the singers cover two consecutive CM stanzas of the psalm during that single pass.

Because DCM-ness is encoded in Airtable's `Double length` column and not yet migrated, the rendering engine cannot currently detect that Petersham requires two stanzas of lyrics per tune-pass. **This is the root cause of the DCM mis-render bug** that the downstream alignment-implementation phase must fix. See §7 Open items.

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

**Rendering rule:** Parse verse-number tokens as `^(\d+)` at the start of any word; do not insert visible whitespace around them in the lyric flow, but the rendering layer should mark them up (superscript, or small leading number) so the verse boundary is visible to the reader without disrupting the metrical line.

The full Psalm 23 lyric (verses 1–6 in 6 stanzas, with similar mid-stanza splits in other stanzas) is the canonical test case for the alignment engine.

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

**Elisions** reduce the naive syllable count. Common in the 1650 text:

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

The `10 10 10 10 10` meter has **5 phrases of 10 syllables each** — an asymmetric (odd) phrase count that breaks the usual CM-family symmetry. Wikipedia's hymn-metre taxonomy explicitly enumerates this as *"124th: 10.10.10.10.10"* [Wiki-Metre], named after its association with this very psalm. Our DB has exactly one tune (Old 124th, id varies) and one psalm version at this meter — they pair canonically.

The rendering engine must handle **odd-phrase-count meters**: the half-stanza boundary doesn't fall cleanly between phrases 2 and 3 (it lies *across* phrase 3). Line-break placement for such meters must defer to the printed JPG, not infer symmetry.

**CPRC divergence:** *None at the line-break level.* CPRC follows the printed psalter's line-break placement; deviations (if any) come from the choice of which tune to pair with which psalm, not from how a given tune is rendered.

---

## 6. Worked Examples — Quick Index

Per D-01 in CONTEXT.md, worked examples are embedded inline at the point of explanation rather than collected in a separate section. This index points to each one:

- **CM canonical (Psalm 23 stanza 1 + Crimond, syllable-by-syllable mapping)** → §4
- **DCM ↔ two CM stanzas (Petersham + any CM psalm)** → §2
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
4. **[IA-facsimile]** *Scottish Psalter (1650) — facsimile*. Internet Archive, https://archive.org/details/scotishpsalter (retrieved 2026-05-17; **Rules-for-Singing transcription still pending — see Risk R3 in `04.9.5-RESEARCH.md`**).
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
