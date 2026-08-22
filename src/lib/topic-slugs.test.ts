import { describe, it, expect } from 'vitest'
import { slugify, buildTopicSlugMap } from './topic-slugs'
import { buildNavesSlugMap } from './naves-slugs'

describe('slugify / buildTopicSlugMap', () => {
  it('builds a simple slug', () => {
    const map = buildTopicSlugMap([{ id: 1, name: 'Praise' }])
    expect(map.get(1)).toBe('praise')
  })

  it('disambiguates colliding base slugs on BOTH entries', () => {
    const map = buildTopicSlugMap([
      { id: 1, name: 'Love' },
      { id: 2, name: 'love' },
    ])
    expect(map.get(1)).toBe('love-1')
    expect(map.get(2)).toBe('love-2')
  })

  it('strips punctuation and apostrophes', () => {
    expect(slugify("God's Word!")).toBe('gods-word')
  })

  it('matches buildNavesSlugMap exactly for a shared fixture list (parity, never drift)', () => {
    const fixture = [
      { id: 1, name: 'Praise' },
      { id: 2, name: 'Love' },
      { id: 3, name: 'love' },
      { id: 4, name: "God's Word!" },
      { id: 5, name: 'Suffering & Trials' },
    ]
    const topicMap = buildTopicSlugMap(fixture)
    const navesMap = buildNavesSlugMap(fixture)
    expect(Object.fromEntries(topicMap)).toEqual(Object.fromEntries(navesMap))
  })
})
