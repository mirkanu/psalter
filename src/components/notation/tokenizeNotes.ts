// Tokenize an ABC measure body into individual note strings.
//
// Each token is either a note (e.g. "c2", "a4", "b", "g", "c'4", "f4") or
// a bar line ("|"). Strips the trailing `|` if present (the caller usually
// appends its own `|` at emission time).
//
// 260825-flatten-note: used by the flatten path to break dense measures
// (e.g. Psalm 23 phrase 3 m1's 9-note "pas-ture green: he lead-eth me")
// across sub-staves via `\` continuation, allowing the LPT scheduler to
// distribute individual notes rather than whole measures.
//
// Limitations (matches countNoteHeads scope):
//   - Does not parse chords `[..]` — treats each pitch inside as separate.
//   - Does not parse broken-rhythm markers (`<` / `>`).
//   - Does not parse grace notes `{..}` — they are filtered out.
// For the Scottish Psalter corpus these are rare/never.

const NOTE_RE = /[=^_]?[A-Ga-g][',]*\d*/

export function tokenizeNotesInMeasure(measureBody: string): string[] {
  // Drop the trailing bar line (we will re-emit it ourselves based on
  // isEndOfMeasure tracking).
  const m = measureBody.replace(/\s*\|\s*$/, '').trim()
  if (!m) return []
  // Strip grace-note groups — their notes are NOT counted in countNoteHeads
  // either, so they shouldn't appear in the flatten note stream.
  const noGrace = m.replace(/\{[^}]*\}/g, '')
  // Split on whitespace; each token is either a note, a bar line, or
  // decoration noise.
  return noGrace.split(/\s+/).filter((tok) => {
    if (!tok) return false
    if (tok === '|') return false // caller handles bar lines
    if (tok.startsWith('[')) return false // chord (rare in Scottish Psalter)
    if (tok.startsWith('"') || tok.startsWith('!')) return false // decoration
    return true
  })
}
