#!/usr/bin/env npx tsx
/**
 * One-off conversion script (Phase 04.10): read the de Boer Crimond.musicxml,
 * run xml2abc.py, extract soprano, derive slur-map from MusicXML directly, walk
 * slurs+syllables to produce a w: line per phrase, insert PHRASE_BREAK markers,
 * validate (note-head count == w-token count per phrase), and (with --apply)
 * UPDATE tunes WHERE name='Crimond'.
 *
 * KNOWN LIMITATION: implements de Boer's 2-note-slur algorithm only.
 *
 * Usage:
 *   npx tsx scripts/convert-crimond-musicxml.ts
 *     # write fixture only, default heuristic PHRASE_BREAKs [8,14,22]
 *   npx tsx scripts/convert-crimond-musicxml.ts --phrase-breaks=10,16,24
 *     # write fixture with custom PHRASE_BREAK note-head positions
 *   npx tsx scripts/convert-crimond-musicxml.ts --apply
 *     # also UPDATE the DB row WHERE name='Crimond'
 */

import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { extractMelodyVoice } from '../src/lib/abc-voice-extract'
import {
  insertPhraseBreaks,
  getSplitPointsForMeter,
} from './annotate-phrase-breaks'
import { splitOnPhraseBreaks, countNoteHeads } from '../src/lib/abc-phrases'

// ─── Constants ──────────────────────────────────────────────────────────────

const SOURCE = '.planning/research/abc-samples/Crimond_deBoer.musicxml'
const OUTPUT = '.planning/research/abc-samples/crimond-verified.abc'

// Psalm 23 stanza 1 syllables per lyric-to-note-alignment.md §8 worked example.
// NB: NO hyphens — §8 canonical w-line writes syllables adjacent without
// hyphens; abcjs renders them adjacent without a hyphen (visual hyphen comes
// from staff layout).
const PSALM_23_STANZA_1: string[] = [
  'The',
  "Lord's",
  'my',
  'shep',
  'herd,',
  "I'll",
  'not',
  'want;',
  'he',
  'makes',
  'me',
  'down',
  'to',
  'lie',
  'in',
  'pas',
  'tures',
  'green,',
  'he',
  'lead',
  'eth',
  'me',
  'the',
  'qui',
  'et',
  'wa',
  'ters',
  'by.',
] // 28 syllables = 8+6+8+6 (CM)

// ─── CLI flag handling ──────────────────────────────────────────────────────

function resolvePhraseBreaks(): number[] {
  const flag = process.argv.find((a) => a.startsWith('--phrase-breaks='))
  if (flag) {
    const csv = flag.slice('--phrase-breaks='.length)
    const parsed = csv
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
    if (parsed.length !== 3) {
      throw new Error(
        `--phrase-breaks expects exactly 3 positions (got ${parsed.length}): ${csv}`,
      )
    }
    return parsed
  }
  const def = getSplitPointsForMeter('CM', 4)
  if (!def) throw new Error('getSplitPointsForMeter returned undefined for CM/4')
  return def // [8, 14, 22]
}

// ─── Exported pure functions (tested in colocated .test.ts) ─────────────────

export interface NoteSlurInfo {
  startsSlur: boolean
  endsSlur: boolean
}

/**
 * Walk notes left-to-right producing a w-line token per note.
 *
 * For each note:
 *   - if no syllables remain → emit '_'
 *   - else emit syllables[si++]
 *   - if this note STARTS a slur: continue walking, emit '_' for each
 *     subsequent note until (and including) the note where endsSlur===true
 *
 * For Crimond (2-note slurs only) this produces "syllable + _" pairs.
 * Output length always equals input notes length (1:1 — abcjs requirement).
 */
