/**
 * Extract the soprano (V:1) voice from a multi-voice SATB ABC document.
 *
 * Ported from src/app/api/dev/test-ocr/route.ts (extractMelodyVoice) so it can
 * be reused by scripts that don't pull the entire OCR route into scope.
 *
 * Keeps the header (X/T/L/Q/M/K, and the V:1 declaration), then includes only
 * music body lines belonging to V:1 — discards V:2/3/4, %%score, I:linebreak,
 * etc. Normalises M:none → M:4/4 and K:none → K:C.
 */
export function extractMelodyVoice(fullAbc: string): string {
  const lines = fullAbc.split('\n')
  const output: string[] = []
  let inHeader = true
  let inV1Content = false

  for (const line of lines) {
    const t = line.trim()
    if (inHeader) {
      if (t.startsWith('X:') || t.startsWith('T:') || t.startsWith('L:') ||
          t.startsWith('Q:')) {
        output.push(line)
      } else if (t.startsWith('M:')) {
        output.push(t === 'M:none' ? 'M:4/4' : line)
      } else if (t.startsWith('K:')) {
        output.push(t === 'K:none' ? 'K:C' : line)
      } else if (t.startsWith('V:1 ')) {
        output.push(line)
      } else if (t === 'V:1') {
        output.push(line)
        inHeader = false
        inV1Content = true
      }
      // skip %%score, I:linebreak, V:2+, etc.
    } else {
      if (t === 'V:1' || (t.startsWith('V:1') && !t.startsWith('V:1 '))) {
        output.push(line)
        inV1Content = true
      } else if (t.startsWith('V:')) {
        inV1Content = false
      } else if (inV1Content) {
        output.push(line)
      }
    }
  }

  // Some SATB outputs declare V:1 only in the header (as `V:1 clef=...`) and
  // then prefix each body line with `[V:1]` inline rather than using a bare
  // `V:1` body line. In that case, the loop above never flips `inV1Content`
  // (because no bare `V:1` line is seen mid-body) and we end up with only the
  // header. Detect this and re-run with inline-voice extraction.
  const hasInlineVoiceBody = /^\s*\[V:\d/m.test(fullAbc)
  const headerOnly = !output.some((l) => /^\s*\[V:1\]/.test(l) || (!isInfoField(l) && /[a-gA-Gz]/.test(l)))
  if (hasInlineVoiceBody && headerOnly) {
    return extractMelodyVoiceInline(fullAbc)
  }

  return output.join('\n')
}

function isInfoField(line: string): boolean {
  return /^\s*[A-Za-z]:/.test(line) || line.trim().startsWith('%')
}

/**
 * Variant for the `[V:1] notes... | [V:2] notes... |` inline-voice ABC format
 * produced by solFaToAbcMultiVoice. Keeps header lines through K:, then
 * outputs only lines that begin with `[V:1]` (stripping the `[V:1]` prefix).
 */
function extractMelodyVoiceInline(fullAbc: string): string {
  const lines = fullAbc.split('\n')
  const output: string[] = []
  let pastKey = false

  for (const line of lines) {
    const t = line.trim()
    if (!pastKey) {
      if (t.startsWith('X:') || t.startsWith('T:') || t.startsWith('L:') ||
          t.startsWith('Q:')) {
        output.push(line)
      } else if (t.startsWith('M:')) {
        output.push(t === 'M:none' ? 'M:4/4' : line)
      } else if (t.startsWith('K:')) {
        output.push(t === 'K:none' ? 'K:C' : line)
        pastKey = true
      } else if (t.startsWith('V:1')) {
        output.push(line)
      }
      // skip V:2/3/4 voice declarations
    } else {
      // Body: only keep lines starting with [V:1]
      const m = line.match(/^\s*\[V:1\]\s*(.*)$/)
      if (m) {
        output.push(m[1])
      }
    }
  }

  return output.join('\n')
}
