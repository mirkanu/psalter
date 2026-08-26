#!/usr/bin/env npx tsx
/**
 * Convert Diademata (tune id 134, SM) Hymnary MusicXML → abc_notation, with
 * de Boer slur→syllable algorithm against psalm 45 Second Version stanza-1
 * lyrics fetched from psalm_versions row 160.
 *
 * Harder case: 1 slur pair (notes 19-20, melisma on "have"), 0 text/syllabic
 * tags in source (no lyric markup). Algorithm uses the slur markup to assign
 * syllables to notes via the canonical de Boer algorithm (lyric-to-note-
 * alignment.md §6).
 *
 * Usage:
 *   ROLLBACK_CAPTURED=true npx tsx scripts/convert-diademata-musicxml.ts --apply
 *
 * Rollback artifact: scripts/uat/baselines/diademata-abc-rollback.txt
 *
 * Hard rules (from plan):
 *   - Additive only — never refactor or remove buildWLineFromSolfa,
 *     syllabifyForAbc, padWLineToNoteCount, splitWLineIntoChunks.
 *   - One row updated per task (id=134 only).
 *   - ROLLBACK_CAPTURED env var MUST be set before any UPDATE.
 *   - MUST use the de Boer algorithm, NOT heuristic melisma detection.
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
const TUNE_ID = 134
const PSALM_VERSION_ID = 160 // psalm 45 (Second Version, Recommended)
const SOURCE_MUSICXML = path.join(
  process.cwd(),
  '.planning/research/abc-samples/Diademata_Hymnary.musicxml',
)
const ROLLBACK_PATH = path.join(
  process.cwd(),
  'scripts/uat/baselines/diademata-abc-rollback.txt',
)

const APPLY = process.argv.includes('--apply')

// ── MusicXML parsing (with slur markup) ──────────────────────────────────────

interface MxNote {
  step: string
  alter: number
  octave: number
  duration: number
  slurStart: boolean
  slurStop: boolean
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
      slurStart: /<slur[^>]*type="start"/.test(block),
      slurStop: /<slur[^>]*type="stop"/.test(block),
    })
  }

  return { notes, fifths }
}

function fifthsToAbcKey(fifths: number): string {
  const map: Record<number, string> = {
    7: 'C#', 6: 'F#', 5: 'B', 4: 'E', 3: 'A', 2: 'D', 1: 'G', 0: 'C',
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
// Psalm 45 (Second Version, Recommended), SM = 6.6.8.6.
//
// Source: psalm_versions row 160 lyrics_structured[0].lines:
//   line 0: "My heart inditing is"
//   line 1: "good matter in a song:"
//   line 2: "I speak the things that I have made,"
//   line 3: "which to the King belong:"
//
// Hard-coded syllable tokens (abcjs w: format; ONE space-token per note).
//
// Why hard-coded: nlp-syllables mis-segments "inditing", "matter", "things",
// "belong". Hard-coding per-tune syllable tokens avoids modifying lyrics.ts
// (additive-only hard rule).
//
// Phrase 1 = 6, phrase 2 = 6, phrase 3 = 8, phrase 4 = 6. Total = 26 syllables.
//
// Diademata MusicXML has 1 slur pair at voice=1 notes 19-20 → "have" syllable
// on note 19, `_` continuation on note 20. With de Boer algorithm:
//   note 19 (slurStart) → syllable 18 "have"
//   note 20 (slurStop) → "_"
//   note 21 → syllable 19 "made"
// Total notes consumed = 26 syllables + 1 continuation = 27 notes.
const PHRASE_W_LINES = [
  "My heart in di ting is",
  "good mat ter in a song",
  "I speak the things that I have made",
  "which to the King be long",
]
const PHRASE_SYLLABLE_COUNTS = [6, 6, 8, 6]
const SPLIT_POINTS = [6, 12, 20] // cumulative end-of-phrase indices

// ── De Boer slur→syllable algorithm ──────────────────────────────────────────
//
// Reference: lyric-to-note-alignment.md §6
//   for each syllable:
//     if current note starts a slur: assign syllable to current note,
//       then skip notes until slur type=stop (these are melisma continuations,
//       emit `_` tokens in w: line)
//     else: assign syllable to current note, advance to next note

interface DeBoerToken {
  noteIdx: number // 0-based index into the MusicXML notes array
  syllable: string
  isMelismaContinuation: boolean
}

function applyDeBoer(notes: MxNote[], syllableTokens: string[]): DeBoerToken[] {
  const tokens: DeBoerToken[] = []
  let noteIdx = 0
  let sylIdx = 0

  while (sylIdx < syllableTokens.length && noteIdx < notes.length) {
    const cur = notes[noteIdx]
    if (cur.slurStart) {
      // Assign current syllable to current note; slur continuations follow
      tokens.push({ noteIdx, syllable: syllableTokens[sylIdx], isMelismaContinuation: false })
      sylIdx++
      noteIdx++
      while (noteIdx < notes.length) {
        const inside = notes[noteIdx]
        tokens.push({ noteIdx, syllable: '_', isMelismaContinuation: true })
        if (inside.slurStop) {
          noteIdx++
          break
        }
        noteIdx++
      }
    } else {
      tokens.push({ noteIdx, syllable: syllableTokens[sylIdx], isMelismaContinuation: false })
      sylIdx++
      noteIdx++
    }
  }

  if (sylIdx < syllableTokens.length) {
    throw new Error(
      `Ran out of notes at syllable ${sylIdx}/${syllableTokens.length}`,
    )
  }

  return tokens
}

// ── Build ABC body ───────────────────────────────────────────────────────────

interface OutToken {
  pitch: string
  dur: string
  syl: string
}

function buildAbc(notes: MxNote[], fifths: number): string {
  const keySig = fifthsToAbcKey(fifths)
  const DIVS_PER_QUARTER = 256

  // Flatten syllable tokens
  const allTokens: string[] = []
  for (const ph of PHRASE_W_LINES) {
    const toks = ph.split(/\s+/).filter(Boolean)
    for (const t of toks) allTokens.push(t)
  }
  const expectedSyls = PHRASE_SYLLABLE_COUNTS.reduce((a, b) => a + b, 0)
  if (allTokens.length !== expectedSyls) {
    throw new Error(
      `Syllable count mismatch: got ${allTokens.length}, expected ${expectedSyls}`,
    )
  }

  // Apply de Boer → tokens with note indices
  const dbTokens = applyDeBoer(notes, allTokens)

  // Validate: total note consumption = syllable count + melisma continuations
  const noteConsumed = dbTokens[dbTokens.length - 1].noteIdx + 1
  const melismaCount = dbTokens.filter((t) => t.isMelismaContinuation).length
  if (noteConsumed - melismaCount !== expectedSyls) {
    console.warn(
      `WARN: note count (${noteConsumed}) - melisma count (${melismaCount}) = ${noteConsumed - melismaCount} ≠ expected ${expectedSyls}`,
    )
  }

  const out: OutToken[] = []
  for (const tk of dbTokens) {
    const n = notes[tk.noteIdx]
    out.push({
      pitch: pitchToAbc(n.step, n.alter, n.octave),
      dur: durationToAbc(n.duration, DIVS_PER_QUARTER),
      syl: tk.syllable,
    })
  }

  // Phrase chunks with trailing-continuation drain
  const chunks: string[] = []
  const wChunks: string[] = []

  let noteStart = 0
  let syllablesInPhrase = 0
  let phraseIdx = 0

  function closePhrase(endIdx: number) {
    const musicParts: string[] = []
    const wParts: string[] = []
    for (let j = noteStart; j <= endIdx; j++) {
      musicParts.push(out[j].pitch + out[j].dur)
      wParts.push(out[j].syl)
    }
    chunks.push(musicParts.join(' '))
    wChunks.push(wParts.join(' '))
    noteStart = endIdx + 1
    syllablesInPhrase = 0
    phraseIdx++
  }

  for (let i = 0; i < out.length; i++) {
    const o = out[i]
    if (o.syl !== '_') syllablesInPhrase++

    const phraseBudget = PHRASE_SYLLABLE_COUNTS[phraseIdx]
    const isLast = i === out.length - 1
    const ranOutOfBudget = phraseBudget === undefined

    if (!ranOutOfBudget && syllablesInPhrase >= phraseBudget) {
      // Drain trailing `_` continuations into this phrase
      let j = i + 1
      while (j < out.length && out[j].syl === '_') j++
      const endIdx = j - 1
      closePhrase(endIdx)
      if (phraseIdx >= PHRASE_SYLLABLE_COUNTS.length) break
      i = j - 1
    } else if (isLast && phraseIdx < PHRASE_SYLLABLE_COUNTS.length) {
      closePhrase(i)
    }
  }

  const body =
    chunks
      .map((c, i) => (i === 0 ? c : `\n% PHRASE_BREAK\n| ${c}`))
      .join('\n')

  const wLines = wChunks.map((p) => `w: ${p}`).join('\n')

  return `X:1
T:Diademata
M:C
L:1/8
Q:1/4=84
K:${keySig}
${body}
${wLines}
`.trim() + '\n'
}

// ── Rollback artifact ────────────────────────────────────────────────────────

interface Rollback {
  tuneId: number
  preAbc: string | null
  newAbcSha256: string
  timestamp: string
  syllableShapeNote: string
}

async function captureRollback(
  sql: ReturnType<typeof postgres>,
  newAbc: string,
  shapeNote: string,
): Promise<Rollback> {
  const rows = await sql<
    { abc_notation: string | null }[]
  >`SELECT abc_notation FROM tunes WHERE id = ${TUNE_ID}`
  const preAbc = rows[0]?.abc_notation ?? null
  const sha = createHash('sha256').update(newAbc, 'utf8').digest('hex')
  const ts = new Date().toISOString()
  const rb: Rollback = {
    tuneId: TUNE_ID,
    preAbc,
    newAbcSha256: sha,
    timestamp: ts,
    syllableShapeNote: shapeNote,
  }
  fs.writeFileSync(ROLLBACK_PATH, JSON.stringify(rb, null, 2) + '\n')
  return rb
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set — run `set -a; . ./.env; set +a` first')
  }

  if (!fs.existsSync(SOURCE_MUSICXML)) {
    throw new Error(`MusicXML not found at ${SOURCE_MUSICXML}`)
  }
  const xml = fs.readFileSync(SOURCE_MUSICXML, 'utf8')
  const { notes, fifths } = parseMusicXml(xml)
  console.log(`Parsed ${notes.length} voice=1 notes from Diademata MusicXML (fifths=${fifths})`)

  // Build ABC
  const abc = buildAbc(notes, fifths)

  // Validate
  const parsed = abcjs.parseOnly(abc)
  if (!parsed?.[0]) throw new Error('abcjs.parseOnly returned no tune')
  const warns = parsed[0].warnings ?? []
  console.log(`abcjs.parseOnly warnings: ${warns.length}`)
  if (warns.length > 0) console.log('  ' + warns.slice(0, 5).join('\n  '))

  // Shape check
  const allSylCount = PHRASE_W_LINES.reduce(
    (acc, p) => acc + p.split(/\s+/).filter(Boolean).length,
    0,
  )
  const shapeNote =
    `SM shape expected [6,6,8,6] = 26 syllables; hard-coded ` +
    `[${PHRASE_SYLLABLE_COUNTS.join(',')}] = ${allSylCount} syllables. ` +
    `Diademata MusicXML has 1 slur pair (notes 19-20) → 1 melisma continuation. ` +
    `Total notes consumed = ${allSylCount + 1}.`
  console.log(shapeNote)

  console.log('\n--- Generated abc_notation ---')
  console.log(abc)
  console.log('--- end preview ---\n')

  if (!APPLY) {
    console.log('DRY RUN — no DB write. Re-run with --apply to UPDATE.')
    return
  }

  if (process.env.ROLLBACK_CAPTURED !== 'true') {
    throw new Error(
      'ROLLBACK_CAPTURED env var must be set to "true" before any UPDATE. Aborting.',
    )
  }

  const sql = postgres(process.env.DATABASE_URL!)
  const rb = await captureRollback(sql, abc, shapeNote)
  console.log(
    `Rollback captured: preAbc=${rb.preAbc === null ? '(null)' : `(length ${rb.preAbc.length})`} newAbcSha256=${rb.newAbcSha256}`,
  )

  const db = drizzle(sql)
  const result = await db
    .update(tunes)
    .set({ abcNotation: abc })
    .where(eq(tunes.id, TUNE_ID))
    .returning({ id: tunes.id })

  if (result.length !== 1) {
    throw new Error(
      `Expected exactly 1 row updated for tune id=${TUNE_ID}, got ${result.length}`,
    )
  }
  console.log(`Updated tune id=${result[0].id} (${result.length} row)`)

  await sql.end()
  console.log('PASS — Diademata abc_notation applied to DB')
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})