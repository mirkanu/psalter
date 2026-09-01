import type { Stanza } from './lyrics-structured'
import { syllabifyForAbc } from './lyrics'

/**
 * Stanza-cycle model (D-11, D-12, D-19, D-20).
 *
 * A "stanza-cycle" is one full pass through the tune. The number of stanzas
 * per cycle is determined by the tune's `meter_variant` array column (D-11)
 * — NOT by parsing meter strings. This eliminates the entire class of DCM
 * mis-renders driven by meter-string heuristics (Phase 04.9.6 B3 fix).
 *
 *   meter_variant lacks 'double_length' → 1 stanza per cycle (CM/LM/SM/etc.).
 *   meter_variant includes 'double_length' → 2 stanzas per cycle
 *     (DCM/DLM/DSM and any hand-curated "double-length" tune variants).
 *
 * Note: 'repeat_last_line' is a separate flag that affects which phrases
 * of the music carry lyrics, not cycle pairing. It's not consulted here.
 *
 * The retired meter-string-driven phrase-portion-splitting heuristic has
 * been deleted from src/lib/lyrics.ts; this module reads stanza.lines
 * directly.
 */

/**
 * Groups a flat stanzas array into stanza-cycles per D-11 / D-12.
 *
 * - Empty input → `[]`.
 * - `meterVariant.includes('double_length')`: pairs every two consecutive
 *   stanzas. Odd stanza count yields a final 1-stanza cycle (under-fill;
 *   D-12 — does NOT repeat content).
 * - `meterVariant.includes('repeat_last_line')`: forces `cycleSize=1` even
 *   when `double_length` is also set. The repeat-last-line convention repeats
 *   the LAST MUSIC PHRASE (one staff appended after the 4 phrases), NOT the
 *   whole stanza-cycle. Pairing two stanzas of lyrics would double that
 *   single repeat, breaking the visual. Each stanza gets its own cycle and
 *   the renderer's virtual phrase-shape override adds the 5th staff per
 *   cycle.
 * - otherwise: emits one cycle per stanza.
 */
export function groupStanzasIntoCycles(
  stanzas: Stanza[],
  meterVariant: string[],
): Stanza[][] {
  if (stanzas.length === 0) return []
  const repeatLastLine = meterVariant.includes('repeat_last_line')
  const cycleSize = repeatLastLine ? 1 : meterVariant.includes('double_length') ? 2 : 1
  const cycles: Stanza[][] = []
  for (let i = 0; i < stanzas.length; i += cycleSize) {
    cycles.push(stanzas.slice(i, i + cycleSize))
  }
  return cycles
}

/**
 * For ONE stanza-cycle, returns a T-element array (T = phrasesPerCycle)
 * where element i is a `string[]` of length === linesPerPhrase, one
 * entry PER METRICAL LINE (no inter-line joining). Under-fill: trailing
 * unfilled slots return `[]`.
 *
 * RETURN-SHAPE CONTRACT (B1, revised for RENDER-07b — Phase 4.9.7 Plan 03):
 * outer dim is phrasesPerCycle; each inner element is `string[]` of
 * length === linesPerPhrase for filled slots and `[]` for under-filled
 * tail slots. NotationRenderer.tsx consumes this directly — one w: line
 * per metrical line per stanza per sub-staff, eliminating the proportional
 * token-split heuristic that was the root cause of cross-stanza
 * alignment drift surfaced at Phase 4.9.7 Plan 02's checkpoint.
 *
 * Line grouping (RENDER-07, Phase 4.9.7 D-02): metrical lines are
 * distributed across phrase slots by integer division —
 * `linesPerPhrase = max(1, floor(flatLines.length / phrasesPerCycle))`.
 * For CM 8.6.8.6 a single-stanza cycle has 4 lines and T=2, so each
 * phrase slot receives 2 metrical lines as 2 separate entries. For DCM
 * (2 stanzas × 4 lines = 8) at T=4, 2 lines per phrase. For alternate
 * meters where `flatLines.length === phrasesPerCycle` (e.g.
 * 10.10.10.10.10 at T=5), one line per phrase.
 *
 * Examples (CM tune T=2, 4-line stanza):
 *   cycle=[s1]    → [['<s1.line0>', '<s1.line1>'], ['<s1.line2>', '<s1.line3>']]
 * (DCM tune T=4, two 4-line stanzas):
 *   cycle=[s1, s2]
 *     → [['<s1.l0>', '<s1.l1>'], ['<s1.l2>', '<s1.l3>'],
 *        ['<s2.l0>', '<s2.l1>'], ['<s2.l2>', '<s2.l3>']]
 *
 * Under-fill (D-04): when `flatLines.length < phrasesPerCycle`, trailing
 * unfilled slots are `[]` — never repeat content.
 *
 * Line.syllables hand-override (D-03 hybrid): if a line carries an
 * explicit `syllables: string[]`, its joined form replaces the
 * auto-syllabified text for that line only.
 *
 * NO meter-string gating — this function NEVER reads CMD/DCM/DLM/DSM
 * literals or calls phrasesForMeter. Cycle grouping is driven entirely
 * by tune.meter_variant upstream (D-11, B3 invariant).
 */
export function mapCycleToPhraseSyllableLines(
  cycle: Stanza[],
  phrasesPerCycle: number,
): string[][] {
  const result: string[][] = Array.from(
    { length: Math.max(0, phrasesPerCycle) },
    () => [] as string[],
  )
  if (cycle.length === 0 || phrasesPerCycle <= 0) return result

  const flatLines = cycle.flatMap((s) => s.lines)
  if (flatLines.length === 0) return result

  // RENDER-07b (Phase 4.9.7 Plan 03): one metrical line === one inner entry.
  // Outer = phrasesPerCycle. Inner = linesPerPhrase per filled slot ([] for
  // under-filled tail slots). Eliminates joined-string output that forced
  // the renderer to proportionally split w: payloads by token count — the
  // root cause of cross-stanza alignment drift surfaced at Plan 02's
  // human-verify checkpoint.
  const linesPerPhrase = Math.max(1, Math.floor(flatLines.length / phrasesPerCycle))
  for (let p = 0; p < phrasesPerCycle; p++) {
    const start = p * linesPerPhrase
    const slice = flatLines.slice(start, start + linesPerPhrase)
    for (const l of slice) {
      const syllabified =
        l.syllables && l.syllables.length > 0
          ? l.syllables.join(' ')
          : syllabifyForAbc(l.text)
      // MOBILE-06 / locked decision 3: glue the plain Bible-verse digit to the first
      // syllable (no markup, no separator) — matches serialiseLyrics. A w: line is
      // plain ABC text abcjs renders into its own SVG <text> nodes, so raised/small
      // styled digits are not achievable here. Prefixing keeps the token count
      // identical (1 token : 1 note).
      const text = l.bibleVerseRef !== undefined ? `${l.bibleVerseRef}${syllabified}` : syllabified
      result[p]!.push(text)
    }
  }
  return result
}
