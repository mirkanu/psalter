/**
 * Diagnostic for psalm 148 (pv 85, Darwall) — surfaces the data defect so the
 * owner can curate lyrics manually rather than rely on auto-repair.
 *
 * Background: the 260815 audit found that pv 85's lyrics_structured has
 * 9 stanzas of 4 lines instead of 6 stanzas of 6 lines (meter = 66 66 88).
 * The raw `lyrics_imported_raw` is ALSO broken: 14 Bible verses × 2 lines
 * each = 28 physical lines, but the meter expects 6 lines per stanza →
 * 6 stanzas × 6 = 36 lines. The raw data fundamentally does not align
 * with the meter — the Bible-verse line breaks are 2-vs-4 (some verses
 * contribute 2 lines, some 4 lines after inline breaks in the source).
 *
 * This script:
 *   1. Loads pv 85 and pv 151 (the two psalm-148 versions).
 *   2. Prints the raw blob, the current structured parse, and a per-line
 *      syllable count vs expected shape.
 *   3. Reports what would be needed to fix it (manual line-break edits
 *      in the raw blob, not a script fix).
 *
 * Usage:
 *   npx tsx scripts/diagnose-psalm-148.ts
 */
import 'dotenv/config'
import { db } from '../src/db'
import { psalmVersions } from '../src/db/schema'
import { and, ilike, isNotNull } from 'drizzle-orm'
import { expectedSyllablesByLine } from '../src/lib/meter-syllable-shape'

function normalise(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n+/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/(\d+)\s+(?=[A-Za-z])/g, '$1')
    .trim()
}

async function main() {
  const rows = await db
    .select()
    .from(psalmVersions)
    .where(and(ilike(psalmVersions.psalterNumber, '148%'), isNotNull(psalmVersions.lyricsImportedRaw)))

  for (const r of rows) {
    console.log(`\n=== psalm-version id=${r.id} psalterNumber=${r.psalterNumber} meter=${r.meter} ===`)
    const blob = r.lyricsImportedRaw ?? ''
    const shape = expectedSyllablesByLine(r.meter)
    console.log(`Expected shape: ${JSON.stringify(shape)}`)
    const lines = normalise(blob).split(/\n/).filter((l) => l.trim().length > 0)
    console.log(`Raw physical-line count: ${lines.length}`)
    console.log(`Required stanza count: ${lines.length / (shape?.length ?? 1)} (if shape=${shape?.length})`)
    console.log('\n--- Raw lyrics (raw_imported_raw) ---')
    console.log(blob)
    console.log('--- End raw ---\n')
    if (r.lyricsStructured) {
      console.log('--- Current lyrics_structured ---')
      for (const s of r.lyricsStructured) {
        const counts = s.lines.map((l) => l.text.split(/\s+/).filter(Boolean).length)
        console.log(`  stanza ${s.index}: lines=${s.lines.length} counts=${JSON.stringify(counts)}`)
      }
      console.log('--- End structured ---\n')
    }
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
