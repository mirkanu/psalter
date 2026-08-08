import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { psalmVersions, psalmVersionTunes, tunes } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { isMeterMismatch } from '@/lib/meter-mismatch'

describe('isMeterMismatch (TUNE-02)', () => {
  it('flags the live Ps 119:153-160 / Aurelia case', () => {
    expect(isMeterMismatch('CM', '76 76 D')).toBe(true)
  })

  it('flags the live Ps 143b / I Need Thee case', () => {
    expect(isMeterMismatch('66 66 D', '66 66')).toBe(true)
  })

  it('does not flag matching meters', () => {
    expect(isMeterMismatch('CM', 'CM')).toBe(false)
  })

  it('is trim + case-insensitive', () => {
    expect(isMeterMismatch(' cm ', 'CM')).toBe(false)
  })

  it('returns false when psalm meter is null', () => {
    expect(isMeterMismatch(null, 'CM')).toBe(false)
  })

  it('returns false when tune meter is null', () => {
    expect(isMeterMismatch('CM', null)).toBe(false)
  })

  it('returns false when both are undefined', () => {
    expect(isMeterMismatch(undefined, undefined)).toBe(false)
  })

  it('treats empty string as missing', () => {
    expect(isMeterMismatch('', 'CM')).toBe(false)
  })
})

describe('TUNE-02: live primary tune links flagged by isMeterMismatch', () => {
  it('flags exactly the two known mismatching primary links', async () => {
    const rows = await db
      .select({
        psalterNumber: psalmVersions.psalterNumber,
        psalmMeter: psalmVersions.meter,
        tuneName: tunes.name,
        tuneMeter: tunes.meter,
      })
      .from(psalmVersionTunes)
      .innerJoin(psalmVersions, eq(psalmVersions.id, psalmVersionTunes.psalmVersionId))
      .innerJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))
      .where(eq(psalmVersionTunes.isPrimary, true))

    const flagged = rows
      .filter((r) => isMeterMismatch(r.psalmMeter, r.tuneMeter))
      .map((r) => `${r.psalterNumber} / ${r.tuneName}`)
      .sort()

    expect(flagged).toEqual([
      '119:153-160 (20) / Aurelia',
      '143 (Second Version, Recommended) / I Need Thee',
    ])
  })
})
