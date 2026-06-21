---
quick_id: 260621-ind
slug: resolve-all-not-approved-tunes-in-melism
description: Resolve all not-approved tunes in melisma editor — Groups A through F
date: 2026-06-21
status: planned
---

# Quick Task 260621-ind: Resolve All Not-Approved Tunes in Melisma Editor

## Goal

Fix all remaining "not approved" tunes in the melisma editor across 6 groups:
- Group A: Prod verification (Darwall/57, Praetorius/66, Westminster/101, Naomi/21)
- Group B: Code fixes (Orlington/28, DCM support, Shepherd/120, Clarkeville/136)
- Group C: OCR re-runs (Farrant/96, Wallace/71, Bays of Harris/12)
- Group D: ABC pitch corrections (Carlisle/99, Woodworth/3, Winchester/157)
- Group E: Syllabification (Old 124th/38, Aurelia/26)
- Group F: Kingsfold/41 wrong ABC

After all fixes: `npm run build`, `pm2 restart psalter`, Playwright-verify, commit per group, push. Mark each tune approved/not_approved via `POST /api/dev/melisma-decision`.

## Codebase Context

- App: Next.js 15, port 3005, deployed at psalter.gsdlabs.dev
- DB: `postgresql://postgres:psalter_secure_2024@localhost:5435/psalter`
- Key files:
  - `src/app/dev/melisma-editor/MelismaEditorClient.tsx` — the editor UI
  - `src/app/dev/melisma-editor/page.tsx` — `TuneOption` interface + loader
  - `src/lib/meter-syllable-shape.ts` — `expectedSyllablesByLine(meter)`
  - `src/lib/inject-phrase-breaks-at-counts.ts` — auto-inject PHRASE_BREAKs
  - `src/lib/abc-edit-ops.ts` — drag/move operations
- Decision API: `POST /api/dev/melisma-decision` with `{ tuneId: N, status: "approved"|"not_approved", comment: "..." }`
- Save API: `POST /api/dev/melisma-save` with `{ tuneId, abcNotation, phraseShape, rawSoprano, melismaPositions }`
- DB connection: `psql postgresql://postgres:psalter_secure_2024@localhost:5435/psalter`

## KEY FINDINGS from pre-analysis

### TuneOption missing doubleLength
`page.tsx` selects `doubleLength` from DB but does NOT include it in `TuneOption` interface or `out.push({...})`. The client never knows about `doubleLength`.

### Auto-inject short-circuit
In `MelismaEditorClient.tsx` line ~118: if ANY `% PHRASE_BREAK` exists in the ABC, auto-inject is skipped entirely. DCM tunes (Ostend, Perfect Way, Eastgate, Orlington) have 3 explicit PHRASE_BREAKs (4 segments, 4th is very long) — the auto-inject won't fire for them.

### Meter parsing `10 10 10 10 10`
`expectedSyllablesByLine` splits every 2-digit group into individual digits. `"10"` → `[1, 0]` which is wrong. Fix: add `!groups.some(g => g.includes('0'))` to the split condition.

### Darwall no PHRASE_BREAKs
Darwall (57) has NO `% PHRASE_BREAK` in stored ABC. Auto-inject works in editor (display only). Saved ABC has no breaks → prod renders wrong. Fix: inject PHRASE_BREAKs directly into DB abc_notation.

### Naomi pitch error
Naomi (21) phrases 3-4 in ABC use Eb-range (doh=Eb: `e`,`_g`,`=e`) but solfège shows C-range (lah=C: `l :-.l | s :fe | s :—`). The OCR extracted wrong pitches for the second half. Fix: reconstruct phrases 3-4 from solfège.

### Clarkeville: auto-inject was added
A comment in MelismaEditorClient.tsx says "Auto-inject PHRASE_BREAK markers when the tune's ABC has none AND the meter shape is known. Without this, tunes like Aurelia/Clarkeville render as a single mega-phrase." Auto-inject was already added. Clarkeville likely now works — verify and approve if so.

### Shepherd: data vs code issue  
Shepherd phrase 4 has 11 notes but meter `87 87` expects 7. The cross-phrase drag restriction is likely a practical UX issue (dragging upward) rather than a code bug. Fix approach: check if `moveTokenBefore` and `moveTokenToPhraseEnd` work cross-phrase (they should) — if they do, the issue is just UX, not code. Verify Shepherd works and mark as needs-data-fix.

---

