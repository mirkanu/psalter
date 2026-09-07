#!/usr/bin/env npx tsx
/**
 * Hetzner → Neon content patch (2026-09-07).
 *
 * Background: the initial Airtable → Neon migration (scripts/migrate-airtable.ts)
 * faithfully migrated only the columns present in Airtable. Post-migration
 * annotation data lives on the live Hetzner DB but was never copied to Neon
 * (these columns were populated by later scripts: apply-abc-notation,
 * bulk-ocr-text, apply-tune-fixes, annotate-phrase-breaks, etc.).
 *
 * Tables patched:
 *   tunes:
 *     abc_notation, abc_notation_ocr, abc_satb,
 *     solfege_ocr_text, solfege_soprano_edited,
 *     melisma_positions, phrase_shape_override,
 *     soundcloud_url, famous_hymn,
 *     number_in_1979_rp_psalter, num_in_prca_psalter
 *
 *   psalm_versions:
 *     lyrics_structured
 *
 *   daily_readings:
 *     starting_verse, ending_verse
 *
 *   naves_topics:
 *     messianic
 *
 *   psalms:
 *     date_bc, occasion, nkjv_title
 *
 * Symptom: empty sing views (abcjs gets empty string), missing daily calendar
 * verses, missing nave topic "Messianic" flag, missing psalm metadata.
 *
 * Safety:
 *   - Reads from Hetzner psalter-db (read-only via this script).
 *   - Writes to Neon only (the destination for Wave 2).
 *   - Updates by primary-key id (already aligned since the initial Airtable
 *     migration wrote rows with sequential ids).
 *   - Does NOT touch the Hetzner DB or any other infrastructure.
 *
 * Run:
 *   set -a; . /home/services/psalter/.env; . /tmp/17-01-neon.txt; set +a
 *   npx tsx scripts/hetzner-to-neon-content-patch.ts
 *
 * Pass --dry-run to print the would-be UPDATE counts without writing.
 */

import postgres from 'postgres'

type ColSpec = {
  /** snake_case column in DB */
  name: string
  /** cast for jsonb/array columns (postgres.js will JSON.stringify if needed) */
  cast?: 'jsonb' | 'intArray'
}

type TablePatch = {
  table: string
  /** columns to copy from Hetzner → Neon */
  columns: ColSpec[]
}

const PATCHES: TablePatch[] = [
  {
    table: 'tunes',
    columns: [
      { name: 'abc_notation' },
      { name: 'abc_notation_ocr' },
      { name: 'abc_satb' },
      { name: 'solfege_ocr_text' },
      { name: 'solfege_soprano_edited' },
      { name: 'melisma_positions', cast: 'jsonb' },
      { name: 'phrase_shape_override', cast: 'jsonb' },
      { name: 'soundcloud_url' },
      { name: 'famous_hymn' },
      { name: 'number_in_1979_rp_psalter' },
      { name: 'num_in_prca_psalter' },
    ],
  },
  {
    table: 'psalm_versions',
    columns: [
      { name: 'lyrics_structured', cast: 'jsonb' },
    ],
  },
  {
    table: 'daily_readings',
    columns: [
      { name: 'starting_verse' },
      { name: 'ending_verse' },
    ],
  },
  {
    table: 'naves_topics',
    columns: [
      { name: 'messianic' },
    ],
  },
  {
    table: 'psalms',
    columns: [
      { name: 'date_bc' },
      { name: 'occasion' },
      { name: 'nkjv_title' },
    ],
  },
]

const HETZNER_URL = process.env.DATABASE_URL
const NEON_URL = process.env.NEON_DATABASE_URL

if (!HETZNER_URL) {
  console.error('DATABASE_URL (Hetzner) is required. source /home/services/psalter/.env first.')
  process.exit(1)
}
if (!NEON_URL) {
  console.error('NEON_DATABASE_URL is required. source /tmp/17-01-neon.txt first.')
  process.exit(1)
}

