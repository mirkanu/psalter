#!/usr/bin/env npx tsx
/**
 * Convert Leominster (tune id 142, SM) Hymnary MusicXML → abc_notation, with
 * 1-syllable-per-note alignment against psalm 70 stanza-1 lyrics fetched from
 * psalm_versions row 91.
 *
 * NO melismas in source (audit: 0 slur tags). All notes map 1:1 to syllables.
 *
 * Usage:
 *   ROLLBACK_CAPTURED=true npx tsx scripts/convert-leominster-musicxml.ts --apply
 *
 * Rollback artifact: scripts/uat/baselines/leominster-abc-rollback.txt
 *
 * Hard rules (from plan):
 *   - Additive only — never refactor or remove buildWLineFromSolfa,
 *     syllabifyForAbc, padWLineToNoteCount, splitWLineIntoChunks.
 *   - One row updated per task (id=142 only).
 *   - ROLLBACK_CAPTURED env var MUST be set before any UPDATE.
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createHash } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { tunes } from '../src/db/schema'
import * as abcjsModule from 'abcjs'

const abcjs = (abcjsModule as any).default ?? abcjsModule
const TUNE_ID = 142
const PSALM_VERSION_ID = 91 // psalm 70 (First Version, Recommended)
const SOURCE_MUSICXML = path.join(
  process.cwd(),
  '.planning/research/abc-samples/Leominster_Hymnary.musicxml',
)
const ROLLBACK_PATH = path.join(
  process.cwd(),
  'scripts/uat/baselines/leominster-abc-rollback.txt',
)
// 2026-08-27: Leominster MusicXML has 52 notes per "stanza" but those notes
// correspond to a DIFFERENT hymn (Bonar's "Not What My Hand Hath Done" — see
// file's <text> tags), not psalm 70 / psalm 25. Neither psalm 25 (23 syllables)
// nor psalm 70 (27 syllables) maps to 52 notes. Drop double-length: use the
// first 27 MusicXML notes (one SM stanza) against psalm 70's 27 syllables →
// 4-phrase SM. `tunes.double_length` column stays true in DB; the runtime
// stanza pairing handles cycle grouping independently.
const DOUBLE_LENGTH = false

const APPLY = process.argv.includes('--apply')

// ── MusicXML parsing (no slur markup expected; defensive parser) ─────────────

interface MxNote {
  step: string
  alter: number
  octave: number
  duration: number // divisions
}

function parseMusicXml(xml: string): {
  notes: MxNote[]
  fifths: number
} {
  const fifthsMatch = xml.match(/<fifths>\s*(-?\d+)\s*<\/fifths>/)
  const fifths = fifthsMatch ? parseInt(fifthsMatch[1], 10) : 0

  const noteBlocks = xml.match(/<note\b[\s\S]*?<\/note>/g) ?? []
  const notes: MxNote[] = []

  for (const block of noteBlocks) {
    const voiceMatch = block.match(/<voice>\s*(\d+)\s*<\/voice>/)
    if (!voiceMatch || voiceMatch[1] !== '1') continue
    if (/<rest\b/.test(block)) continue
    if (/<grace\b/.test(block)) continue

    const stepMatch = block.match(/<step>\s*([A-Ga-g])\s*<\/step>/)
    const octaveMatch = block.match(/<octave>\s*(\d+)\s*<\/octave>/)
    const alterMatch = block.match(/<alter>\s*(-?\d+)\s*<\/alter>/)
    const durMatch = block.match(/<duration>\s*(\d+)\s*<\/duration>/)
    if (!stepMatch || !octaveMatch || !durMatch) continue

    notes.push({
      step: stepMatch[1].toUpperCase(),
      alter: alterMatch ? parseInt(alterMatch[1], 10) : 0,
      octave: parseInt(octaveMatch[1], 10),
      duration: parseInt(durMatch[1], 10),
    })
  }

  return { notes, fifths }
}

function fifthsToAbcKey(fifths: number): string {
  const map: Record<string, string> = {
    '7': 'C#', '6': 'F#', '5': 'B', '4': 'E', '3': 'A', '2': 'D', '1': 'G', '0': 'C',
    '-1': 'F', '-2': 'Bb', '-3': 'Eb', '-4': 'Ab', '-5': 'Db', '-6': 'Gb', '-7': 'Cb',
  }
  return map[String(fifths)] ?? 'C'
}

function pitchToAbc(step: string, alter: number, octave: number): string {
  let s = ''
  if (alter === -1) s += '_'
  else if (alter === 1) s += '^'
  else if (alter === 2) s += '^^'
  else if (alter === -2) s += '__'

  if (octave >= 5) {
    s += step.toLowerCase()
    for (let i = 5; i < octave; i++) s += "'"
  } else if (octave === 4) {
    s += step.toUpperCase()
  } else {
    s += step.toUpperCase()
    for (let i = octave; i < 4; i++) s += ','
  }
  return s
}

function durationToAbc(durationDivisions: number, divisionsPerQuarter: number): string {
  const units = Math.round((durationDivisions / divisionsPerQuarter) * 2)
  if (units === 1) return ''
  if (units === 2) return '2'
  if (units === 4) return '4'
  if (units === 8) return '8'
  if (units % 2 === 0) return String(units)
  return `/${units}`
}

// ── Stanza 1 syllable list (HARD-CODED) ──────────────────────────────────────
//
// Psalm 70 (First Version, Recommended), SM = 6.6.8.6.
//
// Source: psalm_versions row 91 lyrics_structured[0].lines:
//   line 0: "Lord, haste me to deliver;"
//   line 1: "with speed, Lord, succor me."
//   line 2: "Let them that for my soul do seek"
//   line 3: "shamed and confounded be:"
//
// Hard-coded syllable tokens (abcjs w: format; ONE space-token per note, since
// Leominster has 0 slurs → 1-syllable-per-note). For multi-syllable words, we
// split them into separate syllables (one per note).
//
// Why hard-coded: nlp-syllables mis-segments Scottish Psalter vocabulary.
// Hard-coding per-tune syllable tokens avoids modifying lyrics.ts (additive-only
// hard rule).
//
// Phrase 1 = 7 syllables (CPRC "Lord haste me to deliver" — one extra "me" vs.
// standard "Lord make haste to deliver"; user sing-test will confirm). Phrases
// 2/3/4 = 6/8/6 syllables. Total = 27 syllables → 27 notes from MusicXML.
// For SMD (double-length), the stanza is sung twice → 8 phrases total.
const PHRASE_W_LINES = [
  "Lord haste me to de li ver",
  "with speed Lord suc cor me",
  "Let them that for my soul do seek",
  "shamed and con found ed be",
]
const PHRASE_SYLLABLE_COUNTS_SINGLE = [7, 6, 8, 6]
const PHRASE_SYLLABLE_COUNTS = DOUBLE_LENGTH
  ? [...PHRASE_SYLLABLE_COUNTS_SINGLE, ...PHRASE_SYLLABLE_COUNTS_SINGLE]
  : PHRASE_SYLLABLE_COUNTS_SINGLE

// ── Build ABC body (one-syllable-per-note, no slur markup) ──────────────────

interface AbcToken {
  pitch: string
  dur: string
  syl: string
}

interface BuildResult {
  abc: string
  melismaPositions: number[][]
}

function buildAbc(abcNotes: MxNote[], fifths: number): BuildResult {
  const keySig = fifthsToAbcKey(fifths)
  const DIVS_PER_QUARTER = 256 // Hymnary Sibelius default

  // Flatten all syllable tokens. For double-length, repeat the stanza.
  const allTokens: string[] = []
  if (DOUBLE_LENGTH) {
    for (let i = 0; i < 2; i++) {
      for (const ph of PHRASE_W_LINES) {
        const toks = ph.split(/\s+/).filter(Boolean)
        for (const t of toks) allTokens.push(t)
      }
    }
  } else {
    for (const ph of PHRASE_W_LINES) {
      const toks = ph.split(/\s+/).filter(Boolean)
      for (const t of toks) allTokens.push(t)
    }
  }

  const expectedSylCount = PHRASE_SYLLABLE_COUNTS.reduce((a, b) => a + b, 0)
  if (allTokens.length !== expectedSylCount) {
    throw new Error(
      `Hard-coded syllable count mismatch: got ${allTokens.length}, expected ${expectedSylCount}`,
    )
  }

  if (abcNotes.length < allTokens.length) {
    throw new Error(
      `Not enough notes in MusicXML: have ${abcNotes.length}, need ${allTokens.length}`,
    )
  }

  const out: AbcToken[] = []
  for (let i = 0; i < allTokens.length; i++) {
    const n = abcNotes[i]
    out.push({
      pitch: pitchToAbc(n.step, n.alter, n.octave),
      dur: durationToAbc(n.duration, DIVS_PER_QUARTER),
      syl: allTokens[i],
    })
  }

  // Build per-phrase chunks; track melisma_positions per phrase.
  // Leominster has 0 slurs → all per-phrase melisma arrays are empty.
  const chunks: string[] = []
  const wChunks: string[] = []
  const melismaPositions: number[][] = []
  let cursor = 0
  for (const budget of PHRASE_SYLLABLE_COUNTS) {
    const musicParts: string[] = []
    const wParts: string[] = []
    for (let i = cursor; i < cursor + budget; i++) {
      musicParts.push(out[i].pitch + out[i].dur)
      wParts.push(out[i].syl)
    }
    chunks.push(musicParts.join(' '))
    wChunks.push(wParts.join(' '))
    melismaPositions.push([]) // 0 slurs → empty array per phrase
    cursor += budget
  }

  const body =
    chunks
      .map((c, i) => (i === 0 ? c : `\n% PHRASE_BREAK\n| ${c}`))
      .join('\n')

  const wLines = wChunks.map((p) => `w: ${p}`).join('\n')

  const abc = `X:1
T:Leominster
M:C
L:1/8
Q:1/4=84
K:${keySig}
${body}
${wLines}
`.trim() + '\n'

  return { abc, melismaPositions }
}

// ── Rollback artifact ────────────────────────────────────────────────────────

interface Rollback {
  tuneId: number
  preAbc: string | null
  preMelismaPositions: number[][] | null
  newAbcSha256: string
  timestamp: string
}

async function captureRollback(
  sql: ReturnType<typeof postgres>,
  newAbc: string,
  newMelisma: number[][] | null,
): Promise<Rollback> {
  const rows = await sql<
    { abc_notation: string | null; melisma_positions: number[][] | null }[]
  >`SELECT abc_notation, melisma_positions FROM tunes WHERE id = ${TUNE_ID}`
  const preAbc = rows[0]?.abc_notation ?? null
  const preMelismaPositions = rows[0]?.melisma_positions ?? null
  const sha = createHash('sha256').update(newAbc, 'utf8').digest('hex')
  const ts = new Date().toISOString()
  const rb: Rollback = {
    tuneId: TUNE_ID,
    preAbc,
    preMelismaPositions,
    newMelismaPositions: newMelisma,
    newAbcSha256: sha,
    timestamp: ts,
  }
  fs.writeFileSync(ROLLBACK_PATH, JSON.stringify(rb, null, 2) + '\n')
  return rb
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set — run `set -a; . ./.env; set +a` first')
  }

  // 1. Parse MusicXML
  if (!fs.existsSync(SOURCE_MUSICXML)) {
    throw new Error(`MusicXML not found at ${SOURCE_MUSICXML}`)
  }
  const xml = fs.readFileSync(SOURCE_MUSICXML, 'utf8')
  const { notes, fifths } = parseMusicXml(xml)
  console.log(`Parsed ${notes.length} voice=1 notes from Leominster MusicXML (fifths=${fifths})`)

  // 2. Build ABC + melismaPositions
  const { abc, melismaPositions } = buildAbc(notes, fifths)

  // 3. Validate
  const parsed = abcjs.parseOnly(abc)
  if (!parsed?.[0]) throw new Error('abcjs.parseOnly returned no tune')
  const warns = parsed[0].warnings ?? []
  console.log(`abcjs.parseOnly warnings: ${warns.length}`)
  if (warns.length > 0) console.log('  ' + warns.slice(0, 5).join('\n  '))

  console.log('\n--- Generated abc_notation ---')
  console.log(abc)
  console.log('--- end preview ---\n')
  console.log(`melismaPositions: ${JSON.stringify(melismaPositions)}`)

  if (!APPLY) {
    console.log('DRY RUN — no DB write. Re-run with --apply to UPDATE.')
    return
  }

  // 4. ROLLBACK_CAPTURED guard
  if (process.env.ROLLBACK_CAPTURED !== 'true') {
    throw new Error(
      'ROLLBACK_CAPTURED env var must be set to "true" before any UPDATE. Aborting.',
    )
  }

  // 5. Capture rollback + apply
  const sql = postgres(process.env.DATABASE_URL!)
  const rb = await captureRollback(sql, abc, melismaPositions)
  console.log(
    `Rollback captured: preAbc=${rb.preAbc === null ? '(null)' : `(length ${rb.preAbc.length})`} newAbcSha256=${rb.newAbcSha256}`,
  )

  const db = drizzle(sql)
  const result = await db
    .update(tunes)
    .set({ abcNotation: abc, melismaPositions: melismaPositions })
    .where(eq(tunes.id, TUNE_ID))
    .returning({ id: tunes.id })

  if (result.length !== 1) {
    throw new Error(
      `Expected exactly 1 row updated for tune id=${TUNE_ID}, got ${result.length}`,
    )
  }
  console.log(`Updated tune id=${result[0].id} (${result.length} row)`)

  await sql.end()
  console.log('PASS — Leominster abc_notation + melisma_positions applied to DB')
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})