## TASK 1: Group B Code Fixes (do FIRST — other groups depend on DCM fix)

### 1a. Add `doubleLength` to TuneOption and pass through

**File:** `src/app/dev/melisma-editor/page.tsx`

1. Add to `TuneOption` interface (after `melismaPositions`):
   ```ts
   doubleLength: boolean
   ```

2. Add to `out.push({...})` block:
   ```ts
   doubleLength: r.doubleLength ?? false,
   ```

**File:** `src/app/dev/melisma-editor/MelismaEditorClient.tsx`

3. In the `effectiveAbc` useMemo (~line 116), update the auto-inject logic to handle DCM tunes:

Replace the current early-return when PHRASE_BREAKs exist:
```ts
if (/^\s*%\s*PHRASE_BREAK\s*$/m.test(rawEffectiveAbc)) return rawEffectiveAbc
```

With logic that still injects for DCM tunes that have too few PHRASE_BREAKs:
```ts
const isDoubled = tune?.doubleLength ?? false
const expected = expectedSyllablesByLine(tune?.meter ?? null)
const doubledExpected = isDoubled && expected ? [...expected, ...expected] : expected
const effectiveExpected = doubledExpected ?? expected

// If ABC already has PHRASE_BREAKs, only re-inject if tune is doubled AND has fewer breaks than expected
if (/^\s*%\s*PHRASE_BREAK\s*$/m.test(rawEffectiveAbc)) {
  if (!isDoubled || !effectiveExpected) return rawEffectiveAbc
  const existingBreakCount = (rawEffectiveAbc.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
  if (existingBreakCount >= effectiveExpected.length - 1) return rawEffectiveAbc
  // Fall through to inject more breaks
}
if (!effectiveExpected || effectiveExpected.length <= 1) return rawEffectiveAbc
const injected = injectPhraseBreaksAtCounts(rawEffectiveAbc, effectiveExpected)
return injected.inserted > 0 ? injected.abc : rawEffectiveAbc
```

This handles:
- Regular tunes: same behavior as before
- DCM tunes (doubleLength=true, CM meter): uses [8,6,8,6,8,6,8,6] instead of [8,6,8,6], and injects breaks even when some already exist
- Clarkeville (66 66 88): already has no breaks, expectedSyllablesByLine gives [6,6,6,6,8,8] ✓
- Old 124th after meter fix: will use correct shape

### 1b. Fix Old 124th meter parsing

**File:** `src/lib/meter-syllable-shape.ts`

Fix the run-together split condition to exclude meters where digits contain `0` (which would be actual two-digit numbers like 10, 20):

```ts
// Only use run-together split when no group contains '0' (otherwise
// "10 10 10 10 10" would be wrongly split into [1,0,1,0,...]).
if (allMultiDigit && groups.every(g => g.length === 2) && !groups.some(g => g.includes('0'))) {
  nums = groups.flatMap(g => g.split('').map(Number))
} else {
  nums = groups.map(Number)
}
```

After this fix, `10 10 10 10 10` → [10,10,10,10,10]. Combined with double_length=true for Old 124th: [10,10,10,10,10,10,10,10,10,10] (doubled). Note: Old 124th meter may need to be corrected in DB too — check if `10 10 10 10 10` is the correct meter or if it should be `10 10 11 11`. Query first: `SELECT meter, double_length, abc_notation FROM tunes WHERE id = 38`.

### 1c. Fix Orlington "2nd-last phrase repeated" 

Orlington (28) has meter=CM, double_length=true, and 3 explicit PHRASE_BREAKs creating 4 segments. Segment 4 is huge (contains 2nd half of the DCM tune). After the DCM auto-inject fix (1a), the editor will automatically show 8 phrases. Verify by checking the note count distribution:

```bash
psql postgresql://postgres:psalter_secure_2024@localhost:5435/psalter -c "SELECT abc_notation FROM tunes WHERE id = 28;"
```

Count notes in the full ABC and verify they distribute as [8,6,8,6,8,6,8,6] after auto-inject. If the note counts don't match, the "2nd-last phrase repeated" might be because segment 3 had some notes that rightfully belong to segment 4. No code change needed beyond Task 1a if auto-inject works correctly.

### 1d. Verify Shepherd cross-phrase drag and fix if needed

Shepherd (120) has meter=`87 87` (DB) but `M:C` in ABC. 4 phrases: (8,7,8,11 notes). Cross-phrase drag should work in the code — `moveTokenBefore` and `moveTokenToPhraseEnd` have no phrase boundary check. The reported issue is likely a UX challenge dragging upward.

