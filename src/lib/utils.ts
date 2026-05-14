import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract soprano-only ABC from a 4-voice SATB string (inline [V:n] format). */
export function sopranoOnly(abc: string): string {
  return abc
    .split('\n')
    .flatMap((line) => {
      const t = line.trim()
      // Drop non-soprano voice declarations and directives
      if (/^V:[2-9]/.test(t) || /^%%/.test(t) || /^I:/.test(t)) return []
      // Drop non-soprano music lines
      if (/^\[V:[2-9]\]/.test(t)) return []
      // Strip [V:1] prefix from soprano music lines
      if (t.startsWith('[V:1]')) return [t.slice(5).trimStart()]
      return [line]
    })
    .join('\n')
}

const PHRASE_BREAK_RE = /^\s*%\s*PHRASE_BREAK\s*$/m

/**
 * Picks the best ABC source for the dynamic notation renderer, preferring the
 * variant that already carries `% PHRASE_BREAK` markers (D-19 / D-02).
 *
 * Plan 02's marker-annotation script only ran against the monophonic
 * `abc_notation` column. The SATB column (`abc_satb`) — which the tune/psalm
 * pages prefer when present — has NO markers, so `splitOnPhraseBreaks` would
 * collapse the whole tune into a single phrase row, violating D-19's
 * one-row-per-phrase requirement.
 *
 * Resolution order:
 *   1. SATB if it contains a PHRASE_BREAK marker (best of both worlds).
 *   2. Monophonic if it contains a PHRASE_BREAK marker (preserve D-19 layout).
 *   3. SATB without markers (legacy fallback, single-row render).
 *   4. Monophonic without markers.
 *   5. null when neither is present.
 *
 * The caller is responsible for running `sopranoOnly()` on whichever string
 * comes back when it is in SATB form (cheap no-op for monophonic).
 */
export function pickAbcWithMarkers(
  abcSatb: string | null | undefined,
  abcNotation: string | null | undefined,
): string | null {
  const satb = abcSatb?.trim() || null
  const mono = abcNotation?.trim() || null
  if (satb && PHRASE_BREAK_RE.test(satb)) return satb
  if (mono && PHRASE_BREAK_RE.test(mono)) return mono
  return satb ?? mono ?? null
}
