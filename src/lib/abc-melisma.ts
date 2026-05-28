/**
 * Melisma-aware w: line generator for Scottish Psalter tunes.
 *
 * Strategy (hybrid, zero AI cost — see .continue-here.md):
 *   Step 1: Detect passing notes from sol-fa dot-pair syntax (f.r → r is passing)
 *   Step 2: Duration heuristic for residual surplus after dot-pair detection
 *
 * Consumed by NotationRenderer.wLinesForPhrase when solfegeOcrText is available.
 */

import { getPassingPositions } from './solfege-parser'
import { syllabifyForAbc } from './lyrics'
import { phrasesForMeter } from './abc-phrase-meter-map'

// Re-export NoteEvent type for consumers
export type { NoteEvent } from './solfege-parser'

/**
 * Inlined from scripts/annotate-phrase-breaks.ts (pure function, no Node deps).
 * Returns split-point indices for a given meter and phrase count.
 * CM n=4 → [8, 14, 22]  |  LM n=4 → [8, 16, 24]  |  SM n=4 → [6, 12, 20]
 *
 * NOTE: Do NOT import from scripts/annotate-phrase-breaks.ts — that file has
 * Node-only top-level imports (dotenv, postgres, node:fs) that would break the
 * browser bundle. This inline copy is pure TypeScript with no external dependencies.
 */
function getSplitPointsForMeter(
  meter: string | null | undefined,
  n: number,
): number[] | undefined {
  const firstToken = (meter?.trim().split(/\s+/)[0] ?? '').toUpperCase()
  if (n === 4) {
    if (firstToken === 'CM' || firstToken === '8.7.8.7') return [8, 14, 22]
    if (firstToken === 'LM') return [8, 16, 24]
    if (firstToken === 'SM') return [6, 12, 20]
    if (firstToken === '7.6.7.6') return [7, 13, 20]
  }
  if (n === 8) {
    if (firstToken === 'DCM') return [8, 14, 22, 30, 36, 44, 52]
    if (firstToken === 'DLM') return [8, 16, 24, 32, 40, 48, 56]
    if (firstToken === 'DSM') return [6, 12, 20, 26, 32, 40, 46]
  }
  return undefined
}

/**
 * Parse soprano solfège to extract durations for notes in [phraseStart, phraseEnd).
 * Returns duration per event in that range, in order.
 *
 * The solfège duration tokens are:
 *   dot-pair (. separator) → 1 unit each
 *   single beat (:) → 2 units
 *   hold (— or -) → extends previous
 *
 * This inline parse only needs durations + passing flag — not pitches.
 */
function getDurationEvents(
  soprano: string,
  phraseStart: number,
  phraseEnd: number,
): Array<{ duration: number; passing: boolean }> {
  let cleaned = soprano.trim()
  const lastDbl = cleaned.lastIndexOf('||')
  if (lastDbl >= 0) cleaned = cleaned.slice(0, lastDbl)
  cleaned = cleaned.replace(/\|\|/g, '|').replace(/\|$/, '').trim()

  const cells = cleaned.split(/\|+/).map((c) => c.trim()).filter(Boolean)
  const allEvents: Array<{ duration: number; passing: boolean }> = []

  for (const cell of cells) {
    const slots = cell.split(':').map((s) => s.trim()).filter(Boolean)
    for (const slot of slots) {
      const rawSubs = slot.split('.')
      const subTokens = rawSubs
        .map((s, i) => {
          let tok = s.trim()
          if (i === 0 && rawSubs.length > 1 && tok.endsWith(',')) tok = tok.slice(0, -1).trim()
          if (i > 0 && tok.startsWith(',')) tok = tok.slice(1).trim()
          return tok
        })
        .filter(Boolean)
      const halfBeat = subTokens.length > 1
      const unitDur = halfBeat ? 1 : 2

      for (let si = 0; si < subTokens.length; si++) {
        const token = subTokens[si]
        const isPassing = halfBeat && si > 0
        if (token === '—' || token === '-') {
          if (allEvents.length > 0) {
            allEvents[allEvents.length - 1].duration += unitDur
          }
        } else {
          allEvents.push({ duration: unitDur, passing: isPassing })
        }
      }
    }
  }

  return allEvents.slice(phraseStart, phraseEnd)
}