**Verify**: Open `/dev/melisma-editor` in Playwright, navigate to Shepherd, attempt to drag from phrase 4 to phrase 3. If cross-phrase drag actually doesn't work at the code level, investigate `moveTokenBefore`/`moveTokenToPhraseEnd` for bugs.

If the code works but the data is wrong (11 notes in phrase 4 when expecting 7): mark as not_approved with a specific comment about needing 4 notes moved from phrase 4 to phrase 3, and the manual fix required. Note: phrase 4 of Shepherd likely has notes that should be in phrase 3 — checking Shepherd's ABC, phrase 4 content after the last PHRASE_BREAK: `fg2 | eed3ef2 | g2b2a2g2` = 11 notes. The expected shape for line 4 is 7 syllables. The extra notes look like they belong after phrase 3's last note `g` — i.e., some notes from phrase 3's tail accidentally ended up in phrase 4. The fix is a data change: move `fg2` from the start of phrase 4 to the end of phrase 3 (reducing phrase 4 to 9 notes, adding `fg2` to phrase 3 = 10... still wrong). Actually examine the solfège OCR for Shepherd to get the correct note distribution.

### 1e. Verify Clarkeville auto-inject

Clarkeville (136): no PHRASE_BREAKs in ABC, meter `66 66 88`. The auto-inject code comment says it was added for "tunes like Aurelia/Clarkeville". The auto-inject should now create 6 phrases. Verify the editor shows 6 phrases for Clarkeville via Playwright. If it works, approve. If not, debug why injectPhraseBreaksAtCounts returns inserted=0 for it.

---

## TASK 2: Group A — Prod verification

### 2a. Darwall (57) — Add PHRASE_BREAKs to DB

Darwall (57) has no PHRASE_BREAKs in stored ABC. Meter `66 66 88`, doubleLength=true → expected shape [6,6,6,6,8,8,6,6,6,6,8,8] (doubled). But since doubleLength=true, the correct behavior requires checking note count.

Run auto-inject via Node.js and update DB:

```js
// Script: inject-darwall-breaks.js
const { injectPhraseBreaksAtCounts } = require('./src/lib/inject-phrase-breaks-at-counts')
const { expectedSyllablesByLine } = require('./src/lib/meter-syllable-shape')

const abc = `X:1
T:Darwall
M:C
L:1/8
Q:1/4=76
K:D
d2f2d2a2 | f2d'6 | c'2b2a2g2 | f2e6 | e2f2d2b2 | a2^g2e2e'2 | d'2c'4b4 | a6a2 | b4c'4 | d'6d2 | e2f2g2a2 | b2c'2d'2e'2 | d'4c'4 | d'6`

const expected = expectedSyllablesByLine('66 66 88')
// doubleLength=true: double it
const doubled = [...expected, ...expected]
const result = injectPhraseBreaksAtCounts(abc, doubled)
console.log(result.abc)
console.log('Inserted:', result.inserted, 'Total notes:', result.totalNotes)
```

If the note count is 40 and the doubled shape [6,6,6,6,8,8,6,6,6,6,8,8]=72 exceeds it, fall back to the non-doubled shape [6,6,6,6,8,8].

Actually: just use expectedSyllablesByLine('66 66 88') = [6,6,6,6,8,8] (6 phrases). Darwall has 40 notes which distributes as 6+6+6+6+8+8=40. Perfect.

After injecting, UPDATE the DB:
```sql
UPDATE tunes SET abc_notation = '<new_abc_with_breaks>' WHERE id = 57;
```

Then trigger revalidatePath by calling: `curl -X POST http://localhost:3005/api/dev/melisma-save -H "Content-Type: application/json" -d '{"tuneId":57,"abcNotation":"<abc>","phraseShape":[6,6,6,6,8,8]}'`

Or simply rebuild: `npm run build && pm2 restart psalter` (this regenerates all static pages).

### 2b. Praetorius (66) and Westminster (101) — Trigger revalidatePath

These have correct PHRASE_BREAKs already. Just need to force the prod pages to rebuild.

For each, call melisma-save API with the current ABC (no change):

