import { describe, it, expect } from 'vitest'
import 'dotenv/config'
import { db } from '../src/db'
import { tunes } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { splitOnPhraseBreaks } from '../src/lib/abc-phrases'

/**
 * B5 / Open-Question-3 resolution (option b):
 *   Every tune with `double_length=true` SHOULD carry exactly 4
 *   `% PHRASE_BREAK` markers in its `abc_notation`.
 *
 * Live-DB scan (captured 2026-05-18) found 25 violators. They are documented
 * in `.planning/phases/04.9.6-psalter-alignment-implementation/parse-failures.md`
 * §"Tune-quality issues" and represent a hand-curation backlog that is OUT OF
 * SCOPE for Plan 07 (this plan's goal is to surface the work, not do it).
 *
 * The test asserts the offender list matches the documented baseline. Two
 * regression directions both fail:
 *   - A NEW offender appears (a previously-correct DCM tune lost a phrase
 *     marker) → snapshot mismatch.
 *   - A KNOWN offender is fixed → snapshot mismatch, prompting baseline
 *     update + deletion from parse-failures.md.
 * Both outcomes are intentional surfacing per the plan's "surfaces them in
 * parse-failures.md" acceptance alternative.
 */
// 142 (Leominster, SM doubleLength) was fixed by the Phase 04.9.8 migration — removed from baseline.
// 28,56,83,86,111,118,119,122,132,139,149,158,163,164,172 fixed by Phase 04.9.10 Path NH re-annotation.
// 41 (Kingsfold, CM) fixed by Phase 04.9.11 Plan 02 — line-count splitting re-annotation.
const EXPECTED_OFFENDER_IDS: ReadonlySet<number> = new Set([
  5, 26, 38, 57, 62, 71, 109, 136,
])

describe('Tune-quality phrase-count (B5 / Open-Question-3 RESOLVED — option (b))', () => {
  it('every double_length=true tune has exactly 4 phrase breaks (or matches the documented offender baseline)', async () => {
    const rows = await db
      .select({ id: tunes.id, name: tunes.name, abcNotation: tunes.abcNotation })
      .from(tunes)
      .where(eq(tunes.doubleLength, true))

    const offenders: Array<{ id: number; name: string | null; phrases: number }> = []
    for (const t of rows) {
      const abc = t.abcNotation ?? ''
      if (!abc.trim()) continue
      const split = splitOnPhraseBreaks(abc)
      if (split.phrases.length !== 4) {
        offenders.push({ id: t.id, name: t.name, phrases: split.phrases.length })
      }
    }

    const actualIds = new Set(offenders.map((o) => o.id))
    const newOffenders = [...actualIds].filter((id) => !EXPECTED_OFFENDER_IDS.has(id))
    const fixedOffenders = [...EXPECTED_OFFENDER_IDS].filter((id) => !actualIds.has(id))

    if (newOffenders.length > 0 || fixedOffenders.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `Tune-quality phrase-count baseline drift:\n` +
          (newOffenders.length > 0 ? `  NEW offenders (regression): ${newOffenders.join(', ')}\n` : '') +
          (fixedOffenders.length > 0 ? `  FIXED offenders (update baseline + parse-failures.md): ${fixedOffenders.join(', ')}\n` : ''),
      )
    }

    expect({ newOffenders, fixedOffenders }).toEqual({ newOffenders: [], fixedOffenders: [] })
  })

  it('documents the live offender count for cross-reference with parse-failures.md', async () => {
    // Sanity: baseline contains 8 tunes (142 fixed by 04.9.8; 15 fixed by 04.9.10 Path NH re-annotation; 41 fixed by 04.9.11 Plan 02).
    expect(EXPECTED_OFFENDER_IDS.size).toBe(8)
  })

  it('every offender ID corresponds to a real double_length=true tune in the DB', async () => {
    const rows = await db
      .select({ id: tunes.id })
      .from(tunes)
      .where(eq(tunes.doubleLength, true))
    const liveDcmIds = new Set(rows.map((r) => r.id))
    const missing = [...EXPECTED_OFFENDER_IDS].filter((id) => !liveDcmIds.has(id))
    expect(missing).toEqual([])
  })
})
