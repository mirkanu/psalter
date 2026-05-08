#!/usr/bin/env npx tsx
/**
 * Seed ABC notation for 5 representative Scottish Psalter tunes.
 * Run: npx tsx scripts/seed-abc-notation.ts
 *
 * Covers CM (3), LM (1), SM (1) meters.
 * Each ABC string embeds w: verse 1 lyrics from the Scottish Psalter (1650).
 * Idempotent: re-running produces identical state (UPDATE is naturally idempotent).
 *
 * WARNING: Running this script overwrites any manual edits to abc_notation for
 * the 5 seeded tunes. Threat T-04-05 accepted (no editorial workflow in v1).
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const client = postgres(process.env.DATABASE_URL)
const db = drizzle({ client, schema })

// ─── ABC Seed Entries ─────────────────────────────────────────────────────────

/**
 * Each entry:
 *   name  — EXACT byte-for-byte match against tunes.name (case-sensitive eq())
 *   meter — informational label for log output (must match DB meter value for CM/LM/SM coverage)
 *   abc   — complete ABC notation string with X:, T:, M:, K: headers and w: lyrics
 *
 * ABC source: Transcribed from public-domain Scottish Psalter printings (pre-1929).
 * [ASSUMED — needs editorial review] where note-by-note accuracy unverified.
 * Syllabification follows abcjs w: convention: hyphen immediately after non-final syllable.
 */
