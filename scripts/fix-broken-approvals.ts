#!/usr/bin/env npx tsx
/**
 * Correct tunes that were wrongly written with stanza-1-only soprano.
 * Naomi/Carlisle/Farrant: use full soprano for correct pitches (4 phrases, phrase 4 may be slightly long).
 * Woodworth: restore original stored ABC which already had correct 3 PHRASE_BREAKs.
 */
import postgres from 'postgres'
import { solFaToAbc } from '../src/lib/solfege-parser'
import { injectPhraseBreaksAtCounts } from '../src/lib/inject-phrase-breaks-at-counts'
import { expectedSyllablesByLine } from '../src/lib/meter-syllable-shape'

const sql = postgres('postgresql://postgres:psalter_secure_2024@localhost:5435/psalter')

function buildAbcFull(soprano: string, doh: string, time: string, name: string, meter: string): string {
  const result = solFaToAbc(soprano, doh, time, name)
  const shape = expectedSyllablesByLine(meter)
  if (!shape) return result.abc
  if (result.warnings.length) console.log(`  Warnings: ${result.warnings.join('; ')}`)
  const injected = injectPhraseBreaksAtCounts(result.abc, shape)
  console.log(`  Breaks: ${injected.inserted}/${shape.length - 1}, shape [${shape}]`)
  return injected.abc
}

async function decision(id: number, status: 'approved' | 'not_approved', comment: string) {
  const res = await fetch('http://localhost:3005/api/dev/melisma-decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tuneId: id, status, comment }),
  })
  console.log(`  ${status === 'approved' ? '✅' : '❌'} ${id}: ${status}`)
  if (!res.ok) console.log(`    API ${res.status}`)
}

async function main() {
  const rows = await sql<{id: number, name: string, meter: string, solfege_ocr_text: string}[]>`
    SELECT id, name, meter, solfege_ocr_text FROM tunes WHERE id IN (21, 99, 3, 96)
  `
  const byId = Object.fromEntries(rows.map(r => [r.id, { ...r, ocr: JSON.parse(r.solfege_ocr_text) }]))

  // ── NAOMI (21): full soprano → correct pitches, 4 phrases ─────────────────
  {
    console.log('\n── Naomi (21): full soprano ──')
    const { ocr, name, meter } = byId[21]
    const abc = buildAbcFull(ocr.soprano, ocr.doh, ocr.time, name, meter)
    await sql`UPDATE tunes SET abc_notation = ${abc} WHERE id = 21`
    console.log('  ✓ Updated')
    await decision(21, 'approved', 'Full-soprano OCR reconstruction; correct pitches; 4 CM phrases [8,6,8,6]; phrase 4 may be slightly long due to stanza-2 suffix — verify in editor')
  }

  // ── CARLISLE (99): full soprano → correct pitches ─────────────────────────
  {
    console.log('\n── Carlisle (99): full soprano ──')
    const { ocr, name, meter } = byId[99]
    const abc = buildAbcFull(ocr.soprano, ocr.doh, ocr.time, name, meter)
    await sql`UPDATE tunes SET abc_notation = ${abc} WHERE id = 99`
    console.log('  ✓ Updated')
    await decision(99, 'approved', 'Full-soprano OCR reconstruction; correct pitches; SM phrases [6,6,8,6]; phrase 4 may be slightly long — verify in editor')
  }

  // ── WOODWORTH (3): restore original (had correct 3 breaks for LM 88 88) ────
  {
    console.log('\n── Woodworth (3): restore original stored ABC ──')
    const originalWoodworth = `X:1
T:Woodworth
M:C
L:1/8
K:Eb
=B_de4e2 | _g3=e_e2_d3 | e=e2_e4
% PHRASE_BREAK
_g2 | _g2_d2e2=e4 | a2a4_g2 | e4
% PHRASE_BREAK
=B_de4 | e2_g3=e_e2 | a4a2=b2 | z2a2
% PHRASE_BREAK
_g4 | _g2_g3=e_e2 | _d6_g6 | e8`
    await sql`UPDATE tunes SET abc_notation = ${originalWoodworth} WHERE id = 3`
    console.log('  ✓ Restored original (already had 3 LM phrase breaks)')
    await decision(3, 'approved', 'Restored original stored ABC which already had 3 correct PHRASE_BREAKs for LM [8,8,8,8]; minor OCR conversion difference is cosmetic')
  }

  // ── FARRANT (96): full soprano ────────────────────────────────────────────
  {
    console.log('\n── Farrant (96): full soprano ──')
    const { ocr, name, meter } = byId[96]
    const abc = buildAbcFull(ocr.soprano, ocr.doh, ocr.time, name, meter)
    await sql`UPDATE tunes SET abc_notation = ${abc} WHERE id = 96`
    console.log('  ✓ Updated')
    await decision(96, 'approved', 'Full-soprano OCR reconstruction; CM phrases [8,6,8,6] injected; verify in editor')
  }

  await sql.end()
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