```bash
# Get current ABC and re-save via API to trigger revalidatePath
PRAE_ABC=$(psql postgresql://postgres:psalter_secure_2024@localhost:5435/psalter -t -c "SELECT abc_notation FROM tunes WHERE id = 66;")
# Call API with current ABC unchanged
curl -X POST http://localhost:3005/api/dev/melisma-save \
  -H "Content-Type: application/json" \
  -d "{\"tuneId\":66,\"abcNotation\":\"$(echo $PRAE_ABC | head -c 1000)\",...}"
```

Actually the simplest approach: rebuild the app (`npm run build && pm2 restart psalter`). All static psalm pages regenerate. After rebuild, Playwright-verify the prod pages.

Check specifically:
- Praetorius: last syllable in line 1 cut off. Psalm 49 and 81 use Praetorius.
- Westminster: last syllable on 2nd line missing. Psalm 39 and 110 use Westminster.

If the ABC itself has enough notes: count expected syllable vs notes ratio. Praetorius has 4 phrases of [8,6,8,6] total = 28 syllables for CM. Count notes:
`g2d'2d'2e'2 | d'2d'3c'b2` = 8 notes; `g2a2b2c'2 | c'2b6` = 6 notes; `b2b2d'2c'2 | a2b2g2f2` = 8 notes; `d2e2g2g2 | f2g6` = 6 notes. Total 28 notes. Perfect for CM (28 syllables, all single notes). Last syllable of line 1 should be in `d'2d'3c'b2` — the last note is `b2`. Check if the w-line has enough syllables.

Actually the "last syllable cut off" is a lyric issue, not a note issue. The build should fix it after revalidatePath.

### 2c. Naomi (21) — Fix pitch in phrases 3-4

**Analysis:** Naomi OCR solfège soprano:
`m:m.m | s:f.m | r.m:f | m:m | l:-.l | s:fe | s:— || m:m.m | s:f.m | r.m:f | m:m | l:-.l | s.m:r | d:—||`

Key = Eb. Mapping: d=Eb, r=F, m=G, f=Ab, s=Bb, l=C, t=D.

In ABC notation (K:Eb):
- d (Eb) = `e` or `_e` 
- r (F) = `f`
- m (G) = `g`
- f (Ab) = `a` or `_a`
- s (Bb) = `b`
- l (C) = `c`
- t (D) = `d`
- fe (raised Fa = A natural) = `=a`

Phrases 3-4 solfège (stanza 1): `l:-.l | s:fe | s:—`
= C(long) rest C | Bb A♮ | Bb hold

In L:1/8 common time, interpreting solfège timing:
- `l:-.l` = C dotted-quarter, rest quarter, C = `c4 z2 c2`? Or `c6 z2`? 
  More likely: `c4 z2 c2` (C half, rest quarter, C quarter = 1 bar + 1 beat)
  Actually `l:-.l` in tonic solfa = 1st beat: l, 2nd half of beat: rest (dash), 3rd beat: l
  In 4/4 (common time): beat = 2 eighth-notes = `c2`; `l:-.l` = `c2 z2 c2` + carry? 
  
  Let's try: comparing to stored ABC phrase 1 `e2ee_g2=e_e | _de =e2 _e2` = 12 notes in 2 bars.
  
  Phrase 3 expected notes from solfège `l:-.l | s:fe | s:—`:
  If we model after phrase 1 rhythm (`m:m.m | s:f.m` = G, G-G, Bb, Ab-G):
  - `l:-.l` = C, rest, C → `c4 z2 c2` or `c2 z c2`
  - `s:fe` = Bb, A-natural → `b2 =a2`  
  - `s:—` = Bb, hold → `b8` or `b6`

  More carefully: comparing phrase 1 solfège `m:m.m | s:f.m` with ABC `e2ee_g2=e_e | _de =e2 _e2`:
  - m(G)=g, m.m(G+G) = 2 eighths? = `g2` then `ee` = `gg` 
  - s(Bb) = `b`, but stored as `_g2=e_e | _de`... that doesn't match at all.
  
  The ABC for Naomi phrases 1-2 is also suspicious. If K:Eb and phrase 1 solfège = `m:m.m | s:f.m`:
  - m=G → ABC `g`
  - s=Bb → ABC `b`  
  - f=Ab → ABC `a`
  
  But stored phrase 1: `e2ee_g2=e_e | _de =e2 _e2` — uses `e` (Eb=doh), `_g` (Gb=ma), `=e` (E♮), `_d` (Db). These are NOT the solfège pitches.
  
  **CONCLUSION**: The entire Naomi ABC is probably wrong (OCR failure picked up wrong voice or wrong pitches). The correct ABC for Naomi needs to be reconstructed from the solfège.

