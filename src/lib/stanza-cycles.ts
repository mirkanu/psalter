import type { Stanza } from './lyrics-structured'
import { syllabifyForAbc } from './lyrics'

/**
 * Stanza-cycle model (D-11, D-12, D-19, D-20).
 *
 * A "stanza-cycle" is one full pass through the tune. The number of stanzas
 * per cycle is determined by the tune's `double_length` boolean column
 * (D-11) — NOT by parsing meter strings. This eliminates the entire class
 * of DCM mis-renders driven by meter-string heuristics (Phase 04.9.6 B3 fix).
 *
 *   double_length=false → 1 stanza per cycle (CM/LM/SM/etc.).
 *   double_length=true  → 2 stanzas per cycle (DCM/DLM/DSM and any
 *                         hand-curated "double-length" tune variants).
 *
 * The retired meter-string-driven phrase-portion-splitting heuristic has
 * been deleted from src/lib/lyrics.ts; this module reads stanza.lines
 * directly.
 */

/**
 * Groups a flat stanzas array into stanza-cycles per D-11 / D-12.
 *
 * - Empty input → `[]`.
 * - `doubleLength=true`: pairs every two consecutive stanzas. Odd stanza
 *   count yields a final 1-stanza cycle (under-fill; D-12 — does NOT
 *   repeat content).
 * - `doubleLength=false`: emits one cycle per stanza.
 */
export function groupStanzasIntoCycles(
  stanzas: Stanza[],
  doubleLength: boolean,
): Stanza[][] {
  if (stanzas.length === 0) return []
  const cycleSize = doubleLength ? 2 : 1
  const cycles: Stanza[][] = []
  for (let i = 0; i < stanzas.length; i += cycleSize) {
    cycles.push(stanzas.slice(i, i + cycleSize))
  }
  return cycles
}

/**
 * For ONE stanza-cycle, returns a T-element array (T = phrasesPerCycle)
 * where element i is a single-string array `[phraseText]` (or `['']` when
 * this cycle does not fill phrase slot i — under-fill case).
 *
 * RETURN-SHAPE CONTRACT (B1): outer dim is phrasesPerCycle; each inner
 * element is exactly `string[]` of length 1. NotationRenderer.tsx:447-454
 * relies on this: `visibleCycles.flatMap(cycle => { const grid = ...; return grid[i] ?? [''] })`.
 *
 * Within a cycle the metrical lines of each stanza are concatenated in
 * order; each phrase slot receives the corresponding metrical line,
 * syllabified for abcjs `w:` field use.
 *
 * Examples (CM tune T=2, S=2):
 *   cycle=[s1]                   → [['<s1.line0 syllables>'], ['<s1.line1 syllables>']]
 * (DCM tune T=4, S=2):
 *   cycle=[s1, s2]               → [['<s1.line0>'], ['<s1.line1>'], ['<s2.line0>'], ['<s2.line1>']]
 *   cycle=[s1] (under-fill)      → [['<s1.line0>'], ['<s1.line1>'], [''], ['']]
 *
 * Line.syllables hand-override (D-03 hybrid): if a line carries an
 * explicit `syllables: string[]`, its joined form replaces the
 * auto-syllabified text for that line only.
 */
export function mapCycleToPhraseSyllableLines(
  cycle: Stanza[],
  phrasesPerCycle: number,
): string[][] {
  const result: string[][] = Array.from(
    { length: Math.max(0, phrasesPerCycle) },
    () => [''],
  )
  if (cycle.length === 0 || phrasesPerCycle <= 0) return result

  // Flatten all metrical Line[] across the cycle's stanzas, preserving order.
  const flatLines = cycle.flatMap((s) => s.lines)

  // Each metrical line corresponds to one phrase slot, in order. Excess lines
  // (cycle.length * S > T) are truncated; under-fill (lines < T) leaves the
  // tail slots as the initial [''] sentinel.
  for (let i = 0; i < Math.min(flatLines.length, phrasesPerCycle); i++) {
    const line = flatLines[i]!
    const text =
      line.syllables && line.syllables.length > 0
        ? line.syllables.join(' ')
        : syllabifyForAbc(line.text)
    result[i] = [text]
  }
  return result
}
