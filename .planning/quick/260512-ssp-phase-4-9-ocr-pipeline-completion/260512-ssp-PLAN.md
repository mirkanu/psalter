---
phase: quick-260512-ssp
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/db/schema.ts
  - scripts/ocr-solfege.ts
  - scripts/apply-abc-notation.ts
  - scripts/output/solfege-ocr.json
autonomous: true
requirements: [phase-4.9-ocr-completion]
must_haves:
  truths:
    - "tunes table has solfege_ocr_text and abc_satb columns"
    - "scripts/ocr-solfege.ts captures raw solfege text + soprano ABC + SATB ABC per tune"
    - "scripts/apply-abc-notation.ts writes solfege_ocr_text and abc_satb to DB"
    - "All tunes that have solfege JPEG images on disk have non-null solfege_ocr_text in DB"
    - "All tunes that have solfege JPEG images on disk have non-null abc_satb in DB"
    - "No JPEG files in public/tunes/ are modified or deleted"
  artifacts:
    - path: "src/db/schema.ts"
      provides: "tunes.solfegeOcrText (text) + tunes.abcSatb (text) column definitions"
      contains: "solfegeOcrText"
    - path: "scripts/ocr-solfege.ts"
      provides: "Pipeline that emits solfegeText, abc (soprano), abcSatb in solfege-ocr.json"
      contains: "transcribeOnly"
    - path: "scripts/apply-abc-notation.ts"
      provides: "Writes abc_notation + solfege_ocr_text + abc_satb to DB"
      contains: "abcSatb"
    - path: "scripts/output/solfege-ocr.json"
      provides: "Updated JSON with solfegeText + abc + abcSatb per tune"
  key_links:
    - from: "scripts/ocr-solfege.ts"
      to: "src/lib/ocr-solfege-v2.ts::transcribeOnly"
      via: "import + call per tune to get raw solfege JSON"
      pattern: "transcribeOnly"
    - from: "scripts/ocr-solfege.ts"
      to: "src/lib/solfege-parser.ts::solFaToAbcMultiVoice"
      via: "import + call with transcribed voices to produce SATB ABC"
      pattern: "solFaToAbcMultiVoice"
    - from: "scripts/apply-abc-notation.ts"
      to: "tunes.solfegeOcrText / tunes.abcSatb"
      via: "db.update().set({ solfegeOcrText, abcSatb })"
      pattern: "solfegeOcrText.*abcSatb"
---

<objective>
Phase 4.9 OCR pipeline completion: add `solfege_ocr_text` and `abc_satb` columns to the `tunes` DB table, modify the OCR pipeline scripts to capture and persist raw Claude Vision solfege transcription text plus 4-voice SATB ABC (in addition to the existing soprano-only ABC), and re-run the pipeline so all tunes with solfege JPEGs on disk get all three pieces of data populated.

Purpose: Today we only persist soprano-only ABC. The precentor portal and future SATB renderer need the raw OCR text (for debugging/manual correction) and 4-voice SATB ABC (for full-harmony rendering). The infrastructure already exists (`transcribeOnly()` + `solFaToAbcMultiVoice()` in `src/lib/`); the script glue and DB columns are missing.

Output: Schema migration applied; updated scripts committed; DB populated for all tunes with solfege images (about 143 tunes); JPEGs untouched.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

# Existing source we depend on
@src/db/schema.ts
@scripts/ocr-solfege.ts
@scripts/apply-abc-notation.ts
@src/lib/ocr-solfege-v2.ts
@src/lib/solfege-parser.ts

<interfaces>
From src/lib/ocr-solfege-v2.ts:
```typescript
export interface TranscriptionResult {
  doh: string
  time: string
  soprano: string
  alto: string
  tenor: string
  bass: string
  lah?: string
  mode?: string
}

export async function transcribeOnly(
  tuneName: string,
  imagePaths: string | string[],
): Promise<TranscriptionResult & { rawResponse: string }>
```

From src/lib/solfege-parser.ts:
```typescript
export interface SolFaVoices { soprano: string; alto: string; tenor: string; bass: string }
export interface MultiVoiceResult { abc: string; warnings: string[] }

export function solFaToAbcMultiVoice(
  voices: SolFaVoices,
  doh: string,
  time: string,
  tuneName: string,
  lah?: string,
  mode?: string,
): MultiVoiceResult
```

From src/db/schema.ts (existing tunes columns to extend):
```typescript
export const tunes = pgTable('tunes', {
  // ...
  abcNotation: text('abc_notation'),     // existing — soprano-only ABC
  // ADD:
  // solfegeOcrText: text('solfege_ocr_text'),
  // abcSatb: text('abc_satb'),
})
```
</interfaces>

