/**
 * Inject `% PHRASE_BREAK` markers into a plain ABC body at the cumulative
 * note-head counts requested by `counts`. Used by /dev/melisma-editor to
 * preserve the existing phrase structure when the user edits the raw OCR'd
 * solfège and re-runs solFaToAbc (which produces a phrase-unaware ABC).
 *
 * Pure module. Note tokenisation mirrors `countNoteHeads` semantics:
 * accidentals, octave marks, durations all stay attached; rests / grace
 * notes / decorations / chords-as-1 are excluded.
 *
 * If `counts` is empty or all-zero, the input ABC is returned unchanged.
 * If the ABC has fewer notes than the largest cumulative count, the marker
 * for that count is dropped silently (caller can detect by comparing
 * returned-marker-count vs requested).
 */

export interface InjectPhraseBreaksResult {
  abc: string
  /** Number of PHRASE_BREAK markers actually inserted. */
  inserted: number
  /** Total note heads detected in the input ABC body. */
  totalNotes: number
}

const INFO_FIELD = /^\s*[A-Za-z]:/
const NOTE_RE = /[=^_]?[A-Ga-g][',]*\d*\/?\d*/g

export function injectPhraseBreaksAtCounts(
  abc: string,
  counts: number[],
): InjectPhraseBreaksResult {
  if (counts.length === 0) {
    return { abc, inserted: 0, totalNotes: countNotesInAbc(abc) }
  }
  // Compute cumulative thresholds: e.g. [8,6,8,12] → [8, 14, 22, 34]
  const cumulative: number[] = []
  let running = 0
  for (const c of counts) {
    running += c
    cumulative.push(running)
  }
  // We don't want a PHRASE_BREAK *after* the last phrase (that would create a
  // trailing empty phrase). Drop the final cumulative count.
  cumulative.pop()
  if (cumulative.length === 0) {
    return { abc, inserted: 0, totalNotes: countNotesInAbc(abc) }
  }

  const lines = abc.split('\n')
  // Split header (through K:) from body.
  const kIdx = lines.findIndex((l) => /^K:/.test(l.trim()))
  if (kIdx === -1) return { abc, inserted: 0, totalNotes: 0 }
  const headerLines = lines.slice(0, kIdx + 1)
  const bodyLines = lines.slice(kIdx + 1)

  // Walk body lines, counting notes; when cumulative threshold reached, emit
  // a PHRASE_BREAK marker AFTER the current note and continue.
  const outBody: string[] = []
  let noteCount = 0
  let nextThresholdIdx = 0
  let inserted = 0

  for (const line of bodyLines) {
    if (INFO_FIELD.test(line.trim()) || line.trim().startsWith('%') || line.trim() === '') {
      outBody.push(line)
      continue
    }
    // Mask non-note content (chords, decorations, strings) so positions are stable.
    const masked = line
      .replace(/\{[^}]*\}/g, (m) => ' '.repeat(m.length))
      .replace(/"[^"]*"/g, (m) => ' '.repeat(m.length))
      .replace(/![^!]*!/g, (m) => ' '.repeat(m.length))
      .replace(/\[[^\]]+\]/g, (m) => ' '.repeat(m.length))

    let cursor = 0
    let rebuilt = ''
    let m: RegExpExecArray | null
    NOTE_RE.lastIndex = 0
    while ((m = NOTE_RE.exec(masked)) !== null) {
      // Copy any text between cursor and this match into rebuilt verbatim.
      rebuilt += line.slice(cursor, m.index + m[0].length)
      cursor = m.index + m[0].length
      noteCount += 1
      if (
        nextThresholdIdx < cumulative.length &&
        noteCount === cumulative[nextThresholdIdx]
      ) {
        // Flush remainder of this line up to cursor, push line piece, then
        // emit the PHRASE_BREAK on its own line.
        outBody.push(rebuilt)
        outBody.push('% PHRASE_BREAK')
        rebuilt = ''
        nextThresholdIdx++
        inserted++
      }
    }
    rebuilt += line.slice(cursor)
    if (rebuilt.length > 0 || line.length === 0) {
      outBody.push(rebuilt)
    }
  }

  return {
    abc: [...headerLines, ...outBody].join('\n'),
    inserted,
    totalNotes: noteCount,
  }
}

function countNotesInAbc(abc: string): number {
  const lines = abc.split('\n')
  let count = 0
  let inMusic = false
  for (const line of lines) {
    const t = line.trim()
    if (/^K:/.test(t)) { inMusic = true; continue }
    if (!inMusic) continue
    if (INFO_FIELD.test(t) || t.startsWith('%') || t === '') continue
    const masked = line
      .replace(/\{[^}]*\}/g, (m) => ' '.repeat(m.length))
      .replace(/"[^"]*"/g, (m) => ' '.repeat(m.length))
      .replace(/![^!]*!/g, (m) => ' '.repeat(m.length))
      .replace(/\[[^\]]+\]/g, (m) => ' '.repeat(m.length))
    NOTE_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = NOTE_RE.exec(masked)) !== null) count++
  }
  return count
}
