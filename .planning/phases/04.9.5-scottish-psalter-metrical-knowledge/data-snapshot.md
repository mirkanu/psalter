# Data Snapshot — 04.9.5

**Run:** 2026-05-17 (re-verification of RESEARCH.md inventory; all queries live)
**DB:** `localhost:5435/psalter` (psalter-db container, postgres user)
**Tunes with ABC notation:** 148 of 172 total tunes

---

## 1. Tunes meter inventory

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

**Total:** 172 tunes. **Distinct meter labels:** 9 (incl. NULL).

**Notable absences:**
- No `CMD` / `DCM` label exists. DCM is encoded out-of-band in Airtable's `Double length` boolean column, **which has not been migrated to Postgres** (see briefing-notes §Q1).
- No `66 66 D` tune meter (but one psalm version uses it — see §2).

---

## 2. Psalm-versions meter inventory

| meter | n |
|---|---|
| CM | 170 |
| SM | 5 |
| LM (long meter, 88 88) | 4 |
| 66 66 88 | 2 |
| 66 66 D | 1 |
| 87 87 | 1 |
| 10 10 10 10 10 | 1 |

**Total:** 184 psalm-version rows. **Distinct meters:** 7. (All non-NULL — lyric versifications are fully labelled.)

**Deltas vs tunes inventory:**
- Lyric side has `66 66 D` (n=1) but no tune is tagged `66 66 D` → potential alignment problem worth flagging.
- Lyric side has no `76 76 D` (Aurelia's tune meter) → confirms the Aurelia↔Ps119:153-160 pairing is a tune-meter that has no matching lyric meter in the corpus (Q2 mistake corroborated).

---

## 3. Unlabelled tunes (n=14)

Per briefing-notes §Q3 these are **data-quality / Airtable curation gaps**, not structural categories. Out of scope for this doc beyond noting them.

| id | name |
|---|---|
| 98 | Bingham |
| 40 | Brian's mystery tune ("Ballymena") |
| 60 | Elrig |
| 146 | Eventide |
| 81 | Gabe |
| 48 | Going Home (?) |
| 22 | Hawarden |
| 80 | Holly |
| 43 | Lafayette |
| 59 | Maitland |
| 27 | Penitence |
| 156 | Traditional |
| 115 | do NOT use aots for this psalm |
| 4 | use aots for this psalm |

The last two are control rows, not tunes.

---

## 4. CM-tagged tunes — ABC length distribution (DCM-mislabel hunt)

**Distribution (n=120 CM tunes with ABC):**
- min: **125** chars
- median: **178** chars
- max: **275** chars
- Spread: 1.55× median — much tighter than the 2× threshold suggested in RESEARCH.md.

**Top 20 by ABC length (DCM-mislabel candidates):**

| id | name | abc_len |
|---|---|---|
| 111 | Ostend | 275 |
| 164 | St. Asaph | 273 |
| **118** | **Petersham (CMD, EPC tune)** | **267** |
| 139 | Evangel | 263 |
| **119** | **Old 44th** | **247** |
| 132 | Perfect Way | 247 |
| 28 | Orlington | 237 |
| 24 | New Lydia | 230 |
| 148 | Harington | 223 |
| 58 | St. Stephen | 223 |
| 83 | Eastgate (last line repeat for Ps 133) | 219 |
| 158 | Saxony | 219 |
| 89 | Gainsborough | 215 |
| 163 | Pembroke | 213 |
| 149 | Desert DONT SING | 210 |
| 55 | Wetherby | 208 |
| 95 | Bishopthorpe | 206 |
| 172 | Forest Green | 206 |
| 10 | Arnold | 206 |
| 112 | Palestrina (Mr Calendar tune) | 205 |

**Confirmed DCM-mislabel candidates (by name evidence, not just length):**

1. **Petersham** — name explicitly says "(CMD, EPC tune)" but `meter='CM'`. **Definitive mislabel.**
2. **Old 44th** — historically a DCM tune in Scottish Psalter tradition. Length 247 (top quartile).
3. **Eastgate** — name says "(last line repeat for Ps 133)" — implies structural irregularity worth investigating but probably not DCM per se.

**Bottom 10 by ABC length (sanity check):**

| id | name | abc_len |
|---|---|---|
| 71 | Wallace | 125 |
| 162 | Effingham | 129 |
| 96 | Farrant | 134 |
| 12 | Bays of Harris | 135 |
| 79 | Stracathro | 142 |
| 41 | Kingsfold | 143 |
| 127 | Kathrine | 149 |
| 88 | Gabriel | 150 |
| 128 | Azmon/Denfield | 150 |
| 153 | Lloyd | 155 |

All short CM tunes — normal-length entries, no anomalies.

**Authoritative DCM source:** ABC length is **not reliable** for DCM identification — the Airtable `Double length` column is the canonical source (briefing-notes §Q1). The two name-flagged candidates (Petersham, Old 44th) plus whatever the `Double length` column flags should be the working set.

---

## 5. Aurelia pairing confirmation

```
psalm_version_id | psalm_id | version_label | starts
-----------------+----------+---------------+----------------------------------
     184         |    119   |   (empty)     | "153Consider mine affliction..."
```

| field | value |
|---|---|
| Tune | Aurelia (id 26) |
| Tune meter | `76 76 D` |
| Lyric meter | `CM` (8.6.8.6) |
| Lyric content | Psalm 119:153–160 (8 verses × CM stanza) |
| Pairing status (per user) | **CPRC data error**, not intentional practice |

**Implication:** RESEARCH.md identified this as a candidate "DCM tune sung against 2 CM stanzas" example. **It is not.** The doc must:
- Not use this pairing as a DCM worked example.
- Reference it (if at all) under the meter-mismatch warning feature seed.

---

## 6. Psalm 23 lyrics (for §3 mid-stanza-verse-split worked example)

`psalm_versions.id = 35`, `psalm_id = 23`, `meter = CM`. First ~500 chars:

```
1The Lord's my shepherd, I'll not want.
2He makes me down to lie
In pastures green: he leadeth me
the quiet waters by.

3My soul he doth restore again;
and me to walk doth make
Within the paths of righteousness,
ev'n for his own name's sake.

4Yea, though I walk in death's dark vale,
yet will I fear none ill:
For thou art with me; and thy rod
and staff me comfort still.

5My table thou hast furnished
in presence of my foes;
My head thou dost with oil anoint,
and my cup overflows.

6Goodness and ...
```

**Observations relevant to §3:**
- Verse numbers (`1`, `2`, `3`, ...) are embedded **inline** with no separator (no space, no markup) — `2He` not `2 He`.
- **Stanza 1 contains verses 1 AND 2** (`1The Lord's my shepherd, I'll not want.` is verse 1; `2He makes me down to lie / In pastures green...` is verse 2). The mid-stanza verse boundary is exactly where `2` appears.
- Each stanza is **4 lines** (CM = 8.6.8.6 syllables).
- **Elisions visible:** `ev'n`, `death's`, `I'll`. These collapse syllable count from naive 9 to canonical 8 (or 7 to 6 on short lines).
- Stanzas separated by blank lines (`\n\n`).

This is a clean, canonical worked example for §3 and §4 (syllabification).
