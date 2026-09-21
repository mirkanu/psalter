// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { selectMock, fromMock, leftJoinMock, whereMock, limitMock, orderByMock } = vi.hoisted(() => {
  // The select chain returns the same `chain` object at each step so that
  // leftJoin / where / limit / orderBy can be tracked. The final call in each
  // helper (orderBy for fetchAll, limit for fetchDailyReading) resolves to the
  // expected array — vi.fn(() => Promise.resolve([...])).
  const chain: { from?: ReturnType<typeof vi.fn>; leftJoin?: ReturnType<typeof vi.fn>; where?: ReturnType<typeof vi.fn>; limit?: ReturnType<typeof vi.fn>; orderBy?: ReturnType<typeof vi.fn> } = {}
  const fromMock = vi.fn(() => chain)
  const selectMock = vi.fn(() => chain)
  const leftJoinMock = vi.fn(() => chain)
  const whereMock = vi.fn(() => chain)
  const limitMock = vi.fn(() => Promise.resolve([]))
  const orderByMock = vi.fn(() => Promise.resolve([]))
  chain.from = fromMock
  chain.leftJoin = leftJoinMock
  chain.where = whereMock
  chain.limit = limitMock
  chain.orderBy = orderByMock
  return { selectMock, fromMock, leftJoinMock, whereMock, limitMock, orderByMock }
})

vi.mock('@/db', () => ({ db: { select: selectMock } }))

import { fetchAllDailyReadingsMinimal, fetchDailyReadingDayAndPsalmId } from './daily'

beforeEach(() => {
  fromMock.mockClear()
  selectMock.mockClear()
  leftJoinMock.mockClear()
  whereMock.mockClear()
  limitMock.mockClear()
  orderByMock.mockClear()
})

describe('fetchAllDailyReadingsMinimal', () => {
  it('returns the rows from the drizzle query helper', async () => {
    const rows = [
      { dayNumber: 1, psalmId: 1, startingVerse: null, endingVerse: null, psalm: { id: 1 } },
      { dayNumber: 2, psalmId: 2, startingVerse: 1, endingVerse: 3, psalm: { id: 2 } },
    ]
    orderByMock.mockReturnValueOnce(Promise.resolve(rows))
    const result = await fetchAllDailyReadingsMinimal()
    expect(selectMock).toHaveBeenCalled()
    expect(fromMock).toHaveBeenCalled()
    expect(leftJoinMock).toHaveBeenCalled()
    expect(orderByMock).toHaveBeenCalled()
    expect(result).toEqual(rows)
  })

  it('does not project bibleTitle (minimal = dayNumber + psalmId + verses + psalm.id only)', async () => {
    orderByMock.mockReturnValueOnce(Promise.resolve([]))
    await fetchAllDailyReadingsMinimal()
    const selectArg = selectMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(selectArg).not.toHaveProperty('bibleTitle')
    expect(selectArg).toHaveProperty('dayNumber')
    expect(selectArg).toHaveProperty('psalmId')
    const psalmSub = selectArg.psalm as Record<string, unknown>
    expect(psalmSub).toEqual({ id: expect.anything() })
  })
})

describe('fetchDailyReadingDayAndPsalmId', () => {
  it('returns the row from the drizzle query helper', async () => {
    const row = { dayNumber: 92, psalmId: 1, startingVerse: 1, endingVerse: 2, psalm: { id: 1 } }
    limitMock.mockReturnValueOnce(Promise.resolve([row]))
    const result = await fetchDailyReadingDayAndPsalmId(92)
    expect(selectMock).toHaveBeenCalled()
    expect(whereMock).toHaveBeenCalled()
    expect(limitMock).toHaveBeenCalledWith(1)
    expect(result).toEqual(row)
  })

  it('returns null when no row matches', async () => {
    limitMock.mockReturnValueOnce(Promise.resolve([]))
    const result = await fetchDailyReadingDayAndPsalmId(999)
    expect(result).toBeNull()
  })

  it('does not project bibleTitle', async () => {
    limitMock.mockReturnValueOnce(Promise.resolve([]))
    await fetchDailyReadingDayAndPsalmId(1)
    const selectArg = selectMock.mock.calls[0]?.[0] as Record<string, unknown>
    expect(selectArg).not.toHaveProperty('bibleTitle')
  })
})
