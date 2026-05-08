import { describe, it, expect } from 'vitest'

// Pure filter logic test — no DOM needed
function filterTunesByMeter(tunes: Array<{ meter: string | null }>, meter: string): Array<{ meter: string | null }> {
  if (meter === 'all') return tunes
  return tunes.filter((t) => t.meter === meter)
}

describe('TuneGrid meter filter logic', () => {
  const mockTunes = [
    { id: 1, name: 'Tune A', meter: 'CM' },
    { id: 2, name: 'Tune B', meter: 'LM' },
    { id: 3, name: 'Tune C', meter: 'CM' },
    { id: 4, name: 'Tune D', meter: null },
  ]

  it('returns all tunes when meter is "all"', () => {
    expect(filterTunesByMeter(mockTunes, 'all')).toHaveLength(4)
  })

  it('filters to CM meter correctly', () => {
    const result = filterTunesByMeter(mockTunes, 'CM')
    expect(result).toHaveLength(2)
    result.forEach((t) => expect(t.meter).toBe('CM'))
  })

  it('returns empty array for meter with no matches', () => {
    expect(filterTunesByMeter(mockTunes, 'SM')).toHaveLength(0)
  })

  it('excludes null-meter tunes when filtering', () => {
    const result = filterTunesByMeter(mockTunes, 'LM')
    expect(result.every((t) => t.meter !== null)).toBe(true)
  })
})
