// Tokenize a phrase body into a list of measures.
//
// Music body is split on `|` into measures, with each measure including its
// trailing bar. Bare-rest pseudo-bars (`z2`, `Z4` — multi-measure rest markers)
// are filtered out so they don't consume a sub-staff slot (the prior z2 trailing
// rest bug).
//
// Used by both `splitMusicIntoSubLines` (groups measures into N chunks) and the
// Inline Staff flatten path (LPT-distributes measures across N sub-staves to
// balance syllable counts). Centralizing the tokenization here keeps the bar
// handling consistent.
//
// Each returned measure ends with `|` so callers can re-emit them concatenated
// without losing abcjs's accidental-scope reset at bar boundaries
// (Quick 260601-i5d).
export function tokenizeMeasures(body: string): string[] {
  const segs = body.split(/(\|)/).filter((s) => s.length > 0)
  const measures: string[] = []
  let acc = ''
  for (const s of segs) {
    acc += s
    if (s === '|') {
      measures.push(acc.trim())
      acc = ''
    }
  }
  if (acc.trim()) measures.push(acc.trim())
  return measures
    .filter((m) => m && m !== '|')
    .filter((m) => !/^\s*[zxZ]\d*\s*$/.test(m))
}