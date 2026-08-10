import { describe, it, expect } from 'vitest'
import { abbreviateMeter, groupMeterTag } from './meter-abbrev'

describe('abbreviateMeter', () => {
  const cases: [string | null | undefined, string | null][] = [
    ['CM', 'CM'],
    ['SM', 'SM'],
    ['LM (long meter, 88 88)', 'LM'],
    ['66 66 88', 'HM'],
    ['87 87', '87 87'],
    ['76 76 D', '76 76 D'],
    ['66 66 D', '66 66 D'],
    ['10 10 10 10 10', '10 10 10 10 10'],
    ['DCM', 'CMD'],
    ['D.C.M.', 'CMD'],
    ['C.M.', 'CM'],
    ['CMD', 'CMD'],
    [null, null],
    [undefined, null],
    ['', null],
    ['   ', null],
  ]
  for (const [input, expected] of cases) {
    it(`abbreviates ${JSON.stringify(input)} to ${JSON.stringify(expected)}`, () => {
      expect(abbreviateMeter(input)).toBe(expected)
    })
  }
})

describe('groupMeterTag', () => {
  it('shows no tag for a CM-only group', () => {
    expect(groupMeterTag(['CM', 'CM'])).toBeNull()
  })
  it('shows the single non-CM meter of a {CM, X} group', () => {
    expect(groupMeterTag(['CM', 'LM (long meter, 88 88)'])).toBe('LM')
  })
  it('shows no tag when two distinct non-CM meters are present', () => {
    expect(groupMeterTag(['66 66 88', '87 87'])).toBeNull()
  })
  it('collapses duplicate non-CM meters to one tag', () => {
    expect(groupMeterTag(['CM', '66 66 D', '66 66 D'])).toBe('66 66 D')
  })
  it('handles empty and all-null groups', () => {
    expect(groupMeterTag([])).toBeNull()
    expect(groupMeterTag([null, null])).toBeNull()
  })
  it('matches the live 2026-08-09 snapshot for every multi-version psalm', () => {
    expect(groupMeterTag(['CM', 'LM (long meter, 88 88)'])).toBe('LM')   // Ps 6/100/102/145
    expect(groupMeterTag(['CM', 'SM'])).toBe('SM')                        // Ps 25/45/50/67/70
    expect(groupMeterTag(['CM', '10 10 10 10 10'])).toBe('10 10 10 10 10') // Ps 124
    expect(groupMeterTag(['CM', '66 66 D'])).toBe('66 66 D')              // Ps 143
    expect(groupMeterTag(['CM', '66 66 88'])).toBe('HM')                  // Ps 148
    expect(groupMeterTag(['66 66 88', '87 87'])).toBeNull()               // Ps 136 (mixed)
    expect(groupMeterTag(Array(22).fill('CM'))).toBeNull()                // Ps 119
  })
})
