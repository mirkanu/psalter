import { describe, it, expect } from 'vitest'

describe('fetchNavesTopicsWithCounts', () => {
  it('returns topics each with a psalm_count field', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const topics = await mod.fetchNavesTopicsWithCounts()
    expect(topics.length).toBeGreaterThan(0)
    expect(topics[0]).toHaveProperty('psalm_count')
    expect(typeof topics[0].psalm_count).toBe('number')
  })
})

describe('fetchPsalmsByNavesTopic', () => {
  it('returns psalms via correct verse join chain (not direct link)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const topics = await mod.fetchNavesTopicsWithCounts()
    const topicId = topics[0].id
    const psalms = await mod.fetchPsalmsByNavesTopic(topicId)
    expect(Array.isArray(psalms)).toBe(true)
    // psalm_id values must be in 1-150 range
    psalms.forEach((p: { psalm_id: number }) => {
      expect(p.psalm_id).toBeGreaterThanOrEqual(1)
      expect(p.psalm_id).toBeLessThanOrEqual(150)
    })
  })
})

describe('fetchTopicsWithCounts', () => {
  it('returns topics with non-null names after migration fix', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const topics = await mod.fetchTopicsWithCounts()
    expect(topics.length).toBeGreaterThan(0)
    topics.forEach((t: { name: string | null }) => expect(t.name).not.toBeNull())
  })
})
