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

describe('04.12 explore queries', () => {
  it('fetchQuotedInNT returns 68 entries under Quotations and Allusions', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const entries = await mod.fetchQuotedInNT()
    expect(entries.length).toBe(68)
    expect(entries[0]).toHaveProperty('sub_topic')
    expect(entries[0]).toHaveProperty('quotation')
    expect(entries[0]).toHaveProperty('verses')
    expect(Array.isArray(entries[0].verses)).toBe(true)
  })

  it('fetchMessianicByTopic returns exactly 12 rows', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const rows = await mod.fetchMessianicByTopic()
    expect(rows.length).toBe(12)
    rows.forEach((r: { messianic: string | null }) => {
      expect(r.messianic).not.toBeNull()
    })
  })

  it('fetchPsalmsWithAuthorData returns 150 rows with author data fields', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const rows = await mod.fetchPsalmsWithAuthorData()
    expect(rows.length).toBe(150)
    expect(rows[0]).toHaveProperty('id')
    expect(rows[0]).toHaveProperty('author')
    expect(rows[0]).toHaveProperty('dateBC')
    expect(rows[0]).toHaveProperty('occasion')
  })

  it('fetchHeidelbergCatechism returns 35 distinct question numbers', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const rows = await mod.fetchHeidelbergCatechism()
    expect(rows.length).toBe(35)
    expect(rows[0]).toHaveProperty('question_number')
    expect(rows[0]).toHaveProperty('url')
    expect(rows[0]).toHaveProperty('verses')
    expect(Array.isArray(rows[0].verses)).toBe(true)
  })

  it('fetchNavesSubTopics returns sub-topics for a given topic id', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    // Get a topic that has entries
    const topicsWithCounts = await mod.fetchNavesTopicsWithCounts()
    const topicId = topicsWithCounts[0].id
    const rows = await mod.fetchNavesSubTopics(topicId)
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0]).toHaveProperty('sub_topic')
    expect(rows[0]).toHaveProperty('verses')
  })

  it('fetchTopicsByType returns correct counts by topic type', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('@/db/queries/explore' as any)
    const mainTopics = await mod.fetchTopicsByType('Main Topic')
    expect(mainTopics.length).toBe(42)
    const moodTopics = await mod.fetchTopicsByType('Mood')
    expect(moodTopics.length).toBe(21)
    const songTypeTopics = await mod.fetchTopicsByType('Song Type')
    expect(songTypeTopics.length).toBe(15)
  })
})
