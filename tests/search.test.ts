import { describe, it, expect } from 'vitest'

// SRCH-01: PsalmSearchWidget psalm number lookup
describe('PsalmSearchWidget psalm number nav', () => {
  it('navigates to /psalms/[n] for valid input 1-150', () => {
    // Unit test: valid range 1-150 produces the correct path
    // Import the validation logic once Plan 02 creates the component
    expect(true).toBe(true) // placeholder — replace when widget exposes validatePsalmNumber
  })
})

// SRCH-02: fetchSearchResults FTS query
describe('fetchSearchResults', () => {
  it('returns empty array for blank query without hitting DB', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/search' as any)
    const results = await mod.fetchSearchResults('')
    expect(results).toEqual([])
  })

  it('returns results containing Psalm 23 for query "shepherd"', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/search' as any)
    const results = await mod.fetchSearchResults('shepherd')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r: { id: number }) => r.id === 23)).toBe(true)
  })

  it('returns empty array for query with no matches', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/search' as any)
    const results = await mod.fetchSearchResults('zzznomatch')
    expect(results).toEqual([])
  })
})
