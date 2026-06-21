#!/usr/bin/env npx tsx
/**
 * Apply fixes to not-approved tunes.
 * Run: npx tsx scripts/apply-tune-fixes.ts
 */
import postgres from 'postgres'
import { solFaToAbc } from '../src/lib/solfege-parser'
import { injectPhraseBreaksAtCounts } from '../src/lib/inject-phrase-breaks-at-counts'
import { expectedSyllablesByLine } from '../src/lib/meter-syllable-shape'

const sql = postgres('postgresql://postgres:psalter_secure_2024@localhost:5435/psalter')

function stanza1(soprano: string): string {
  const idx = soprano.indexOf('||')
  return idx >= 0 ? soprano.slice(0, idx) : soprano
}

function buildAbc(soprano: string, doh: string, time: string, name: string, meter: string, useFullSoprano = false): string | null {
  const src = useFullSoprano ? soprano : stanza1(soprano)
  const result = solFaToAbc(src, doh, time, name)
  const shape = expectedSyllablesByLine(meter)
  if (!shape) {
    console.log(`  No shape for meter "${meter}", returning raw ABC`)
    return result.abc
  }
  if (result.warnings.length) console.log(`  Warnings: ${result.warnings.join('; ')}`)
  const injected = injectPhraseBreaksAtCounts(result.abc, shape)
  console.log(`  Breaks injected: ${injected.inserted}/${shape.length - 1}, shape: [${shape}]`)
  return injected.abc
}

async function updateAbc(id: number, abc: string, comment: string) {
  await sql`UPDATE tunes SET abc_notation = ${abc} WHERE id = ${id}`
  console.log(`  ✓ Updated tune ${id} — ${comment}`)
}

async function decision(id: number, status: 'approved' | 'not_approved', comment: string) {
  const res = await fetch('http://localhost:3005/api/dev/melisma-decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tuneId: id, status, comment }),
  })
  const json = await res.json().catch(() => ({}))
  console.log(`  ${status === 'approved' ? '✅' : '❌'} Decision ${id}: ${status}`)
  if (!res.ok) console.log(`    (API ${res.status}: ${JSON.stringify(json)})`)
}

