---
phase: quick
plan: 260607-gju
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/solfege-parser.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Psalm 106 (Dunfermline) renders all 4 phrases with correct lyric alignment"
    - "The final phrase (phrase 4, 6 notes) is not given 8 note slots by buildWLineFromSolfa"
    - "The fix applies to all 63 tunes whose solfege_ocr_text.soprano still has Amen notes after the current strip logic"
  artifacts:
    - path: "src/lib/solfege-parser.ts"
      provides: "Corrected Amen-stripping that removes both the final double-bar AND the Amen notes before it"
  key_links:
    - from: "src/lib/solfege-parser.ts (getPassingPositions)"
      to: "src/lib/abc-melisma.ts (buildWLineFromSolfa)"
      via: "soprano totalEvents count"
      pattern: "getPassingPositions.*soprano"
---

<objective>
Fix phrase 4 lyric misalignment on Psalm 106 (Dunfermline) and 62 other tunes caused by Amen notes leaking through the solfège Amen-stripping logic.

Purpose: The melisma editor removed the Amen notes from `abc_notation` for Dunfermline but the `solfege_ocr_text.soprano` still contains the Amen chord (`d | d ||` after the end-of-tune double bar). The Amen-stripping code in `solfege-parser.ts` only strips from the LAST `||`, leaving the Amen notes `d | d` in the stripped result. This inflates `totalEvents` by 2 (28→30 for CM), making `buildWLineFromSolfa` assign 8 note slots to phrase 4 instead of 6, causing abcjs to misalign that phrase.

Output: One code fix in `solfege-parser.ts`. No DB changes needed.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md

## Root Cause (confirmed by investigation)

The soprano string for Dunfermline (and 62 other tunes) has this structure:

```
:d | d :r | ... | d :— | — || :s | m :s | ... | d :— | — || d | d ||
                                 ^^ end of first half     ^^ end of tune  ^^ final bar
                                                          Amen --> [d | d] ||
```

Current code in `solfege-parser.ts` (around line 243):
```typescript
let cleaned = raw.trim()
const lastDbl = cleaned.lastIndexOf('||')
if (lastDbl >= 0) cleaned = cleaned.slice(0, lastDbl)
```

`lastIndexOf('||')` finds the FINAL `||` (after the Amen notes), so `slice(0, lastDbl)` gives:
```
... | d :— | — || d | d
```

The `d | d` (Amen notes) remain in `cleaned`. `getPassingPositions` then counts these as 2 extra note events, inflating `totalEvents` from 28 to 30.

`buildWLineFromSolfa` uses split points `[8, 14, 22]` for CM with `totalEvents=30`, giving phrase 4 range `[22, 30]` = 8 events. But the ABC only has 6 notes in phrase 4. This desynchronises the w-line.

## Correct Fix

After the first strip (removing the final `||`), apply a SECOND strip pass:
find the new last `||` in the already-stripped string and check whether the content after it is Amen-like (no beat-colon `:`, short). If so, strip from that second-to-last `||` instead.

```typescript
let cleaned = raw.trim()
const lastDbl = cleaned.lastIndexOf('||')
if (lastDbl >= 0) {
  cleaned = cleaned.slice(0, lastDbl)
  // Second pass: if the already-stripped string still ends with Amen-like content
  // after a || (e.g. "d | d" or "d |d" — no colons, short), strip further.
  const penultimateDbl = cleaned.lastIndexOf('||')
  if (penultimateDbl >= 0) {
    const amenCandidate = cleaned.slice(penultimateDbl + 2).trim()
    if (amenCandidate && !amenCandidate.includes(':') && amenCandidate.length <= 10) {
      cleaned = cleaned.slice(0, penultimateDbl)
    }
  }
}
cleaned = cleaned.replace(/\|\|/g, '|').replace(/\|$/, '').trim()
```

The `!amenCandidate.includes(':')` guard is critical: legitimate mid-tune content always has beat slots separated by `:`. Amen notes are bare pitch tokens with only `|` separators — never `:`.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Amen double-strip in solfege-parser.ts and verify Dunfermline alignment</name>
  <files>src/lib/solfege-parser.ts</files>
  <action>
Find the Amen-stripping block in `solfege-parser.ts` (around line 243, inside `getPassingPositions`). It currently reads:

```typescript
let cleaned = raw.trim()
const lastDbl = cleaned.lastIndexOf('||')
if (lastDbl >= 0) cleaned = cleaned.slice(0, lastDbl)
cleaned = cleaned.replace(/\|\|/g, '|').replace(/\|$/, '').trim()
```

Replace with:

```typescript
let cleaned = raw.trim()
const lastDbl = cleaned.lastIndexOf('||')
if (lastDbl >= 0) {
  cleaned = cleaned.slice(0, lastDbl)
  // Second pass: after removing the final ||, the string may still end with
  // Amen-like content (e.g. "d | d") before the penultimate ||.
  // Amen notes have no beat-colon (:) — they are bare pitch tokens separated
  // only by |. If the tail after the new last || has no : and is short, it is
  // the Amen section and must also be stripped.
  const penultimateDbl = cleaned.lastIndexOf('||')
  if (penultimateDbl >= 0) {
    const amenCandidate = cleaned.slice(penultimateDbl + 2).trim()
    if (amenCandidate && !amenCandidate.includes(':') && amenCandidate.length <= 10) {
      cleaned = cleaned.slice(0, penultimateDbl)
    }
  }
}
cleaned = cleaned.replace(/\|\|/g, '|').replace(/\|$/, '').trim()
```

