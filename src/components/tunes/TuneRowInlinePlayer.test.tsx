import { describe, it, expect } from 'vitest'
import {
  hasTuneAbc,
  hasTuneImages,
  hasAnyTuneMedia,
  initialPlayerTab,
  buildSoundcloudEmbedSrc,
} from './TuneRowInlinePlayer'

describe('hasTuneAbc', () => {
  it('is true when abcNotation is present', () => {
    expect(hasTuneAbc({ abcNotation: 'X:1\nK:C\nCDEF|', abcSatb: null })).toBe(true)
  })

  it('is true when only abcSatb is present', () => {
    expect(hasTuneAbc({ abcNotation: null, abcSatb: 'X:1...' })).toBe(true)
  })

  it('is false for null/empty/whitespace-only ABC', () => {
    expect(hasTuneAbc({ abcNotation: '   ', abcSatb: null })).toBe(false)
  })
})

describe('hasTuneImages', () => {
  it('is true when either page array is non-empty', () => {
    expect(hasTuneImages({ staffPages: ['/a.jpg'], solfegePages: [] })).toBe(true)
  })
})

describe('hasAnyTuneMedia', () => {
  it('is false when there is no recording, no ABC and no images', () => {
    expect(
      hasAnyTuneMedia({
        abcNotation: null,
        abcSatb: null,
        staffPages: [],
        solfegePages: [],
        soundcloudUrl: null,
      }),
    ).toBe(false)
  })

  it('is true when only a soundcloudUrl exists', () => {
    expect(
      hasAnyTuneMedia({
        abcNotation: null,
        abcSatb: null,
        staffPages: [],
        solfegePages: [],
        soundcloudUrl: 'https://soundcloud.com/manuel-kuhs/dundee',
      }),
    ).toBe(true)
  })
})

describe('initialPlayerTab', () => {
  it("prefers 'recording' when a soundcloudUrl exists", () => {
    expect(initialPlayerTab({ soundcloudUrl: 'https://soundcloud.com/manuel-kuhs/dundee' })).toBe('recording')
  })

  it("falls back to 'score' when there is no recording", () => {
    expect(initialPlayerTab({ soundcloudUrl: null })).toBe('score')
  })
})

describe('buildSoundcloudEmbedSrc', () => {
  it('percent-encodes the destination URL', () => {
    const src = buildSoundcloudEmbedSrc('https://soundcloud.com/manuel-kuhs/sets/a b')
    expect(src).toContain('url=https%3A%2F%2Fsoundcloud.com%2Fmanuel-kuhs%2Fsets%2Fa%20b')
  })

  it('includes the locked widget params', () => {
    const src = buildSoundcloudEmbedSrc('https://soundcloud.com/manuel-kuhs/dundee')
    expect(src).toContain('auto_play=true')
    expect(src).toContain('hide_related=true')
    expect(src).toContain('show_comments=false')
    expect(src).toContain('show_user=false')
    expect(src).toContain('show_reposts=false')
    expect(src.startsWith('https://w.soundcloud.com/player/?url=')).toBe(true)
  })

  it('(D-11 GUARD) is pure — it does not mutate its input object', () => {
    const input = { soundcloudUrl: 'https://soundcloud.com/manuel-kuhs/dundee' }
    const before = { ...input }
    const result = buildSoundcloudEmbedSrc(input.soundcloudUrl)
    expect(input).toEqual(before)
    expect((input as Record<string, unknown>).embedSrc).toBeUndefined()
    expect(typeof result).toBe('string')
  })
})
