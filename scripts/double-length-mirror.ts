/**
 * Shared helper for double-length (CMD / SMD / LMD) ABC generation.
 *
 * For a double-length tune, the music of phrase N+4 is identical to phrase N
 * (the melody is sung twice). The slur/melisma markup is also identical
 * between the two cycles. Walking the MusicXML twice — once per cycle — would
 * fail because MusicXML typically only contains one copy of the melody, and
 * slur tags would either be consumed by the first pass or absent in the second.
 *
 * Fix: consume notes for ONE cycle (using the canonical deBoer algorithm with
 * slur markup), then re-run deBoer on the SAME notes with the second half of
 * the syllable stream. The MusicXML's slur markup is on the notes themselves
 * (not consumed by deBoer), so the second pass produces an identical
 * slur pattern.
 *
 * Usage:
 *   import { buildMirroredDeBoerTokens } from './double-length-mirror'
 *
 *   const result = buildMirroredDeBoerTokens({
 *     notes,
 *     allSyllableTokens,         // flattened first-half + (optionally) second-half syllables
 *     phraseBudgets,             // e.g. [6,6,8,6] for SM, [6,6,8,6,6,6,8,6] for SMD
 *     applyDeBoer,               // the tune's deBoer fn, signature (notes, syls) => AbcToken[]
 *     doubleLength,
 *   })
 */

export interface AbcMelismaToken {
  /** Index into the MusicXML notes array this token pairs with. */
  noteIdx: number
  /** Syllable text for the w: line (`_` for melisma continuation). */
  syllable: string
  /** True iff this token is a melisma continuation (no new syllable). */
  isMelismaContinuation: boolean
}

export interface MirrorResult<T extends AbcMelismaToken> {
  /** All tokens for the full tune (cycle 1 + cycle 2 if double-length). */
  tokens: T[]
  /** Note count consumed by the FIRST cycle. Pass back to slice notes for cycle 2. */
  firstCycleNoteCount: number
}

export function buildMirroredDeBoerTokens<T extends AbcMelismaToken>(args: {
  notes: any[]
  allSyllableTokens: string[]
  doubleLength: boolean
  applyDeBoer: (notes: any[], syls: string[]) => T[]
}): MirrorResult<T> {
  const { notes, allSyllableTokens, doubleLength, applyDeBoer } = args

  if (!doubleLength) {
    const tokens = applyDeBoer(notes, allSyllableTokens)
    return { tokens, firstCycleNoteCount: tokens.length }
  }

  // First cycle: full MusicXML notes, first half of syllables
  const halfPoint = allSyllableTokens.length / 2
  const firstHalfSyls = allSyllableTokens.slice(0, halfPoint)
  const secondHalfSyls = allSyllableTokens.slice(halfPoint)

  // Probe first cycle against the full note array to determine how many notes
  // a single cycle consumes (includes melisma continuations).
  const probeTokens = applyDeBoer(notes, firstHalfSyls)
  const firstCycleNoteCount = probeTokens.length

  // Slice notes to first cycle's worth. Elements are references to the same
  // MxNote objects as the original notes array, so slur markup is preserved.
  const firstCycleNotes = notes.slice(0, firstCycleNoteCount)

  // First cycle (canonical) — run again so we have the proper token list
  const firstCycleTokens = applyDeBoer(firstCycleNotes, firstHalfSyls)

  // Second cycle (mirror) — SAME notes, second half of syllables → identical
  // music + identical slur pattern
  const secondCycleTokens = applyDeBoer(firstCycleNotes, secondHalfSyls)

  return {
    tokens: [...firstCycleTokens, ...secondCycleTokens],
    firstCycleNoteCount,
  }
}
