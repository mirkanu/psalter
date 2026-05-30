/**
 * Unit tests for ocr-melisma-v3 — prompt-content assertions + JSON-extraction round-trip.
 *
 * No live Vision calls. Tests exercise:
 *   1. The TRANSCRIPTION_PROMPT_V3 constant contains the canonical directives
 *      (PRESERVE underlines; distinguish underline from dot/em-dash/subscript;
 *      does NOT contain the v2 anti-instruction).
 *   2. extractMelismaJson parses well-formed JSON into MelismaTranscriptionResult.
 *   3. Missing per-token `conf` defaults to 0 (downstream gating treats as low-confidence).
 *   4. Malformed input (no `{...}` block) throws a descriptive error.
 */

import { describe, it, expect } from 'vitest'
import {
  extractMelismaJson,
  TRANSCRIPTION_PROMPT_V3,
} from './ocr-melisma-v3'

describe('ocrMelismaV3 — prompt content', () => {
  it('PRESERVES underlines (reverses v2 anti-instruction)', () => {
    expect(TRANSCRIPTION_PROMPT_V3).toContain('PRESERVE every underline')
    expect(TRANSCRIPTION_PROMPT_V3).toContain('"underlined":')
    expect(TRANSCRIPTION_PROMPT_V3).not.toContain('ignore the underline')
  })

  it('distinguishes the underline from the three visual lookalikes', () => {
    expect(TRANSCRIPTION_PROMPT_V3).toContain('Dot subdivisions BETWEEN notes')
    expect(TRANSCRIPTION_PROMPT_V3).toContain('Em-dash BETWEEN notes')
    expect(TRANSCRIPTION_PROMPT_V3).toContain('Subscript digit BELOW a letter')
  })
})

describe('ocrMelismaV3 — extractMelismaJson', () => {
  it('parses a well-formed JSON response into MelismaTranscriptionResult', () => {
    const raw = `Here is the transcription:
{
  "doh": "F",
  "time": "C",
  "soprano": [
    { "tok": "d", "dur": 1, "underlined": false, "conf": 0.95 },
    { "tok": "r", "dur": 1, "underlined": true,  "conf": 0.88 }
  ]
}`
    const out = extractMelismaJson(raw)
    expect(out.doh).toBe('F')
    expect(out.time).toBe('C')
    expect(out.soprano).toHaveLength(2)
    expect(out.soprano[0]).toEqual({ tok: 'd', dur: 1, underlined: false, conf: 0.95 })
    expect(out.soprano[1].underlined).toBe(true)
    expect(out.raw).toBe(raw)
  })

  it('defaults missing per-token conf to 0', () => {
    const raw = `{
      "doh": "G",
      "time": "3",
      "soprano": [
        { "tok": "s", "dur": 2, "underlined": false }
      ]
    }`
    const out = extractMelismaJson(raw)
    expect(out.soprano[0].conf).toBe(0)
  })

  it('throws a descriptive error when no JSON object is present', () => {
    expect(() => extractMelismaJson('sorry, no json here')).toThrow(/No JSON/)
  })
})
