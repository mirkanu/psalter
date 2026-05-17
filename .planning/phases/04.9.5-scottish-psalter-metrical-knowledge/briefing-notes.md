# Briefing Notes — 04.9.5 Scottish Psalter Metrical Knowledge

**Captured:** 2026-05-17
**Captured from:** Project owner / CPRC precentor (Manuel Kuhs)
**Format:** Q&A — answers paraphrased with key quotes preserved; follow-ups noted inline.

---

## Q1: DCM identification

**User's answer:**
- DCM is recognised by **ABC notation length / number of phrases** (~2× the length of a normal CM tune). The score on the page is "double the normal length (e.g. 2× JPEGs)."
- DCM tunes can be paired with **any CM psalm** — they are not constrained to long psalms or specific pairings.
- The precentor does **not** need to derive DCM-ness from per-tune memory: the **Airtable Tunes table has a manually-curated binary column "Double length"** which is the authoritative source. User's quote: *"My 'double length' column is most likely correct."*

**Follow-ups asked / answered:**
- Is "DCM" used as a label in CPRC speech? — Implicitly no, the term itself wasn't volunteered; the structural fact ("this tune is double length, sing two stanzas to it") is what matters in practice.

**Implication for doc:**
- §1 (Meter Taxonomy) should state: DCM is **not** carried as a distinct `meter` value in the current DB — it's encoded structurally via the `Double length` Airtable column, which has **not yet been migrated** to Postgres.
- §2 (Tune Anatomy) DCM section can cite "Double length"-flagged tunes once that column is imported.

**Action item (downstream, out of scope here):**
- Add a `double_length boolean` column to `tunes` and backfill from Airtable. Required before the alignment phase can render DCM correctly. Surface as a seed for the alignment-implementation phase.

---

## Q2: Aurelia ↔ Psalm 119:153–160 pairing intentionality

**User's answer:**
- This pairing is a **CPRC mistake**, not intentional practice. The lyric meter (CM) and tune meter (76 76 D) do not match.
- Fixing it requires precentor consensus and is **outside the scope of this project**.
- However: the app **should display a small visual warning** on any psalm where the assigned tune's meter does not match the lyric meter.

**Follow-ups asked / answered:**
- Is this the cleanest live "long tune covers 2 CM stanzas" example? — No, it shouldn't be used as such; it's a mismatch, not a structural pattern.

**Implication for doc:**
- The planned §2 worked example ("DCM tune sung against two CM stanzas — Aurelia + Ps 119") is **invalid**. Need to substitute a real DCM tune (one of the `Double length`-flagged Airtable tunes) paired with a CM psalm.
- Doc should explicitly categorise CM↔76 76 D pairings as **data-quality warnings**, not as a meter-bending performance practice.

**Action item (downstream seed):**
- **New feature seed:** Meter-mismatch visual warning UI. When `tune.meter` ≠ lyric meter (and the mismatch is not a sanctioned DCM↔2×CM relation), surface a small visual indicator on the psalm page. To be captured as a separate seed for a future phase.

---

## Q3: Unlabelled tunes (meter IS NULL / empty)

**User's answer:**
- Treat as **(b) data quality issue, out of scope for this doc.** These 14 tunes *should* have meter labels; it's an Airtable curation gap to be fixed later.

**Implication for doc:**
- §1b (data-driven subset) lists the 14 unlabelled tunes with a single bullet: *"To be labelled in Airtable; data-fix pending."* No structural analysis required.

**Action item (downstream):**
- Airtable curation pass to label the 14 missing meters. Not in this phase.

---

## Q4: Amen-skip rule scope

**User's answer:**
- **CPRC does not sing the amen.** ("a: no we don't.")
- App behaviour: **never** show, render, or play amens. ("c — never show, render or play the amens (should only appear in the jpegs)")
- JPGs may visually contain amens — leave them as the historical artifact they are; no need to scrub.

**Implication for doc:**
- §2 (Tune Anatomy) amen section: state CPRC convention clearly. Frame as a **performance-practice and rendering choice**, not a data-stripping accident.
- §2 should also state that the ABC notation already reflects this convention (amens absent from digitised ABCs is correct, not a bug).
- The "amen-skip rule" framing from RESEARCH.md is misleading — there is no "rule to skip an amen that the ABC contains"; the amen is simply never present in CPRC singing.

---

## Q5: CPRC vs broader Scottish Presbyterian divergences

