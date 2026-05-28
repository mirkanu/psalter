import { describe, it, expect } from 'vitest'
import { buildWLineFromSolfa } from './abc-melisma'

// Minimal RED test — buildWLineFromSolfa does not yet exist
describe('buildWLineFromSolfa (RED gate)', () => {
  it('returns a string', () => {
    const soprano = 's|m:r|d:t_1|l_1:s|f|m:f|s:—|s|s|l:t|d:t|l:s|f|r:d|t_1|s:—||'
    const warnings: string[] = []
    const result = buildWLineFromSolfa(soprano, 'G', 'C', 0, 'CM', 'The Lord my shepherd', warnings)
    expect(typeof result).toBe('string')
  })
})
