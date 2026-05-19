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
 * Line grouping (RENDER-07, Phase 4.9.7 D-02): metrical lines are
 * distributed across phrase slots by integer division —
 * `linesPerPhrase = floor(flatLines.length / phrasesPerCycle)`. For CM
 * 8.6.8.6 a single-stanza cycle has 4 lines and T=2, so each phrase slot
 * receives 2 metrical lines joined by a space. For DCM (2 stanzas × 4 lines
 * = 8) at T=4, 2 lines per phrase. For alternate meters where
 * `flatLines.length === phrasesPerCycle` (e.g. 10.10.10.10.10 at T=5), one
 * line per phrase. This replaces the pre-fix 1:1 truncating loop that
 * silently dropped lines past `phrasesPerCycle`.
 *
 * Examples (CM tune T=2, 4-line stanza):
 *   cycle=[s1]                   → [['<s1.line0> <s1.line1>'], ['<s1.line2> <s1.line3>']]
 * (DCM tune T=4, two 4-line stanzas):
 *   cycle=[s1, s2]               → [['<s1.l0> <s1.l1>'], ['<s1.l2> <s1.l3>'], ['<s2.l0> <s2.l1>'], ['<s2.l2> <s2.l3>']]
 *
 * Under-fill (D-04): when `flatLines.length < phrasesPerCycle`, trailing
 * unfilled slots stay as the initial `['']` sentinel — never repeat
 * content.
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
  if (flatLines.length === 0) return result

  // RENDER-07 fix (Phase 4.9.7, D-02): group `linesPerPhrase` metrical
  // lines into each phrase slot. CM 8.6.8.6 → 4 lines / T=2 = 2 lines per
  // phrase. DCM → 8 lines / T=4 = 2 lines per phrase. Alternate meter
  // (e.g. 10.10.10.10.10 T=5, S=5) → 5/5 = 1 line per phrase. Restores
  // the pre-Phase-4.9.6 behaviour without re-introducing the
  // meter-string DCM heuristic (RENDER-01 invariant preserved).
  const linesPerPhrase = Math.max(1, Math.floor(flatLines.length / phrasesPerCycle))
  for (let p = 0; p < phrasesPerCycle; p++) {
    const start = p * linesPerPhrase
    const slice = flatLines.slice(start, start + linesPerPhrase)
    if (slice.length === 0) continue
    const text = slice
      .map((l) =>
        l.syllables && l.syllables.length > 0
          ? l.syllables.join(' ')
          : syllabifyForAbc(l.text),
      )
      .join(' ')
    result[p] = [text]
  }
  return result
}
