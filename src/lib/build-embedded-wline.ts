/**
 * Pure module — no DOM, no abcjs, no Next/React imports, no DB, no fs, no Vision.
 *
 * buildEmbeddedWline: deterministic transform from
 *   (Vision tokens + per-token underlined flags + stanza-1 syllables + existing ABC body)
 * to an ABC body with embedded w: lines containing _ continuation tokens at every
 * underlined note position.
 *
 * Implements lyric-to-note-alignment.md §6 algorithm on solfège-OCR output (Phase 04.11 D-01).
 * Single source of truth for syllable→note mapping; PHRASE_BREAK markers are visual-only.
 */
import { splitOnPhraseBreaks, countNoteHeads } from './abc-phrases'

export interface BuildEmbeddedWlineInput {
  tokens: string[]
  underlined: boolean[]
  syllables: string[]
  existingAbc: string
}

export interface PerPhraseDiagnostic {
  phraseIdx: number
  noteHeadCount: number
  wTokenCount: number
}

export interface BuildEmbeddedWlineResult {
  abc: string
  passesValidation: boolean
  warnings: string[]
  perPhrase: PerPhraseDiagnostic[]
}

/**
 * Build the global w-line token stream by walking tokens left-to-right.
 * For each token: emit `_` if underlined, else consume the next syllable.
 *
 * This is the §6 algorithm applied directly to solfège OCR output: underlines
 * mark melisma continuations; non-underlined tokens consume one syllable.
 */
function buildWStream(
  tokens: string[],
  underlined: boolean[],
  syllables: string[],
  warnings: string[],
): string[] {
  const wStream: string[] = []
  let syllIdx = 0
  for (let i = 0; i < tokens.length; i++) {
    if (underlined[i]) {
      wStream.push('_')
    } else {
      if (syllIdx >= syllables.length) {
        // Out of syllables — emit a `*` placeholder (abcjs convention for "no lyric")
        // and record warning. Do NOT throw.
        wStream.push('*')
        warnings.push(
          `token ${i} (${tokens[i]}) has no syllable: syllable stream exhausted at syllIdx=${syllIdx}`,
        )
      } else {
        wStream.push(syllables[syllIdx++])
      }
    }
  }
  if (syllIdx < syllables.length) {
    warnings.push(
      `syllable count mismatch: ${syllables.length - syllIdx} leftover syllables after consuming all tokens (non-underlined token count vs syllables.length)`,
    )
  }
  return wStream
}

export function buildEmbeddedWline(
  input: BuildEmbeddedWlineInput,
): BuildEmbeddedWlineResult {
  const { tokens, underlined, syllables, existingAbc } = input
  const warnings: string[] = []

  // --- Invariant 0: tokens/underlined length match ---
  if (tokens.length !== underlined.length) {
    return {
      abc: existingAbc,
      passesValidation: false,
      warnings: [
        `tokens/underlined length mismatch: tokens.length=${tokens.length} vs underlined.length=${underlined.length}`,
      ],
      perPhrase: [],
    }
  }

  // --- Edge cases: empty tokens or empty syllables ---
  if (tokens.length === 0) {
    return {
      abc: existingAbc,
      passesValidation: false,
      warnings: ['empty tokens array — nothing to align'],
      perPhrase: [],
    }
  }
  if (syllables.length === 0) {
    return {
      abc: existingAbc,
      passesValidation: false,
      warnings: ['empty syllables array — nothing to align'],
      perPhrase: [],
    }
  }

  // --- Up-front syllable-count check (Test 4): non-underlined count vs syllables.length ---
  const nonUnderlinedCount = underlined.filter((u) => !u).length
  if (nonUnderlinedCount !== syllables.length) {
    warnings.push(
      `syllable count mismatch: non-underlined tokens=${nonUnderlinedCount} vs syllables.length=${syllables.length}`,
    )
  }

  // --- Step 1: build the global w-stream ---
  const wStream = buildWStream(tokens, underlined, syllables, warnings)

  // --- Step 2: split existing ABC into header + phrase bodies ---
  const split = splitOnPhraseBreaks(existingAbc)

  // --- Step 3: per phrase, slice the matching number of tokens by note-head count ---
  const perPhrase: PerPhraseDiagnostic[] = []
  const newPhraseBodies: string[] = []
  let cursor = 0

  for (let pIdx = 0; pIdx < split.phrases.length; pIdx++) {
    const body = split.phrases[pIdx]
    const noteHeadCount = countNoteHeads(body)
    const slice = wStream.slice(cursor, cursor + noteHeadCount)
    const wTokenCount = slice.length

    if (wTokenCount < noteHeadCount) {
      warnings.push(
        `phrase ${pIdx}: w-stream exhausted (need ${noteHeadCount} tokens, got ${wTokenCount})`,
      )
    }

    perPhrase.push({ phraseIdx: pIdx, noteHeadCount, wTokenCount })
    cursor += noteHeadCount

    // Inject w: line at end of phrase body
    const wLine = `w: ${slice.join(' ')}`
    newPhraseBodies.push(`${body}\n${wLine}`)
  }

  if (cursor < wStream.length) {
    warnings.push(
      `w-stream has ${wStream.length - cursor} leftover tokens after consuming all phrases`,
    )
  }

  // --- Step 4: rebuild ABC, preserving the PHRASE_BREAK separators verbatim ---
  const PHRASE_BREAK_LINE = '% PHRASE_BREAK'
  const separator = `\n${PHRASE_BREAK_LINE}\n`
  const newAbc = split.header
    ? `${split.header}\n${newPhraseBodies.join(separator)}`
    : newPhraseBodies.join(separator)

  // --- Step 5: single-source-of-truth invariant ---
  const allPhrasesValid = perPhrase.every(
    (p) => p.noteHeadCount === p.wTokenCount,
  )
  const passesValidation = allPhrasesValid && warnings.length === 0

  return {
    abc: newAbc,
    passesValidation,
    warnings,
    perPhrase,
  }
}
