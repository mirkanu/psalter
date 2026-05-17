# Source Citation Inventory — 04.9.5

**Compiled:** 2026-05-17
**Method:** WebFetch retrieval + extraction of statements relevant to doc sections.

---

## Citation format

Inline format used in the doc: `[short-tag]` with full entry in §7 Sources.
Example: `Common Meter is 8.6.8.6 [Wiki-CM]`.

---

## Sources

### [CPRC-1650] CPRC — The Scottish Metrical Version of the Psalms (1650)

**URL:** https://cprc.co.uk/articles/scottishmetricalpsalter/
**Retrieved:** 2026-05-17

**Key extracts relevant to doc sections:**

- §1 Meter Taxonomy / Historical context:
  > "the Psalter of 1564 was a faithful translation of the original, its variety of metre was too difficult for the common people"
  Indicates the 1650 standardisation onto CM-dominant metres was deliberate, motivated by accessibility.

- §3 Stanza vs Verse / Translation method:
  > "What it does mean is contraction and dilation of Hebrew words and phrases"
  Explains how the 1650 versifiers reconciled metrical constraints with textual faithfulness — directly supports the syllabification principle in §4.

- §1 / §5 CPRC divergence framing:
  > "when the Churches began to produce their own revisions we have seen 'individualism' win the day with the Presbyterian Churches each having their own Psalter"
  Underpins user briefing §Q5 finding that there is **no universally-agreed psalm↔tune pairing** across Scottish Presbyterian churches.

**Notable absence:** The article does **not** discuss specific tune assignments, meter patterns, or singing methodology. Doctrinal/textual focus only. Tune-side authority must come from other sources or from user briefing.

---

### [WestminsterStd-1650] Westminster Standard — 1650 Scottish Metrical Psalter

**URL:** https://thewestminsterstandard.org/1650-scottish-metrical-psalter/
**Retrieved:** 2026-05-17

**Status:** Directory page — no preface, rules-for-singing, or technical guidance present.

**Single usable extract (historical attribution):**
> "This version, after repeated revisals, was approved of by the Westminster Assembly; and, having undergone further careful revision by members of the General Assembly of the Church of Scotland, it was adopted and sanctioned in 1649"

For technical singing rules: this source recommends consulting the printed psalter itself (Trinitarian Bible Society or Reformation Heritage Books) or external resources (ScottishPsalter.com, Psalter.org). **Out of scope here.**

---

### [1650psalter] 1650psalter.com — Introduction

**URL:** https://1650psalter.com/introduction/
**Retrieved:** 2026-05-17

**Key extracts (high relevance — most useful technical statements found across all eight sources):**

- §1 Meter Taxonomy:
  > "Every Psalm in the Psalter has been put to common meter, with thirteen Psalms put to alternate meters as well."

- §1 / §4 CM definition:
  > "Common meter features four lines per stanza, with eight syllables in the first and third lines, and six in the second and fourth lines."

- §1 Design philosophy (supports §1 intro paragraph):
  > "This is a very simple meter, with a wide selection of tunes available to be used."

- §2 Tune flexibility (supports user briefing §Q5 — no universal pairings):
  > "if someone knows only one or two tunes of the right meter (such as 'New Britain,' the tune used for the hymn 'Amazing Grace'), they can sing any Psalm using this Psalter."

- §2 Text-over-tune principle:
  > "The tunes that one may use are irrelevant, meaning that the emphasis is (rightly) placed on the words of the Psalm, rather than the tune that happens to be used."

**Doc impact:** This source provides the cleanest external corroboration for the "CM-dominant + ~13 alternate-meter psalms" structure observed in our data (170 CM + 14 non-CM in `psalm_versions`). Use heavily in §1 and §2.

---

### [IA-facsimile] Internet Archive — 1650 Scottish Psalter facsimile

**URL:** https://archive.org/details/scotishpsalter
**Retrieved:** 2026-05-17

**Status:** **UNAVAILABLE via WebFetch.** Archive page surfaces metadata and download options only — no table of contents or page-level preview through the WebFetch path. Cannot confirm presence or location of a "Rules for Singing" section without downloading the scan.

**Doc impact:** RESEARCH.md Risk R3 stands — Rules for Singing front matter remains untranscribed. Doc should cite this source as "facsimile available; rules-for-singing transcription pending — see R3."

---

### [Wiki-CM] Wikipedia — Common metre

**URL:** https://en.wikipedia.org/wiki/Common_metre
**Retrieved:** 2026-05-17

**Key extracts:**

- §1 CM definition (canonical):
  > "A poetic metre consisting of four lines that alternate between iambic tetrameter (four metrical feet per line) and iambic trimeter (three metrical feet per line)"
  - Syllable count: **8.6.8.6** (or 86.86)
  - Rhyme scheme: **ABAB**

- §1 CMD definition:
  > "The common metre pattern repeated twice within each stanza, doubling the line structure."
  - Syllable count: **8.6.8.6.8.6.8.6**
  - Rhyme scheme: **ABABCDCD** (or XAXAXBXB in ballad form)

**Coverage gap:** This article does not define LM (Long Metre) or SM (Short Metre). For those, use [Wiki-Metre].

---

### [Wiki-Metre] Wikipedia — Metre (hymn)

**URL:** https://en.wikipedia.org/wiki/Metre_(hymn)
**Retrieved:** 2026-05-17

**Comprehensive metre taxonomy** (verbatim from extraction):

