/**
 * Phase 04.10 — pure helper extracted from NotationRenderer's per-phrase
 * loop so the embedded-w rendering branch is unit-testable in isolation
 * (NotationRenderer itself is client-only and pulls in abcjs, which Vitest
 * cannot import — see RESEARCH.md Pitfall 7).
 *
 * Given a phrase body that contains source-authored `w:` line(s), produce
 * the list of ABC text lines to push into the renderer's `parts`
 * accumulator. Cycle 0 emits VERBATIM; cycles 1+ signal "fall back to
 * heuristic" per O-2 option A.
 *
 * IMPORTANT: this helper enforces single-sub-staff rendering for embedded
 * phrases (Pitfall 4 mitigation). The caller MUST NOT call
 * splitMusicIntoSubLines / padWLineToNoteCount / splitWLineIntoChunks for
 * a phrase that takes this branch — that is the entire point of the
 * branch. abcjs renders the authored w: line with `_` continuations
 * natively when the whole phrase is given as a single body.
 */

export interface EmbeddedWBranchResult {
  /** ABC text lines for cycle 0 (verbatim from source). Push these into `parts`. */
  cycle0Lines: string[]
  /**
   * One boolean per visible cycle. `true` => the caller MUST run the OLD
   * heuristic path for that cycle (cycles >= 1 per O-2 option A).
   * `false` => already handled by cycle0Lines above (cycle 0 only).
   */
  needsHeuristicFallback: boolean[]
}

export function renderEmbeddedWPhrase(
  phraseBody: string,
  cycleCount: number,
): EmbeddedWBranchResult {
  if (!/^\s*w:/m.test(phraseBody)) {
    throw new Error(
      'renderEmbeddedWPhrase called on phrase without w: lines — call site MUST gate on hasEmbeddedWLines() first',
    )
  }
  // Emit the body as-authored — BUT merge consecutive music text lines into
  // a single line. Without this, a phrase whose music is split across multiple
  // text lines (e.g. a leading "| |" empty bar on its own line followed by
  // the real notes on the next line) renders as MULTIPLE staff systems in
  // abcjs — each music text line becomes its own staff. That produces the
  // empty-3rd-staff bug observed on Abbeyville (Phase 04.11 Plan 05).
  //
  // Rule (parallels NotationRenderer.tsx OLD path cleanedBody reducer):
  //   - Info-field lines (`X:`, `K:`, `M:`, `w:`, etc.) stay on their own line.
  //   - Consecutive non-info-field lines are joined with a single space.
  // abcjs ignores extra whitespace between ABC tokens, so the join is safe.
  const isInfoField = (s: string) => /^\s*[A-Za-z]:/.test(s)
  const cycle0Lines = phraseBody
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.length > 0)
    .reduce<string[]>((acc, line) => {
      if (isInfoField(line)) {
        acc.push(line)
      } else if (acc.length > 0 && !isInfoField(acc[acc.length - 1])) {
        acc[acc.length - 1] += ' ' + line.trim()
      } else {
        acc.push(line)
      }
      return acc
    }, [])
  const needsHeuristicFallback = Array.from(
    { length: Math.max(cycleCount, 1) },
    (_, idx) => idx > 0,
  )
  return { cycle0Lines, needsHeuristicFallback }
}