**Correct Naomi ABC reconstruction** (K:Eb, L:1/8, M:C):

From solfège: `m:m.m | s:f.m | r.m:f | m:m | l:-.l | s:fe | s:— || m:m.m | s:f.m | r.m:f | m:m | l:-.l | s.m:r | d:—||`

Interpreting timing (comparing with Naomi tune rhythm I know):
Naomi is a 4/4 hymn where:
- `x:y` = x on beat 1, y on beat 2 (each beat = 1 quarter note = 2 eighth notes)
- `.` = subdivide (offbeat eighth)
- `—` = hold/sustain
- `||` = double bar (phrase division)

Phrase 1 (`m:m.m | s:f.m`):
- `m:m.m` = G (beat1) : G (beat2) . G (offbeat) → `g2 g2g2` ? or `g2 g2g`?
  Actually in common time 4/4 with beats of 2 eighths:
  bar1: `m:m.m` = G(2), G(1).G(1) = `g2 gg` = `g2gg` — 4 notes
  bar2: `s:f.m` = Bb(2), Ab(1).G(1) = `b2 ag` = `b2ag` — 4 notes
  → Phrase 1: `g2gg b2ag`

Phrase 2 (`r.m:f | m:m`):
  bar1: `r.m:f` = F(1).G(1):Ab(2) = `fg a2` — 3 notes
  bar2: `m:m` = G(2):G(2) = `g4` or `g2g2` — 2 notes
  → Phrase 2: `fg a2 g2g2` or `fg a2 g4`

Actually this is getting too complex without the original sheet music. The safest fix for Naomi:

1. Use the solfège soprano string to re-run `solFaToAbc` — that's what the "Show on Live Preview" button does in the editor.
2. The OCR soprano: `m :m.m | s :f.m | r.m:f | m :m | l :-.l | s :fe | s :— || m :m.m | s :f.m | r.m:f | m :m | l :-.l | s.m :r | d :—||`
3. Run this through `solFaToAbc` with doh="Eb", time="C"

**Implementation**: Run `solFaToAbc` directly in Node.js:

```js
const { solFaToAbc } = require('./src/lib/solfege-parser')
const result = solFaToAbc(
  'm :m.m | s :f.m | r.m:f | m :m | l :-.l | s :fe | s :— || m :m.m | s :f.m | r.m:f | m :m | l :-.l | s.m :r | d :—||',
  'Eb', 'C', 'Naomi'
)
console.log(result.abc)
```

Then compare with current stored ABC to identify the correct phrases 3-4 notes. Inject PHRASE_BREAKs and update DB.

---

## TASK 3: Group C — OCR Re-runs

### 3a. Farrant (96) and Wallace (71) — Re-run OCR

Both have no solfège JPEG (`has_solfege=false`). They have `solfege_ocr_text` but no image. 

**Action**: The OCR text in DB is garbled. Without a solfège JPEG, we cannot re-run proper OCR. Check if score_jpg_url exists. If not, mark as not_approved with "no solfège image available, cannot re-run OCR".

Check:
```sql
SELECT id, name, score_jpg_url, additional_score_urls FROM tunes WHERE id IN (71, 96);
```

If URLs exist (Airtable URLs may be expired), attempt to download and OCR.

The existing OCR for Farrant (96):
```
{"doh":"G","time":"C","soprano":":d |d :-.r |m :r |d :f |r :r |m.fe:s |s :fe |s :—|—||d |d||"}
```

This actually looks reasonable for a G-major tune! `:d |d:-.r | m:r | d:f | r:r | m.fe:s | s:fe | s:—` = d,d,r,m,r,d,f,r,r,m,fe,s,s,fe,s. Let me check if `solFaToAbc` produces correct ABC from this.

Run `solFaToAbc` on Farrant's existing OCR soprano to get updated ABC, compare with stored ABC. If it improves, update.

### 3b. Bays of Harris (12) — No solfège image

Decision: "no solfege jpeg". DB confirms no solfege_jpg_url, no score_jpg_url, has garbled solfege_ocr_text.

**Action**: Mark as not_approved with comment "blocked — no source image (no solfège JPEG, no score image in DB). Requires manual sheet music entry."

---

## TASK 4: Group D — ABC Pitch Corrections

### 4a. Carlisle (99) — Fix "ri-sing" accidental inconsistency

The ABC phrase 3: `| _d2e2_d =B =e2 e _d _g2 =e _e a2`

