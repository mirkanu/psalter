---
phase: quick
plan: 260512-qmy
type: execute
wave: 1
depends_on: []
files_modified:
  - public/tunes/old-124th-solfege-0.jpg
  - public/tunes/old-124th-solfege-1.jpg
  - src/lib/ocr-solfege-v2.ts
  - src/lib/solfege-parser.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "old-124th-solfege-0.jpg is the first page (has OLD 124TH title and DOH=G header)"
    - "old-124th-solfege-1.jpg is the continuation page"
    - "TRANSCRIPTION_PROMPT instructs Claude to transcribe Image 1 fully before Image 2"
    - "parseSyllable(',r') returns octaveShift=0, not -1"
    - "Glasgow soprano line produces correct octaves — 'a' (A4) not 'A' (A3) for lah, 'e'' (E5) not 'e' (E4) for mi"
  artifacts:
    - path: "public/tunes/old-124th-solfege-0.jpg"
      provides: "First page of Old 124th solfege (title + DOH header)"
    - path: "src/lib/solfege-parser.ts"
      provides: "Fixed parseVoiceLine — strips leading comma artifact from dotted-comma splits"
  key_links:
    - from: "src/lib/solfege-parser.ts parseVoiceLine"
      to: "parseSyllable"
      via: "subTokens after split('.')"
      pattern: "strip comma from i > 0 tokens starting with ','"
---

<objective>
Fix two OCR pipeline bugs: (1) Old 124th solfege JPEG pages are in wrong numeric order causing Claude Vision to read continuation before first page; (2) Glasgow soprano notes are an octave too low because dotted-comma rhythm notation (m.,r) produces a spurious leading comma after the dot split, triggering the lower-octave rule in parseSyllable.

Purpose: Both bugs cause incorrect ABC output and silent audio errors that are hard to diagnose later.
Output: Swapped image files, improved multi-page OCR prompt, and fixed parser subtoken stripping.
</objective>

<execution_context>
@/data/home/psalter/.claude/get-shit-done/workflows/execute-plan.md
@/data/home/psalter/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/data/home/psalter/.planning/PROJECT.md
@/data/home/psalter/.planning/ROADMAP.md
@/data/home/psalter/.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Swap Old 124th solfege page files and improve multi-page OCR prompt</name>
  <files>public/tunes/old-124th-solfege-0.jpg, public/tunes/old-124th-solfege-1.jpg, src/lib/ocr-solfege-v2.ts</files>
  <action>
Swap the two JPEG files so that numeric order matches reading order:

1. Use a temp file to perform a safe three-step swap:
   ```bash
   cp public/tunes/old-124th-solfege-0.jpg public/tunes/old-124th-solfege-tmp.jpg
   cp public/tunes/old-124th-solfege-1.jpg public/tunes/old-124th-solfege-0.jpg
   cp public/tunes/old-124th-solfege-tmp.jpg public/tunes/old-124th-solfege-1.jpg
   rm public/tunes/old-124th-solfege-tmp.jpg
   ```
   After the swap, solfege-0.jpg must be the page with "OLD 124TH" title + "DOH=G." header.

2. In `src/lib/ocr-solfege-v2.ts`, find the TRANSCRIPTION_PROMPT constant. Replace the multi-page instruction:

   BEFORE (current text):
   ```
   Multi-page tunes: read all pages in order, left to right.
   ```

   AFTER:
   ```
   Multi-page tunes: images are provided in page order (Image 1 first, Image 2 second). Transcribe Image 1 completely — every line from top to bottom — before moving to Image 2. Never interleave or skip lines.
   ```
  </action>
  <verify>
    <automated>
# Verify solfege-0 is the larger file (first page has more content) and contains title metadata
# The first page image file will differ from the continuation page — check file sizes differ and swap occurred
ls -la /data/home/psalter/public/tunes/old-124th-solfege-*.jpg

# Read the first few bytes via file command to confirm it's a valid JPEG after the swap
file /data/home/psalter/public/tunes/old-124th-solfege-0.jpg