export function buildWTokens(
  notes: NoteSlurInfo[],
  syllables: string[],
): string[] {
  const tokens: string[] = []
  let si = 0
  let i = 0
  while (i < notes.length) {
    const syll = syllables[si]
    if (syll === undefined) {
      tokens.push('_')
      i++
      continue
    }
    tokens.push(syll)
    si++
    if (notes[i].startsSlur) {
      // walk continuation notes until endsSlur (inclusive)
      let j = i + 1
      while (j < notes.length) {
        tokens.push('_')
        if (notes[j].endsSlur) {
          j++
          break
        }
        j++
      }
      i = j
    } else {
      i++
    }
  }
  return tokens
}

/**
 * Parse the soprano voice (Part P1, voice 1, non-grace, non-chord, non-rest)
 * out of a MusicXML string and return per-note slur info.
 *
 * Streaming regex parser — no XML library dependency. Throws on grace notes
 * (de Boer Crimond has none; if encountered, the algorithm needs adjustment).
 */
export function parseSlursFromMusicXml(xml: string): NoteSlurInfo[] {
  // Extract Part P1 body only (soprano + alto live in P1; voice 1 = soprano)
  const partMatch = xml.match(/<part id="P1">([\s\S]*?)<\/part>/)
  if (!partMatch) {
    throw new Error('Could not find <part id="P1"> in MusicXML')
  }
  const body = partMatch[1]

  // Find each <note>...</note> block
  const noteBlocks = body.match(/<note\b[\s\S]*?<\/note>/g) ?? []
  const out: NoteSlurInfo[] = []
  for (const block of noteBlocks) {
    // Filter: voice 1 only
    const vm = block.match(/<voice>(\d+)<\/voice>/)
    if (!vm || vm[1] !== '1') continue
    // Skip grace notes — algorithm doesn't handle them
    if (/<grace\b/.test(block)) {
      throw new Error(
        'Grace note encountered in soprano voice — buildWTokens does not handle grace notes',
      )
    }
    // Skip chord-continuation notes (only the head of a chord gets a syllable)
    if (/<chord\s*\/>/.test(block)) continue
    // Skip rests
    if (/<rest\s*\/>/.test(block)) continue

    const startsSlur = /<slur[^>]*type="start"/.test(block)
    const endsSlur = /<slur[^>]*type="stop"/.test(block)
    out.push({ startsSlur, endsSlur })
  }
  return out
}

/**
 * Count whitespace-separated w-line tokens in a phrase body.
 * Each '_' counts as 1, each non-empty token counts as 1.
 * Strips the leading `w:` (or `w :`) marker and joins continuation lines.
 */
export function countWTokens(phraseBody: string): number {
  const lines = phraseBody.split('\n')
  let total = 0
  for (const line of lines) {
    const m = line.match(/^\s*w\s*:\s*(.*)$/)
    if (!m) continue
    const stripped = m[1].trim()
    if (!stripped) continue
    const tokens = stripped.split(/\s+/).filter((t) => t.length > 0)
    total += tokens.length
  }
  return total
}

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Weave w-line tokens into a phrased ABC string. For each phrase body, slice
 * the wTokens array by the phrase's note-head count and append a `w: ...`
 * line directly after the music body.
 */