**Environment:**
- API key env var: `PSALTER_ANTHROPIC_API_KEY` (already used by both `scripts/ocr-solfege.ts` and `src/lib/ocr-solfege-v2.ts`; lives in project `.env`)
- `DATABASE_URL` already used by existing scripts
- Solfege JPEGs at `public/tunes/{slug}-solfege-{i}.jpg` — READ ONLY, never modify or delete
- Pipeline output JSON: `scripts/output/solfege-ocr.json`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add solfege_ocr_text and abc_satb columns to tunes schema</name>
  <files>src/db/schema.ts</files>
  <action>
Edit `src/db/schema.ts`. In the `tunes` table definition (around line 50), add two new nullable text columns immediately after `abcNotation`:

```typescript
abcNotation: text('abc_notation'),             // NULL until Phase 4 (soprano only)
solfegeOcrText: text('solfege_ocr_text'),      // raw Claude Vision transcription JSON
abcSatb: text('abc_satb'),                     // 4-voice SATB ABC from solFaToAbcMultiVoice
scoreJpgUrl: text('score_jpg_url'),
```

Both columns are nullable text (no `.notNull()`, no default). Do not touch any other columns or relations.

Then push to the live DB:
```bash
npx drizzle-kit push
```

If drizzle-kit prompts interactively, answer to add the columns (default option). Verify the columns exist:
```bash
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d psalter -c "\d tunes" | grep -E "solfege_ocr_text|abc_satb"
```

Then commit:
```bash
git add src/db/schema.ts
git commit -m "feat(db): add solfege_ocr_text and abc_satb columns to tunes"
```
  </action>
  <verify>
    <automated>PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d psalter -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='tunes' AND column_name IN ('solfege_ocr_text','abc_satb') ORDER BY column_name" | tr '\n' ',' | grep -q "abc_satb,solfege_ocr_text,"</automated>
  </verify>
  <done>Both columns exist as nullable text in the live `tunes` table; schema.ts updated and committed.</done>
</task>

<task type="auto">
  <name>Task 2: Capture raw solfege OCR text + SATB ABC in pipeline scripts</name>
  <files>scripts/ocr-solfege.ts, scripts/apply-abc-notation.ts</files>
  <action>
**Part A — `scripts/ocr-solfege.ts`:** Refactor so each tune produces three artefacts (raw transcription, soprano ABC, SATB ABC) instead of just soprano ABC.

1. Add imports at the top of the file:
   ```typescript
   import { transcribeOnly, type TranscriptionResult } from '../src/lib/ocr-solfege-v2'
   import { solFaToAbc, solFaToAbcMultiVoice } from '../src/lib/solfege-parser'
   ```
   Remove the now-unused `PROMPT` constant and the `callVision`/`prepareImageBase64`/`sharp`/`Anthropic` imports IF no longer referenced. (The `client` instance is unused once `transcribeOnly` does the API work.) Keep `abcjs`/`validateAbc`/`postProcessAbc` — still useful for validating soprano ABC produced from solfege text.

2. Extend `OutputEntry`:
   ```typescript
   interface OutputEntry {
     id: number
     name: string
     slug: string
     status: 'success' | 'no_image' | 'validation_failure' | 'transcription_failure'
     // legacy field (kept for compat with apply-abc-notation.ts existing reads):
     abc: string | null              // soprano-only ABC (from solFaToAbc)
     // new fields:
     solfegeText: string | null      // JSON.stringify(TranscriptionResult) — raw transcribed voices
     abcSatb: string | null          // 4-voice ABC from solFaToAbcMultiVoice
     model: 'claude-sonnet-4-6' | null
     warningCount?: number
     pageCount?: number
   }
   ```

3. Replace `tryGetAbc` with a `tryProcessTune(pages, tuneName)` that:
   a. Calls `transcribeOnly(tuneName, pages)` -> `TranscriptionResult`. On throw, return `{ status: 'transcription_failure', abc: null, solfegeText: null, abcSatb: null, model: 'claude-sonnet-4-6', pageCount: pages.length }`.
   b. Stores `solfegeText = JSON.stringify({ doh, time, soprano, alto, tenor, bass, lah, mode })`.
   c. Calls `solFaToAbc(soprano, doh, time, tuneName, lah, mode)` -> soprano ABC string. Run `postProcessAbc` then `validateAbc`. If invalid, mark status `validation_failure` but still keep `solfegeText` + `abcSatb` so they can be saved.
   d. Calls `solFaToAbcMultiVoice({soprano, alto, tenor, bass}, doh, time, tuneName, lah, mode)` -> SATB ABC. Do NOT block on its validation — SATB ABC is best-effort; keep the string even if abcjs warns.
   e. Return all three pieces.

