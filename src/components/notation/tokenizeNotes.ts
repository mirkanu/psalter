// Tokenize an ABC measure body into individual note strings.
//
// Each token is a single note (e.g. "c2", "a4", "b", "g", "c'4", "f4"). Strips
// the trailing `|` if present (the caller usually appends its own `|` at
// emission time).
//
// 260825-flatten-note: used by the flatten path to break dense measures
// (e.g. Psalm 23 phrase 3 m1's 9-note "pas-ture green: he lead-eth me")
// across sub-staves via `\` continuation, allowing the LPT scheduler to
// distribute individual notes rather than whole measures.
//
// 260825-flatten-split: ABC measures are sometimes written without spaces
// between notes (e.g. "c2a4bg" — common in the Scottish Psalter corpus).
// A pure whitespace split would treat that whole measure as a single token,
// so the LPT scheduler would distribute whole multi-note measures instead of
// individual notes — yielding wildly uneven rows (e.g. {5, 12, 8, 6, 5}
// instead of the target {7, 7, 7, 7, 7}). We use the NOTE_RE regex to split
// on note boundaries so each pitch becomes its own entry.
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
  const stripped = measureBody.replace(/\s*\|\s*$/, '').trim()
  if (!stripped) return []
  // Strip grace-note groups — their notes are NOT counted in countNoteHeads
  // either, so they shouldn't appear in the flatten note stream.
  const noGrace = stripped.replace(/\{[^}]*\}/g, '')
  // 260825-flatten-split: extract every note token via the regex instead
  // of whitespace-splitting. ABC measures without inter-note spaces
  // (e.g. "c2a4bg") would otherwise become a single token.
  const matches = noGrace.match(new RegExp(NOTE_RE.source, 'g'))
  return matches ? matches.filter((tok) => tok.length > 0) : []
}
