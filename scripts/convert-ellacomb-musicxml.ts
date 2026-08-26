#!/usr/bin/env npx tsx
/**
 * Convert Ellacomb (tune id 18, CM) Hymnary MusicXML → abc_notation, with
 * de Boer slur→syllable algorithm against psalm 99 stanza-1 lyrics fetched
 * from psalm_versions row 134.
 *
 * NOTE — typo decision: DB name is "Ellacomb" (almost certainly a typo of
 * "Ellacombe"). We KEEP the name as-is. A rename would require
 * permanentRedirect wiring in src/app/tunes/[slug]/page.tsx and risks
 * JPG filename drift. See Open Questions in the SUMMARY.
 *
 * Usage:
 *   ROLLBACK_CAPTURED=true npx tsx scripts/convert-ellacomb-musicxml.ts --apply
 *
 * Rollback artifact: scripts/uat/baselines/ellacomb-abc-rollback.txt
 *   Format: pre-change abc_notation value + sha256 of new abc_notation.
 *
 * Hard rules (from plan):
 *   - Additive only — never refactor or remove buildWLineFromSolfa,
 *     syllabifyForAbc, padWLineToNoteCount, splitWLineIntoChunks.
 *   - One row updated per task (id=18 only).
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { syllabifyForAbc } from '../src/lib/lyrics'

const abcjs = (abcjsModule as any).default ?? abcjsModule
const TUNE_ID = 18
const PSALM_VERSION_ID = 134 // psalm 99 (First Version)
const SOURCE_MUSICXML = path.join(
  process.cwd(),
  '.planning/research/abc-samples/Ellacombe_Hymnary.musicxml',
)
const ROLLBACK_PATH = path.join(
  process.cwd(),
  'scripts/uat/baselines/ellacomb-abc-rollback.txt',
)

const APPLY = process.argv.includes('--apply')

// ── MusicXML parsing (regex, no new deps) ────────────────────────────────────
//
// Extract voice=1 notes in document order. Each note carries:
//   - step (A–G) + alter (-1=♭, 0=♮, 1=♯) + octave (number)
//   - duration in divisions (relative to <divisions>)
//   - <notations><slur type="start"/></notations> for melisma span
// We also extract the key <fifths> for ABC K: field.

interface MxNote {
  step: string
  alter: number
  octave: number
  duration: number // divisions
  slurStart: boolean
  slurStop: boolean
}

function parseMusicXml(xml: string): {
  notes: MxNote[]
  fifths: number
} {
  // First <key><fifths> for the key signature
  const fifthsMatch = xml.match(/<fifths>\s*(-?\d+)\s*<\/fifths>/)
  const fifths = fifthsMatch ? parseInt(fifthsMatch[1], 10) : 0

  // Match each <note>...</note> block
  const noteBlocks = xml.match(/<note\b[\s\S]*?<\/note>/g) ?? []
  const notes: MxNote[] = []

  for (const block of noteBlocks) {
    // voice: only voice=1
    const voiceMatch = block.match(/<voice>\s*(\d+)\s*<\/voice>/)
    if (!voiceMatch || voiceMatch[1] !== '1') continue

    // skip rest notes — we want pitched notes only
    if (/<rest\b/.test(block)) continue

    // skip grace notes — they have <grace/> and no <duration>
    if (/<grace\b/.test(block)) continue

    const stepMatch = block.match(/<step>\s*([A-Ga-g])\s*<\/step>/)
    const octaveMatch = block.match(/<octave>\s*(\d+)\s*<\/octave>/)
    const alterMatch = block.match(/<alter>\s*(-?\d+)\s*<\/alter>/)
    const durMatch = block.match(/<duration>\s*(\d+)\s*<\/duration>/)
    if (!stepMatch || !octaveMatch || !durMatch) continue

    const slurStart = /<slur[^>]*type="start"/.test(block)
    const slurStop = /<slur[^>]*type="stop"/.test(block)

    notes.push({
      step: stepMatch[1].toUpperCase(),
      alter: alterMatch ? parseInt(alterMatch[1], 10) : 0,
      octave: parseInt(octaveMatch[1], 10),
      duration: parseInt(durMatch[1], 10),
      slurStart,
      slurStop,
    })
  }

  return { notes, fifths }
}

// ── MusicXML note → ABC token ─────────────────────────────────────────────────

function fifthsToAbcKey(fifths: number): string {
  // ABC key mapping (sharp/flat count → major key letter)
  // +7=C#, +6=F#, +5=B, +4=E, +3=A, +2=D, +1=G, 0=C,
  // -1=F, -2=B♭, -3=E♭, -4=A♭, -5=D♭, -6=G♭, -7=C♭
  const map: Record<string, string> = {
    '7': 'C#', '6': 'F#', '5': 'B', '4': 'E', '3': 'A', '2': 'D', '1': 'G', '0': 'C',
    '-1': 'F', '-2': 'Bb', '-3': 'Eb', '-4': 'Ab', '-5': 'Db', '-6': 'Gb', '-7': 'Cb',
  }
  return map[String(fifths)] ?? 'C'
}

function pitchToAbc(step: string, alter: number, octave: number): string {
  // ABC pitch: C4 = "C" (middle C), D4 = "D", ..., B4 = "B"
  //           C5 = "c", D5 = "d", ..., B5 = "b"
  //           C3 = "C," (low), D3 = "D,"
  //           C7 = "c'''" (high)
  let s = ''
  if (alter === -1) s += '_' // ♭
  else if (alter === 1) s += '^' // ♯
  else if (alter === 2) s += '^^'
  else if (alter === -2) s += '__'

  if (octave >= 5) {
    s += step.toLowerCase()
    for (let i = 5; i < octave; i++) s += "'"
  } else if (octave === 4) {
    s += step.toUpperCase()
  } else {
    // octave 3 or lower: uppercase + commas
    s += step.toUpperCase()
    for (let i = octave; i < 4; i++) s += ','
  }
  return s
}

function durationToAbc(durationDivisions: number, divisionsPerQuarter: number): string {
  // ABC L:1/8 means an eighth = 1 unit. So duration units = (divisions / divisionsPerQuarter) * 2
  // For Ellacomb: divisionsPerQuarter = 256, eighth = 128 → 1 unit; quarter = 256 → 2 units.
  const units = Math.round((durationDivisions / divisionsPerQuarter) * 2)
  if (units === 1) return '' // bare note = 1 unit
  if (units === 2) return '2'
  if (units === 4) return '4'
  if (units === 8) return '8'
  // dotted / unusual: emit "/N"
  if (units % 2 === 0) return String(units)
  // odd unit count: scale down
  const scaled = units / 1
  return `/${scaled}`
}

// ── Stanza 1 syllable list (HARD-CODED) ──────────────────────────────────────
//
// Psalm 99, CM = 8.6.8.6, total 28 syllables per stanza.
//
// Source: psalm_versions row 134 lyrics_structured[0].lines
//   line 0: "Th' eternal Lord doth reign as king,"
//   line 1: "let all the people quake;"
//   line 2: "He sits between the cherubims,"
//   line 3: "let th' earth be mov'd and shake."
//
// Hard-coded syllable tokens in abcjs w: format (space-separated; multi-syllable
// words joined with hyphens like "e-ter-nal"). "Th'" before a vowel is elided
// (counts as 0 syllables in singing — see PSALM_SYLLABLE_OVERRIDES).
//
// Why hard-coded: nlp-syllables mis-segments "eternal", "people", "between",
// "cherubims", "quake", "mov'd" — adding overrides to lyrics.ts would change
// runtime behavior across the whole app (hard rule: additive only to lyrics.ts).
// Hard-coding per-tune syllable tokens is the safe path.
//
// Phrase 1 = 8, phrase 2 = 6, phrase 3 = 8, phrase 4 = 6.
const PHRASE_W_LINES = [
  "e- ter- nal Lord doth reign as king",
  "let all the peo- ple quake",
  "He sits be- tween the cher- u- bims",
  "let earth be mov'd and shake",
]
// Expected syllable count per phrase (matches CM 8.6.8.6):
const PHRASE_SYLLABLE_COUNTS = [8, 6, 8, 6]
// getSplitPointsForMeter('CM', 4) → [8, 14, 22] — cumulative end-of-phrase
// indices for syllable tokens in a single 28-token stream.
const SPLIT_POINTS = [8, 14, 22]

// ── De Boer slur→syllable algorithm ──────────────────────────────────────────
//
// Reference: lyric-to-note-alignment.md §6
//   for each syllable:
//     if current note starts a slur: assign syllable to current note,
//       then skip notes until slur type=stop (these are melisma continuations,
//       emit `_` tokens in w: line)
//     else: assign syllable to current note, advance to next note
//
// We consume exactly one CM stanza's worth of music. The MusicXML may have
// more notes than we need (file has multiple stanzas); we stop when syllable
// stream is exhausted.

interface AbcNoteToken {
  abc: string // e.g. "_A2"
  syllable: string // word-level token to print under this note (empty for `_`)
  isMelismaContinuation: boolean
}

function applyDeBoer(notes: MxNote[], syllableTokens: string[]): AbcNoteToken[] {
  const tokens: AbcNoteToken[] = []
  let noteIdx = 0
  let sylIdx = 0

  while (sylIdx < syllableTokens.length && noteIdx < notes.length) {
    const cur = notes[noteIdx]
    if (cur.slurStart) {
      // Assign current syllable to current note; then skip notes inside slur
      tokens.push({ abc: '', syllable: syllableTokens[sylIdx], isMelismaContinuation: false })
      sylIdx++
      // Advance noteIdx past slur-stop
      noteIdx++
      while (noteIdx < notes.length) {
        const inside = notes[noteIdx]
        tokens.push({ abc: '', syllable: '_', isMelismaContinuation: true })
        if (inside.slurStop) {
          noteIdx++
          break
        }
        noteIdx++
      }
    } else {
      // syllabic — one note, one syllable
      tokens.push({ abc: '', syllable: syllableTokens[sylIdx], isMelismaContinuation: false })
      sylIdx++
      noteIdx++
    }
  }

  if (sylIdx < syllableTokens.length) {
    console.warn(
      `WARNING: ran out of notes at syllable ${sylIdx}/${syllableTokens.length} — truncating`,
    )
  }

  return tokens
}

// ── ABC assembly ─────────────────────────────────────────────────────────────

function buildAbc(
  abcNotes: MxNote[],
  syllabifiedPhrases: string[],
  fifths: number,
): string {
  const keySig = fifthsToAbcKey(fifths)
  // Flatten phrase syllables to one stream, then split back by phrase boundaries
  const allTokens: string[] = []
  for (const ph of syllabifiedPhrases) {
    const toks = ph.split(/\s+/).filter(Boolean)
    for (const t of toks) allTokens.push(t)
  }

  if (allTokens.length !== 28) {
    throw new Error(
      `Expected 28 CM syllables, got ${allTokens.length}. Syllables: ${JSON.stringify(allTokens)}`,
    )
  }

  const deBoerTokens = applyDeBoer(abcNotes, allTokens)

  // Walk note indices in parallel: each deBoerToken has no abc string yet;
  // we need to map them back to the original note index for pitch/duration.
  // Easier: rebuild by walking notes and syllables together from the slur data.
  // Re-do with note pitches attached:
  const out: Array<{ pitch: string; dur: string; syl: string; isCont: boolean }> = []
  let noteIdx2 = 0
  let tIdx = 0
  // Divisions per quarter = 256 for Ellacomb (typical Hymnary Sibelius export).
  const DIVS_PER_QUARTER = 256

  while (tIdx < deBoerTokens.length && noteIdx2 < abcNotes.length) {
    const n = abcNotes[noteIdx2]
    const tk = deBoerTokens[tIdx]
    if (tk.syllable === '_') {
      // melisma continuation
      out.push({
        pitch: pitchToAbc(n.step, n.alter, n.octave),
        dur: durationToAbc(n.duration, DIVS_PER_QUARTER),
        syl: '_',
        isCont: true,
      })
      tIdx++
      noteIdx2++
    } else {
      out.push({
        pitch: pitchToAbc(n.step, n.alter, n.octave),
        dur: durationToAbc(n.duration, DIVS_PER_QUARTER),
        syl: tk.syllable,
        isCont: false,
      })
      tIdx++
      noteIdx2++
    }
  }

  // Build music body with PHRASE_BREAK markers.
// Phrase boundaries are determined by SYLLABLE counts (CM = 8.6.8.6 = [8,6,8,6]).
// A melisma continuation (`_` in w:) consumes an extra note without consuming a
// syllable, so a phrase's music-note range may be longer than its syllable count.
// IMPORTANT: a `_` continuation belongs to the SAME phrase as the syllable that
// triggered it — if the last syllable of a phrase falls on a slur-start note,
// the trailing `_` note(s) are still part of that phrase. So when a phrase
// closes, we drain any trailing `_` entries before opening the next phrase.

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
      // Phrase syllable budget met. Drain any trailing `_` continuations into
      // this same phrase (they belong to the syllable that triggered them).
      let j = i + 1
      while (j < out.length && out[j].syl === '_') j++
      const endIdx = j - 1
      closePhrase(endIdx)
      if (phraseIdx >= PHRASE_SYLLABLE_COUNTS.length) break
      // continue from j on next iteration
      // (noteStart was updated by closePhrase)
      i = j - 1 // for-loop will increment to j
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
T:Ellacomb
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
}

async function captureRollback(sql: ReturnType<typeof postgres>, newAbc: string): Promise<Rollback> {
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
  console.log(`Parsed ${notes.length} voice=1 notes from Ellacomb MusicXML (fifths=${fifths})`)

  // 2. Use hard-coded syllables (NLP over-splits Scottish Psalter words)
  const syllabifiedPhrases = PHRASE_W_LINES
  for (let i = 0; i < syllabifiedPhrases.length; i++) {
    const toks = syllabifiedPhrases[i].split(/\s+/).filter(Boolean)
    if (toks.length !== PHRASE_SYLLABLE_COUNTS[i]) {
      throw new Error(
        `Phrase ${i + 1}: expected ${PHRASE_SYLLABLE_COUNTS[i]} syllables, got ${toks.length}: ${JSON.stringify(toks)}`,
      )
    }
  }
  console.log('Syllabified phrases (hard-coded):')
  syllabifiedPhrases.forEach((p, i) => console.log(`  phrase ${i + 1}: ${p}`))

  // 3. Build ABC
  const abc = buildAbc(notes, syllabifiedPhrases, fifths)

  // 4. Validate via abcjs.parseOnly()
  const parsed = abcjs.parseOnly(abc)
  if (!parsed?.[0]) throw new Error('abcjs.parseOnly returned no tune')
  const warns = parsed[0].warnings ?? []
  console.log(`abcjs.parseOnly warnings: ${warns.length}`)
  if (warns.length > 0) console.log('  ' + warns.slice(0, 5).join('\n  '))

  // 5. Print preview
  console.log('\n--- Generated abc_notation ---')
  console.log(abc)
  console.log('--- end preview ---\n')

  if (!APPLY) {
    console.log('DRY RUN — no DB write. Re-run with --apply to UPDATE.')
    return
  }

  // 6. ROLLBACK_CAPTURED guard
  if (process.env.ROLLBACK_CAPTURED !== 'true') {
    throw new Error(
      'ROLLBACK_CAPTURED env var must be set to "true" before any UPDATE. Aborting.',
    )
  }

  // 7. Connect to DB, capture rollback, apply
  const sql = postgres(process.env.DATABASE_URL!)
  const rb = await captureRollback(sql, abc)
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
  console.log('PASS — Ellacomb abc_notation applied to DB')
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})