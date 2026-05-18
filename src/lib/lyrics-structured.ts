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
export function parseLyrics(raw: string, meter: string | null | undefined): ParseResult {
  void raw
  void meter
  throw new Error('not implemented — plan 02')
}

/**
 * Serialise a `StructuredLyrics` tree back into a `lyrics_imported_raw`-shaped
 * blob. MUST emit strict `\d+\S` (no whitespace between a Bible-verse digit
 * and the first lyric character) — see `parseLyrics` for the asymmetric
 * whitespace rule.
 *
 * Stub: implementation lands in Plan 02.
 */
export function serialiseLyrics(stanzas: StructuredLyrics): string {
  void stanzas
  throw new Error('not implemented — plan 02')
}