| Abbreviation | Name | Pattern |
|---|---|---|
| C.M. / CM | Common Metre | 8.6.8.6 |
| L.M. / LM | Long Metre | 8.8.8.8 |
| S.M. / SM | Short Metre | 6.6.8.6 |
| D.C.M. / C.M.D. / CMD | Doubled Common Metre | 8.6.8.6.8.6.8.6 |
| D.L.M. / L.M.D. / LMD | Doubled Long Metre | 8.8.8.8.8.8.8.8 |
| 8.7.8.7.D | Doubled 8.7.8.7 | — |

**Historic / regional variations:**

- **P.M. / PM** — Peculiar Metre (irregular)
- **L.P.M. / LPM** — Long Particular Metre: 8.8.8.8.8.8
- **H.M. / HM** — Hallelujah Metre: 6.6.6.6.8.8
- **"50th"** — 10.10.10.10.10.10
- **"104th"** — 10.10.11.11
- **"112th"** — 6.6.6.6.8.8
- **"124th"** — 10.10.10.10.10 *(matches the `10 10 10 10 10` lyric_meter in our DB — see data-snapshot.md §2; this is Psalm 124's Second Version meter)*
- **"148th"** — 6.6.6.6.4.4.4.4

**Notable mapping to our data:**
- Our `76 76 D` (Aurelia, etc.) is the `7.6.7.6.D` family — not enumerated in the Wikipedia table directly, but is a well-known hymnological metre.
- Our `66 66 88` (4 tunes) matches Wikipedia's **H.M. / Hallelujah Metre**.
- Our `87 87` (4 tunes / 1 psalm) is a standard Methodist/Lutheran metre.
- Our `10 10 10 10 10` matches **"124th"**.

**Attribution credit:** Wikipedia attributes metre formalisation to Isaac Watts: *"who wrote hundreds of hymns"* and credits him with popularising these patterns.

---

### [Hymnary] Hymnary.org — per-tune confirmations

**URL:** https://hymnary.org/tune/crimond_irvine (Crimond entry; others not fetched in this pass)
**Retrieved:** 2026-05-17

**Crimond confirmation:**
- Metre: **CM (8.6.8.6)** — matches our DB.
- Structure: **Four-phrase tune**, key F Major.
- Incipit: `53425 42171 33224` (solfège pattern of the opening).
- Composer: Jessie Seymour Irvine (1872).

**Coverage gap:** Aurelia, Old 100th, Old 124th, Trentham not retrieved in this fetch — separate hymnary URLs would be needed per tune. **Defer to Task 1.4 only if specific worked examples require external metre confirmation;** otherwise rely on our DB's `meter` column for these tunes.

---

### [CPRC-index] Additional CPRC psalmody articles

**URL:** https://cprc.co.uk/articles/
**Retrieved:** 2026-05-17

**Related articles (10 found, beyond the 1650 article):**

1. **Singing the Canonical Psalms** — https://cprc.co.uk/articles/singingcanonicalpsalms/
2. **Singing the Psalms in Public Worship** — https://cprc.co.uk/articles/singingthepsalms/
3. **Scriptural Praise: The Case For Exclusive Psalmody** — https://cprc.co.uk/articles/scripturalpraise/
4. **A Special Exegesis of Ephesians 5:19 and Colossians 3:16** — https://cprc.co.uk/articles/specialexegesismcnaugher/
5. **Psalms, Hymns and (Spiritual) Songs: A Quick Survey** — https://cprc.co.uk/articles/psalmshymnssongs/
6. **Why Psalms Only?** — https://cprc.co.uk/articles/whypsalmsonly/
7. **John Calvin on the Wonder of the Psalms** — https://cprc.co.uk/articles/johncalvinpsalms/
8. **The Rage for the Psalter in France** — https://cprc.co.uk/articles/psalterinfrance/
9. **_Our Own Hymn Book_ Versus God's Own Hymn Book** — https://cprc.co.uk/articles/freepresbyterianhymnal/
10. **Horatio Spafford: Not Well With His Soul** — https://cprc.co.uk/articles/spafford/

**Relevance:** Articles 1–4 and 6 cover **exclusive psalmody** (theological motivation) but not metrical/structural mechanics. Useful as background citations if the doc needs to motivate "why CPRC sings only psalms," but not needed for the structural reference doc itself. Do not embed inline unless §2 or §5 requires explicit theological framing.

---

## Summary — citations usable per doc section

| Doc § | Primary citation | Supporting |
|---|---|---|
| §1 Meter Taxonomy — general | [Wiki-Metre] | [Wiki-CM], [1650psalter] |
| §1b Data-driven subset | (own data — `data-snapshot.md`) | — |
| §2 Tune Anatomy — CPRC practice | (user briefing — `briefing-notes.md`) | [1650psalter] for tune flexibility |
| §3 Stanza vs Bible-Verse | (own data — `data-snapshot.md` Ps 23) | [CPRC-1650] for "contraction/dilation" |
| §4 Syllabification | [Wiki-CM] | [CPRC-1650], [1650psalter] |
| §5 Line-Break | (own data + briefing) | [Wiki-Metre] |
| §7 Sources | (this file) | — |
| Rules-for-Singing | **UNAVAILABLE** ([IA-facsimile] not retrieved) | flag R3 risk |

**Sources retrieved:** 7 of 8 attempted (Internet Archive facsimile uncontactable via WebFetch metadata page; flagged as Risk R3 outstanding).
