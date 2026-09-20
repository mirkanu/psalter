import { describe, it, expect } from 'vitest'
import {
  matchPsalmRange,
  matchPsalmSingleVerse,
  matchStanzaLetter,
  matchPsalmNumber,
} from './search-query'

describe('search-query parsers', () => {
  describe('matchPsalmRange', () => {
    it('matches "119:1-8" — colon delimiter (issue #25 regression coverage)', () => {
      expect(matchPsalmRange('119:1-8')).toEqual({ id: 119, verseStart: 1, verseEnd: 8 })
    })
    it('matches "119-1-8" — hyphen delimiter', () => {
      expect(matchPsalmRange('119-1-8')).toEqual({ id: 119, verseStart: 1, verseEnd: 8 })
    })
    it('matches cross-stanza range "119:1-9" (issue #25 regression coverage)', () => {
      expect(matchPsalmRange('119:1-9')).toEqual({ id: 119, verseStart: 1, verseEnd: 9 })
    })
    it('matches cross-stanza range "119-1-9"', () => {
      expect(matchPsalmRange('119-1-9')).toEqual({ id: 119, verseStart: 1, verseEnd: 9 })
    })
    it('matches other psalms ("23:1-6")', () => {
      expect(matchPsalmRange('23:1-6')).toEqual({ id: 23, verseStart: 1, verseEnd: 6 })
    })
    it('rejects single-verse "119:1"', () => {
      expect(matchPsalmRange('119:1')).toBeNull()
    })
    it('rejects bare-number "119"', () => {
      expect(matchPsalmRange('119')).toBeNull()
    })
    it('rejects empty input', () => {
      expect(matchPsalmRange('')).toBeNull()
    })
  })

  describe('matchPsalmSingleVerse', () => {
    it('matches "119:1"', () => {
      expect(matchPsalmSingleVerse('119:1')).toEqual({ id: 119, verse: 1 })
    })
    it('matches "119:9" — a verse that crosses into stanza b (regression for issue #25)', () => {
      expect(matchPsalmSingleVerse('119:9')).toEqual({ id: 119, verse: 9 })
    })
    it('rejects ranges "119:1-8"', () => {
      expect(matchPsalmSingleVerse('119:1-8')).toBeNull()
    })
    it('rejects stanza letter "119a"', () => {
      expect(matchPsalmSingleVerse('119a')).toBeNull()
    })
  })

  describe('matchStanzaLetter', () => {
    it('matches "119a"', () => {
      expect(matchStanzaLetter('119a')).toEqual({ id: 119, letter: 'a' })
    })
    it('matches "70b"', () => {
      expect(matchStanzaLetter('70b')).toEqual({ id: 70, letter: 'b' })
    })
    it('rejects "119:1"', () => {
      expect(matchStanzaLetter('119:1')).toBeNull()
    })
  })

  describe('matchPsalmNumber', () => {
    it('matches "119"', () => {
      expect(matchPsalmNumber('119')).toBe(119)
    })
    it('matches "1"', () => {
      expect(matchPsalmNumber('1')).toBe(1)
    })
    it('rejects "119a"', () => {
      expect(matchPsalmNumber('119a')).toBeNull()
    })
    it('rejects "119:1"', () => {
      expect(matchPsalmNumber('119:1')).toBeNull()
    })
  })
})
