import { describe, it, expect } from 'vitest'
import { extractSopranoTokens, extractSopranoTokensWithPos, replaceTokenAt } from './abc-soprano-tokens'

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

describe('extractSopranoTokensWithPos', () => {
  it('returns same tokens as extractSopranoTokens with positions', () => {
    const a = extractSopranoTokens(CRIMOND)
    const b = extractSopranoTokensWithPos(CRIMOND)
    expect(b.length).toBe(a.length)
    expect(b.map(t => t.token)).toEqual(a.map(t => t.token))
    expect(b.map(t => t.phraseIdx)).toEqual(a.map(t => t.phraseIdx))
  })

  it('positions are increasing and non-overlapping', () => {
    const toks = extractSopranoTokensWithPos(CRIMOND)
    for (let i = 1; i < toks.length; i++) {
      expect(toks[i].absStart).toBeGreaterThanOrEqual(toks[i - 1].absEnd)
    }
  })

  it('the substring at each position matches the token', () => {
    const toks = extractSopranoTokensWithPos(CRIMOND)
    for (const t of toks) {
      expect(CRIMOND.slice(t.absStart, t.absEnd)).toBe(t.token)
    }
  })
})

describe('replaceTokenAt + extractSopranoTokensWithPos round-trip', () => {
  it('replacing first c2 with a2 changes only that token', () => {
    const toks = extractSopranoTokensWithPos(CRIMOND)
    expect(toks[0].token).toBe('c2')
    const newBody = replaceTokenAt(CRIMOND, toks[0].absStart, toks[0].absEnd, 'a2')
    const newToks = extractSopranoTokensWithPos(newBody)
    expect(newToks[0].token).toBe('a2')
    expect(newToks.slice(1).map(t => t.token)).toEqual(toks.slice(1).map(t => t.token))
  })
})
