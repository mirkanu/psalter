// eslint-disable-next-line @typescript-eslint/no-require-imports
const syllabize = require('nlp-syllables/src/syllables') as (word: string) => string[]

/**
 * Manual syllable overrides for archaic Scottish Psalter vocabulary that the
 * `nlp-syllables` library gets wrong. Keyed by lowercase word (no punctuation).
 *
 * Each value is an array of syllable strings. The `syllabifyForAbc` function
 * checks this map before invoking the NLP library, applying the correct count
 * for words the automatic segmenter mis-handles (e.g. "tongues" → 2,
 * "righteous" → 4, "prayer" → 1 — all wrong).
 *
 * Add entries here whenever a visual alignment bug is traced to a syllable
 * count mismatch on a specific word.
 */
const PSALM_SYLLABLE_OVERRIDES: Record<string, string[]> = {
  // Scottish Psalter elided forms — count as 0 syllables (no note of their own).
  // "th'" before a vowel-initial word (Almighty, eternal, etc.) is elided in singing.
  "th'": [],
  // NLP over-splits single-syllable words ending in -ce/-te/-re (silent-e pattern).
  // These cause the last syllable to be dropped from 8-note phrases when the
  // phrase gets 9 tokens instead of 8.
  place: ['place'],
  grace: ['grace'],
  face: ['face'],
  race: ['race'],
  space: ['space'],
  trace: ['trace'],
  waste: ['waste'],
  taste: ['taste'],
  haste: ['haste'],
  paste: ['paste'],
  snare: ['snare'],
  bare: ['bare'],
  care: ['care'],
  dare: ['dare'],
  fare: ['fare'],
  hare: ['hare'],
  mare: ['mare'],
  rare: ['rare'],
  share: ['share'],
  spare: ['spare'],
  stare: ['stare'],
  square: ['square'],
  // NLP gives pestilence 4 syllables (pes-ti-len-ce); correct = 3 (pes-ti-lence)
  pestilence: ['pes', 'ti', 'lence'],
  // NLP under-splits common words (gives 1 syllable; correct = 2)
  under: ['un', 'der'],
  only: ['on', 'ly'],
  upon: ['up', 'on'],
  over: ['o', 'ver'],
  therein: ['there', 'in'],
  // NLP gives deliver 2 syllables (de-liver); correct = 3 (de-li-ver)
  deliver: ['de', 'li', 'ver'],
  deliverance: ['de', 'li', 'ver', 'ance'],
  // NLP gives assuredly 3 syllables; correct singing = 4 (as-sur-ed-ly)
  assuredly: ['as', 'sur', 'ed', 'ly'],
  // NLP splits "praise/raise" as "prai-se / rai-se" (2 syl); correct singing = 1.
  // These are the single biggest source of CM/SM/LM count mismatches in the
  // Scottish Psalter because praise-words appear in every doxology and Ps 150.
  praise: ['praise'],
  praises: ['praises'],
  praised: ['praised'],
  raise: ['raise'],
  raises: ['raises'],
  raised: ['raised'],
  // prayer: NLP gives 1 syllable; traditional singing = 2 (pray-er)
  prayer: ['pray', 'er'],
  prayers: ['pray', 'ers'],
  // tongues: NLP splits as ton-gues (2); correct = 1
  tongues: ['tongues'],
  // enemy / enemies: NLP gives ene-my (2); correct = 3 (en-e-my)
  enemy: ['en', 'e', 'my'],
  enemies: ['en', 'e', 'mies'],
  // iniquity: NLP gives i-ni-qu-i-ty (5); correct = 4 (in-iq-ui-ty)
  iniquity: ['in', 'iq', 'ui', 'ty'],
  iniquities: ['in', 'iq', 'ui', 'ties'],
  // righteous: NLP gives rig-hte-o-us (4); correct = 2 (righ-teous)
  righteous: ['righ', 'teous'],
  righteousness: ['righ', 'teous', 'ness'],
  unrighteous: ['un', 'righ', 'teous'],
  unrighteousness: ['un', 'righ', 'teous', 'ness'],
  // majesty: NLP gives majes-ty (2); correct = 3 (maj-es-ty)
  majesty: ['maj', 'es', 'ty'],
  // Archaic -eth verb forms: NLP gives 1 syllable; correct singing = 2 (verb-eth)
  beareth: ['bear', 'eth'],
  causeth: ['cause', 'eth'],
  cometh: ['come', 'eth'],
  doeth: ['do', 'eth'],
  fadeth: ['fade', 'eth'],
  faileth: ['fail', 'eth'],
  giveth: ['give', 'eth'],
  goeth: ['go', 'eth'],
  hateth: ['hate', 'eth'],
  healeth: ['heal', 'eth'],
  heareth: ['hear', 'eth'],
  hideth: ['hide', 'eth'],
  keepeth: ['keep', 'eth'],
  layeth: ['lay', 'eth'],
  leadeth: ['lead', 'eth'],
  liveth: ['live', 'eth'],
  looketh: ['look', 'eth'],
  maketh: ['make', 'eth'],
  raiseth: ['raise', 'eth'],
  ruleth: ['rule', 'eth'],
  seeketh: ['seek', 'eth'],
  shineth: ['shine', 'eth'],
  taketh: ['take', 'eth'],
  useth: ['use', 'eth'],
  waxeth: ['wax', 'eth'],
}

/**
 * Extracts the first stanza from a multi-stanza psalm lyrics string.
 *
 * Verses in psalmVersions.lyricsImportedRaw are separated by double-newlines and each
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

    // Check manual override dictionary before invoking NLP library
    const lowerStripped = stripped.toLowerCase()
    const syllables: string[] =
      PSALM_SYLLABLE_OVERRIDES[lowerStripped] ?? syllabize(lowerStripped)

    if (syllables.length === 0) {
      // Zero syllables — elided word (e.g. "th'"), produces no token
      return ''
    }
    if (syllables.length === 1) {
      // Single syllable — preserve original capitalisation of stripped word
      return stripped + trailing
    }

    // Multi-syllable: join with "- " and re-attach trailing punctuation to last
    const joined = syllables
      .map((syl, i) => (i < syllables.length - 1 ? syl + '-' : syl))
      .join(' ')
    return joined + trailing
  })

  return result.filter(Boolean).join(' ')
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
 *   - NOTE: the retired meter-string phrase-portion-splitting heuristic
 *     was removed in Phase 04.9.6 plan 04 — alignment now reads
 *     stanza.lines directly from the structured-lyrics tree.
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
    .filter((p) => !!p && p.trim().length > 0)
    .map((p) => `w: ${syllabifyForAbc(p.replace(/\n/g, ' '))}`)
    .join('\n')
  if (!wLines) return cleaned
  return `${cleaned}\n${wLines}`
}
