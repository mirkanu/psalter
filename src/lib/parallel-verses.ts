/**
 * Display-only Bible-verse grouping for the Parallel tab's 3-column table.
 *
 * Pure module — no React, no DOM, no DB. Imports ONLY types from
 * `lyrics-structured.ts`; never modifies that file (per project CLAUDE.md's
 * binding rule on `.planning/research/lyric-to-note-alignment.md`).
 *
 * This is unrelated to melisma/slur/underline alignment — `bibleVerseRef`
 * marks where a Bible verse BEGINS within the metrical lyrics, a completely
 * different concept from syllable-to-note melisma continuation.
 */
import type { StructuredLyrics } from './lyrics-structured'

export interface VerseGroup {
  verseNumber: number | null
  lines: string[]
}

export interface ParallelRow {
  verseNumber: number | null
  psalterLines: string[]
  kjvText: string | null
}

/**
 * Walk stanzas and lines in document order, grouping consecutive lines
 * under the Bible verse number that most recently began (per
 * `bibleVerseRef`). Lines before any `bibleVerseRef` form a single
 * `verseNumber: null` group. A verse may span a stanza boundary.
 */
export function groupLinesByBibleVerse(stanzas: StructuredLyrics): VerseGroup[] {
  const groups: VerseGroup[] = []
  let current: VerseGroup | null = null

  for (const stanza of stanzas) {
    for (const line of stanza.lines) {
      if (line.bibleVerseRef !== undefined) {
        current = { verseNumber: line.bibleVerseRef, lines: [line.text] }
        groups.push(current)
      } else if (current) {
        current.lines.push(line.text)
      } else {
        current = { verseNumber: null, lines: [line.text] }
        groups.push(current)
      }
    }
  }

  return groups
}

/**
 * Merge psalter verse groups with KJV verses into one row per distinct
 * verse number across the union of both sides, sorted ascending with any
 * null-numbered psalter group first. Neither side ever drops a row because
 * the other side is missing that verse number.
 */
export function buildParallelRows(
  stanzas: StructuredLyrics,
  kjvVerses: Array<{ verseNumber: number | null; kjvText: string | null }>,
): ParallelRow[] {
  const psalterGroups = groupLinesByBibleVerse(stanzas)
  const kjvByVerse = new Map<number | null, string | null>()
  for (const v of kjvVerses) {
    kjvByVerse.set(v.verseNumber, v.kjvText)
  }

  const rows = new Map<number | null, ParallelRow>()

  for (const group of psalterGroups) {
    rows.set(group.verseNumber, {
      verseNumber: group.verseNumber,
      psalterLines: group.lines,
      kjvText: kjvByVerse.get(group.verseNumber) ?? null,
    })
  }

  for (const v of kjvVerses) {
    const existing = rows.get(v.verseNumber)
    if (existing) {
      existing.kjvText = v.kjvText
    } else {
      rows.set(v.verseNumber, {
        verseNumber: v.verseNumber,
        psalterLines: [],
        kjvText: v.kjvText,
      })
    }
  }

  return Array.from(rows.values()).sort((a, b) => {
    if (a.verseNumber === null) return -1
    if (b.verseNumber === null) return 1
    return a.verseNumber - b.verseNumber
  })
}
