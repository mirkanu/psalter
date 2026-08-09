import { describe, it, expect, vi } from 'vitest'
import { buildNotationRendererProps } from './notation-renderer-props'
import { pickAbcWithMarkers, sopranoOnly } from './utils'

describe('buildNotationRendererProps', () => {
  it('picks the SATB variant when it carries PHRASE_BREAK markers and reduces it to soprano', () => {
    const abcSatb = 'X:1\nK:C\n% PHRASE_BREAK\n[V:1]CDEF|\n[V:2]EFGA|'
    const abcNotation = 'X:1\nK:C\nCDEF|'
    const result = buildNotationRendererProps(
      { abcNotation, abcSatb, name: 'Test', meter: 'CM' },
      { lyrics: '', stanzaMeter: null, lyricsStructured: null },
    )
    expect(result.abc).not.toBe('')
    expect(result.abc).toBe(sopranoOnly(pickAbcWithMarkers(abcSatb, abcNotation)!))
  })

  it('falls back to abcNotation when abcSatb is null', () => {
    const abcNotation = 'X:1\nK:C\nCDEF|'
    const result = buildNotationRendererProps(
      { abcNotation, abcSatb: null, name: 'Test', meter: 'CM' },
      { lyrics: '', stanzaMeter: null, lyricsStructured: null },
    )
    expect(result.abc).toBe(sopranoOnly(abcNotation))
  })

  it('returns empty abc for a null tune', () => {
    const result = buildNotationRendererProps(null, { lyrics: '', stanzaMeter: null, lyricsStructured: null })
    expect(result.abc).toBe('')
  })

  it('/tunes/[slug] shape', () => {
    const result = buildNotationRendererProps(
      {
        abcNotation: 'X:1\nK:C\nCDEF|',
        abcSatb: null,
        name: 'Dundee',
        meter: 'CM',
        solfegeOcrText: '{"soprano":"d"}',
        scoreJpgUrl: '/tunes/dundee-staff-0.jpg',
      },
      { lyrics: '', stanzaMeter: null, lyricsStructured: null },
      { showLyrics: false, fallbackTuneName: 'Tune 42' },
    )
    expect(result.showLyrics).toBe(false)
    expect(result.solfegeOcrText).toBe('{"soprano":"d"}')
    expect(result.tuneName).toBe('Dundee')
    expect(result.onViewModeChange).toBeUndefined()
  })

  it('showLyrics defaults to true when the option is omitted (PsalmTabs shape)', () => {
    const result = buildNotationRendererProps(
      { abcNotation: 'X:1\nK:C\nCDEF|', abcSatb: null, name: 'Test', meter: 'CM' },
      { lyrics: '', stanzaMeter: null, lyricsStructured: null },
    )
    expect(result.showLyrics).toBe(true)
  })

  it('onViewModeChange is passed straight through', () => {
    const fn = vi.fn()
    const result = buildNotationRendererProps(
      { abcNotation: 'X:1\nK:C\nCDEF|', abcSatb: null, name: 'Test', meter: 'CM' },
      { lyrics: '', stanzaMeter: null, lyricsStructured: null },
      { onViewModeChange: fn },
    )
    expect(result.onViewModeChange).toBe(fn)
  })

  it('SingingView null-tune shape produces the same defaults SingingView uses today', () => {
    const result = buildNotationRendererProps(
      null,
      { lyrics: 'x', stanzaMeter: 'CM', lyricsStructured: null },
      { fallbackTuneName: '' },
    )
    expect(result.tuneName).toBe('')
    expect(result.tuneMeter).toBeNull()
    expect(result.scoreJpgUrl).toBeNull()
    expect(result.solfegeJpgUrl).toBeNull()
    expect(result.phraseShapeOverride).toBeNull()
    expect(result.doubleLength).toBe(false)
    expect(result.solfegeOcrText).toBeNull()
  })

  it('context fields pass through unchanged', () => {
    const lyricsStructured = [{ marker: 'test' }] as unknown as import('./lyrics-structured').StructuredLyrics
    const result = buildNotationRendererProps(
      null,
      { lyrics: 'x', stanzaMeter: 'CM', lyricsStructured },
    )
    expect(result.lyrics).toBe('x')
    expect(result.stanzaMeter).toBe('CM')
    expect(result.lyricsStructured).toBe(lyricsStructured)
  })

  it('nullish tune fields collapse to the documented defaults', () => {
    const result = buildNotationRendererProps(
      { abcNotation: null, abcSatb: null, name: null, meter: null },
      { lyrics: '', stanzaMeter: null, lyricsStructured: null },
    )
    expect(result.tuneName).toBe('Tune')
    expect(result.tuneMeter).toBeNull()
    expect(result.phraseShapeOverride).toBeNull()
    expect(result.doubleLength).toBe(false)
    expect(result.solfegeOcrText).toBeNull()
  })

  it('the returned object is JSON-serialisable when no callback is supplied', () => {
    const result = buildNotationRendererProps(
      { abcNotation: 'X:1\nK:C\nCDEF|', abcSatb: null, name: 'Test', meter: 'CM' },
      { lyrics: '', stanzaMeter: null, lyricsStructured: null },
      { showLyrics: false },
    )
    const parsed = JSON.parse(JSON.stringify(result))
    expect(parsed.showLyrics).toBe(false)
  })
})
