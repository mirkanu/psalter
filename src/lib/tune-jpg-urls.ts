/**
 * Derive staff and solfège JPEG URLs from the filesystem.
 *
 * DB columns score_jpg_url / solfege_jpg_url are NULL for all tunes because
 * Airtable attachment URLs expired before migration. The JPEG files DO exist
 * on disk at public/tunes/ using the pattern:
 *   {slug}-staff-0.jpg, {slug}-staff-1.jpg, …
 *   {slug}-solfege-0.jpg, {slug}-solfege-1.jpg, …
 *
 * Slug = tune name lowercased, non-alphanumeric chars → hyphen,
 *        multiple hyphens collapsed, leading/trailing hyphens trimmed.
 *
 * This module is server-only (uses Node.js `fs`).
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { tuneNameToSlug } from './tune-slug'

export { tuneNameToSlug }

/**
 * Process-lifetime memo. public/tunes/*.jpg only changes on deploy (which restarts the process), so
 * caching is safe. Without it, fetchAllTunes()'s per-row derivation costs ~2,750 sync existsSync calls
 * on every /tunes request (force-dynamic, ~172 tunes x 16 probes).
 */
const jpgPageCache = new Map<string, { staffPages: string[]; solfegePages: string[] }>()

/**
 * Return arrays of /tunes/{slug}-staff-{n}.jpg and /tunes/{slug}-solfege-{n}.jpg
 * paths (relative to Next.js public/) that actually exist on disk.
 *
 * @param tuneName  Human-readable tune name (e.g. "Dundee")
 * @param maxPages  How many page indices to probe (default 8)
 */
export function deriveTuneJpgPages(
  tuneName: string,
  maxPages = 8
): { staffPages: string[]; solfegePages: string[] } {
  const cacheKey = `${tuneName}::${maxPages}`
  const cached = jpgPageCache.get(cacheKey)
  if (cached) return cached

  const slug = tuneNameToSlug(tuneName)
  const staffPages: string[] = []
  const solfegePages: string[] = []

  for (let i = 0; i < maxPages; i++) {
    const staffPath = `/tunes/${slug}-staff-${i}.jpg`
    const solfegeP = `/tunes/${slug}-solfege-${i}.jpg`
    if (existsSync(join(process.cwd(), 'public', staffPath))) {
      staffPages.push(staffPath)
    }
    if (existsSync(join(process.cwd(), 'public', solfegeP))) {
      solfegePages.push(solfegeP)
    }
  }

  const result = { staffPages, solfegePages }
  jpgPageCache.set(cacheKey, result)
  return result
}
