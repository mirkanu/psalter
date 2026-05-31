import { describe, it, expect } from 'vitest'
import { abcNoteToSolfege, extractDohFromAbc } from './abc-note-to-solfege'

describe('extractDohFromAbc', () => {
  it('reads K:F', () => {
    expect(extractDohFromAbc('X:1\nT:t\nK:F\n|cde|')).toBe('F')
  })
  it('reads K:Bb', () => {
    expect(extractDohFromAbc('K:Bb')).toBe('Bb')
  })
  it('converts minor to relative major doh', () => {
    expect(extractDohFromAbc('K:Dm')).toBe('F')
    expect(extractDohFromAbc('K:Am')).toBe('C')
  })
  it('defaults to C', () => {
    expect(extractDohFromAbc('no K line')).toBe('C')
  })
})

describe('abcNoteToSolfege — Crimond F major', () => {
  it('c → s (5th)', () => expect(abcNoteToSolfege('c', 'F')).toBe('s'))
  it('a → m (3rd)', () => expect(abcNoteToSolfege('a', 'F')).toBe('m'))
  it('b → f (Bb in F major, 4th)', () => expect(abcNoteToSolfege('b', 'F')).toBe('f'))
  it('g → r (2nd)', () => expect(abcNoteToSolfege('g', 'F')).toBe('r'))
  it('f → d (root)', () => expect(abcNoteToSolfege('f', 'F')).toBe('d'))
  it('e → t (7th)', () => expect(abcNoteToSolfege('e', 'F')).toBe('t'))
  it("d → l (6th)", () => expect(abcNoteToSolfege('d', 'F')).toBe('l'))
  it("c'4 → s' (upper sol)", () => expect(abcNoteToSolfege("c'4", 'F')).toBe("s'"))
  it("d'2 → l' (upper la)", () => expect(abcNoteToSolfege("d'2", 'F')).toBe("l'"))
  it('=b → fe (B-natural in F major = raised 4th)', () => {
    expect(abcNoteToSolfege('=b', 'F')).toBe('fe')
  })
  it('strips duration digits', () => {
    expect(abcNoteToSolfege('a4', 'F')).toBe('m')
    expect(abcNoteToSolfege('c2', 'F')).toBe('s')
  })
})

describe('abcNoteToSolfege — C major', () => {
  it('c → d', () => expect(abcNoteToSolfege('c', 'C')).toBe('d'))
  it('d → r', () => expect(abcNoteToSolfege('d', 'C')).toBe('r'))
  it('e → m', () => expect(abcNoteToSolfege('e', 'C')).toBe('m'))
})

describe('abcNoteToSolfege — accidentals', () => {
  it('^c in C → de (raised doh)', () => expect(abcNoteToSolfege('^c', 'C')).toBe('de'))
  it('_b in C → ta (flat te)', () => expect(abcNoteToSolfege('_b', 'C')).toBe('ta'))
})
