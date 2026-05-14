import { phrasesForMeter } from './abc-phrase-meter-map'
import { splitStanzaIntoPhrasePortions } from './lyrics'

/**
 * Stanza-cycle model (D-19 / D-20).
 *
 * A "stanza-cycle" is one full pass through the tune. The number of stanzas
 * per cycle depends on the ratio of tune phrases (T) to stanza phrases (S):
 *
 *   CM tune (T=2)        × CM psalm (S=2)   → 1 stanza per cycle.
 *   double-CM tune (T=4) × CM psalm (S=2)   → 2 stanzas per cycle (paired).
 *
 * The cycle size is `floor(T / S)`, clamped to at least 1.
 *
 * Reverse mismatch: when S > T (e.g. a CM tune trying to hold a DCM stanza)
 * the model cannot fit a stanza into a single tune-pass. Phase 4.9.2 defers
 * any real handling of this case — `groupStanzasIntoCycles` emits a
 * console.warn and falls back to 1-stanza cycles so the render still
 * proceeds.
 */

/**
 * Groups a flat stanzas array into stanza-cycles per D-20.
 *
 * - Empty input → `[]`.
 * - Reverse mismatch (S > T, T > 0, S > 0) → console.warn + 1-stanza cycles.
 * - Final cycle may be partial when stanza count does not divide evenly by
 *   cycleSize (e.g. 5 stanzas with cycleSize 2 → `[[s1,s2],[s3,s4],[s5]]`).
 * - Null/undefined meter args degrade to phrasesForMeter() = 1, hence
 *   cycleSize = 1.
 */
export function groupStanzasIntoCycles(
  stanzas: string[],
  tuneMeter: string | null | undefined,
  stanzaMeter: string | null | undefined,
): string[][] {
  if (stanzas.length === 0) return []
  const T = phrasesForMeter(tuneMeter)
  const S = phrasesForMeter(stanzaMeter)
  if (S > T && T > 0 && S > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[stanza-cycles] reverse meter mismatch: tune_phrases=${T} < stanza_phrases=${S}; falling back to 1-stanza cycles`,
    )
    return stanzas.map((s) => [s])
  }
  const cycleSize = Math.max(1, Math.floor(T / Math.max(1, S)))
  const out: string[][] = []
  for (let i = 0; i < stanzas.length; i += cycleSize) {
    out.push(stanzas.slice(i, i + cycleSize))
  }
  return out
}

/**
 * For ONE stanza-cycle, returns a T-element array where element i is the
 * array of w: line strings for phrase index i across this cycle (D-19 / D-20).
 *
 * Within a cycle, stanza k (0-indexed) covers phrase indices [k*S, k*S + S)
 * of the tune. Each phrase slot receives the corresponding portion from
 * `splitStanzaIntoPhrasePortions(stanza, stanzaMeter)`.
 *
 * Examples:
 *   CM × CM (T=2, S=2), cycle=[s1]:
 *     → [[portion0(s1)], [portion1(s1)]]
 *   DCM × CM (T=4, S=2), cycle=[s1, s2]:
 *     → [[portion0(s1)], [portion1(s1)], [portion0(s2)], [portion1(s2)]]
 *   DCM × CM (T=4, S=2), cycle=[s1] (under-filled final cycle):
 *     → [[portion0(s1)], [portion1(s1)], [''], ['']]
 *
 * Each element is a single-string array — one w: line for this ONE
 * stanza-cycle's contribution to that phrase. Callers that need to stack
 * multiple cycles concatenate element-i across cycles before passing into
 * buildAbcWithSyllables().
 *
 * Empty-cycle input returns `T` elements each containing `['']` (the empty
 * string will be filtered out by buildAbcWithSyllables, producing no w: line).
 *
 * This function never emits the reverse-mismatch warning — that is the sole
 * responsibility of groupStanzasIntoCycles().
 */
export function mapCycleToPhraseSyllableLines(
  cycle: string[],
  tuneMeter: string | null | undefined,
  stanzaMeter: string | null | undefined,
): string[][] {
  const T = phrasesForMeter(tuneMeter)
  const S = phrasesForMeter(stanzaMeter)
  const result: string[][] = Array.from({ length: T }, () => [''])
  for (let k = 0; k < cycle.length; k++) {
    const portions = splitStanzaIntoPhrasePortions(cycle[k] ?? '', stanzaMeter)
    for (let p = 0; p < S; p++) {
      const phraseIdx = k * S + p
      if (phraseIdx >= T) break
      result[phraseIdx] = [portions[p] ?? '']
    }
  }
  return result
}