4. Resume logic: a tune is "already done" only when `existing[id].status === 'success' && existing[id].solfegeText && existing[id].abcSatb`. Tunes with the old shape (only `abc` populated) must be re-processed so the new fields fill in.

5. Update the summary block to also report counts of entries with `solfegeText` and `abcSatb`. Keep the rate-limit `DELAY_MS` wait between API calls.

6. Keep the model field set to `'claude-sonnet-4-6'` (transcribeOnly uses sonnet internally). Drop haiku/sonnet escalation — `transcribeOnly` already chooses its model.

**Part B — `scripts/apply-abc-notation.ts`:** Write all three fields to the DB.

1. Extend `OutputEntry` interface to include `solfegeText: string | null` and `abcSatb: string | null` (matching Part A).

2. In the main loop, for every entry that has at least one of (`abc` with valid soprano-and-not-protected, `solfegeText`, `abcSatb`), build a partial update and write it:
   ```typescript
   const setObj: Partial<typeof schema.tunes.$inferInsert> = {}
   // abc: only write if not protected (existing protect-logic) AND re-validates
   if (entry.abc && shouldWriteSopranoAbc) setObj.abcNotation = entry.abc
   if (entry.solfegeText) setObj.solfegeOcrText = entry.solfegeText
   if (entry.abcSatb)     setObj.abcSatb       = entry.abcSatb
   if (Object.keys(setObj).length > 0) {
     await db.update(schema.tunes).set(setObj).where(eq(schema.tunes.id, entry.id))
   }
   ```
   Preserve the existing `--overwrite` protection for `abcNotation` only (the hand-crafted ABCs from Phase 4 must not be replaced by default). `solfegeOcrText` and `abcSatb` are always safe to overwrite — they are new fields with no hand-crafted values.

3. Update the sanity guard at the bottom: change "fewer than 100 tunes updated" to count ANY field write, not just abc_notation writes.

