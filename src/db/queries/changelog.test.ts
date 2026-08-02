import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db } from '@/db'
import { changelogPosts } from '@/db/schema'
import { like } from 'drizzle-orm'
import { fetchPublishedPosts } from './changelog'

const PREFIX = 'TEST-CHLG-'

async function cleanup() {
  await db.delete(changelogPosts).where(like(changelogPosts.title, `${PREFIX}%`))
}

describe('fetchPublishedPosts', () => {
  beforeAll(async () => {
    await cleanup()
    await db.insert(changelogPosts).values([
      { title: `${PREFIX}oldest`, body: 'a', createdAt: new Date('2026-01-01T00:00:00Z') },
      { title: `${PREFIX}middle`, body: 'b', createdAt: new Date('2026-02-01T00:00:00Z') },
      { title: `${PREFIX}newest`, body: 'c', createdAt: new Date('2026-03-01T00:00:00Z') },
    ])
  })

  afterAll(cleanup)

  it('returns posts newest-first', async () => {
    const posts = await fetchPublishedPosts()
    const seeded = posts.filter((p) => p.title.startsWith(PREFIX))
    expect(seeded.map((p) => p.title)).toEqual([
      `${PREFIX}newest`,
      `${PREFIX}middle`,
      `${PREFIX}oldest`,
    ])
  })

  it('orders the full result set strictly descending by createdAt', async () => {
    const posts = await fetchPublishedPosts()
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(posts[i].createdAt.getTime())
    }
  })

  it('exposes id, title, body and createdAt on every row', async () => {
    const posts = await fetchPublishedPosts()
    const row = posts.find((p) => p.title === `${PREFIX}newest`)!
    expect(row).toBeDefined()
    expect(typeof row.id).toBe('number')
    expect(typeof row.body).toBe('string')
    expect(row.createdAt).toBeInstanceOf(Date)
  })

  it('resolves to an array with no seeded rows present (empty-state path)', async () => {
    await cleanup()
    const posts = await fetchPublishedPosts()
    expect(Array.isArray(posts)).toBe(true)
    expect(posts.filter((p) => p.title.startsWith(PREFIX))).toHaveLength(0)
  })
})
