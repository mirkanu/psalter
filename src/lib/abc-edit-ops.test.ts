import { describe, it, expect } from 'vitest'
import {
  insertTokenAtPhraseEnd,
  deleteTokenAt,
  moveTokenBefore,
  moveTokenToPhraseEnd,
} from './abc-edit-ops'
import { extractSopranoTokensWithPos } from './abc-soprano-tokens'

const CRIMOND = `X:1
T:Crimond
M:C
L:1/8
K:F
c2a4bg | c'4bgf4
% PHRASE_BREAK
| e2f4a2 | a2g2g2
% PHRASE_BREAK
=b4 | =b2c'4a2 | a2b2a2g4`

describe('insertTokenAtPhraseEnd', () => {
  it('appends token at end of phrase 0', () => {
    const after = insertTokenAtPhraseEnd(CRIMOND, 0, 'd')
    const toks = extractSopranoTokensWithPos(after)
    const p0 = toks.filter(t => t.phraseIdx === 0)
    expect(p0[p0.length - 1].token).toBe('d')
    expect(p0.length).toBe(9)
  })

  it('does not affect other phrases', () => {
    const after = insertTokenAtPhraseEnd(CRIMOND, 0, 'd')
    const before = extractSopranoTokensWithPos(CRIMOND)
    const after2 = extractSopranoTokensWithPos(after)
    const beforeP2 = before.filter(t => t.phraseIdx === 2).map(t => t.token)
    const afterP2 = after2.filter(t => t.phraseIdx === 2).map(t => t.token)
    expect(afterP2).toEqual(beforeP2)
  })

  it('appends to last phrase', () => {
    const after = insertTokenAtPhraseEnd(CRIMOND, 2, 'd2')
    const toks = extractSopranoTokensWithPos(after)
    const p2 = toks.filter(t => t.phraseIdx === 2)
    expect(p2[p2.length - 1].token).toBe('d2')
  })
})

describe('deleteTokenAt', () => {
  it('removes the first token', () => {
    const toks = extractSopranoTokensWithPos(CRIMOND)
    const first = toks[0]
    const after = deleteTokenAt(CRIMOND, first.absStart, first.absEnd)
    const newToks = extractSopranoTokensWithPos(after)
    expect(newToks.length).toBe(toks.length - 1)
    expect(newToks[0].token).toBe(toks[1].token)
  })
})

describe('moveTokenBefore', () => {
  it('moves last token to before first (no-op direction same)', () => {
    const toks = extractSopranoTokensWithPos(CRIMOND)
    const source = toks[toks.length - 1]
    const target = toks[0]
    const after = moveTokenBefore(CRIMOND, source.absStart, source.absEnd, target.absStart)
    const newToks = extractSopranoTokensWithPos(after)
    expect(newToks.length).toBe(toks.length)
    expect(newToks[0].token).toBe(source.token)
  })

  it('cross-phrase move: phrase-0 token-2 to before phrase-2 token-0', () => {
    const toks = extractSopranoTokensWithPos(CRIMOND)
    const source = toks[2] // 3rd note of phrase 0
    const target = toks.find(t => t.phraseIdx === 2)!
    const after = moveTokenBefore(CRIMOND, source.absStart, source.absEnd, target.absStart)
    const newToks = extractSopranoTokensWithPos(after)
    // Total count preserved
    expect(newToks.length).toBe(toks.length)
    // Phrase 0 now has one fewer note
    expect(newToks.filter(t => t.phraseIdx === 0).length).toBe(toks.filter(t => t.phraseIdx === 0).length - 1)
    // Phrase 2 now has one more note (and source token at its start)
    expect(newToks.filter(t => t.phraseIdx === 2).length).toBe(toks.filter(t => t.phraseIdx === 2).length + 1)
    expect(newToks.filter(t => t.phraseIdx === 2)[0].token).toBe(source.token)
  })
})

describe('moveTokenToPhraseEnd', () => {
  it('moves first phrase-0 token to end of phrase 2', () => {
    const toks = extractSopranoTokensWithPos(CRIMOND)
    const source = toks[0]
    const after = moveTokenToPhraseEnd(CRIMOND, source.absStart, source.absEnd, 2)
    const newToks = extractSopranoTokensWithPos(after)
    expect(newToks.length).toBe(toks.length)
    const p2 = newToks.filter(t => t.phraseIdx === 2)
    expect(p2[p2.length - 1].token).toBe(source.token)
  })
})