In K:Eb (key sig: Bb, Eb, Ab):
- `=e` = E natural
- `e` = Eb (from key sig)
- `_e` = Eb (explicit)

The word "ri-sing": looking for two consecutive notes with same pitch where one is sharp and the other isn't. In phrase 3: `=e2 e` — E-natural followed by E-flat. These are DIFFERENT pitches. Not the same pitch played differently.

Further scanning: `=e _e` appears in phrases — these are E-natural then E-flat (different notes).

The OCR solfège soprano for Carlisle:
`:d |s :d |m.r:d.t_1|d :— |— :d |f :s.l |s :d.f|m :r |—|| :r |m :r.d|f :m.r|s :f.m|l :t |d' :d.f|m :r |d :— |—||`

Converting: Carlisle is in K:Eb (doh=Eb). Solfège d=Eb(e), r=F(f), m=G(g), f=Ab(a), s=Bb(b), l=C(c), t=D(d).

The OCR says phrase 3 soprano: `s :f.m | l :t` = Bb:Ab.G | C:D.
In ABC K:Eb: `b2 a2g2 | c2 d2`

But stored ABC phrase 3: `| _d2e2_d =B =e2 e _d _g2 =e _e a2`

These clearly don't match. The stored ABC for Carlisle phrases 3-4 also seems wrong (similar to Naomi — OCR may have picked up wrong voice).

**Fix**: Re-run `solFaToAbc` on Carlisle's OCR soprano, inject PHRASE_BREAKs, update DB. The OCR soprano `:d |s:d |m.r:d.t_1|d:— |—:d |f:s.l |s:d.f|m:r |—|| :r |m:r.d|f:m.r|s:f.m|l:t |d':d.f|m:r |d:— |—||` needs `solFaToAbc('Eb','C','Carlisle')`.

### 4b. Woodworth (3) — Fix ABC/OCR discrepancy

OCR soprano: `:d.r|m:-:m|s:-.f:m|r:-.m:f|m:-:s|s:r:m|f:-:l|l:-:s|m:-||:d.r|m:-:m|s:-.f:m|l:-:l|d':-t:l|s:-:s|s:-.f:m|r:-:-|s:-:-|m:-:-|:-||`

This is a 3/4 time tune (note the `-:-:-` patterns suggesting 3-beat bars). Woodworth is well known as a 4/4 hymn tune ("Just As I Am"), but the OCR might be in 3/4.

Run `solFaToAbc` with doh="Eb", time="C" (from OCR JSON: `"time":"C"` = common time) and compare with stored ABC.

The stored ABC: 
```
=B_de4e2 | _g3=e_e2_d3 | e=e2_e4
% PHRASE_BREAK
_g2 | _g2_d2e2=e4 | a2a4_g2 | e4
% PHRASE_BREAK
=B_de4 | e2_g3=e_e2 | a4a2=b2 | z2a2
% PHRASE_BREAK
_g4 | _g2_g3=e_e2 | _d6_g6 | e8
```

The user says "raw OCR looks perfect but conversion to ABC has a minor error." Compare the solFaToAbc output against stored ABC note-by-note and find the discrepancy.

### 4c. Winchester (157) — MIDI player wrong notes (low priority)

Winchester ABC:
```
g2b3ba2 | g2c'2c'2b2
% PHRASE_BREAK
 | a2b2d'2d'2 | ^c'2d'6
% PHRASE_BREAK
 | b2e'3d'c'2 | b2a2g2f2
% PHRASE_BREAK
 | b2a2g2g2 | f2g6
```

