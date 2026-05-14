/**
 * Phrase-meter lookup map for Scottish Psalter tunes (D-03).
 *
 * One "phrase" = one displayed line of staff + the corresponding lyric line
 * break. Common Meter (CM, 8.6.8.6) breaks into 2 phrases (8+6 syllables each);
 * Double Common Meter (DCM) doubles that to 4. This map is consumed by both
 * the phrase-annotation script (Plan 02) and the NotationRenderer (Plan 04) to
 * decide how many `% PHRASE_BREAK` markers a tune should carry and how many
 * w: lines a stanza splits into.
 *
 * Per STATE.md decision [04-02], tune.meter values in the database can include
 * a parenthesised long-form description such as `"CM (common meter, 8.6.8.6)"`
 * or `"LM (long meter, 88 88)"`. `phrasesForMeter()` MUST normalise these by
 * taking the first whitespace-delimited token before lookup.
 */
export const PHRASES_PER_STANZA: Record<string, number> = {
  CM: 2, // 8.6.8.6 — two halves
  LM: 2, // 8.8.8.8 — two halves
  SM: 2, // 6.6.8.6 — two halves
  DCM: 4, // 8.6.8.6.8.6.8.6 — four halves
  DLM: 4,
  DSM: 4,
  '8.7.8.7': 2,
  '7.6.7.6': 2,
}

/**
 * Returns the number of phrases per stanza for a given meter string.
 *
 * Normalisation rules:
 *   - null / undefined / empty string → 1 (whole-stanza fallback).
 *   - First whitespace-delimited token is uppercased and looked up in
 *     PHRASES_PER_STANZA first (catches "CM (common meter, 8.6.8.6)").
 *   - If that misses, the trimmed raw string is looked up (catches numeric
 *     meters like "8.7.8.7" that would be mangled by toUpperCase).
 *   - Anything still unknown → 1.
 *
 * @example
 *   phrasesForMeter("CM")                            // => 2
 *   phrasesForMeter("CM (common meter, 8.6.8.6)")    // => 2
 *   phrasesForMeter("DCM")                           // => 4
 *   phrasesForMeter("8.7.8.7")                       // => 2
 *   phrasesForMeter(null)                            // => 1
 *   phrasesForMeter("UNKNOWN")                       // => 1
 */
export function phrasesForMeter(meter: string | null | undefined): number {
  if (!meter) return 1
  const trimmed = meter.trim()
  if (!trimmed) return 1
  const firstToken = trimmed.split(/\s+/)[0]
  const normalised = firstToken ? firstToken.toUpperCase() : ''
  return PHRASES_PER_STANZA[normalised] ?? PHRASES_PER_STANZA[trimmed] ?? 1
}