4. Update the final DB count check to report all three:
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE abc_notation IS NOT NULL)        AS with_abc,
     COUNT(*) FILTER (WHERE solfege_ocr_text IS NOT NULL)    AS with_ocr_text,
     COUNT(*) FILTER (WHERE abc_satb IS NOT NULL)            AS with_satb
   FROM tunes
   ```

**Type-check both files**:
```bash
npx tsc --noEmit
```

Then commit:
```bash
git add scripts/ocr-solfege.ts scripts/apply-abc-notation.ts
git commit -m "feat(scripts): capture raw solfege OCR text and SATB ABC in pipeline"
```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -E "scripts/(ocr-solfege|apply-abc-notation)\.ts" | wc -l | grep -q "^0$" && grep -q "transcribeOnly" scripts/ocr-solfege.ts && grep -q "solFaToAbcMultiVoice" scripts/ocr-solfege.ts && grep -q "abcSatb" scripts/apply-abc-notation.ts && grep -q "solfegeOcrText" scripts/apply-abc-notation.ts</automated>
  </verify>
  <done>Both scripts type-check clean. `ocr-solfege.ts` imports + calls `transcribeOnly` and `solFaToAbcMultiVoice`. `apply-abc-notation.ts` writes `solfegeOcrText` and `abcSatb` columns in addition to `abcNotation`.</done>
</task>

<task type="auto">
  <name>Task 3: Run pipeline and populate DB for all tunes with solfege images</name>
  <files>scripts/output/solfege-ocr.json</files>
  <action>
**Pre-flight: snapshot JPEG state and back up the existing JSON** so we can detect any inadvertent file changes and restore the JSON if the run regresses:
```bash
ls public/tunes/*.jpg | wc -l > /tmp/jpeg-count.before
du -sb public/tunes/ | awk '{print $1}' > /tmp/jpeg-bytes.before
cp scripts/output/solfege-ocr.json scripts/output/solfege-ocr.json.bak
```

**Verify the script does not write into public/tunes/** — only `scripts/output/solfege-ocr.json` should be written:
```bash
grep -nE "writeFileSync|unlinkSync|rmSync|sharp.*toFile" scripts/ocr-solfege.ts
```
Expected: every match is on `OUTPUT_PATH`. If anything targets `public/tunes/`, STOP and fix.

**Run the pipeline** for all tunes (the resume logic in Task 2 ensures only tunes missing the new fields are re-processed; tunes whose JSON already has `solfegeText` and `abcSatb` are skipped):
```bash
npx tsx scripts/ocr-solfege.ts 2>&1 | tee scripts/output/ocr-run.log
```

Expected runtime: roughly 3-8 minutes for ~143 tunes at the existing `DELAY_MS=1200` rate. Cost: ~$2-5 in Claude Sonnet calls. If the run is interrupted, re-run — resume is built in.

If the run exits non-zero because of the 95% soprano-ABC acceptance bar, that is acceptable in this plan IF `solfegeText` and `abcSatb` are still populated for those entries. Inspect failures:
```bash
cat scripts/output/solfege-failures.json 2>/dev/null | head -50
```
The goal of THIS run is OCR text + SATB capture, not 100% soprano ABC validity. If soprano-ABC validity regresses below the prior 143-tune count, restore the JSON backup and re-investigate:
```bash
# Only if regression occurs:
# cp scripts/output/solfege-ocr.json.bak scripts/output/solfege-ocr.json
```

**Apply to DB** (without overwriting hand-crafted abc_notation values):
```bash
npx tsx scripts/apply-abc-notation.ts 2>&1 | tee scripts/output/apply-run.log
```

**Verify DB state**:
```bash
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d psalter -c "
SELECT
  COUNT(*) FILTER (WHERE solfege_jpg_url IS NOT NULL)   AS with_solfege_image,
  COUNT(*) FILTER (WHERE solfege_ocr_text IS NOT NULL)  AS with_ocr_text,
  COUNT(*) FILTER (WHERE abc_satb IS NOT NULL)          AS with_satb,
  COUNT(*) FILTER (WHERE abc_notation IS NOT NULL)      AS with_soprano_abc
FROM tunes;"
```

Expected: `with_ocr_text` and `with_satb` are each roughly equal to the count of tunes that have solfege JPEG files on disk (about 143). `with_soprano_abc` must be >= its previous value (143), never less.

**Verify JPEGs untouched**:
```bash
ls public/tunes/*.jpg | wc -l > /tmp/jpeg-count.after
du -sb public/tunes/ | awk '{print $1}' > /tmp/jpeg-bytes.after
diff /tmp/jpeg-count.before /tmp/jpeg-count.after && diff /tmp/jpeg-bytes.before /tmp/jpeg-bytes.after && echo "JPEGs unchanged" || (echo "JPEG CHANGE DETECTED — abort" && false)
```

**Commit** the updated JSON (and clean up the backup):
```bash
rm -f scripts/output/solfege-ocr.json.bak
git add scripts/output/solfege-ocr.json
git commit -m "feat(data): populate solfege_ocr_text and abc_satb for all tunes with solfege images"
```

(The DB rows are not in git; the JSON is the reproducible source.)
  </action>
  <verify>
    <automated>PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d psalter -tAc "SELECT (SELECT COUNT(*) FROM tunes WHERE solfege_ocr_text IS NOT NULL) >= 140 AND (SELECT COUNT(*) FROM tunes WHERE abc_satb IS NOT NULL) >= 140" | grep -q "^t$"</automated>
  </verify>
  <done>DB has >=140 tunes with non-null `solfege_ocr_text` and >=140 with non-null `abc_satb`. JPEG count and total bytes in `public/tunes/` are unchanged. Updated JSON committed.</done>
</task>

</tasks>

<verification>
- `tunes` table has both new columns: `solfege_ocr_text` and `abc_satb`.
- `scripts/ocr-solfege.ts` uses `transcribeOnly()` and `solFaToAbcMultiVoice()` from `src/lib/`.
- `scripts/apply-abc-notation.ts` writes `solfegeOcrText` and `abcSatb` columns.
- `solfege-ocr.json` contains `solfegeText`, `abc`, and `abcSatb` for each successfully processed tune.
- DB query reports `>= 140` tunes with `solfege_ocr_text IS NOT NULL` AND `>= 140` with `abc_satb IS NOT NULL`.
- `public/tunes/` JPEG count and total bytes are unchanged from pre-run snapshot.
- Three commits land on master: schema migration, script changes, data run.
</verification>

<success_criteria>
- Schema: two new nullable text columns live in the DB and in `src/db/schema.ts`.
- Scripts: type-check clean; OCR script captures all three artefacts per tune; apply script persists them.
- Data: ~143 tunes (the count of tunes with solfege JPEGs on disk) have non-null `solfege_ocr_text` and `abc_satb`; existing `abc_notation` values for the 143 tunes are preserved unless `--overwrite` is explicitly passed.
- JPEGs: zero files in `public/tunes/` modified, added, or deleted.
- Git: three commits with the messages specified in each task.
</success_criteria>

<output>
After completion, create `.planning/quick/260512-ssp-phase-4-9-ocr-pipeline-completion/260512-ssp-SUMMARY.md` recording:
- Final DB counts (with_ocr_text, with_satb, with_soprano_abc)
- Any tunes whose soprano-ABC validation regressed and why
- Total API spend (from claude billing if known, or estimate from log lines)
- The three commit SHAs
</output>
</content>
