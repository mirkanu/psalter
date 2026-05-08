// eslint-disable-next-line @typescript-eslint/no-require-imports
const syllabize = require('nlp-syllables/src/syllables') as (word: string) => string[]

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