Apply this change BOTH in the `getPassingPositions` function AND search the file for any other location that does the same lastDbl stripping pattern (there may be a second copy in `solFaToAbc` or similar). Fix all occurrences in the file that use `lastIndexOf('||')` for Amen stripping.

After making the fix, run a quick node verification:

```bash
cd /data/home/psalter && node -e "
const { getPassingPositions } = require('./src/lib/solfege-parser.ts');
" 2>&1 | head -5
```

(TypeScript won't run directly — use ts-node or the build. Instead, verify by running the dev server and checking the psalm page.)

Build check:
```bash
cd /data/home/psalter && npx tsc --noEmit 2>&1 | head -20
```

Then trigger a test via curl to confirm the page response is fresh:
```bash
curl -s https://psalter.gsdlabs.dev/psalms/106 | grep -c "Dunfermline"
```
  </action>
  <verify>
    <automated>cd /data/home/psalter && npx tsc --noEmit 2>&1 | head -20; echo "tsc exit: $?"</automated>
  </verify>
  <done>TypeScript compiles without errors after the change.</done>
</task>

<task type="auto">
  <name>Task 2: Rebuild Docker container and Playwright-verify psalm 106 alignment</name>
  <files></files>
  <action>
Rebuild the psalter Docker container so the updated `solfege-parser.ts` is included in the running build:

```bash
cd /home/services/hetzner-vps && docker compose build psalter && docker compose up -d psalter
```

Wait ~20 seconds for the container to start, then verify via Playwright that:
1. Psalm 106 renders all 4 phrases with correct lyric alignment (no missing lyrics on phrase 4)
2. The last phrase staff row has lyric text below it (not empty)

Use the Playwright daemon:
```javascript
const { runPlaywright } = require('/home/services/playwright-daemon/client.js');
const result = await runPlaywright(`
  await page.goto('https://psalter.gsdlabs.dev/psalms/106', { waitUntil: 'networkidle' });
  const skip = await page.$('button:has-text("Skip tour")');
  if (skip) { await skip.click(); await page.waitForTimeout(500); }
  // Count staff rows rendered (abcjs renders SVGs)
  const staffCount = await page.evaluate(() => document.querySelectorAll('svg').length);
  // Get text content to verify lyrics appear
  const bodyText = await page.evaluate(() => document.body.innerText);
  await page.screenshot({ path: '/tmp/psalm-106-fixed.png' });
  return { staffCount, bodyText: bodyText.substring(0, 300) };
`);
```

Screenshot the result. Confirm 4 staff rows are present and lyric text for phrases 1-4 is visible.

Also spot-check one other affected tune (e.g. psalm 23 which uses Martyrdom):
- Navigate to `/psalms/23`
- Verify notation renders without misalignment

If the page looks correct, the fix is confirmed. If not, check Docker container logs:
```bash
docker logs hetzner-vps-psalter-1 --tail 50
```
  </action>
  <verify>
    <automated>node -e "
const { runPlaywright } = require('/home/services/playwright-daemon/client.js');
runPlaywright(\`
  await page.goto('https://psalter.gsdlabs.dev/psalms/106', { waitUntil: 'networkidle' });
  const skip = await page.\$('button:has-text(\"Skip tour\")');
  if (skip) { await skip.click(); await page.waitForTimeout(500); }
  const svgCount = await page.evaluate(() => document.querySelectorAll('svg').length);
  await page.screenshot({ path: '/tmp/psalm-106-fixed.png' });
  return { svgCount };
\`).then(r => console.log(JSON.stringify(r))).catch(e => console.error(e));
" 2>&1</automated>
  </verify>
  <done>Psalm 106 shows all 4 phrases with lyric text visible under each staff row. Screenshot at /tmp/psalm-106-fixed.png confirms correct rendering. TypeScript build passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| DB data → parser | solfege_ocr_text is trusted (internal OCR pipeline), but may contain unexpected Amen formats |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-gju-01 | Tampering | solfege-parser Amen strip | accept | Internal data pipeline; no external input. The length <= 10 guard prevents over-stripping of legitimate mid-tune content |
</threat_model>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Playwright screenshot of psalms/106 shows 4 staff rows with lyrics on all rows
3. No regression on psalms that already render correctly (spot-check psalm 23 / Martyrdom)
</verification>

<success_criteria>
- Psalm 106 renders phrase 4 with correct lyric alignment (6 note slots, not 8)
- All 63 tunes with Amen-contaminated soprano strings now get correct note counts
- No TypeScript errors introduced
- Docker container rebuilt and serving the fix on production
</success_criteria>

<output>
After completion, create `.planning/quick/260607-gju-dunfermline-psalm-106-rendering-wrong-de/260607-gju-SUMMARY.md`
</output>
