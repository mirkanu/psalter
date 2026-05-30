/**
 * Pure helpers for detecting and extracting source-authored `w:` lyric lines
 * from an ABC phrase body. Used by NotationRenderer (Phase 04.10) to detect
 * source-authored w: lines and bypass the heuristic w-line construction path
 * (buildWLineFromSolfa / syllabifyForAbc).
 *
 * Pure module — no DOM, no abcjs, no Next/React imports.
 */

export function hasEmbeddedWLines(phraseBody: string): boolean {
  return /^\s*w:/m.test(phraseBody)
}

export function extractEmbeddedWLines(phraseBody: string): string[] {
  return phraseBody
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^w:/.test(l))
    .map((l) => l.replace(/^w:\s*/, ''))
}
