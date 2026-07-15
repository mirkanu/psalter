/**
 * Detects consecutive same-pitch note runs — the psalm-singing "reciting
 * note" / "point" convention where a syllable is chanted across 2+
 * repeated-pitch notes (see .planning/research/lyric-to-note-alignment.md
 * §4, Mechanism 1: explicit slur/underline melisma, here inferred from
 * pitch repetition since the source OCR data lost the underline markers).
 *
 * Returns 0-indexed note positions — in the SAME note ordering `countNoteHeads`
 * counts in (chords excluded, tied notes excluded) — that should be treated
 * as melisma continuations: every note after the first in each repeated-pitch
 * run, earliest runs first, capped at `maxContinuations`.
 */
export function detectRepeatedPitchContinuations(musicBody: string, maxContinuations: number): number[] {
  if (maxContinuations <= 0) return []

  const musicOnly = musicBody
    .split('\n')
    .filter((l) => !/^\s*[A-Za-z]:/.test(l) && !/^\s*%/.test(l))
    .join(' ')
  const stripped = musicOnly
    .replace(/\{[^}]*\}/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/![^!]*!/g, '')
    .replace(/\[[^\]]+\]/g, '') // chords excluded — ambiguous "pitch", matches countNoteHeads

  const notePattern = /[=^_]?[A-Ga-g][',]*\d*/g
  const pitches: string[] = []
  let match: RegExpExecArray | null
  while ((match = notePattern.exec(stripped))) {
    const precededByTie = stripped[match.index - 1] === '-'
    if (precededByTie) continue // tied note — already merged, not a distinct note head
    pitches.push(match[0].replace(/\d+$/, '')) // pitch identity: accidental + letter + octave marks
  }

  const continuations: number[] = []
  for (let i = 1; i < pitches.length && continuations.length < maxContinuations; i++) {
    if (pitches[i] === pitches[i - 1]) continuations.push(i)
  }
  return continuations
}
