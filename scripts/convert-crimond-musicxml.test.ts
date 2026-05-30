import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  buildWTokens,
  countWTokens,
  parseSlursFromMusicXml,
  type NoteSlurInfo,
} from './convert-crimond-musicxml'

/**
 * Tests for the Phase 04.10 Crimond MusicXML→ABC conversion script.
 *
 * Test 1 is LOCKED against `.planning/research/lyric-to-note-alignment.md` §8 —
 * its 10-token w-line output is the canonical ground truth for de Boer Crimond
 * phrase 1. Do not modify these arrays without updating the canonical doc.
 */

// ─── Phrase 1 ground truth (§8 worked example) ─────────────────────────────
const PHRASE_1_NOTES: NoteSlurInfo[] = [
  { startsSlur: false, endsSlur: false }, // 0: c   — "The"        (syllabic)
  { startsSlur: false, endsSlur: false }, // 1: a4  — "Lord's"     (long-note implicit melisma — NO slur)
  { startsSlur: true, endsSlur: false }, // 2: b   — "my"          (slur start)
  { startsSlur: false, endsSlur: true }, // 3: g    — continuation ("_")
  { startsSlur: false, endsSlur: false }, // 4: c'  — "shep"       (syllabic)
  { startsSlur: true, endsSlur: false }, // 5: b    — "herd,"      (slur start)
  { startsSlur: false, endsSlur: true }, // 6: g    — continuation ("_")
  { startsSlur: false, endsSlur: false }, // 7: f4  — "I'll"       (syllabic)
  { startsSlur: false, endsSlur: false }, // 8: e2  — "not"        (long-note implicit melisma — NO slur)
  { startsSlur: false, endsSlur: false }, // 9: f4  — "want;"      (syllabic)
]

const PHRASE_1_SYLLABLES = [
  'The',
  "Lord's",
  'my',
  'shep',
  'herd,',
  "I'll",
  'not',
  'want;',
] // 8 syllables for 10 notes (2 melismas)

describe('buildWTokens (§8 canonical algorithm)', () => {
  it('Test 1: Phrase 1 matches lyric-to-note-alignment.md §8 verbatim', () => {
    const tokens = buildWTokens(PHRASE_1_NOTES, PHRASE_1_SYLLABLES)
    expect(tokens.join(' ')).toBe("The Lord's my _ shep herd, _ I'll not want;")
    expect(tokens.length).toBe(10)
  })

  it('Test 2: handles syllables-shorter-than-notes safely (pads with _)', () => {
    const notes: NoteSlurInfo[] = [
      { startsSlur: false, endsSlur: false },
      { startsSlur: false, endsSlur: false },
      { startsSlur: false, endsSlur: false },
    ]
    const tokens = buildWTokens(notes, ['a'])
    expect(tokens).toEqual(['a', '_', '_'])
  })

  it('Test 3: handles isolated 2-note slur (de Boer-style melisma)', () => {
    const notes: NoteSlurInfo[] = [
      { startsSlur: true, endsSlur: false },
      { startsSlur: false, endsSlur: true },
      { startsSlur: false, endsSlur: false },
    ]
    const tokens = buildWTokens(notes, ['x', 'y'])
    expect(tokens).toEqual(['x', '_', 'y'])
  })
})

describe('parseSlursFromMusicXml (against de Boer Crimond fixture)', () => {
  it('Test 4: parses >= 19 soprano notes from Crimond_deBoer.musicxml', () => {
    const xml = readFileSync(
      '.planning/research/abc-samples/Crimond_deBoer.musicxml',
      'utf-8',
    )
    const notes = parseSlursFromMusicXml(xml)
    // Plan 01 confirmed >= 19 <slur elements; soprano voice has 34 notes.
    expect(notes.length).toBeGreaterThanOrEqual(19)
    // Sanity: at least some slurs detected
    expect(notes.some((n) => n.startsSlur)).toBe(true)
    expect(notes.some((n) => n.endsSlur)).toBe(true)
  })

  it('Test 4b: first 10 soprano notes match §8 ground truth slur pattern', () => {
    const xml = readFileSync(
      '.planning/research/abc-samples/Crimond_deBoer.musicxml',
      'utf-8',
    )
    const notes = parseSlursFromMusicXml(xml)
    const first10 = notes.slice(0, 10)
    expect(first10).toEqual(PHRASE_1_NOTES)
  })
})

describe('countWTokens', () => {
  it('Test 5: counts each non-empty token (including _) as 1, ignoring whitespace', () => {
    expect(countWTokens('w: The Lord\'s my _ shep herd, _ I\'ll not want;')).toBe(10)
    expect(countWTokens('w:  a    b   _   c  ')).toBe(4)
    // multi-line w: lines (continuation) collapse
    expect(countWTokens('| C D |\nw: a b _ c\n| E F |\nw: d e')).toBe(6)
  })
})

describe('End-to-end (generated golden fixture)', () => {
  it('Test 6: crimond-verified.abc has 4 phrases with note-head == w-token per phrase', async () => {
    const { splitOnPhraseBreaks, countNoteHeads } = await import(
      '../src/lib/abc-phrases'
    )
    const abc = readFileSync(
      '.planning/research/abc-samples/crimond-verified.abc',
      'utf-8',
    )
    const split = splitOnPhraseBreaks(abc)
    expect(split.phrases.length).toBe(4)
    for (let i = 0; i < split.phrases.length; i++) {
      const heads = countNoteHeads(split.phrases[i])
      const tokens = countWTokens(split.phrases[i])
      expect(tokens).toBe(heads)
    }
  })
})
