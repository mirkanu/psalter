import { describe, it, expect } from 'vitest'
import { parsePsalmList } from './parse-psalm-list'
import type { PsalmRow } from '@/components/PsalmListingGrid'

// Fixture rows whose ids/labels match the live DB (verified 2026-11-08).
function row(o: { id: number; versionId: number; displayLabel: string; isRecommended?: boolean }): PsalmRow {
  return {
    id: o.id,
    versionId: o.versionId,
    displayLabel: o.displayLabel,
    slug: o.displayLabel.replace('*', '').replace(':', '-'),
    firstLine: null,
    meter: null,
    kjvExcerpt: null,
    isRecommended: o.isRecommended ?? false,
  }
}

const ROWS: PsalmRow[] = [
  row({ id: 6,  versionId: 144, displayLabel: '6a*',  isRecommended: true }),
  row({ id: 6,  versionId: 157, displayLabel: '6b' }),
  row({ id: 45, versionId: 29,  displayLabel: '45a' }),
  row({ id: 45, versionId: 160, displayLabel: '45b*', isRecommended: true }),
  row({ id: 50, versionId: 20,  displayLabel: '50a*', isRecommended: true }),
  row({ id: 50, versionId: 173, displayLabel: '50b' }),
  row({ id: 23, versionId: 42,  displayLabel: '23' }),
  row({ id: 119, versionId: 84,  displayLabel: '119:1-8' }),
  row({ id: 119, versionId: 150, displayLabel: '119:9-16' }),
  row({ id: 119, versionId: 176, displayLabel: '119:73-80' }),
]

describe('parsePsalmList', () => {
  it('resolves a bare multi-version number to the RECOMMENDED first version (50 -> 50a*)', () => {
    const [entry] = parsePsalmList('50', ROWS)
    expect(entry.psalm?.displayLabel).toBe('50a*')
    expect(entry.psalmVersionId).toBe(20)
  })

  it('resolves a bare multi-version number to the RECOMMENDED second version (45 -> 45b*), not the first row', () => {
    const [entry] = parsePsalmList('45', ROWS)
    expect(entry.psalm?.displayLabel).toBe('45b*')
    expect(entry.psalmVersionId).toBe(160)
    expect(entry.psalmVersionId).not.toBe(29)
  })

  it('leaves a single-version psalm unchanged and records no version id (23)', () => {
    const [entry] = parsePsalmList('23', ROWS)
    expect(entry.psalm?.displayLabel).toBe('23')
    expect(entry.psalmVersionId).toBeNull()
  })

  it('parses a verse range on a single-version psalm without changing the psalm (23:1-6)', () => {
    const [entry] = parsePsalmList('23:1-6', ROWS)
    expect(entry.verseRange).toBe('1-6')
    expect(entry.psalm?.displayLabel).toBe('23')
    expect(entry.psalmVersionId).toBeNull()
  })

  it('binds a psalm-119 range paste to that exact stanza (119:9-16)', () => {
    const [entry] = parsePsalmList('119:9-16', ROWS)
    expect(entry.psalm?.displayLabel).toBe('119:9-16')
    expect(entry.psalmVersionId).toBe(150)
  })

  it('binds a bare psalm-119 paste to the first stanza (119 -> 119:1-8)', () => {
    const [entry] = parsePsalmList('119', ROWS)
    expect(entry.psalm?.displayLabel).toBe('119:1-8')
    expect(entry.psalmVersionId).toBe(84)
  })

  it('picks the "b" version for a parenthetical paste (50 (AOTS) -> 50b)', () => {
    const [entry] = parsePsalmList('50 (AOTS)', ROWS)
    expect(entry.psalm?.displayLabel).toBe('50b')
    expect(entry.psalmVersionId).toBe(173)
  })

  it('picks the first psalm-119 stanza for a parenthetical paste, not an arbitrary later stanza (119 (AOTS))', () => {
    const [entry] = parsePsalmList('119 (AOTS)', ROWS)
    expect(entry.psalm?.displayLabel).toBe('119:1-8')
  })

  it('matches the parenthetical "b" version by LABEL, not by array position', () => {
    const reordered: PsalmRow[] = [
      row({ id: 50, versionId: 173, displayLabel: '50b' }),
      row({ id: 50, versionId: 20,  displayLabel: '50a*', isRecommended: true }),
    ]
    const [entry] = parsePsalmList('50 (AOTS)', reordered)
    expect(entry.psalm?.displayLabel).toBe('50b')
    expect(entry.psalmVersionId).toBe(173)
  })

  it('returns a null psalm for a number with no rows (99)', () => {
    const [entry] = parsePsalmList('99', ROWS)
    expect(entry.psalm).toBeNull()
    expect(entry.psalmVersionId).toBeNull()
  })

  it('skips numbers outside the 1-150 psalm range entirely (999)', () => {
    expect(parsePsalmList('999', ROWS)).toEqual([])
  })

  it('parses a multi-psalm list, resolving each entry independently', () => {
    const entries = parsePsalmList('23:1-6; 45; 119:9-16', ROWS)
    expect(entries).toHaveLength(3)
    expect(entries[0].verseRange).toBe('1-6')
    expect(entries[0].psalm?.displayLabel).toBe('23')
    expect(entries[0].psalmVersionId).toBeNull()
    expect(entries[1].psalm?.displayLabel).toBe('45b*')
    expect(entries[1].psalmVersionId).toBe(160)
    expect(entries[2].psalm?.displayLabel).toBe('119:9-16')
    expect(entries[2].psalmVersionId).toBe(150)
  })
})
