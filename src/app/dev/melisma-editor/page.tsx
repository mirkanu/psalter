import fs from 'node:fs'
import path from 'node:path'
import { db } from '@/db'
import { tunes, psalmVersionTunes, psalmVersions, tuneMelismaDecisions } from '@/db/schema'
import { isNotNull, asc, eq, desc, sql } from 'drizzle-orm'
import { syllabifyForAbc } from '@/lib/lyrics'
import { countNoteHeads } from '@/lib/abc-phrases'
import { parseSavedWLines } from '@/lib/parse-saved-w-lines'
import { checkAgainstMeter, expectedSyllablesByLine } from '@/lib/meter-syllable-shape'
import { forceMatchMeterShape } from '@/lib/force-match-meter-shape'
import { regroupLinesToMeter } from '@/lib/regroup-lines-to-meter'
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
  // User-edited soprano string from the raw-solfège textarea. null = use OCR
  // original. Editor's textarea defaults to this when present; Revert button
  // sends null to clear.
  solfegeSopranoEdited: string | null
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
  /** True when the tune's saved notes vs syllables count doesn't balance
   *  (i.e. non-underlined notes ≠ syllables — the editor's top "✗ counts
   *  don't match" check). For unsaved tunes, equivalent to notes ≠ stanza1. */
  melismaError: boolean
  /** True when stanza-1 syllables per line don't match the meter requirement
   *  (the "Stanza-1 syllables" panel's "✗ N lines ≠ meter" flag). */
  meterError: boolean
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
      solfegeSopranoEdited: tunes.solfegeSopranoEdited,
      phraseShapeOverride: tunes.phraseShapeOverride,
      doubleLength: tunes.doubleLength,
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
  // Comment to show: the comment field of the SAME row that defines the
  // current status. This way the user only sees comments that are still
  // relevant to the latest decision — older comments from superseded
  // statuses are hidden (e.g. Communion: latest status=Approved, so an
  // older "remove Amens" Not Approved comment is no longer shown).
  const lastCommentByTune = new Map<number, string>()
  for (const d of allDecisions) {
    if (d.status && !statusByTune.has(d.tuneId)) {
      statusByTune.set(d.tuneId, d.status as 'approved' | 'not_approved')
      if (d.comment && d.comment.length > 0) {
        lastCommentByTune.set(d.tuneId, d.comment)
      }
    }
  }
  // Tunes with no status entries but with comment-only entries: show the
  // most recent comment as a fallback (preserves visibility for triage).
  for (const d of allDecisions) {
    if (!statusByTune.has(d.tuneId) && d.comment && d.comment.length > 0 && !lastCommentByTune.has(d.tuneId)) {
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
        const ls = pvRows[0].lyricsStructured as unknown as Array<{ lines?: Array<{ text?: string; syllables?: string[] }> }> | null
        let stanzaLineTexts: string[] = []
        // Per-line syllable overrides (when present from the bulk meter-fit
        // script). When the source line has its own `syllables` array, use it
        // verbatim — bypass the runtime syllabifier. Stored in a parallel
        // map keyed by line index so we can slot them back after the text-
        // based syllabify pass below.
        const overridesByLineIdx = new Map<number, string[]>()
        // DCM tunes sing two CM stanzas as one musical "stanza" — pull both
        // stanza 1 AND stanza 2 so the editor sees the full 8-line shape
        // [8,6,8,6,8,6,8,6]. Same for other doubled meters (LMD, SMD).
        const isDoubled = r.doubleLength === true
        if (Array.isArray(ls) && Array.isArray(ls[0]?.lines)) {
          const collect = (stanza: { lines?: Array<{ text?: string; syllables?: string[] }> }) => {
            stanza.lines!.forEach((l) => {
              const text = (l?.text ?? '').trim()
              if (text.length === 0) return
              const idx = stanzaLineTexts.length
              stanzaLineTexts.push(text)
              if (Array.isArray(l.syllables) && l.syllables.length > 0) {
                overridesByLineIdx.set(idx, l.syllables)
              }
            })
          }
          collect(ls[0]!)
          if (isDoubled && Array.isArray(ls[1]?.lines)) collect(ls[1]!)
        } else if (pvRows[0].lyricsImportedRaw) {
          const allLines = pvRows[0].lyricsImportedRaw
            .split('\n')
            .map(l => l.replace(/^\d+/, '').trim())
          if (isDoubled) {
            // Take the first TWO stanza blocks (separated by blank lines).
            const blocks: string[][] = []
            let current: string[] = []
            for (const l of allLines) {
              if (l.length === 0) {
                if (current.length > 0) { blocks.push(current); current = [] }
              } else {
                current.push(l)
              }
              if (blocks.length === 2) break
            }
            if (current.length > 0 && blocks.length < 2) blocks.push(current)
            stanzaLineTexts = blocks.slice(0, 2).flat()
          } else {
            const firstBlank = allLines.findIndex(l => l.length === 0)
            stanzaLineTexts = (firstBlank === -1 ? allLines : allLines.slice(0, firstBlank))
              .filter(l => l.length > 0)
          }
        }
        if (stanzaLineTexts.length > 0) {
          stanza1SyllablesPerLine = stanzaLineTexts.map((t, idx) => {
            const override = overridesByLineIdx.get(idx)
            if (override) return [...override]
            return syllabifyForAbc(t).split(/\s+/).filter(Boolean)
          })
          // Some Airtable lyric blocks have MORE lines than the meter expects
          // because Bible-verse line breaks split short metrical lines
          // (Darwall 66 66 88: Airtable has 8 short lines that need to fold
          // into 6 metrical lines [6,6,6,6,8,8]). regroupLinesToMeter folds
          // them via greedy syllable-count fitting.
          const expectedForRegroup = expectedSyllablesByLine(r.meter)
          const regroup = regroupLinesToMeter(stanza1SyllablesPerLine, expectedForRegroup)
          if (regroup.merged) stanza1SyllablesPerLine = regroup.regrouped
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

    // Live count-error computation — two independent flags:
    // melismaError: notes vs syllables (top counts-match check).
    // meterError: stanza-1 syllables vs meter requirements (Stanza-1 panel).
    let melismaError = false
    const totalNotes = countNoteHeads(r.abcNotation!)
    const saved = parseSavedWLines(r.abcNotation!)
    if (saved) {
      const savedTotal =
        saved.underlinedGlobalIndices.length +
        saved.syllablesPerPhrase.reduce((a, l) => a + l.length, 0)
      melismaError = savedTotal !== totalNotes
    } else if (stanza1Syllables.length > 0) {
      // Use the SAME auto-fitted shape the editor uses, so navigator agrees.
      const expectedShape = expectedSyllablesByLine(r.meter)
      const fitted = expectedShape
        ? forceMatchMeterShape(stanza1SyllablesPerLine, expectedShape).fixed
        : stanza1SyllablesPerLine
      const stanzaLen = fitted.reduce((a, l) => a + l.length, 0)
      const lastLineLen = fitted[fitted.length - 1]?.length ?? 0
      melismaError =
        totalNotes !== stanzaLen &&
        !(lastLineLen > 0 && totalNotes === stanzaLen + lastLineLen)
    } else if (totalNotes > 0) {
      // No saved w-lines AND no resolvable stanza-1 lyrics, but the tune has
      // notes. The editor would show "✗ counts don't match" (notes vs 0
      // syllables) — flag here too so the navigator agrees (Agawam).
      melismaError = true
    }

    // meterError: any stanza-1 line whose actual syllable count disagrees with
    // the meter's expected per-line count (repeat-last-line aware via
    // checkAgainstMeter). Tunes with no resolvable lyrics aren't flagged.
    // Mirror the editor's behavior: force-fit per-line counts to meter before
    // flagging. Without this, tunes whose psalm-version lyrics are in a
    // different meter than the tune itself (e.g. Aurelia tune is "76 76 D"
    // but its linked psalm 119 version is CM) would always flag here even
    // though the editor's auto-fix gives a green ✓.
    let meterError = false
    if (stanza1SyllablesPerLine.length > 0) {
      const expectedShape = expectedSyllablesByLine(r.meter)
      const fitted = expectedShape
        ? forceMatchMeterShape(stanza1SyllablesPerLine, expectedShape).fixed
        : stanza1SyllablesPerLine
      const checks = checkAgainstMeter(fitted, r.meter)
      meterError = checks.some((c) => !c.match)
    }

    out.push({
      id: r.id,
      name: r.name,
      meter: r.meter,
      abcNotation: r.abcNotation!,
      abcNotationOcr: r.abcNotationOcr,
      solfegeOcrText: r.solfegeOcrText,
      solfegeSopranoEdited: r.solfegeSopranoEdited,
      phraseShapeOverride: r.phraseShapeOverride ?? null,
      solfegeJpgUrls: findSolfegeJpgs(slugify(r.name)),
      stanza1Syllables,
      stanza1SyllablesPerLine,
      psalmNumber,
      decisionStatus: statusByTune.get(r.id) ?? null,
      lastComment: lastCommentByTune.get(r.id) ?? null,
      melismaError,
      meterError,
    })
  }

  return out
}

export default async function MelismaEditorPage() {
  const tuneRows = await loadTunes()
  return <MelismaEditorClient tunes={tuneRows} />
}
