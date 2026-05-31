import { describe, it, expect } from 'vitest'
import { abcNoteToSolfege, extractDohFromAbc, solfegeToAbcNote, parseSolfegeToken } from './abc-note-to-solfege'

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

describe('parseSolfegeToken', () => {
  it('plain syllable', () => expect(parseSolfegeToken('m')).toEqual({ syllable: 'm', octaveOffset: 0 }))
  it('chromatic syllable', () => expect(parseSolfegeToken('fe')).toEqual({ syllable: 'fe', octaveOffset: 0 }))
  it("upper octave '", () => expect(parseSolfegeToken("s'")).toEqual({ syllable: 's', octaveOffset: 1 }))
  it("double upper ''", () => expect(parseSolfegeToken("d''")).toEqual({ syllable: 'd', octaveOffset: 2 }))
  it('lower octave _1', () => expect(parseSolfegeToken('s_1')).toEqual({ syllable: 's', octaveOffset: -1 }))
  it('lower octave _2', () => expect(parseSolfegeToken('d_2')).toEqual({ syllable: 'd', octaveOffset: -2 }))
  it('lower via comma', () => expect(parseSolfegeToken('m,')).toEqual({ syllable: 'm', octaveOffset: -1 }))
  it('rejects garbage', () => expect(parseSolfegeToken('xyz')).toBeNull())
  it('rejects empty', () => expect(parseSolfegeToken('')).toBeNull())
})

describe('solfegeToAbcNote — Crimond F major', () => {
  it('s + duration "2" → c2', () => expect(solfegeToAbcNote('s', 'F', 'c2')).toBe('c2'))
  it('m + duration "4" → a4', () => expect(solfegeToAbcNote('m', 'F', 'a4')).toBe('a4'))
  it('f → b (key signature gives Bb naturally)', () => expect(solfegeToAbcNote('f', 'F', 'b')).toBe('b'))
  it('d + no duration → f', () => expect(solfegeToAbcNote('d', 'F', 'g')).toBe('f'))
  it("s' preserves duration → c'4", () => expect(solfegeToAbcNote("s'", 'F', "c'4")).toBe("c'4"))
  it('fe → =b (B-natural override of Bb key sig)', () => expect(solfegeToAbcNote('fe', 'F', 'b')).toBe('=b'))
})

describe('solfegeToAbcNote — round-trip', () => {
  const KEYS = ['F', 'C', 'G', 'D', 'Bb', 'Eb']
  const TOKENS = ['c', 'd', 'e', 'f', 'g', 'a', 'b', "c'", "d'", "f'"]
  for (const key of KEYS) {
    for (const tok of TOKENS) {
      it(`${tok} in ${key} round-trips`, () => {
        const sol = abcNoteToSolfege(tok, key)
        const back = solfegeToAbcNote(sol, key, tok)
        // After round-trip, re-extract solfège should match.
        expect(abcNoteToSolfege(back, key)).toBe(sol)
      })
    }
  }
})

describe('solfegeToAbcNote — invalid input passes through', () => {
  it('garbage returns original', () => expect(solfegeToAbcNote('xyz', 'F', 'c2')).toBe('c2'))
})
