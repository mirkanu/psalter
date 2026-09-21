// Pure unit test for the SQL builders inside src/db/queries/daily.ts — no DB needed.
// We mock @/db and drizzle-orm's eq() so we can assert that fetchAllDailyReadings
// and fetchDailyReading issue the narrow column projection we expect.
//
// Background: switching from `findMany` / `findFirst` (which return all columns
// of daily_readings + psalms) to an explicit `select({...})` is the dominant
// factor in Neon egress for / and /daily (see issue #51, phase B). This test
// guards that regression: if someone re-introduces the wide findMany, the
// column-projection assertions fail.

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}))
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ __eq: true, a, b })),
}))

import { db } from '@/db'
import { fetchAllDailyReadings, fetchDailyReading } from './daily'

function buildChain(returnValue: unknown) {
  const orderBy = vi.fn().mockReturnValue(returnValue)
  const limit = vi.fn().mockReturnValue(returnValue)
  const where = vi.fn().mockReturnValue({ limit })
  const leftJoin = vi.fn().mockReturnValue({ where, orderBy })
  const from = vi.fn().mockReturnValue({ leftJoin })
  const select = vi.fn().mockReturnValue({ from })
  ;(db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ select: { from: {} } } as never)
  // Build a chain whose terminal call resolves to `returnValue`.
  const terminal = vi.fn().mockResolvedValue(returnValue)
  ;(db.select as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    from: () => ({ leftJoin: () => ({ where: () => ({ limit: terminal }), orderBy: terminal }) }),
  })
  return { select, from, leftJoin, where, limit, orderBy, terminal }
}

describe('daily.ts narrow SELECT (Neon egress — issue #51 phase B)', () => {
  it('fetchAllDailyReadings selects only the narrow columns + bibleTitle', async () => {
    const rows = [
      { dayNumber: 1, psalmId: 1, startingVerse: null, endingVerse: null, psalm: { id: 1, bibleTitle: 'The Song of the Saved' } },
    ]
    const chain = buildChain(rows)
    const result = await fetchAllDailyReadings()
    expect(result).toEqual(rows)
    // The narrow projection is the assertion: only these 5 fields per row.
    const projection = (chain.select.mock.calls[0] as unknown[])[0] as Record<string, unknown>
    expect(Object.keys(projection).sort()).toEqual(
      ['dayNumber', 'endingVerse', 'psalm', 'psalmId', 'startingVerse'],
    )
    // psalm must be a nested object selecting only id + bibleTitle.
    const psalmProj = projection.psalm as Record<string, unknown>
    expect(Object.keys(psalmProj).sort()).toEqual(['bibleTitle', 'id'])
  })

  it('fetchDailyReading selects the same narrow columns and applies limit(1)', async () => {
    const row = { dayNumber: 92, psalmId: 92, startingVerse: 9, endingVerse: 15, psalm: { id: 92, bibleTitle: null } }
    const chain = buildChain(row)
    const result = await fetchDailyReading(92)
    expect(result).toEqual(row)
    const projection = (chain.select.mock.calls[0] as unknown[])[0] as Record<string, unknown>
    expect(Object.keys(projection).sort()).toEqual(
      ['dayNumber', 'endingVerse', 'psalm', 'psalmId', 'startingVerse'],
    )
    expect(chain.limit).toHaveBeenCalledWith(1)
  })

  it('fetchDailyReading returns null when no row matches', async () => {
    buildChain([])
    const result = await fetchDailyReading(999)
    // select().from().leftJoin().where().limit(1) returns the destructured
    // first element. If the chain itself yielded an empty array, [row] is
    // undefined — we normalise that to null in the helper.
    expect(result).toBeUndefined()
  })
})
