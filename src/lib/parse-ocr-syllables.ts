/**
 * Extract the ordered sequence of solfège syllable labels from an OCR'd
 * soprano string (the `soprano` field of solfegeOcrText JSON). Used by
 * /dev/melisma-editor to show grid labels that MATCH the solfège JPG
 * verbatim — even when the derived ABC has chromatic accidentals that
 * would otherwise produce different `abcNoteToSolfege` output (Carlisle).
 *
 * Format conventions (Scottish Psalter solfa):
 *   - `:` separates beat slots within a bar
 *   - `|` and `||` separate bars (we treat both the same here)
 *   - `.` (dot) inside a slot subdivides into multiple notes ("d.r" = d then r)
 *   - `,` (comma) also subdivides ("d,r")
 *   - `—` / `-` are hold (extend previous note); NOT counted as a new note
 *   - subscript `_N` after a token = lower octave (kept as part of label)
 *   - trailing `'` = upper octave (kept as part of label)
 *
 * Returns one label per note event, in the same order solFaToAbc would
 * emit ABC notes — so callers can index by globalIdx to display the OCR
 * label alongside the ABC token.
 */

export function parseOcrSyllableSequence(raw: string): string[] {
  if (!raw) return []
  // Normalize: strip any trailing Amen marker (after last `||`).
  let cleaned = raw.trim()
  const lastDbl = cleaned.lastIndexOf('||')
  if (lastDbl >= 0) cleaned = cleaned.slice(0, lastDbl)
  cleaned = cleaned.replace(/\|\|/g, '|').replace(/\|$/, '').trim()

  const out: string[] = []
  // Split into cells on `|`
  const cells = cleaned.split(/\|+/).map((c) => c.trim()).filter(Boolean)
  for (const cell of cells) {
    const slots = cell.split(':').map((s) => s.trim()).filter(Boolean)
    for (const slot of slots) {
      // Subdivide on . or , — both are subdivision markers.
      const subTokens = slot.split(/[.,]/).map((s) => s.trim()).filter(Boolean)
      for (const tok of subTokens) {
        if (tok === '—' || tok === '-') {
          // Hold — extends previous note, not a new note event.
          continue
        }
        out.push(tok)
      }
    }
  }
  return out
}