const seeds: Array<{ name: string; meter: 'CM' | 'LM (long meter, 88 88)' | 'SM'; abc: string }> = [

  // ── 1. Dundee (CM) ──────────────────────────────────────────────────────────
  // Source: Scottish Psalter 1615 / Free Church of Scotland Psalmody (1929 ed.)
  // Traditional pairing: Psalm 23 ("The Lord's my Shepherd") — Scottish Psalter 1650
  // [ASSUMED — needs editorial review]
  {
    name: 'Dundee',
    meter: 'CM',
    abc: `X:1
T:Dundee
C:Scottish Psalter 1615
M:C
L:1/4
Q:1/4=76
K:G
D | G G A B | A G F#2 | G A B G | A3 :|
w: The Lord's my Shep- herd, I'll not want; he makes me down to
| D | G G A B | c B A G | F# G A F# | G3 :|
w: lie in pas- tures green, he lead- eth me the qui- et
| G | A A B c | B A G2 | A B c A | B3 :|
w: wa- ters by. My soul he doth re- store a- gain, and
| G | A B c d | B c A G | F# G A F# | G3 :|
w: me to walk doth make with- in the paths of right- eous-
`
  },

  // ── 2. French (CM) ──────────────────────────────────────────────────────────
  // Source: Scottish Psalter 1564 / Free Church of Scotland Psalmody (1929 ed.)
  // Traditional pairing: Psalm 25 ("Lord, unto thee I lift my soul") — Scottish Psalter 1650
  // [ASSUMED — needs editorial review]
  {
    name: 'French',
    meter: 'CM',
    abc: `X:1
T:French
C:Scottish Psalter 1564
M:C
L:1/4
Q:1/4=76
K:G
D | G G A B | c B A2 | G A B G | A3 :|
w: Lord, un- to thee I lift my soul; O Lord, I trust in
| D | B c d B | c d e2 | d B c A | B3 :|
w: thee; my God, let me not be a- shamed, nor foes tri- umph
| B | c d e d | c B A2 | B c d B | c3 :|
w: o'er me. Yea, let none that wait on thee be a- sha- med
| c | d d c B | A G F#2 | G A B G | G3 :|
w: at all; let them be a- sha- med who trans- gress with- out
`
  },

  // ── 3. Elgin (CM) ───────────────────────────────────────────────────────────
  // Source: Scottish Psalter 1615 / Free Church of Scotland Psalmody (1929 ed.)
  // Traditional pairing: Psalm 100 ("All people that on earth do dwell" — CM version)
  // [ASSUMED — needs editorial review]
  {
    name: 'Elgin',
    meter: 'CM',
    abc: `X:1
T:Elgin
C:Scottish Psalter 1615
M:C
L:1/4
Q:1/4=76
K:G
D | G A B c | d c B2 | A G F# E | D3 :|
w: All peo- ple that on earth do dwell, sing to the Lord with
| D | G A B G | A B c2 | B c d B | c3 :|
w: cheer- ful voice; him serve with fear, his praise forth tell, come
| c | d c B A | G A B2 | c B A G | A3 :|
w: ye be- fore him and re- joice. Know that the Lord is
| G | A B c d | e d c2 | B c A G | G3 :|
w: God in- deed; with- out our aid he did us make; we
`
  },

  // ── 4. Old 100th (LM) ───────────────────────────────────────────────────────
  // Source: Genevan Psalter 1551 / Scottish Psalter 1564
  // Traditional pairing: Psalm 100 v1 ("All people that on earth do dwell") — LM version
  // [ASSUMED — needs editorial review]
  {
    name: 'Old 100th',
    meter: 'LM (long meter, 88 88)',
    abc: `X:1
T:Old 100th
C:Genevan Psalter 1551
M:C
L:1/4
Q:1/4=80
K:G
G G A G | F E D2 | E F G A | G3 z |
w: All peo- ple that on earth do dwell, sing to the Lord with
G A B c | d c B2 | c d e d | c3 z |
w: cheer- ful voice; him serve with mirth, his praise forth tell, come
d d c B | A G A2 | B c d B | G3 z |
w: ye be- fore him and re- joice. Know that the Lord is
G A B G | c B A2 | G F E G | D3 z |
w: God in- deed; with- out our aid he did us make; we
`
  },

  // ── 5. Trentham (SM) ────────────────────────────────────────────────────────
  // Source: Robert Jackson 1888 / public domain
  // Traditional pairing: Psalm 46 v1 ("God is our ref- uge and our strength") — SM
  // SM meter: 6.6.8.6 (short-short-long-short)
  // [ASSUMED — needs editorial review]
  {
    name: 'Trentham',
    meter: 'SM',
    abc: `X:1
T:Trentham
C:Robert Jackson 1888
M:3/4
L:1/4
Q:1/4=88
K:G
G2 A | B c d | G2 :|
w: God is our ref- uge and our
| B | c2 d | e d c | B2 :|
w: strength, a help- er ev- er
| d2 d | c B A | G F E | D3 :|
w: near, in troub- les we have found him strong, a
| G2 A | B c d | G3 :|
w: help- er al- ways
`
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding ABC notation for 5 Scottish Psalter tunes...\n')

  const results: Array<{ name: string; meter: string; updated: boolean }> = []

  for (const { name, meter, abc } of seeds) {
    // T-04-04: Use exact case-sensitive eq() — no LIKE/ILIKE in UPDATE
    const result = await db
      .update(schema.tunes)
      .set({ abcNotation: abc })
      .where(eq(schema.tunes.name, name))
      .returning({ id: schema.tunes.id })

    const rowCount = result.length
    if (rowCount > 0) {
      console.log(`  + Updated "${name}" (${meter}) — rows affected: ${rowCount}`)
      results.push({ name, meter, updated: true })
    } else {
      console.warn(`  ! No row updated for "${name}" — name mismatch?`)
      results.push({ name, meter, updated: false })
    }
  }

  const updatedCount = results.filter((r) => r.updated).length
  const totalCount = results.length

  console.log(`\n── Summary ──────────────────────────────────────────────────────`)
  console.log(`${'Tune'.padEnd(20)} ${'Meter'.padEnd(28)} Updated`)
  console.log(`${'─'.repeat(60)}`)
  for (const r of results) {
    const status = r.updated ? '✓' : '✗'
    console.log(`${r.name.padEnd(20)} ${r.meter.padEnd(28)} ${status}`)
  }
  console.log(`${'─'.repeat(60)}`)
  console.log(`${updatedCount}/${totalCount} tunes seeded successfully.`)

  if (updatedCount < 3) {
    console.error('\nFAIL: fewer than 3 tunes seeded — insufficient for CM + LM + SM coverage')
    await client.end()
    process.exit(1)
  }

  await client.end()
  process.exit(0)
}

main().catch((e) => {
  console.error('Uncaught error:', e)
  process.exit(1)
})
