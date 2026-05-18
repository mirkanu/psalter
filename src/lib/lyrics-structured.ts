/** Structured lyrics data model + parser/serialiser. Pure module — no DOM, no DB, no React imports. */

/**
 * A single metrical line within a stanza.
 *
 * `text` is the verbatim metrical line text — leading Bible-verse digits are stripped
 * by the parser and surfaced on `bibleVerseRef` instead (per Phase 04.9.6 D-06 invariant 2).
 *
 * `bibleVerseRef` is present iff this line begins a new Bible verse (a Bible verse may
 * start mid-stanza, per D-06 invariant 5).
 *
 * `syllables` is an optional hand-override of the runtime auto-syllabifier (D-03 hybrid):
 * when present, it replaces `syllabifyForAbc(text)` for this line only. Keeps the
 * persisted payload small while still allowing per-line manual fixes.
 */
export interface Line {
  text: string                    // verbatim metrical line, NO leading verse digits
  bibleVerseRef?: number          // present iff this line begins a new Bible verse
  syllables?: string[]            // optional hand-override of auto-syllabifier (D-03 hybrid)
}

/**
 * A stanza is an ordered list of metrical lines. `index` is the 0-based stanza
 * ordinal within the psalm version. `lines.length` MUST equal the metrical-line
 * count for the version's meter (CM=4, DCM=8, LM=4, SM=4, 10.10.10.10.10=5, …)
 * per D-08.
 */
export interface Stanza {
  index: number                   // 0-based stanza ordinal
  lines: Line[]                   // length == metrical-line count for the meter
}

/**
 * The canonical persisted shape for `psalm_versions.lyrics_structured`.
 * Stored as `jsonb`; typed via `.$type<StructuredLyrics | null>()` on the
 * Drizzle column (see `src/db/schema.ts`).
 */
export type StructuredLyrics = Stanza[]

/**
 * Result of parsing a raw `lyrics_imported_raw` blob. `ok: false` is what
 * the one-shot backfill (Plan 03) quarantines per D-04; the offending line
 * (1-based) is captured when known so the failure report points at it.
 */
export type ParseResult =
  | { ok: true; stanzas: StructuredLyrics }
  | { ok: false; reason: string; line?: number }

/**
 * Parse a raw `lyrics_imported_raw` blob into a `StructuredLyrics` tree.
 *
 * Whitespace tolerance is ASYMMETRIC and load-bearing (per D-06 invariant 2,
 * RESEARCH §"Whitespace tolerance is asymmetric"): the parser accepts
 * `\d+\s*` (whitespace between the verse digit and the first lyric character
 * is tolerated on input), but `serialiseLyrics` MUST emit strict `\d+\S` (no
 * space). This asymmetry lets us round-trip historical blobs whose typography
 * is inconsistent while still producing a single canonical output form.
 *
 * Stub: implementation lands in Plan 02. Importers can already reference the
 * symbol today so the renderer (Plan 04/05) compiles against the final shape.
 */
/**
 * Lookup table — declared metrical-line count per stanza, keyed by meter string
 * in every variant we've seen in the corpus. Phase 04.9.5 RESEARCH §"Meter
 * taxonomy" is the authoritative source for which forms exist.
 *
 * Adding a new meter? Append it here AND update test fixtures in
 * `lyrics-structured.test.ts` if the new meter introduces a novel F-pattern.
 */
const METRICAL_LINES: Record<string, number> = {
  'CM': 4, 'C.M.': 4, 'Common Meter': 4,
  'CMD': 8, 'C.M.D.': 8, 'Common Meter Doubled': 8, 'DCM': 8,
  'LM': 4, 'L.M.': 4, 'Long Meter': 4,
  'LMD': 8, 'L.M.D.': 8,
  'SM': 4, 'S.M.': 4, 'Short Meter': 4,
  'SMD': 8, 'S.M.D.': 8,
  '10.10.10.10.10': 5, '10 10 10 10 10': 5,
  '66.66.88': 6, '66 66 88': 6,
  '87.87': 2, '8 7 8 7': 2,
  '76.76.D': 8, '76 76 D': 8,
}

