import fs from 'node:fs'
import path from 'node:path'
import { db } from '@/db'
import { tunes, psalmVersionTunes, psalmVersions } from '@/db/schema'
import { isNotNull, asc, eq } from 'drizzle-orm'
import { syllabifyForAbc } from '@/lib/lyrics'
import { MelismaEditorClient } from './MelismaEditorClient'

export const dynamic = 'force-dynamic'

export interface TuneOption {
  id: number
  name: string
  meter: string | null
  abcNotation: string
  // Resolved from disk via slug match (DB column is often empty).
  solfegeJpgUrls: string[]
  // Stanza-1 fully-flattened syllables (all lines joined) for default alignment.
  stanza1Syllables: string[]
  // Linked psalm number for the side-by-side lyrics preview.
  psalmNumber: number | null
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
    })
    .from(tunes)
    .where(isNotNull(tunes.abcNotation))
    .orderBy(asc(tunes.name))

  const out: TuneOption[] = []
  for (const r of rows) {
    // Resolve stanza-1 syllables (full stanza, all lines joined)
    const pvts = await db
      .select()
      .from(psalmVersionTunes)
      .where(eq(psalmVersionTunes.tuneId, r.id))
    pvts.sort((a, b) => a.psalmVersionId - b.psalmVersionId)

    let stanza1Syllables: string[] = []
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
        let stanzaText: string | null = null
        if (Array.isArray(ls) && Array.isArray(ls[0]?.lines)) {
          const lines = ls[0]!.lines!.map(l => (l?.text ?? '').trim()).filter(t => t.length > 0)
          if (lines.length > 0) stanzaText = lines.join(' ')
        } else if (pvRows[0].lyricsImportedRaw) {
          const allLines = pvRows[0].lyricsImportedRaw
            .split('\n')
            .map(l => l.replace(/^\d+/, '').trim())
          const firstBlank = allLines.findIndex(l => l.length === 0)
          const stanzaLines = (firstBlank === -1 ? allLines : allLines.slice(0, firstBlank))
            .filter(l => l.length > 0)
          if (stanzaLines.length > 0) stanzaText = stanzaLines.join(' ')
        }
        if (stanzaText) {
          stanza1Syllables = syllabifyForAbc(stanzaText).split(/\s+/).filter(Boolean)
        }
        // psalms.id IS the psalm number (1-150) per schema comment
        psalmNumber = pvRows[0].psalmId ?? null
      }
    }

    out.push({
      id: r.id,
      name: r.name,
      meter: r.meter,
      abcNotation: r.abcNotation!,
      solfegeJpgUrls: findSolfegeJpgs(slugify(r.name)),
      stanza1Syllables,
      psalmNumber,
    })
  }

  return out
}

export default async function MelismaEditorPage() {
  const tuneRows = await loadTunes()
  return <MelismaEditorClient tunes={tuneRows} />
}
