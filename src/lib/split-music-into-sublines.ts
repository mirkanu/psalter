/**
 * splitMusicIntoSubLines — extracted from NotationRenderer.tsx for unit testing.
 *
 * Splits an ABC music phrase body into N sub-staff lines at measure boundaries.
 * Music body is tokenised on `|` into measures, then re-grouped into N chunks.
 * Each chunk becomes a separate music line (rendered as a separate staff system
 * by abcjs).
 *
 * Phase 04.9.8 fix: bare rest pseudo-bars (z2, x2, Z, z, etc.) that appear
 * without a closing barline are excluded from the measure count. This prevents
 * a trailing `z2` rest from inflating bar count and causing wrong sub-line splits
 * in the 5 known z2-bug tunes (Arnold, Crediton, New Britain, St. Andrew, St. Mary).
 */
export function splitMusicIntoSubLines(body: string, n: number): string[] {
  if (n <= 1) return [body]
  // Tokenize on the bar `|` — keep the bars attached to the preceding measure.
  const segs = body.split(/(\|)/).filter((s) => s.length > 0)
  // Re-pair tokens so each measure includes its trailing bar.
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
  const realMeasures = measures
    .filter((m) => m && m !== '|')
    .filter((m) => !/^\s*[zxZ]\d*\s*$/.test(m)) // exclude bare rest pseudo-bars (z2 trailing rest bug)
  if (realMeasures.length < 2) return [body]
  const per = Math.max(1, Math.ceil(realMeasures.length / n))
  const lines: string[] = []
  for (let k = 0; k < realMeasures.length; k += per) {
    lines.push(realMeasures.slice(k, k + per).join(' '))
  }
  return lines
}
