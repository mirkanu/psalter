/**
 * Coerce a per-line syllable list to match a target per-line shape (e.g. CM
 * [8,6,8,6]). When the syllabifier produces the wrong count for a line (over-
 * or under-split words), this helper merges or splits adjacent syllables
 * until the line has exactly the expected count.
 *
 * Pure module. Best-effort: the result may not be a clean syllabification
 * (e.g. "fooba-r" or "fo-o-bar"), but the COUNT will match. Callers should
 * surface a UI hint indicating which lines were auto-adjusted.
 *
 * Used by /dev/melisma-editor to keep the editor's "Stanza-1 syllables"
 * panel + the buildEmbeddedWline pipeline aligned with the meter even when
 * the canonical syllabifier disagrees with the Psalter's expected shape.
 */

export interface ForceMatchResult {
  fixed: string[][]
  /** True at index i when line i was modified from the input. */
  adjusted: boolean[]
}

/**
 * @param actualPerLine Current syllables grouped by line.
 * @param expectedPerLine Target syllable counts per line (e.g. [8,6,8,6]).
 *                        If shorter than actualPerLine, extra lines pass through unchanged.
 *                        If longer, missing lines are skipped (no synthesis).
 */
export function forceMatchMeterShape(
  actualPerLine: string[][],
  expectedPerLine: number[] | null | undefined,
): ForceMatchResult {
  if (!expectedPerLine || expectedPerLine.length === 0) {
    return { fixed: actualPerLine.map((l) => [...l]), adjusted: actualPerLine.map(() => false) }
  }

  const fixed: string[][] = []
  const adjusted: boolean[] = []

  for (let i = 0; i < actualPerLine.length; i++) {
    const line = actualPerLine[i]
    const expected = expectedPerLine[i]
    if (expected === undefined || line.length === expected) {
      fixed.push([...line])
      adjusted.push(false)
      continue
    }
    let work = [...line]
    if (work.length > expected) {
      // Shrink by merging adjacent syllables. Prefer pairs at hyphen
      // boundaries (mid-word splits, e.g. "she-" + "pherd" → "shepherd").
      while (work.length > expected) {
        const merged = mergeOnceAtBestBoundary(work)
        if (merged === null) break
        work = merged
      }
    } else {
      // Grow by splitting the longest syllable in half at a vowel boundary.
      while (work.length < expected) {
        const split = splitLongestAtVowel(work)
        if (split === null) break
        work = split
      }
    }
    fixed.push(work)
    adjusted.push(work.length === expected || work.length !== line.length)
  }

  return { fixed, adjusted }
}

/** Merge the best adjacent pair into one syllable. Returns null if no merge possible. */
function mergeOnceAtBestBoundary(line: string[]): string[] | null {
  if (line.length < 2) return null
  // First pass: find an index where line[i] ends with '-' (hyphenated mid-word).
  for (let i = 0; i < line.length - 1; i++) {
    if (line[i].endsWith('-')) {
      const merged = line[i].slice(0, -1) + line[i + 1]
      return [...line.slice(0, i), merged, ...line.slice(i + 2)]
    }
  }
  // Otherwise: merge the last two syllables (simplest, preserves earlier word boundaries).
  const last = line.length - 1
  const merged = line[last - 1] + line[last]
  return [...line.slice(0, last - 1), merged]
}

const VOWELS = /[aeiouyAEIOUY]/

/** Split the longest syllable at the rightmost interior vowel→consonant transition. */
function splitLongestAtVowel(line: string[]): string[] | null {
  let bestIdx = -1
  let bestLen = 0
  for (let i = 0; i < line.length; i++) {
    if (line[i].length > bestLen && hasInteriorVowel(line[i])) {
      bestLen = line[i].length
      bestIdx = i
    }
  }
  if (bestIdx === -1) return null
  const target = line[bestIdx]
  const splitAt = findInteriorVowelSplit(target)
  if (splitAt === -1) return null
  const left = target.slice(0, splitAt) + '-'  // hyphen marks mid-word
  const right = target.slice(splitAt)
  return [...line.slice(0, bestIdx), left, right, ...line.slice(bestIdx + 1)]
}

function hasInteriorVowel(s: string): boolean {
  // We need a vowel that isn't the first or last character so a split leaves
  // a non-empty piece on each side.
  for (let i = 1; i < s.length - 1; i++) {
    if (VOWELS.test(s[i])) return true
  }
  return false
}

function findInteriorVowelSplit(s: string): number {
  // Walk from rightmost interior vowel; split AFTER it (so the consonant
  // cluster starts the second syllable, English-syllabification convention).
  for (let i = s.length - 2; i >= 1; i--) {
    if (VOWELS.test(s[i]) && !VOWELS.test(s[i + 1])) {
      return i + 1
    }
  }
  // Fallback: split at the first interior vowel.
  for (let i = 1; i < s.length - 1; i++) {
    if (VOWELS.test(s[i])) return i + 1
  }
  return -1
}