function weaveWLinesIntoPhrases(phrasedAbc: string, wTokens: string[]): string {
  const lines = phrasedAbc.split('\n')
  const kIdx = lines.findIndex((l) => /^K:/.test(l.trim()))
  if (kIdx === -1) {
    throw new Error('No K: line found in phrased ABC — cannot weave w-lines')
  }
  const header = lines.slice(0, kIdx + 1)
  const body = lines.slice(kIdx + 1)

  // Walk body, grouping lines into phrases delimited by `% PHRASE_BREAK`
  const out: string[] = [...header]
  let phraseLines: string[] = []
  let tokenCursor = 0

  const flushPhrase = () => {
    if (phraseLines.length === 0) return
    const phraseText = phraseLines.join('\n')
    const noteCount = countNoteHeads(phraseText)
    const tokens = wTokens.slice(tokenCursor, tokenCursor + noteCount)
    tokenCursor += noteCount
    out.push(...phraseLines)
    out.push(`w: ${tokens.join(' ')}`)
    phraseLines = []
  }

  for (const line of body) {
    if (/^\s*%\s*PHRASE_BREAK\s*$/.test(line)) {
      flushPhrase()
      out.push(line)
    } else {
      phraseLines.push(line)
    }
  }
  flushPhrase()

  return out.join('\n')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const APPLY = args.includes('--apply')
  const phraseBreaks = resolvePhraseBreaks()
  console.log(`Using PHRASE_BREAK positions: [${phraseBreaks.join(', ')}]`)

  // xml2abc writes to a directory when -o points to a dir; instead, write to a
  // temp directory then read the *.abc file inside it.
  const tmpDir = '/tmp/crimond-deboer-abc'
  execSync(`mkdir -p ${tmpDir} && rm -f ${tmpDir}/*.abc`, { stdio: 'inherit' })
  execSync(`python3 scripts/xml2abc.py ${SOURCE} -o ${tmpDir}`, {
    stdio: 'inherit',
  })
  const abcFile = execSync(`ls ${tmpDir}/*.abc`).toString().trim().split('\n')[0]
  const satb = readFileSync(abcFile, 'utf-8')

  const soprano = extractMelodyVoice(satb)
  if (!soprano.trim()) {
    throw new Error('Extracted soprano voice is empty — check ABC structure')
  }

  const slurMap = parseSlursFromMusicXml(readFileSync(SOURCE, 'utf-8'))
  if (slurMap.length === 0) {
    throw new Error('No notes parsed from MusicXML — check voice filter')
  }
  console.log(`Parsed ${slurMap.length} soprano notes from MusicXML`)

  const wTokens = buildWTokens(slurMap, PSALM_23_STANZA_1)
  console.log(`Generated ${wTokens.length} w-line tokens`)

  const phrased = insertPhraseBreaks(soprano, 4, phraseBreaks)
  if (!phrased.includes('% PHRASE_BREAK')) {
    throw new Error('insertPhraseBreaks did not insert any PHRASE_BREAK markers')
  }

  const final = weaveWLinesIntoPhrases(phrased, wTokens)

  // Validate: every phrase has note-head count == w-token count
  const split = splitOnPhraseBreaks(final)
  if (split.phrases.length !== 4) {
    throw new Error(`Expected 4 phrases (CM), got ${split.phrases.length}`)
  }
  for (let i = 0; i < split.phrases.length; i++) {
    const heads = countNoteHeads(split.phrases[i])
    const tokens = countWTokens(split.phrases[i])
    if (heads !== tokens) {
      throw new Error(
        `Phrase ${i}: ${heads} note-heads vs ${tokens} w-tokens — mismatch`,
      )
    }
  }
  console.log(`VALIDATED: 4 phrases, length=${final.length}`)

  writeFileSync(OUTPUT, final)
  console.log(`Wrote ${OUTPUT}`)

  if (APPLY) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set')
    }
    const pgClient = postgres(process.env.DATABASE_URL)
    const db = drizzle({ client: pgClient, schema })
    const result = await db
      .update(schema.tunes)
      .set({ abcNotation: final })
      .where(eq(schema.tunes.name, 'Crimond'))
      .returning({ id: schema.tunes.id })
    if (result.length !== 1) {
      await pgClient.end()
      throw new Error(`Expected exactly 1 row updated, got ${result.length}`)
    }
    await pgClient.end()
    console.log(`Applied to tunes.name='Crimond' (id=${result[0].id})`)
  } else {
    console.log('Dry run — re-run with --apply to write to DB')
  }
}

// Only run main when invoked directly (not when imported by tests)
const isMainModule =
  // tsx/node ESM entry detection
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('convert-crimond-musicxml.ts')

if (isMainModule) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
