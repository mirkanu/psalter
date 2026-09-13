import { describe, it, expect } from 'vitest'
import {
  MOBILE_HIDDEN_COLUMN_KEYS,
  truncatePsalmIds,
  buildTuneCsv,
  shouldTierRows,
  type TuneRow,
} from './TuneTable'

function makeTuneRow(overrides: Partial<TuneRow> = {}): TuneRow {
  return {
    id: 1,
    name: 'Dundee',
    slug: 'dundee',
    meter: 'CM',
    scoreJpgUrl: null,
    inPrcaPsalter: true,
    hasFamousHymn: false,
    famousHymn: null,
    numberIn1979RpPsalter: null,
    numInPrcaPsalter: null,
    moods: [],
    recommendedPsalmIds: [],
    recommendedPsalmVariantCount: {},
    soundcloudUrl: null,
    solfegeJpgUrl: null,
    youtubeUrl: null,
    abcNotation: null,
    abcSatb: null,
    phraseShapeOverride: null,
    doubleLength: false,
    meterVariant: [],
    solfegeOcrText: null,
    weightedHistoricalFrequency: 0,
    staffPages: [],
    solfegePages: [],
    ...overrides,
  }
}

describe('MOBILE_HIDDEN_COLUMN_KEYS', () => {
  it('Recording is NOT in the mobile-hidden set', () => {
    expect((MOBILE_HIDDEN_COLUMN_KEYS as readonly string[]).includes('recording')).toBe(false)
  })

  it('the mobile-hidden set is exactly the five opt-in columns', () => {
    expect([...MOBILE_HIDDEN_COLUMN_KEYS].sort()).toEqual(['hymn', 'inPrca', 'mood', 'prca', 'rp'])
  })
})

describe('truncatePsalmIds', () => {
  it('keeps all ids when under the limit', () => {
    expect(truncatePsalmIds([1, 2, 3], 8)).toBe('1, 2, 3')
  })

  it('appends a +N remainder', () => {
    expect(truncatePsalmIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 8)).toBe('1, 2, 3, 4, 5, 6, 7, 8 +2')
  })

  it('honours the tighter mobile limit', () => {
    expect(truncatePsalmIds([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3)).toBe('1, 2, 3 +7')
  })

  it('on an empty list returns an empty string', () => {
    expect(truncatePsalmIds([], 8)).toBe('')
  })
})

describe('buildTuneCsv', () => {
  it('(D-11 REGRESSION GUARD) writes the raw SoundCloud destination URL, not an embed URL', () => {
    const row = makeTuneRow({ soundcloudUrl: 'https://soundcloud.com/manuel-kuhs/dundee' })
    const csv = buildTuneCsv([row])
    expect(csv).toContain('https://soundcloud.com/manuel-kuhs/dundee')
    expect(csv).not.toContain('w.soundcloud.com/player')
  })

  it('CSV header row is unchanged', () => {
    expect(buildTuneCsv([]).split('\n')[0]).toBe(
      '"Tune Name","Meter","Recommended Psalms","Psalm Count","Mood","# 1979 RP Psalter","# 1912 PRCA Psalter","Famous Hymn","In PRCA Psalter","SoundCloud"',
    )
  })

  it('escapes embedded double quotes', () => {
    const row = makeTuneRow({ name: 'He said "Hi"' })
    const csv = buildTuneCsv([row])
    expect(csv).toContain('"He said ""Hi"""')
  })
})

describe('shouldTierRows', () => {
  it('is false when tuneTiers is undefined', () => {
    expect(shouldTierRows(undefined)).toBe(false)
  })

  it('is false when tuneTiers is null', () => {
    expect(shouldTierRows(null)).toBe(false)
  })

  it('is false when all tier arrays are empty', () => {
    expect(shouldTierRows({ recommendedTuneIds: [], backupTuneIds: [], historicalTuneIds: [] })).toBe(false)
  })

  it('is true when a backup tune exists', () => {
    expect(shouldTierRows({ recommendedTuneIds: [], backupTuneIds: [7], historicalTuneIds: [] })).toBe(true)
  })

  it('is true when only historical tunes exist', () => {
    expect(shouldTierRows({ recommendedTuneIds: [], backupTuneIds: [], historicalTuneIds: [3] })).toBe(true)
  })

  it('is true when only a recommended tune exists', () => {
    expect(shouldTierRows({ recommendedTuneIds: [5], backupTuneIds: [], historicalTuneIds: [] })).toBe(true)
  })
})
