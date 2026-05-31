import { describe, it, expect } from 'vitest'
import { extractSopranoTokens } from './abc-soprano-tokens'

const CRIMOND = `X:1
T:Crimond
M:C
L:1/8
Q:1/4=76
K:F
c2a4bg | c'4bgf4
% PHRASE_BREAK
 | e2f4a2 | a2g2g2
% PHRASE_BREAK
=b4 |
=b2c'4a2 | a2b2a2g4
% PHRASE_BREAK
 | a2b2c'2b2 | a4a2g2 | b2d'2f4 | e2f4`

describe('extractSopranoTokens', () => {
  it('returns 34 tokens for Crimond across 4 phrases', () => {
    const toks = extractSopranoTokens(CRIMOND)
    expect(toks.length).toBe(34)
  })

  it('groups tokens by phrase: 8 + 6 + 8 + 12', () => {
    const toks = extractSopranoTokens(CRIMOND)
    const perPhrase = [0, 1, 2, 3].map(p => toks.filter(t => t.phraseIdx === p).length)
    expect(perPhrase).toEqual([8, 6, 8, 12])
  })

  it('assigns sequential globalIdx', () => {
    const toks = extractSopranoTokens(CRIMOND)
    toks.forEach((t, i) => expect(t.globalIdx).toBe(i))
  })

  it('first tokens are c2, a4, b, g, ...', () => {
    const toks = extractSopranoTokens(CRIMOND)
    expect(toks.slice(0, 4).map(t => t.token)).toEqual(['c2', 'a4', 'b', 'g'])
  })

  it('handles empty body', () => {
    expect(extractSopranoTokens('')).toEqual([])
  })
})