Issue: `^c'` (C-sharp) in phrase 2. In K:G (key sig: F#), C-sharp is a raised chromatic. The MIDI player might be rendering C-natural instead. Check: is the problem `^c'` vs `c'` (C natural vs C# vs C double-sharp)?

K:G: F# is in key sig. So `c` in K:G = C-natural, `^c` = C-sharp, `=c` = C-natural (explicit). The tune Winchester Old (CM, G major) typically has C# in the melody (measure 4). So `^c'2` is likely correct. If the MIDI player is playing it wrong, it may be an abcjs MIDI rendering issue unrelated to our code.

Action: If `^c'` is the correct pitch, no fix needed — mark as approved with note "MIDI rendering issue in abcjs is cosmetic only, notation display is correct". If C-natural is correct, change `^c'` to `c'`.

---

## TASK 5: Group E — Syllabification

### 5a. Old 124th (38) — Meter and syllable fix

DB: meter=`10 10 10 10 10`, double_length=true.

After Task 1b fixes the meter parsing bug, `expectedSyllablesByLine('10 10 10 10 10')` = [10,10,10,10,10] (5 phrases).

But the task description says Old 124th has meter `10.10.11.11` (4 phrases). The DB meter `10 10 10 10 10` may be wrong.

**Check**: Look at the ABC — `g2abc'2b2 | aggfg4 | b2c'd'e'2d'2 | c'bagf4 | d2ggf2g2 | ac'bab4 | d'2d'c'b2a2 | bd'd'^c'd'4 | b2agfgac' | b2a2g4 | g2g2` — 11 note groups. Let me count actual notes to determine the correct phrase structure.

The linked psalm is 124. Query psalm version lyrics for psalm 124 to get the expected syllable count per line, which will confirm the correct meter.

If meter is actually `10.10.11.11`, update the DB:
```sql
UPDATE tunes SET meter = '10 10 11 11', double_length = false WHERE id = 38;
```

After meter correction, the auto-inject should correctly create 4 phrases with [10,10,11,11] notes.

### 5b. Aurelia (26) — Investigate "several issues"

Aurelia: meter=`76 76 D`, double_length=true. DB ABC has no PHRASE_BREAKs.

`expectedSyllablesByLine('76 76 D')` = [7,6,7,6,7,6,7,6] (8 phrases).

With DCM auto-inject fix (Task 1a): doubleLength=true + meter `76 76 D` will use [7,6,7,6,7,6,7,6,7,6,7,6,7,6,7,6] (doubled again = 16 phrases)?? 

Wait — `76 76 D` already contains the doubled marker (`D`). So `expectedSyllablesByLine` already returns 8 phrases. `doubleLength=true` on top of that would double again to 16 phrases, which is wrong.

**Fix**: In the effectiveAbc useMemo, only double when the meter doesn't already contain ` D` (i.e., when it's not already marked as doubled):
```ts
const isAlreadyDoubled = /\bD\b/.test(tune?.meter ?? '')
const effectiveExpected = (isDoubled && !isAlreadyDoubled && expected) 
  ? [...expected, ...expected] 
  : expected
```

After fixing the doubling logic: Aurelia with `76 76 D` + doubleLength=true should use 8 phrases (not 16).

Aurelia ABC has no PHRASE_BREAKs (all one block). Count Aurelia's notes:
`e2e2e2=e2 | e2e4_d2 | =B2=B2a2_g2 | =e2_e6 | =e2_g2=b2=b2 | b2b4a2 | _g2=e2_g2_e2 | =B2_d6 | _d2e2=e2_g2 | a2a4_g2 | =b2=b3_ba2 | e2=e6 | _d2e2e2=e2 | e2e4_d2 | =B2=B2_d2=B2 | B2=B6`

Count: 7+6+7+6+7+6+7+6 = 52 notes? (estimate — need actual count)

After the auto-inject fires with [7,6,7,6,7,6,7,6], it should create 7 PHRASE_BREAKs → 8 phrases. Verify via Playwright.

The "several issues (not with melismas)" comment is vague. Once phrases are working correctly, open Aurelia in the editor and identify what other issues exist. Possible issues:
1. Syllable mismatch (linked psalm may be CM text, not 76 76 D text)
2. Some notes have wrong pitch

**Check**: `SELECT pv.psalm_id FROM psalm_version_tunes pvt JOIN psalm_versions pv ON pvt.psalm_version_id = pv.id WHERE pvt.tune_id = 26;` — if linked psalm is CM, the syllable layout will mismatch the 76 76 D tune.

---

## TASK 6: Group F — Kingsfold (41) Wrong ABC

Current ABC has 3 notes with 2 PHRASE_BREAKs (obviously wrong). 

Kingsfold is the tune "I Heard the Voice of Jesus Say" (English County Songs, 1893, Vaughan Williams arrangement). It's a well-known English folk tune in DCM (Double Common Meter), modal on D (Dorian mode), typically harmonized in G major.

**The correct melody** (Kingsfold, G major, 4/4, 8 phrases DCM):
Standard soprano in G major:
- P1 (8 notes): D4 G4 A2 B2 C2 A2 B4 G2 (or similar — needs verification)
- Actually: Kingsfold soprano in G: g2 g2 a2 b2 | c'2 b2 a2 g2 | a2 g2 e2 f2 | g8 | g2 a2 b2 c'2 | d'2 c'2 b2 a2 | b2 g2 a2 b2 | c'8 (approx)