function normaliseMeter(m: string | null | undefined): string | null {
  if (!m) return null
  // Strip parenthetical descriptions like "CM (common meter, 86 86)" → "CM"
  return m.replace(/\(.*\)/, '').trim()
}

function resolveLinesPerStanza(meter: string | null | undefined): number | null {
  const norm = normaliseMeter(meter)
  if (!norm) return null
  if (METRICAL_LINES[norm] !== undefined) return METRICAL_LINES[norm]
  // Fuzzy match — scan for any known key as a substring (handles
  // composite strings like "CM common meter").
  const up = norm.toUpperCase()
  for (const key of Object.keys(METRICAL_LINES)) {
    if (up.includes(key.toUpperCase())) return METRICAL_LINES[key]
  }
  return null
}

export function parseLyrics(raw: string, meter: string | null | undefined): ParseResult {
  const linesPerStanza = resolveLinesPerStanza(meter)
  if (!linesPerStanza) {
    return {
      ok: false,
      reason: `unknown meter: ${meter ?? '<null>'} (not in METRICAL_LINES)`,
    }
  }

  // F-5 detection — colophon line (starts with '#') anywhere in the blob
  // is a quarantine signal; the backfill must not emit a structured tree
  // for these rows (D-04).
  const colophonIdx = raw.split('\n').findIndex((l) => l.startsWith('#'))
  if (colophonIdx !== -1) {
    return { ok: false, reason: 'colophon line detected (F-5)', line: colophonIdx + 1 }
  }

  // Flatten all non-blank lines preserving order. Per D-06 invariant 3 and the
  // plan §interfaces note, we reuse the existing stanza-split regex from
  // src/lib/lyrics.ts:22 — `split(/\n\s*\n/)`.
  const allLines: { text: string; verseRef?: number }[] = []
  for (const blobGroup of raw.split(/\n\s*\n/)) {
    for (const line of blobGroup.split(/\n/)) {
      const trimmed = line.replace(/[ \t]+$/, '')
      if (!trimmed) continue
      // F-2 / F-3: leading digit run, optional whitespace, then text.
      // Matches both "1The Lord..." (glued) AND "6 By men..." (with space).
      const m = trimmed.match(/^(\d+)\s*(\S.*)$/)
      if (m) {
        allLines.push({ text: m[2], verseRef: parseInt(m[1], 10) })
      } else {
        allLines.push({ text: trimmed })
      }
    }
  }

  // F-6 quarantine — non-blank line count must be a clean multiple of meter
  if (allLines.length === 0 || allLines.length % linesPerStanza !== 0) {
    return {
      ok: false,
      reason: `line count ${allLines.length} not a multiple of ${linesPerStanza} (meter F-6)`,
    }
  }

  const stanzas: StructuredLyrics = []
  for (let i = 0; i < allLines.length; i += linesPerStanza) {
    const lines: Line[] = allLines.slice(i, i + linesPerStanza).map((l) => {
      const out: Line = { text: l.text }
      if (l.verseRef !== undefined) out.bibleVerseRef = l.verseRef
      return out
    })
    stanzas.push({ index: stanzas.length, lines })
  }

  return { ok: true, stanzas }
}

/**
 * Serialise a `StructuredLyrics` tree back into a `lyrics_imported_raw`-shaped
 * blob. Emits strict `\d+\S` (no whitespace between a Bible-verse digit
 * and the first lyric character) — see `parseLyrics` for the asymmetric
 * whitespace rule.
 */
export function serialiseLyrics(stanzas: StructuredLyrics): string {
  return stanzas
    .map((stanza) =>
      stanza.lines
        .map((line) =>
          line.bibleVerseRef !== undefined
            ? `${line.bibleVerseRef}${line.text}`
            : line.text,
        )
        .join('\n'),
    )
    .join('\n\n')
}
