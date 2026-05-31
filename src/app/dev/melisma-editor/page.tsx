import fs from 'node:fs'
import path from 'node:path'
import { db } from '@/db'
import { tunes, psalmVersionTunes, psalmVersions, tuneMelismaDecisions } from '@/db/schema'
import { isNotNull, asc, eq, desc, sql } from 'drizzle-orm'
import { syllabifyForAbc } from '@/lib/lyrics'
import { countNoteHeads } from '@/lib/abc-phrases'
import { parseSavedWLines } from '@/lib/parse-saved-w-lines'
import { MelismaEditorClient } from './MelismaEditorClient'

export const dynamic = 'force-dynamic'

export interface TuneOption {
  id: number
  name: string
  meter: string | null
  abcNotation: string
  // Permanently-preserved OCR-imported ABC (Phase 04.11 snapshot).
  // Null only for tunes that had no OCR data at backfill time.
  abcNotationOcr: string | null
  // Raw OCR transcription (JSON-as-string) — surfaced for the editor's
  // "raw solfège" mode where the user can fix `:`, `.`, `—`, voice typos.
  solfegeOcrText: string | null
  // Per-tune phrase syllable shape override (e.g. [8,6,8,6,6] for Abbeyville).
  // NULL means "use the meter default" (CM → [8,6,8,6]). Authored here +
  // consumed by NotationRenderer for cycles 2+.
  phraseShapeOverride: number[] | null
  // Resolved from disk via slug match (DB column is often empty).
  solfegeJpgUrls: string[]
  // Stanza-1 fully-flattened syllables (all lines joined) for default alignment.
  stanza1Syllables: string[]
  // Same syllables, but grouped by lyric line. Used by the editor to display
  // the stanza-1 syllables panel one row per psalm-text line.
  stanza1SyllablesPerLine: string[][]
  // Linked psalm number for the side-by-side lyrics preview.
  psalmNumber: number | null
  // ── Tune navigator extras (populated server-side for the modal table) ──
  /** Latest non-null status from tune_melisma_decisions, or null. */
  decisionStatus: 'approved' | 'not_approved' | null
  /** Most recent non-null comment text (latest entry), or null. */
  lastComment: string | null
  /** True when the tune's saved ABC notes don't equal its expected syllable count. */
  countError: boolean
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function findSolfegeJpgs(slug: string): string[] {
  const dir = path.join(process.cwd(), 'public', 'tunes')
  if (!fs.existsSync(dir)) return []
  const prefix = `${slug}-solfege-`
  return fs.readdirSync(dir)
    .filter(f => f.startsWith(prefix) && f.endsWith('.jpg'))
    .sort()
    .map(f => `/tunes/${f}`)
}

async function loadTunes(): Promise<TuneOption[]> {
  const rows = await db
    .select({
      id: tunes.id,
      name: tunes.name,
      meter: tunes.meter,
      abcNotation: tunes.abcNotation,
      abcNotationOcr: tunes.abcNotationOcr,
      solfegeOcrText: tunes.solfegeOcrText,
      phraseShapeOverride: tunes.phraseShapeOverride,
    })
    .from(tunes)
    .where(isNotNull(tunes.abcNotation))
    .orderBy(asc(tunes.name))

  // Fetch ALL decisions in one query, then derive per-tune currentStatus +
  // latest non-empty comment in JS. Cheaper than N round-trips.
  const allDecisions = await db
    .select()
    .from(tuneMelismaDecisions)
    .orderBy(desc(tuneMelismaDecisions.createdAt), desc(tuneMelismaDecisions.id))
  const statusByTune = new Map<number, 'approved' | 'not_approved'>()
  const lastCommentByTune = new Map<number, string>()
  for (const d of allDecisions) {
    if (d.status && !statusByTune.has(d.tuneId)) {
      statusByTune.set(d.tuneId, d.status as 'approved' | 'not_approved')
    }
    if (d.comment && d.comment.length > 0 && !lastCommentByTune.has(d.tuneId)) {
      lastCommentByTune.set(d.tuneId, d.comment)
    }
  }

  const out: TuneOption[] = []
  for (const r of rows) {
    // Resolve stanza-1 syllables (full stanza, all lines joined)
    const pvts = await db
      .select()
      .from(psalmVersionTunes)
      .where(eq(psalmVersionTunes.tuneId, r.id))
    pvts.sort((a, b) => a.psalmVersionId - b.psalmVersionId)

    let stanza1Syllables: string[] = []
    let stanza1SyllablesPerLine: string[][] = []
    let psalmNumber: number | null = null

    if (pvts.length > 0) {
      const pvRows = await db
        .select({
          lyricsStructured: psalmVersions.lyricsStructured,
          lyricsImportedRaw: psalmVersions.lyricsImportedRaw,
          psalmId: psalmVersions.psalmId,
        })
        .from(psalmVersions)
        .where(eq(psalmVersions.id, pvts[0].psalmVersionId))
      if (pvRows.length === 1) {
        const ls = pvRows[0].lyricsStructured as unknown as Array<{ lines?: Array<{ text?: string }> }> | null
        let stanzaLineTexts: string[] = []
        if (Array.isArray(ls) && Array.isArray(ls[0]?.lines)) {
          stanzaLineTexts = ls[0]!.lines!.map(l => (l?.text ?? '').trim()).filter(t => t.length > 0)
        } else if (pvRows[0].lyricsImportedRaw) {
          const allLines = pvRows[0].lyricsImportedRaw
            .split('\n')
            .map(l => l.replace(/^\d+/, '').trim())
          const firstBlank = allLines.findIndex(l => l.length === 0)
          stanzaLineTexts = (firstBlank === -1 ? allLines : allLines.slice(0, firstBlank))
            .filter(l => l.length > 0)
        }
        if (stanzaLineTexts.length > 0) {
          stanza1SyllablesPerLine = stanzaLineTexts.map(t =>
            syllabifyForAbc(t).split(/\s+/).filter(Boolean),
          )
          stanza1Syllables = stanza1SyllablesPerLine.flat()
        }
        // psalms.id IS the psalm number (1-150) per schema comment
        psalmNumber = pvRows[0].psalmId ?? null
      }
    }

    // Apply phrase_shape_override if it requires more lines than the lyrics
    // natively provide (Abbeyville-style 8.6.8.6.6): pad by repeating the
    // last lyric line until we hit the override length. This is the
    // canonical "repeat last line" pattern.
    const override = r.phraseShapeOverride
    if (Array.isArray(override) && stanza1SyllablesPerLine.length > 0 && override.length > stanza1SyllablesPerLine.length) {
      while (stanza1SyllablesPerLine.length < override.length) {
        const lastLine = stanza1SyllablesPerLine[stanza1SyllablesPerLine.length - 1]
        stanza1SyllablesPerLine.push([...lastLine])
      }
      stanza1Syllables = stanza1SyllablesPerLine.flat()
    }

    // Live count-error computation:
    // - If saved w-lines exist, the per-phrase syllable list already balances
    //   with note count by construction → no error.
    // - Otherwise, compare total note heads against stanza-1 syllables. Repeat-
    //   last-line leniency: if notes === stanza1 + lastLineLen, also OK.
    let countError = false
    const totalNotes = countNoteHeads(r.abcNotation!)
    const saved = parseSavedWLines(r.abcNotation!)
    if (saved) {
      const savedTotal =
        saved.underlinedGlobalIndices.length +
        saved.syllablesPerPhrase.reduce((a, l) => a + l.length, 0)
      countError = savedTotal !== totalNotes
    } else if (stanza1Syllables.length > 0) {
      const stanzaLen = stanza1Syllables.length
      const lastLineLen =
        stanza1SyllablesPerLine[stanza1SyllablesPerLine.length - 1]?.length ?? 0
      countError =
        totalNotes !== stanzaLen &&
        !(lastLineLen > 0 && totalNotes === stanzaLen + lastLineLen)
    }
    // If the tune has no resolvable lyrics, leave countError=false rather than
    // flagging — it's not the editor's job to flag missing lyrics.

    out.push({
      id: r.id,
      name: r.name,
      meter: r.meter,
      abcNotation: r.abcNotation!,
      abcNotationOcr: r.abcNotationOcr,
      solfegeOcrText: r.solfegeOcrText,
      phraseShapeOverride: r.phraseShapeOverride ?? null,
      solfegeJpgUrls: findSolfegeJpgs(slugify(r.name)),
      stanza1Syllables,
      stanza1SyllablesPerLine,
      psalmNumber,
      decisionStatus: statusByTune.get(r.id) ?? null,
      lastComment: lastCommentByTune.get(r.id) ?? null,
      countError,
    })
  }

  return out
}

export default async function MelismaEditorPage() {
  const tuneRows = await loadTunes()
  return <MelismaEditorClient tunes={tuneRows} />
}