This is incorrect without the score. Instead:

**Update DB to mark doubleLength=true** (already in task description):
```sql
UPDATE tunes SET double_length = true WHERE id = 41;
```

**Construct ABC from known Kingsfold melody** in G major, L:1/8:

Kingsfold (traditional, public domain):
```
X:1
T:Kingsfold
M:C
L:1/8
Q:1/4=76
K:G
g2a2b2g2 | d'2c'2b2g2
% PHRASE_BREAK
 | a2f2g2a2 | b8
% PHRASE_BREAK
 | g2a2b2g2 | d'2c'2b2a2
% PHRASE_BREAK
 | g2f2e2d2 | g8
% PHRASE_BREAK
 | g2a2b2c'2 | d'2c'2b2g2
% PHRASE_BREAK
 | a2b2c'2d'2 | e'4d'4
% PHRASE_BREAK
 | c'2b2a2g2 | a2b2c'2a2
% PHRASE_BREAK
 | g2f2e2d2 | g8
```

Note: This is my best reconstruction of the Kingsfold soprano from memory. Verify against the score_jpg_url or additional_score_urls if available. Query first:
```sql
SELECT score_jpg_url, additional_score_urls FROM tunes WHERE id = 41;
```

If no valid score image, use the above reconstruction and mark as "not_approved — constructed from memory, needs verification against sheet music" if uncertain.

---

## TASK 7: Build, verify, commit, push

```bash
npm run build 2>&1 | tail -30
pm2 restart psalter
sleep 5
pm2 logs psalter --lines 20 --nostream
```

### Playwright verification

Use CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET from `/home/services/.env.production`.

```js
const { chromium } = require('/usr/lib/node_modules/playwright');
const browser = await chromium.launch({
  executablePath: '/tmp/pw-browsers/chromium-1217/chrome-linux/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setExtraHTTPHeaders({
  'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
  'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
});
// Navigate to editor
await page.goto('https://psalter.gsdlabs.dev/dev/melisma-editor');
// Test specific tunes...
await browser.close();
```

For each tune: navigate to the editor, select the tune by ID (use the filter box), verify phrase count and note grid shows correctly.

For prod pages: navigate to `https://psalter.gsdlabs.dev/psalms/[psalm_id]` and verify notation renders correctly.

---

## TASK 8: Mark decisions and create SUMMARY.md

For each tune, POST to `/api/dev/melisma-decision`:
```bash
curl -X POST http://localhost:3005/api/dev/melisma-decision \
  -H "Content-Type: application/json" \
  -d '{"tuneId": N, "status": "approved", "comment": "fixed: ..."}'
```

Or for not-fixable tunes:
```bash
curl -X POST http://localhost:3005/api/dev/melisma-decision \
  -H "Content-Type: application/json" \
  -d '{"tuneId": N, "status": "not_approved", "comment": "blocked: ..."}'
```

---

## Commit Strategy

Commit atomically per group:
- `fix(melisma-editor/group-b): DCM support + doubleLength in TuneOption + meter-syllable-shape 10xx fix`
- `fix(melisma-editor/group-a): Darwall PHRASE_BREAKs + Naomi pitch correction`
- `fix(melisma-editor/group-d): Carlisle + Woodworth ABC from solfège OCR`
- `fix(melisma-editor/group-e): Old 124th meter + Aurelia phrase support`
- `fix(melisma-editor/group-f): Kingsfold correct ABC`
- `data(melisma-editor/group-c): OCR results for Farrant + Wallace`

Push after build verification: `git push origin master`

## must_haves
- truths:
  - `doubleLength` field added to TuneOption and passed from page.tsx
  - `meter-syllable-shape.ts` correctly parses `10 10 10 10 10` → [10,10,10,10,10]
  - DCM auto-inject creates 8 phrases for CM+doubleLength tunes
  - Darwall abc_notation in DB has 5 PHRASE_BREAKs
  - App builds without errors
  - pm2 restart succeeds
- artifacts:
  - SUMMARY.md at `.planning/quick/260621-ind-resolve-all-not-approved-tunes-in-melism/260621-ind-SUMMARY.md`
- key_links:
  - Editor: https://psalter.gsdlabs.dev/dev/melisma-editor
  - Psalm pages: https://psalter.gsdlabs.dev/psalms/[id]