# Verify the OCR prompt was updated
grep -n "Image 1 first, Image 2 second" /data/home/psalter/src/lib/ocr-solfege-v2.ts
    </automated>
  </verify>
  <done>solfege-0.jpg and solfege-1.jpg are swapped (both valid JPEGs, different sizes); TRANSCRIPTION_PROMPT contains "Image 1 first, Image 2 second" and "Transcribe Image 1 completely".</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Fix dotted-comma octave bug in solfege-parser parseVoiceLine</name>
  <files>src/lib/solfege-parser.ts</files>
  <behavior>
    - parseSyllable(',r') must return { syllable: 'r', octaveShift: 0 } after the caller strips the artifact comma — the fix is in parseVoiceLine's subTokens construction, not in parseSyllable itself
    - Glasgow line ':s_1 |d :— :r |m.,r:d :m |s.,l:s :f |m :— :m |r :— :f |m.,r:d :t_1 |d :—||' with DOH=G in key C must produce note string containing 'a' (A4) not 'A' (A3), and 'e'' (E5) not 'e' (E4)
    - Existing non-dotted-comma lines must be unaffected (comma-as-octave-shift still works for tokens that are not i>0 artifacts)
  </behavior>
  <action>
In `src/lib/solfege-parser.ts`, locate the `parseVoiceLine` function. Find the subTokens construction block (around line 258):

```ts
const subTokens = slot.split('.').map(s => s.trim()).filter(Boolean)
const halfBeat = subTokens.length > 1
const unitDur = halfBeat ? 1 : 2
```

Replace with:

```ts
const rawSubs = slot.split('.')
const subTokens = rawSubs.map((s, i) => {
  let tok = s.trim()
  // Strip comma that's a rhythmic separator artifact (e.g. "m.,r" → ["m", ",r"])
  // The printer formats dotted subdivisions as "m.,r"; after split('.'), the second
  // token gets a spurious leading comma. Only strip for i > 0 (never the first token).
  if (i > 0 && tok.startsWith(',')) tok = tok.slice(1).trim()
  return tok
}).filter(Boolean)
const halfBeat = subTokens.length > 1
const unitDur = halfBeat ? 1 : 2
```

No other changes — parseSyllable itself is correct and must not be modified.

After making the change, run the verification command below to confirm octaves are correct.
  </action>
  <verify>
    <automated>
cd /data/home/psalter && npx tsx -e "
import { solFaToAbc } from './src/lib/solfege-parser.ts';
const { abc } = solFaToAbc(':s_1 |d :— :r |m.,r:d :m |s.,l:s :f |m :— :m |r :— :f |m.,r:d :t_1 |d :—||', 'G', 'C', 'Glasgow');
console.log('ABC notes:', abc);
const notes = abc.match(/[a-gA-G][',]*/g) ?? [];
console.log('Note tokens:', notes);
const hasWrongA = notes.some(n => n === 'A');
const hasWrongE = notes.some(n => n === 'e' && !notes.includes(\"e'\"));
console.log('Has wrong A (A3):', hasWrongA, '— should be false');
console.log('PASS:', !hasWrongA);
"
    </automated>
  </verify>
  <done>Glasgow soprano line produces all notes in correct octave: 'a' (A4) appears instead of 'A' (A3); 'e'' (E5) appears for the mi in the s.,l slot. Verification script exits with PASS:true.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| filesystem | Image file swap is local-only, no network exposure |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-qmy-01 | Tampering | file swap (cp commands) | accept | Three-step copy via tmp; original bytes preserved until rm; low risk on local VPS filesystem |
</threat_model>

<verification>
1. `ls -la public/tunes/old-124th-solfege-*.jpg` — both files exist, sizes differ from pre-swap state
2. `grep -n "Image 1 first, Image 2 second" src/lib/ocr-solfege-v2.ts` — returns a match
3. Glasgow verification script (Task 2 automated verify) — PASS: true, no 'A' (A3) in output
4. `npx tsc --noEmit` — no new TypeScript errors
</verification>

<success_criteria>
- old-124th-solfege-0.jpg is now the first/title page (confirmed by file size or visual inspection)
- old-124th-solfege-1.jpg is now the continuation page
- TRANSCRIPTION_PROMPT updated in ocr-solfege-v2.ts
- Glasgow soprano test produces correct octaves (PASS: true)
- No TypeScript errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/260512-qmy-fix-ocr-pipeline-bugs-old-124th-page-order-swap-plus-glasgow/260512-qmy-SUMMARY.md`
</output>
