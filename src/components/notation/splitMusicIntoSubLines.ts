// Split a phrase body into N sub-staves at measure boundaries.
//
// Music body is split on `|` into measures (via tokenizeMeasures), then
// re-grouped into N chunks. Each chunk becomes its own newline-separated music
// line, which abcjs renders as a separate staff system.
//
// Trailing-bar normalisation (Quick 260601-i5d):
// abcjs 6.6.3 synth scopes explicit accidentals (`^`, `_`, `=`) to the next
// `|` barline. `w:` lyric lines and music-line breaks do NOT reset accidental
// scope. If a sub-line ends WITHOUT a trailing `|`, an accidental on the
// final note (e.g. `=e` in K:Eb) leaks across the w: line into the next
// phrase's leading notes — manifesting as "sharps play as naturals" on
// Contemplation.
//
// Fix: every emitted sub-line ends with `|` (idempotent — no `||` introduced
// when the input already terminates in `|`). The n=1 early-return path is
// preserved byte-identical so single-line callers are unaffected.
//
// See `.planning/debug/contemplation-sharps-as-naturals.md` for the full
// root-cause analysis.
import { tokenizeMeasures } from './tokenizeMeasures'

export function splitMusicIntoSubLines(body: string, n: number): string[] {
  if (n <= 1) return [body]
  const realMeasures = tokenizeMeasures(body)
  if (realMeasures.length < 2) return [body]
  const per = Math.max(1, Math.ceil(realMeasures.length / n))
  const lines: string[] = []
  for (let k = 0; k < realMeasures.length; k += per) {
    lines.push(realMeasures.slice(k, k + per).join(' '))
  }
  // Normalise: ensure every sub-line ends with `|` to reset abcjs synth's
  // accidental scope at phrase boundaries. Idempotent — does not double-bar.
  return lines.map((l) => (/\|\s*$/.test(l) ? l : `${l} |`))
}