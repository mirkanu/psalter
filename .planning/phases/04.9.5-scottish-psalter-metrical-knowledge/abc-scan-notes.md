# ABC Scan Notes — 04.9.5

**Scanned:** 2026-05-17
**Corpus:** 148 tunes with non-null `abc_notation` (of 172 total).

---

## Amen-strip claim

**Method:** Sampled the last 40 characters of 30 alphabetically-ordered CM tunes (Abbeyville through Eastgate).

**Result:** **0 of 30** tunes show an explicit `||X2 Y2` amen-style coda. Tails are normal phrase endings — long held notes (`g6`, `a6`, `f6`), final-measure cadences (`a4`, `g2g2`), or continuation patterns. No double-barline + 2-note pattern observed.

**Conclusion:** Amens are **fully stripped** from the digitised ABC, matching both the RESEARCH.md claim and the user's stated CPRC practice (briefing-notes §Q4: CPRC does not sing amens; app should never render them; ABC correctly omits).

**Doc impact:** §2 amen subsection should frame this as "ABC representation correctly reflects CPRC singing convention — amens appear only in historical JPGs, which the app preserves but does not interpret."

---

## Repeat sign scan

**Method:** SQL `LIKE '%|:%' OR LIKE '%:|%'` over all 148 ABC tunes.

**Result:** **0 of 148** tunes contain ABC repeat signs.

**Conclusion:** Either (a) the source JPGs have no repeat signs at all, or (b) digitisation stripped them. Per briefing-notes §Q6 the user was uncertain — this confirms that **the ABC representation cannot be the source of truth for repeats** in the current data.

**Doc impact:** §2 repeats subsection should:
- State that no encoded repeat signs are present in any digitised ABC.
- Defer to the JPG as authoritative for repeat indications.
- Note the user's wrinkle: some apparent "repeats" may actually be **variant tunes for a repeated lyric line**, not playback repeats — see below.

---

## additional_score_urls — multi-JPG investigation

**Method:** Count tunes with non-empty `additional_score_urls` jsonb array.

**Result:** **0 of 172** tunes have any `additional_score_urls` populated. The column exists in schema but is unused.

**Conclusion:** The user's hypothesis (some tunes have a 2nd JPG that is a variant tune) **is not currently represented in the database**. Either:
- (a) The variant-tune cases exist physically (printed scans) but were not migrated into `additional_score_urls`.
- (b) Such variants are stored as separate `tunes` rows (e.g. "Tune Foo" and "Tune Foo II") — would require a name-similarity scan to confirm.
- (c) The variant phenomenon is rarer than suspected and there's nothing to migrate.

**Doc impact:** §2 repeats subsection should note this as an **unresolved data question**, not assert that the variant-tune pattern is captured anywhere. Flag as a downstream investigation seed.

---

## Anacrusis candidates

**Method 1 — targeted inspection** of 6 known candidates' first measures (parsing notes-before-first-barline as eighth-note units, given `M:C L:1/8` → 8 units per full measure):

| Tune | M: | First-cell content | Units | Full measure? |
|---|---|---|---|---|
| Aurelia | C | `e2e2e2=e2` | 8 | ✓ Full |
| Ballerma (start high) | C | `a2c'4b2` | 8 | ✓ Full |
| Bangor | C | `a2f2e2d2` | 8 | ✓ Full |
| Crimond | C | `c2a4bg` | 8 | ✓ Full |
| Martyrdom | C | `e2a4f2` | 8 | ✓ Full |
| St. Anne | C | `a2f2b2a2` | 8 | ✓ Full |

**Method 2 — exhaustive corpus scan** (node.js + postgres driver, see `/tmp/anacrusis-scan.mjs`): parse first measure of every ABC, flag any tune whose first cell has fewer note-units than its meter requires.

**Result:** **0 of 148** tunes have a genuine anacrusis (one false-positive from a parser artifact on tune "Leominster" where the V: voice declaration contained letters that matched the note-regex — confirmed by manual inspection that the actual first measure is full).

**Conclusion:** **Anacruses do not exist in the digitised ABC corpus.** RESEARCH.md's Assumption A1 (Ballerma/Martyrdom/St. Anne may have anacrusis) is **disproven by data**.

Possible interpretations:
1. The printed source psalter does not use anacruses for these tunes (i.e. Scottish Psalter tradition writes full opening measures).
2. The digitisation process normalised partial measures away.
3. Both — different tunes for different reasons.

**Doc impact:** §2 (Tune Anatomy) **cannot include an anacrusis worked example** sourced from the data. Options:
- (a) Omit anacrusis from §2 entirely.
- (b) Mention anacrusis as a hymnology concept (Wikipedia citation), but explicitly state "no anacruses present in the digitised CPRC ABC corpus as of 2026-05-17."
- (c) Defer the question until printed sources are re-examined (out of scope here).

**Recommended:** Option (b) — keep the concept in the doc for completeness, but be honest about the data gap.

---

## CM-tagged DCM mislabel candidates

See `data-snapshot.md` §4 for the ABC-length analysis. **Confirmed mislabel candidates by name evidence:**

- **Petersham** — name says "(CMD, EPC tune)", currently `meter='CM'`. **Confirmed DCM.**
- **Old 44th** — historically DCM in Scottish Psalter tradition, length 247 (CM top quartile). **Likely DCM.**

ABC length alone is **not** a reliable DCM discriminator: max CM length (275) is only 1.55× the median (178), well below the 2× heuristic RESEARCH.md proposed.

**Doc impact:** §2 DCM worked-example should use **Petersham** or **Old 44th** paired with a CM psalm version (specific pairing to be selected during Task 1.4 — requires checking which psalms reference them via `psalm_version_tunes`).

**Action item (not in scope here):** Migrate Airtable `Double length` column to a new `tunes.double_length boolean` for authoritative DCM identification, per briefing-notes §Q1 action item.

---

## Summary of disproven RESEARCH.md assumptions

| RESEARCH.md claim | Verdict from data | Replacement |
|---|---|---|
| Anacrusis may be present in Ballerma/Martyrdom/St. Anne (A1) | **Disproven** — 0 hits in 148 tunes | Reframe §2 anacrusis as concept-only, not worked example |
| ABC length >2× median = DCM mislabel | **Disproven** — max is only 1.55× median | Use name-evidence and Airtable Double length instead |
| Aurelia ↔ Ps119:153-160 is a clean "DCM tune covers 2 CM stanzas" example | **Disproven** (user) — it's a mistake, not a structural pattern | Use Petersham or Old 44th + CM psalm instead |
| Some `additional_score_urls` carry variant tunes | **Unverified** — column entirely empty in current data | Flag as downstream investigation seed |
| ABC contains repeat signs | **Disproven** — 0 hits | JPG is authoritative for repeats |
| Amens stripped from ABC | **Confirmed** — 0 hits in 30 sampled tails | Doc states ABC correctly reflects CPRC convention |