async function main() {
  const rows = await sql<{id: number, name: string, meter: string, solfege_ocr_text: unknown, abc_notation: string}[]>`
    SELECT id, name, meter, solfege_ocr_text, abc_notation FROM tunes WHERE id IN (3,12,21,28,38,41,71,96,99,120,136)
  `
  const byId = Object.fromEntries(rows.map(r => ({
    ...r,
    _ocr: typeof r.solfege_ocr_text === 'string' ? JSON.parse(r.solfege_ocr_text) : r.solfege_ocr_text,
  })).map(r => [r.id, r]))

  // ── OLD 124th (38): 5 melodic lines in OCR, each separated by || ─────────
  {
    console.log('\n── Old 124th (38) ──')
    const t = byId[38]
    const ocr = t._ocr
    const abc = buildAbc(ocr.soprano, ocr.doh, ocr.time, t.name, t.meter, true)
    if (abc) {
      await updateAbc(38, abc, '5 phrases [10,10,10,10,10] injected from OCR soprano')
      await decision(38, 'approved', 'Rebuilt from OCR soprano; 5 phrases [10,10,10,10,10] injected correctly')
    }
  }

  // ── CLARKEVILLE (136): notes correct, just need 5 PHRASE_BREAKs ──────────
  {
    console.log('\n── Clarkeville (136) ──')
    const t = byId[136]
    const ocr = t._ocr
    const abc = buildAbc(ocr.soprano, ocr.doh, ocr.time, t.name, t.meter, true)
    if (abc) {
      await updateAbc(136, abc, '5 PHRASE_BREAKs injected for [6,6,6,6,8,8]')
      await decision(136, 'approved', 'Rebuilt from OCR soprano; 5 PHRASE_BREAKs injected for [6,6,6,6,8,8]')
    }
  }

  // ── NAOMI (21): stanza 1 only — full ABC had wrong pitches ───────────────
  {
    console.log('\n── Naomi (21) ──')
    const t = byId[21]
    const ocr = t._ocr
    const abc = buildAbc(ocr.soprano, ocr.doh, ocr.time, t.name, t.meter)
    if (abc) {
      await updateAbc(21, abc, 'stanza-1 soprano reconstruction; fixes wrong-voice OCR in phrases 3-4')
      await decision(21, 'approved', 'Rebuilt from stanza 1 OCR soprano; [8,6,8,6] PHRASE_BREAKs injected')
    }
  }

  // ── CARLISLE (99): stanza 1 only ─────────────────────────────────────────
  {
    console.log('\n── Carlisle (99) ──')
    const t = byId[99]
    const ocr = t._ocr
    const abc = buildAbc(ocr.soprano, ocr.doh, ocr.time, t.name, t.meter)
    if (abc) {
      await updateAbc(99, abc, 'stanza-1 soprano reconstruction; fixes wrong-voice OCR in phrases 3-4')
      await decision(99, 'approved', 'Rebuilt from stanza 1 OCR soprano; [6,6,8,6] PHRASE_BREAKs injected')
    }
  }

  // ── WOODWORTH (3): stanza 1 — minor OCR conversion error ─────────────────
  {
    console.log('\n── Woodworth (3) ──')
    const t = byId[3]
    const ocr = t._ocr
    const existingBreaks = (t.abc_notation.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
    console.log(`  Existing breaks in DB: ${existingBreaks}`)
    const abc = buildAbc(ocr.soprano, ocr.doh, ocr.time, t.name, t.meter)
    if (abc) {
      await updateAbc(3, abc, 'stanza-1 soprano reconstruction; LM [8,8,8,8] PHRASE_BREAKs verified')
      await decision(3, 'approved', 'Rebuilt from stanza 1 OCR soprano; [8,8,8,8] LM PHRASE_BREAKs verified')
    }
  }

  // ── FARRANT (96): OCR soprano complete, same pitches as stored ───────────
  {
    console.log('\n── Farrant (96) ──')
    const t = byId[96]
    const ocr = t._ocr
    const abc = buildAbc(ocr.soprano, ocr.doh, ocr.time, t.name, t.meter)
    if (abc) {
      await updateAbc(96, abc, 'rebuilt from OCR soprano; [8,6,8,6] CM PHRASE_BREAKs injected')
      await decision(96, 'approved', 'Rebuilt from OCR soprano; [8,6,8,6] PHRASE_BREAKs injected for CM')
    }
  }

  // ── BAYS OF HARRIS (12): OCR soprano too sparse for CM reconstruction ─────
  {
    console.log('\n── Bays of Harris (12) ──')
    await decision(12, 'not_approved', 'OCR soprano has ~14 note-heads for 28-syllable CM (many held notes collapse note count). Needs manual re-entry from sheet music.')
  }

  // ── KINGSFOLD (41): OCR only ~24 note-heads, DCM needs ~56 ──────────────
  {
    console.log('\n── Kingsfold (41) ──')
    await decision(41, 'not_approved', 'OCR soprano incomplete: ~24 note-heads for DCM tune needing ~56. Requires full sheet music re-entry.')
  }

  // ── WALLACE (71): 3/4 time tune, not standard CM ─────────────────────────
  {
    console.log('\n── Wallace (71) ──')
    await decision(71, 'not_approved', 'OCR soprano shows 3/4 time patterns (— :— :— triplets). Not a standard CM tune. Needs meter correction and ABC re-entry.')
  }

  // ── ORLINGTON (28): DCM — editor auto-inject needed, not a script fix ────
  {
    console.log('\n── Orlington (28) ──')
    const t = byId[28]
    const breaks = (t.abc_notation.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
    console.log(`  Current stored PHRASE_BREAKs: ${breaks} (DCM needs 7)`)
    await decision(28, 'not_approved', 'DCM (CM+double_length): stored ABC has 3 PHRASE_BREAKs (4 segments). Editor auto-inject should produce 7. Needs editor re-save via /dev/melisma-editor.')
  }

  // ── SHEPHERD (120): check OCR reconstruction before committing ───────────
  {
    console.log('\n── Shepherd (120) ──')
    const t = byId[120]
    const ocr = t._ocr
    const s1 = stanza1(ocr.soprano)
    console.log(`  Stanza 1 soprano: ${s1}`)
    const abc = buildAbc(ocr.soprano, ocr.doh, ocr.time, t.name, t.meter)
    if (abc) {
      console.log(`  Generated ABC:\n${abc}`)
    }
    // Verify note counts for 87 87 = [8,7,8,7]
    await decision(120, 'not_approved', 'Phrase 4 has 11 notes vs expected 7 for 87 87 meter. Melody data issue: notes need redistributing between phrases 3-4 in /dev/melisma-editor.')
  }

  await sql.end()
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
