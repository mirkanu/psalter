import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { tunes } from '@/db/schema'
import { tuneNameToSlug, isNumericTuneSlug } from '@/lib/tune-slug'
import { fetchTuneBySlug, fetchTuneSlugs } from '@/db/queries/tunes'

describe('tuneNameToSlug', () => {
  it('lowercases and hyphenates a simple name', () => {
    expect(tuneNameToSlug('Beatitudo')).toBe('beatitudo')
  })

  it('handles numeric names', () => {
    expect(tuneNameToSlug('Old 100th')).toBe('old-100th')
  })

  it('strips punctuation', () => {
    expect(tuneNameToSlug('St. Anne')).toBe('st-anne')
  })

  it('collapses a slash into a single hyphen', () => {
    expect(tuneNameToSlug('Azmon/Denfield')).toBe('azmon-denfield')
  })

  it('collapses commas, parens, and multiple spaces', () => {
    expect(tuneNameToSlug('St Agnes, Durham (start high)')).toBe('st-agnes-durham-start-high')
  })
})

describe('isNumericTuneSlug', () => {
  it('accepts plain integer strings', () => {
    expect(isNumericTuneSlug('169')).toBe(true)
    expect(isNumericTuneSlug('0')).toBe(true)
  })

  it.each(['beatitudo', '12abc', '1e5', ' 12', '-1', '1.5', ''])(
    'rejects %j',
    (input) => {
      expect(isNumericTuneSlug(input)).toBe(false)
    }
  )
})

describe('TUNE-05: slug uniqueness across all tune names', () => {
  it('no two tune names collapse to the same slug', async () => {
    const rows = await db.select({ name: tunes.name }).from(tunes)
    const slugs = rows.map((r) => tuneNameToSlug(r.name))
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
    expect(dupes).toEqual([])
    expect(slugs.every((s) => s.length > 0)).toBe(true)
    expect(slugs).toHaveLength(rows.length)
  })
})

describe('fetchTuneBySlug / fetchTuneSlugs', () => {
  it('resolves a known slug to the matching tune', async () => {
    const tune = await fetchTuneBySlug('darwall')
    expect(tune?.name).toBe('Darwall')
  })

  it('returns undefined for an unknown slug', async () => {
    const tune = await fetchTuneBySlug('no-such-tune')
    expect(tune).toBeUndefined()
  })

  it('returns one non-empty slug per tune row', async () => {
    const slugs = await fetchTuneSlugs()
    expect(slugs.length).toBeGreaterThan(0)
    expect(slugs.every((s) => typeof s === 'string' && s.length > 0)).toBe(true)
  })
})
