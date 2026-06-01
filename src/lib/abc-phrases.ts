/**
 * Pure helpers for splitting a phrased ABC tune string on `% PHRASE_BREAK`
 * marker comments (D-02). Comments starting with `%` are ignored by the abcjs
 * parser, so the source tune still renders normally; this module is consumed
 * by the NotationRenderer (Plan 04) and the annotation script (Plan 02) to
 * isolate one phrase at a time for the per-phrase staff/lyrics layout (D-10,
 * D-19).
 *
 * Pure module — no DOM, no abcjs, no Next/React imports.
 */

export interface SplitAbc {
  header: string
  phrases: string[]
}

/**
 * Splits an ABC string into its header (through K: line inclusive) and an
 * ordered list of phrase bodies, separated by `% PHRASE_BREAK` lines.
 *
 * Marker tolerance: any line matching `/^\s*%\s*PHRASE_BREAK\s*$/m` is treated
 * as a separator (allows leading/trailing whitespace and optional space
 * between `%` and `PHRASE_BREAK`).
 *
 * Empty body chunks (e.g. an `% PHRASE_BREAK` immediately after the K: line)
 * are filtered out.
 *
 * Graceful fallbacks:
 *   - No K: line found → `{ header: '', phrases: [abc] }` (entire input is
 *     treated as one phrase body).
 *   - No `% PHRASE_BREAK` markers → single-element phrases array containing
 *     the trimmed body.
 *
 * @example
 *   splitOnPhraseBreaks(`X:1\nT:Old Hundredth\nK:G\n| G2 G G |\n% PHRASE_BREAK\n| D2 D D |`)
 *   // => { header: "X:1\nT:Old Hundredth\nK:G", phrases: ["| G2 G G |", "| D2 D D |"] }
 */
export function splitOnPhraseBreaks(abc: string): SplitAbc {
  const lines = abc.split('\n')
  const kIdx = lines.findIndex((l) => /^K:/.test(l.trim()))
  if (kIdx === -1) return { header: '', phrases: [abc] }
  const header = lines.slice(0, kIdx + 1).join('\n')
  const body = lines.slice(kIdx + 1).join('\n')
  const phrases = body
    .split(/^\s*%\s*PHRASE_BREAK\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
  return { header, phrases: phrases.length ? phrases : [body.trim()] }
}

/**
 * Reassembles a single-phrase ABC string from a SplitAbc and a phrase index.
 *
 * - Out-of-bounds index → falls back to the first phrase.
 * - Empty phrases array → returns the header alone (no crash).
 *
 * @example
 *   buildPhraseAbc({ header: "X:1\nK:G", phrases: ["| C |", "| D |"] }, 1)
 *   // => "X:1\nK:G\n| D |"
 */
export function buildPhraseAbc(split: SplitAbc, phraseIndex: number): string {
  if (split.phrases.length === 0) return split.header
  const body = split.phrases[phraseIndex] ?? split.phrases[0]
  return `${split.header}\n${body}`
}

function isInfoFieldLine(line: string): boolean {
  return /^\s*[A-Za-z]:/.test(line)
}

/**
 * Count note heads in an ABC music fragment.
 * Pure function. Excludes rests, grace notes, annotations, decorations, and
 * tied continuations. Counts each chord [..] as 1.
 *
 * Copied verbatim from scripts/annotate-phrase-breaks.ts (which has Node-only
 * top-level imports — dotenv, postgres, node:fs — so cannot be imported by
 * browser-bundled modules). Keep the two copies in sync.
 */
export function countNoteHeads(abc: string): number {
  const musicOnly = abc
    .split('\n')
    // Exclude info-field lines (X:, T:, M:, K:, w:, ...) AND comment lines
    // (`% PHRASE_BREAK`, etc.). Comment lines contain literal letters like
    // `A` `E` `B` that would otherwise match the note regex and inflate
    // the count by ~5 per PHRASE_BREAK marker.
    .filter((l) => !isInfoFieldLine(l) && !/^\s*%/.test(l))
    .join(' ')
  const stripped = musicOnly
    .replace(/\{[^}]*\}/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/![^!]*!/g, '')
  const chordCount = (stripped.match(/\[[^\]]+\]/g) ?? []).length
  const noChords = stripped.replace(/\[[^\]]+\]/g, '')
  const notePattern = /[=^_]?[A-Ga-g][',]*\d*/g
  const noteCount = (noChords.match(notePattern) ?? []).length
  const tieCount = (noChords.match(/-(?=[=^_]?[A-Ga-g])/g) ?? []).length
  return chordCount + noteCount - tieCount
}