/**
 * Generate an abcjs w:-field string for one phrase of a melismatic tune.
 *
 * @param soprano       Raw solfège soprano line from DB (solfege_ocr_text soprano field)
 * @param doh           Key letter (e.g. "G", "Bb")
 * @param time          Time signature (e.g. "C", "3/4")
 * @param phraseIndex   0-based phrase index within the tune (0..3 for CM)
 * @param meter         Tune meter string (e.g. "CM", "LM (long meter, 88 88)")
 * @param syllables     Space-separated syllable text for this phrase portion
 *                      (already a single metrical line, e.g. "The Lord's my shep- herd")
 * @param warnings      Mutable array for diagnostic messages (passed in from caller)
 */
export function buildWLineFromSolfa(
  soprano: string,
  doh: string,
  time: string,
  phraseIndex: number,
  meter: string,
  syllables: string,
  warnings: string[],
): string {
  // Step 1: Get passing positions for entire tune
  const allPassings = getPassingPositions(soprano, doh, time)
  const totalEvents = allPassings.length

  // Step 2: Determine phrase note-event range
  const phraseCount = phrasesForMeter(meter)
  const splitPoints = getSplitPointsForMeter(meter, phraseCount)
  let phraseStart = 0
  let phraseEnd = totalEvents

  if (splitPoints) {
    const boundaries = [0, ...splitPoints, totalEvents]
    phraseStart = boundaries[phraseIndex] ?? 0
    phraseEnd = boundaries[phraseIndex + 1] ?? totalEvents
  }

  const phrasePassings = allPassings.slice(phraseStart, phraseEnd)
  const noteCount = phrasePassings.length

  // Step 3: Prepare syllable tokens from the syllabifyForAbc output
  const syllabified = syllabifyForAbc(syllables)
  const sylTokens = syllabified ? syllabified.split(/\s+/).filter(Boolean) : []
  let syllabicCount = phrasePassings.filter((v) => !v).length

  // Step 4: Duration heuristic — if syllabicCount > sylTokens.length, mark
  // shortest non-passing notes as passing until counts balance
  let adjustedPassings = [...phrasePassings]
  if (syllabicCount > sylTokens.length) {
    const events = getDurationEvents(soprano, phraseStart, phraseEnd)
    // Build array of {index, duration} for non-passing positions, sort ascending duration
    const candidates = events
      .map((e, i) => ({ i, duration: e.duration, passing: adjustedPassings[i] }))
      .filter((c) => !c.passing)
      .sort((a, b) => a.duration - b.duration) // shortest first

    let surplus = syllabicCount - sylTokens.length
    // Convert shortest notes to passing, later indices preferred for ties
    for (const c of candidates) {
      if (surplus <= 0) break
      adjustedPassings[c.i] = true
      surplus--
    }
    syllabicCount = adjustedPassings.filter((v) => !v).length
  }

  // Step 5: Check if still mismatched after heuristic
  if (syllabicCount !== sylTokens.length) {
    warnings.push(
      `abc-melisma: phrase ${phraseIndex} syllable mismatch after heuristic — ` +
      `${syllabicCount} syllabic slots, ${sylTokens.length} syllable tokens. ` +
      `Padding/truncating.`,
    )
  }

  // Step 6: Build token array
  const tokens: string[] = []
  let sylIdx = 0
  for (let ni = 0; ni < noteCount; ni++) {
    if (adjustedPassings[ni]) {
      tokens.push('_')
    } else {
      tokens.push(sylTokens[sylIdx] ?? '*')
      sylIdx++
    }
  }

  return tokens.join(' ')
}
