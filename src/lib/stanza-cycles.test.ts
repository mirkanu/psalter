import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  groupStanzasIntoCycles,
  mapCycleToPhraseSyllableLines,
} from './stanza-cycles'

const SHEPHERD_S1 = `1The Lord's my Shepherd
I'll not want
He makes me down to lie
In pastures green`

const SHEPHERD_S2 = `2My soul He doth restore
And me to walk
Within the paths of righteousness
For his own name's sake`

// Inline expected portions for clarity
const S1_P0 = "1The Lord's my Shepherd\nI'll not want"
const S1_P1 = 'He makes me down to lie\nIn pastures green'
const S2_P0 = '2My soul He doth restore\nAnd me to walk'
const S2_P1 = "Within the paths of righteousness\nFor his own name's sake"

afterEach(() => {
  vi.restoreAllMocks()
})

describe('groupStanzasIntoCycles', () => {
  it('CM × CM with 6 stanzas → 6 cycles of length 1', () => {
    const stanzas = ['s1', 's2', 's3', 's4', 's5', 's6']
    const cycles = groupStanzasIntoCycles(stanzas, 'CM', 'CM')
    expect(cycles).toEqual([['s1'], ['s2'], ['s3'], ['s4'], ['s5'], ['s6']])
  })

  it('DCM × CM with 6 stanzas → 3 cycles of length 2 (paired)', () => {
    const stanzas = ['s1', 's2', 's3', 's4', 's5', 's6']
    const cycles = groupStanzasIntoCycles(stanzas, 'DCM', 'CM')
    expect(cycles).toEqual([
      ['s1', 's2'],
      ['s3', 's4'],
      ['s5', 's6'],
    ])
  })

  it('DCM × CM with 5 stanzas → 3 cycles, final cycle length 1', () => {
    const stanzas = ['s1', 's2', 's3', 's4', 's5']
    const cycles = groupStanzasIntoCycles(stanzas, 'DCM', 'CM')
    expect(cycles).toEqual([['s1', 's2'], ['s3', 's4'], ['s5']])
  })

  it('empty stanzas array returns []', () => {
    expect(groupStanzasIntoCycles([], 'DCM', 'CM')).toEqual([])
  })

  it('reverse meter mismatch (CM × DCM) emits console.warn and falls back to 1-stanza cycles', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const stanzas = ['s1', 's2', 's3', 's4']
    const cycles = groupStanzasIntoCycles(stanzas, 'CM', 'DCM')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0]?.[0]).toContain('reverse meter mismatch')
    expect(cycles).toEqual([['s1'], ['s2'], ['s3'], ['s4']])
  })

  it('null/undefined meter args degrade to 1-stanza cycles', () => {
    expect(groupStanzasIntoCycles(['s1', 's2'], null, null)).toEqual([
      ['s1'],
      ['s2'],
    ])
    expect(groupStanzasIntoCycles(['s1', 's2'], undefined, undefined)).toEqual([
      ['s1'],
      ['s2'],
    ])
  })

  it('parenthesised meter strings normalise correctly', () => {
    const stanzas = ['s1', 's2', 's3', 's4']
    const cycles = groupStanzasIntoCycles(
      stanzas,
      'DCM (double common meter)',
      'CM (common meter, 8.6.8.6)',
    )
    expect(cycles).toEqual([['s1', 's2'], ['s3', 's4']])
  })
})

describe('mapCycleToPhraseSyllableLines', () => {
  it('CM × CM, cycle=[s1] → 2 elements, each a 1-element array of the matching portion', () => {
    const result = mapCycleToPhraseSyllableLines([SHEPHERD_S1], 'CM', 'CM')
    expect(result).toEqual([[S1_P0], [S1_P1]])
  })

  it('DCM × CM, cycle=[s1, s2] → 4 elements distributing portions across phrase rows', () => {
    const result = mapCycleToPhraseSyllableLines(
      [SHEPHERD_S1, SHEPHERD_S2],
      'DCM',
      'CM',
    )
    expect(result).toEqual([[S1_P0], [S1_P1], [S2_P0], [S2_P1]])
  })

  it('DCM × CM, cycle=[s1] (under-filled) → s1 fills phrases 0+1, phrases 2+3 are [""]', () => {
    const result = mapCycleToPhraseSyllableLines([SHEPHERD_S1], 'DCM', 'CM')
    expect(result).toEqual([[S1_P0], [S1_P1], [''], ['']])
  })

  it('empty cycle returns T elements each [""]', () => {
    const resultCm = mapCycleToPhraseSyllableLines([], 'CM', 'CM')
    expect(resultCm).toEqual([[''], ['']])
    const resultDcm = mapCycleToPhraseSyllableLines([], 'DCM', 'CM')
    expect(resultDcm).toEqual([[''], [''], [''], ['']])
  })

  it('does NOT re-warn on reverse-mismatch fallback (only groupStanzasIntoCycles warns)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // After groupStanzasIntoCycles fallback, callers pass 1-stanza cycles.
    // Here we directly invoke mapCycle... with a 1-stanza cycle and CM/DCM
    // meters to confirm it stays silent (groupStanzasIntoCycles is the
    // single owner of the warning).
    mapCycleToPhraseSyllableLines([SHEPHERD_S1], 'CM', 'DCM')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('null meter args: T defaults to 1, returns 1-element array', () => {
    const result = mapCycleToPhraseSyllableLines([SHEPHERD_S1], null, null)
    expect(result).toHaveLength(1)
    // With S=1 and tuneMeter null, splitStanzaIntoPhrasePortions returns
    // the whole stanza unsplit, so phrase 0 gets it.
    expect(result[0]).toEqual([SHEPHERD_S1])
  })

  it('integration: chained with groupStanzasIntoCycles for DCM × CM 4-stanza psalm', () => {
    const stanzas = [SHEPHERD_S1, SHEPHERD_S2, SHEPHERD_S1, SHEPHERD_S2]
    const cycles = groupStanzasIntoCycles(stanzas, 'DCM', 'CM')
    expect(cycles).toHaveLength(2)
    const cycle1Map = mapCycleToPhraseSyllableLines(cycles[0]!, 'DCM', 'CM')
    expect(cycle1Map).toEqual([[S1_P0], [S1_P1], [S2_P0], [S2_P1]])
  })
})
