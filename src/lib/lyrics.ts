// eslint-disable-next-line @typescript-eslint/no-require-imports
const syllabize = require('nlp-syllables/src/syllables') as (word: string) => string[]

import { phrasesForMeter } from './abc-phrase-meter-map'

/**
 * Extracts the first stanza from a multi-stanza psalm lyrics string.
 *
 * Verses in psalmVersions.lyrics are separated by double-newlines and each
 * verse begins with a run of digits immediately followed by the first word
 * (e.g. "1Praise ye the Lord"). This function strips that leading digit run
 * and returns the first stanza as a single space-separated string.
 *
 * @example
 *   extractVerse1("1Praise ye the Lord:\na new song\n\n2Let Isr'el joy")
 *   // => "Praise ye the Lord: a new song"
 *
 * @returns '' for null, undefined, or empty input
 */
export function extractVerse1(lyrics: string | null | undefined): string {
  if (!lyrics) return ''
  const paragraphs = lyrics.split(/\n\s*\n/)
  const first = paragraphs[0] ?? ''
  // Strip leading digit run (verse number prefix e.g. "1", "10", "123")
  const stripped = first.replace(/^\d+/, '')
  // Collapse all internal whitespace (newlines, multiple spaces) to single space
  return stripped.replace(/\s+/g, ' ').trim()
}

/**
 * Converts a plain-text lyric string into an abcjs w:-field-ready string.
 *
 * Each word is syllabified using nlp-syllables. Multi-syllable words have
 * their syllables joined with "- " (hyphen-space as abcjs expects). Single-
 * syllable words are returned as-is. Trailing punctuation (.,;:!?) is
 * stripped before syllabifying and re-attached to the last syllable so lyric
 * punctuation is preserved. Words are separated by spaces in the output.
 *
 * @example
 *   syllabifyForAbc("beautiful assembly")
 *   // => "beau- ti- ful as- sem- bly"
 *
 * @returns '' for empty input
 */
export function syllabifyForAbc(text: string): string {
  if (!text) return ''

  const words = text.split(/\s+/)
  const result = words.map((word) => {
    // Capture trailing punctuation to re-attach after syllabification
    const trailingMatch = word.match(/([.,;:!?]+)$/)
    const trailing = trailingMatch ? trailingMatch[1] : ''
    const stripped = trailing ? word.slice(0, word.length - trailing.length) : word

    if (!stripped) return word

    // syllabize lowercases internally; we pass lowercase for consistent results
    const syllables: string[] = syllabize(stripped.toLowerCase())

    if (syllables.length <= 1) {
      // Single syllable — preserve original capitalisation of stripped word
      return stripped + trailing
    }

    // Multi-syllable: join with "- " and re-attach trailing punctuation to last
    const joined = syllables
      .map((syl, i) => (i < syllables.length - 1 ? syl + '-' : syl))
      .join(' ')
    return joined + trailing
  })

  return result.join(' ')
}

/**
 * Splits a single stanza's text into N phrase-portions, where
 * N = phrasesForMeter(meter). Per D-16, each portion is the slice of lyric
 * lines that aligns with one phrase of the tune.
 *
 * Line-count mapping rule: given L non-blank lines and N phrases, each portion
 * receives `Math.ceil(L / N)` lines. The final portion may be shorter when L
 * does not divide evenly. For CM (8.6.8.6, N=2) with a 4-line stanza this
 * yields [lines 1-2, lines 3-4]; for DCM (N=4) with 4 lines it yields four
 * single-line portions; for DCM with 8 lines it yields four 2-line portions.
 *
 * Edge cases:
 *   - phrasesForMeter(meter) returns 1 (unknown / null / undefined meter) →
 *     returns `[stanzaText]` unchanged.
 *   - Stanza with zero non-blank lines after trimming → returns N empty
 *     strings.
 *   - Blank lines within the stanza are filtered out before slicing.
 *   - The verse-number prefix (e.g. "1") on the first line is preserved
 *     naturally because it travels with that line into the first portion;
 *     subsequent portions have no such prefix.
 *
 * @example
 *   splitStanzaIntoPhrasePortions(
 *     "1The Lord's my Shepherd\nI'll not want\nHe makes me down to lie\nIn pastures green",
 *     "CM"
 *   )
 *   // => [
 *   //   "1The Lord's my Shepherd\nI'll not want",
 *   //   "He makes me down to lie\nIn pastures green",
 *   // ]
 */
export function splitStanzaIntoPhrasePortions(
  stanzaText: string,
  meter: string | null | undefined,
): string[] {
  const n = phrasesForMeter(meter)
  if (n <= 1) return [stanzaText]
  const lines = stanzaText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return Array.from({ length: n }, () => '')
  const linesPerPortion = Math.ceil(lines.length / n)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const slice = lines.slice(i * linesPerPortion, (i + 1) * linesPerPortion)
    out.push(slice.join('\n'))
  }
  return out
}

/**
 * Injects syllabified `w:` lines into a single-phrase ABC fragment.
 *
 * Per D-16, the second argument is per-phrase portions (one entry per stanza
 * being shown under THIS phrase), NOT full stanzas. Each portion becomes one
 * `w:` line; multiple portions render as stacked verse rows below the staff.
 *
 * Cleaning rules (defensive):
 *   - Any pre-existing `w:` lines in the input ABC are stripped before new
 *     ones are appended (avoids duplicates if the source already had lyrics).
 *   - Consecutive blank lines are collapsed to single newlines (abcjs Pitfall
 *     1: a blank line ends the tune).
 *   - Trailing whitespace on the cleaned body is trimmed before w: lines are
 *     appended.
 *   - Newlines inside a portion are flattened to spaces before syllabifying
 *     (a w: line is single-line).
 *   - Empty-string portions are skipped (no w: line emitted for that stanza
 *     on this phrase — used by mapCycleToPhraseSyllableLines under-fill).
 *
 * @example
 *   buildAbcWithSyllables("X:1\nK:G\n| G2 G G |", [
 *     "1The Lord's my Shepherd\nI'll not want",
 *     "2He makes me down to lie",
 *   ])
 *   // X:1
 *   // K:G
 *   // | G2 G G |
 *   // w: 1The Lord's my Shep- herd I'll not want
 *   // w: 2He makes me down to lie
 */
export function buildAbcWithSyllables(
  phraseAbc: string,
  stanzaPortionsForThisPhrase: string[],
): string {
  const cleaned = phraseAbc
    .replace(/^w:.*$/gm, '')
    .replace(/\n\n+/g, '\n')
    .trim()
  if (stanzaPortionsForThisPhrase.length === 0) return cleaned
  const wLines = stanzaPortionsForThisPhrase
    .filter((p) => !!p && p.length > 0)
    .map((p) => `w: ${syllabifyForAbc(p.replace(/\n/g, ' '))}`)
    .join('\n')
  if (!wLines) return cleaned
  return `${cleaned}\n${wLines}`
}