const dryRun = process.argv.includes('--dry-run')

const hetzner = postgres(HETZNER_URL, { max: 1, prepare: false })
const neon = postgres(NEON_URL, { max: 1, prepare: false })

function describeCol(c: ColSpec): string {
  return c.cast ? `${c.name}::${c.cast}` : c.name
}

async function patchTable(spec: TablePatch): Promise<{ updated: number; failed: number }> {
  const table = spec.table
  const cols = spec.columns
  const colNames = cols.map((c) => c.name).join(', ')

  // Pull every row from Hetzner
  const rows = await hetzner.unsafe(
    `SELECT id, ${colNames} FROM ${table}`
  )
  console.log(`  [${table}] read ${rows.length} rows from Hetzner`)

  if (dryRun) {
    const setClause = cols.map((c) => `${c.name} = EXCLUDED.${c.name}`).join(', ')
    console.log(`  [${table}] dry-run — would update ${rows.length} rows`)
    return { updated: rows.length, failed: 0 }
  }

  // One UPDATE per row, matching on id. postgres.js template-tag syntax for
  // dynamic SET lists: build the SET clause with safe identifiers, then bind
  // values via parameterised SQL.
  let updated = 0
  let failed = 0
  for (const row of rows) {
    const setFragments = cols.map((c) => `${c.name} = $${cols.indexOf(c) + 1}`).join(', ')
    const values = cols.map((c) => {
      const v = row[c.name]
      if (v === null || v === undefined) return null
      if (c.cast === 'jsonb' && typeof v === 'string') return v // already JSON text
      if (c.cast === 'jsonb') return JSON.stringify(v)
      return v
    })

    try {
      await neon.unsafe(
        `UPDATE ${table} SET ${setFragments} WHERE id = $${cols.length + 1}`,
        [...values, row.id],
      )
      updated++
    } catch (err) {
      failed++
      console.error(`  [${table}] id=${row.id} (${(row as any).name ?? ''}) failed:`, (err as Error).message.slice(0, 200))
    }
  }
  return { updated, failed }
}

async function parityForTable(spec: TablePatch): Promise<void> {
  const cols = spec.columns.map((c) => c.name)
  const selectFragments = cols
    .map((c) => `count(${c}) filter (where length(coalesce(${c}::text,'')) > 0) as ${c}`)
    .join(', ')
  const [h] = await hetzner.unsafe(
    `SELECT count(*) as total, ${selectFragments} FROM ${spec.table}`,
  )
  const [n] = await neon.unsafe(
    `SELECT count(*) as total, ${selectFragments} FROM ${spec.table}`,
  )
  console.log(`  [${spec.table}] parity:`)
  console.log(`    column                       Hetzner    Neon`)
  for (const c of cols) {
    console.log(`    ${c.padEnd(28)} ${String(h[c]).padStart(8)} ${String(n[c]).padStart(8)}`)
  }
}

async function main() {
  console.log('=== Hetzner → Neon content patch ===')
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'WRITE'}`)
  console.log(`Tables: ${PATCHES.map((p) => p.table).join(', ')}`)
  console.log()

  console.log('--- Pre-patch parity ---')
  for (const spec of PATCHES) {
    await parityForTable(spec)
  }
  console.log()

  console.log('--- Patching ---')
  for (const spec of PATCHES) {
    const r = await patchTable(spec)
    console.log(`  [${spec.table}] updated=${r.updated}, failed=${r.failed}`)
  }
  console.log()

  console.log('--- Post-patch parity ---')
  for (const spec of PATCHES) {
    await parityForTable(spec)
  }
  console.log()

  console.log(dryRun ? 'DRY-RUN complete — no writes performed' : 'Patch complete')
  await hetzner.end()
  await neon.end()
}

main().catch(async (err) => {
  console.error('Patch failed:', err)
  await hetzner.end()
  await neon.end()
  process.exit(1)
})
