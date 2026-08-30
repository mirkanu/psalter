// Split a phrase body into N sub-staves.
//
// Two-pass strategy:
//   1. MEASURE SPLIT (preferred): split on `|` into measures via
//      tokenizeMeasures, then re-group into N chunks. Each chunk becomes
//      its own newline-separated music line, which abcjs renders as a
//      separate staff system.
//   2. NOTE SPLIT (fallback, 2026-08-30): when the phrase is a SINGLE
//      MEASURE — common for double-length CMD/SMD tunes whose phrases
//      pack 6-8 notes into one bar (Ellacomb/Diademata/Leominster) —
//      measure splitting returns 1 chunk and the renderer falls back to
//      splitting on note tokens. Without this fallback, paired-stanza
//      double-length tunes would render 4 staff lines instead of 8
//      (4 phrases × 2 sub-staves). See commit e443736 for context.
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
  if (realMeasures.length >= 2) {
    const per = Math.max(1, Math.ceil(realMeasures.length / n))
    const lines: string[] = []
    for (let k = 0; k < realMeasures.length; k += per) {
      lines.push(realMeasures.slice(k, k + per).join(' '))
    }
    return lines.map((l) => (/\|\s*$/.test(l) ? l : `${l} |`))
  }
  // NOTE FALLBACK: phrase is a single measure. Split on note tokens so
  // double-length tunes (1 measure per phrase × paired-stanza sub-staves)
  // produce N sub-staves per phrase. Accidental-scope normalisation still
  // applies — every sub-line gets a trailing `|`.
  const tokens = body.trim().split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return [body]
  const per = Math.max(1, Math.ceil(tokens.length / n))
  const lines: string[] = []
  for (let k = 0; k < tokens.length; k += per) {
    lines.push(tokens.slice(k, k + per).join(' '))
  }
  return lines.map((l) => (/\|\s*$/.test(l) ? l : `${l} |`))
}