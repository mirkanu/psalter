/**
 * Local file download helper for tune score sheet JPGs.
 * Downloads from Airtable's temporary signed URL to the psalter_tunes Docker volume.
 * Airtable attachment URLs expire in ~2 hours — NEVER store them in the database.
 * Files are served by Next.js as static assets at /tunes/<filename>.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const TUNES_DIR = process.env.TUNES_DIR ?? './public/tunes'

export function slugifyTuneName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function downloadToLocal(
  sourceUrl: string,
  filename: string,
): Promise<string> {
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to download from ${sourceUrl}: ${response.status} ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  await mkdir(TUNES_DIR, { recursive: true })
  await writeFile(join(TUNES_DIR, filename), Buffer.from(buffer))
  // Return the public path served by Next.js
  return `/tunes/${filename}`
}

export async function downloadTuneScores(
  tuneName: string,
  attachments: Array<{ url: string; filename: string }>,
  type: 'staff' | 'solfege',
): Promise<{ primaryUrl: string | null; additionalUrls: string[] }> {
  if (!attachments || attachments.length === 0) {
    return { primaryUrl: null, additionalUrls: [] }
  }

  const slug = slugifyTuneName(tuneName)
  const urls: string[] = []

  for (let i = 0; i < attachments.length; i++) {
    const ext = attachments[i].filename.split('.').pop() ?? 'jpg'
    const filename = `${slug}-${type}-${i}.${ext}`
    try {
      const url = await downloadToLocal(attachments[i].url, filename)
      urls.push(url)
    } catch (err) {
      console.error(`Failed to download ${filename}:`, err)
      // Continue — partial download is better than aborting the migration
    }
  }

  return {
    primaryUrl: urls[0] ?? null,
    additionalUrls: urls.slice(1),
  }
}