**User's answer (consolidated):**
- **Unique tune-psalm pairings:** Yes — CPRC has its own pairings. The broader landscape has **no universally-agreed psalm↔tune pairing** across Scottish Presbyterian churches. *"We are solving it just for our church."* This is itself a meaningful CPRC characteristic.
- **Source of CPRC's pairings:** The **"default tune" per psalm** as stored in the app/DB. (Not in the JPGs.)
- **Printed-psalter recommended pairings:** The printed psalter from which the JPGs were taken **does include its own recommended pairings**, which are **not yet in our DB**. User wants these added in future and exposed in the app (separate from CPRC's chosen pairings).
- **Repeats:** No repeated lines/stanzas in CPRC practice unless the JPG indicates it (see Q6 for nuance).
- **Harmony:** **Unison singing only** in CPRC at present. Some individuals sing harmony, but corporate practice is unison. SATB is a long-term goal, not current practice.
- **Instruments:** **Strict a cappella, no instruments at all.**

**Implication for doc:**
- §1 (Meter Taxonomy) intro paragraph: note "no universal pairing across Scottish Presbyterian tradition — congregational practice varies; this doc reflects CPRC practice."
- §2 (Tune Anatomy): unison default; harmony out of scope for the rendering model.
- Insert a short "Performance practice — CPRC specifics" subsection or callout enumerating: unison, a cappella, no amen, no repeats unless JPG-indicated, pairings determined by app default-tune column.

**Action items (downstream seeds):**
- **Seed:** Ingest printed-psalter recommended tune pairings into a new `recommended_tune_id` (or join table) on psalms, separate from current CPRC default; expose in the app.
- **Seed:** SATB / harmony rendering — long-term, captured for future roadmap.

**Open question (not blocking):**
- Where do the printed-psalter recommended pairings physically live? (Inside the same JPG pages? Or a separate index page we don't have digitised yet?) — User's answer was about *CPRC* pairings (app default); printed-psalter source location remains open. Resolve when seed is picked up.

---

## Q6: Repeats (`://`)

**User's answer:**
- User has **not** verified whether the digitised ABC notation actually captures any `|:` / `:|` repeat signs — uncertain whether digitisation preserved them.
- **Desired behaviour:** Playback should **honour the repeat** (play the section twice). Visual display should use **standard repeat notation** (do not visually duplicate the bars).
- **Important wrinkle:** Some tunes have **multiple JPGs** (2nd JPG = "repeat"). User suspects these may not be true playback repeats but rather **variant tunes for the same lyric line** — i.e. a lyric line is sung twice, with the second pass using a slightly different tune. *"I think that's what some tunes are — they repeat a lyric line with a different tune."*

**Implication for doc:**
- §2 (Tune Anatomy) repeats section: cover both cases —
  - Case A: True repeat (ABC `|: ... :|`) — render as standard repeat in score, double in playback.
  - Case B: Variant-tune-for-repeated-line — modelled as a multi-segment tune (or as multiple linked tunes per psalm), **not** as a repeat. Doc should flag this as a distinct structural pattern that the alignment phase must handle.
- The current `tunes.additional_score_urls` jsonb column may be carrying these variants; the doc should note this is unverified.

**Action items (Task 1.2 scans):**
- Check: do any `abc_notation` values contain `|:` or `:|` repeat-sign substrings? (If none, the digitisation has stripped repeats — important finding.)
- For tunes with `additional_score_urls` populated, sample 3–5 and inspect whether the 2nd JPG is a duplicate view, a variant tune, or something else. Record findings in `abc-scan-notes.md`.

---

## "Specific Ideas" from CONTEXT.md — confirmation pass

Each item from CONTEXT.md's "Specific Ideas" list was confirmed implicitly by the answers above:

| Idea (from CONTEXT.md) | Status |
|---|---|
| CM = 8.6.8.6 | Confirmed (standard, no CPRC divergence) |
| DCM = 8.6.8.6.8.6.8.6 paired with two CM stanzas | Confirmed — but DCM-ness lives in Airtable `Double length` boolean, not in `meter` column |
| Amen as final 2 notes | Refined: CPRC does not sing amens; ABC correctly omits them; JPGs may show them historically |
| Single-blob lyrics with embedded verse numbers | Confirmed (downstream Task 1.4 will use Ps 23 §3 worked example) |
| Alternate meters already exist | Confirmed (76 76 D, etc.) |

---

## Summary of seeds and action items surfaced

For the seeds file / future roadmap:

1. **Data migration:** Import Airtable Tunes `Double length` column into `tunes.double_length boolean` (required before alignment phase).
2. **Data migration:** Label the 14 unlabelled tunes in Airtable.
3. **Data migration:** Ingest printed-psalter recommended tune pairings (location TBD).
4. **Feature seed:** Meter-mismatch visual warning UI on psalm pages.
5. **Feature seed:** SATB / harmony rendering (long-term).
6. **Investigation:** Determine whether digitised ABCs contain repeat signs; classify multi-JPG tunes as duplicate-view vs variant-tune.

---

## Confirmation gate

The user has confirmed each Q1–Q6 answer in real time during the briefing session (this conversation). Plan 1 Task 1.1 acceptance criterion *"User has explicitly confirmed each answer before this task is marked done"* is satisfied by the conversational confirmation; if a stricter sign-off is required, the user is asked to review this file directly.
