import { describe, it, expect } from 'vitest'
import { tuneTier, sortTunesByTier } from '@/lib/tune-tiers'

const backupTuneIds = [7]
const historicalTuneIds = [3, 9]

const tunes = [
  { id: 1, name: 'Alpha', weightedHistoricalFrequency: 0.01 },
  { id: 3, name: 'Zulu', weightedHistoricalFrequency: 0 },
  { id: 7, name: 'Mike', weightedHistoricalFrequency: 0 },
  { id: 9, name: 'Alpha2', weightedHistoricalFrequency: 0.5 },
  { id: 2, name: 'Bravo', weightedHistoricalFrequency: 0.3 },
]

describe('tuneTier', () => {
  it('classifies a backup tune', () => {
    expect(tuneTier(7, backupTuneIds, historicalTuneIds)).toBe('backup')
  })

  it('classifies a historical tune', () => {
    expect(tuneTier(3, backupTuneIds, historicalTuneIds)).toBe('historical')
  })

  it('classifies an other tune', () => {
    expect(tuneTier(1, backupTuneIds, historicalTuneIds)).toBe('other')
  })

  it('classifies a tune present in both lists as backup (backup outranks historical)', () => {
    expect(tuneTier(7, [7], [7])).toBe('backup')
  })
})

describe('sortTunesByTier', () => {
  it('orders backup first, then historical (by name), then other (by frequency DESC, then name)', () => {
    const sorted = sortTunesByTier(tunes, backupTuneIds, historicalTuneIds)
    expect(sorted.map((t) => t.id)).toEqual([7, 9, 3, 2, 1])
  })

  it('sorts historical tier by name ascending (Alpha2 before Zulu)', () => {
    const sorted = sortTunesByTier(tunes, backupTuneIds, historicalTuneIds)
    const historical = sorted.filter((t) => tuneTier(t.id, backupTuneIds, historicalTuneIds) === 'historical')
    expect(historical.map((t) => t.name)).toEqual(['Alpha2', 'Zulu'])
  })

  it('sorts other tier by weightedHistoricalFrequency DESC (Bravo 0.30 before Alpha 0.01)', () => {
    const sorted = sortTunesByTier(tunes, backupTuneIds, historicalTuneIds)
    const other = sorted.filter((t) => tuneTier(t.id, backupTuneIds, historicalTuneIds) === 'other')
    expect(other.map((t) => t.name)).toEqual(['Bravo', 'Alpha'])
  })

  it('sorts two other tunes with equal frequency by name ascending', () => {
    const equalFreqTunes = [
      { id: 10, name: 'Zeta', weightedHistoricalFrequency: 0.2 },
      { id: 11, name: 'Alpha3', weightedHistoricalFrequency: 0.2 },
    ]
    const sorted = sortTunesByTier(equalFreqTunes, [], [])
    expect(sorted.map((t) => t.name)).toEqual(['Alpha3', 'Zeta'])
  })

  it('does not mutate its input array', () => {
    const input = [...tunes]
    const originalOrder = input.map((t) => t.id)
    sortTunesByTier(input, backupTuneIds, historicalTuneIds)
    expect(input.map((t) => t.id)).toEqual(originalOrder)
  })

  it('returns pure "other" ordering when tier lists are empty', () => {
    const sorted = sortTunesByTier(tunes, [], [])
    // frequencies: 9=0.5, 2=0.3, 1=0.01, 3=0, 7=0 — ties (3, 7) break by name: 'Mike' < 'Zulu'
    expect(sorted.map((t) => t.id)).toEqual([9, 2, 1, 7, 3])
  })

  it('returns an empty array for an empty tune list', () => {
    expect(sortTunesByTier([], backupTuneIds, historicalTuneIds)).toEqual([])
  })
})
