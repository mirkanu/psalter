/**
 * Derive staff and solfège JPEG URLs from the R2 CDN.
 *
 * After Plan 17-00 (2026-09-06): all 326 JPGs live in the
 * `psalter-tunes-backup` Cloudflare R2 bucket under flat
 * `{slug}-staff-{n}.jpg` / `{slug}-solfege-{n}.jpg` keys, served
 * via the custom domain `cdn.psalter.gsdlabs.dev`. R2 is the source
 * of truth — we no longer probe the local filesystem. Which pages exist
 * comes from the generated `tune-jpg-manifest.ts`.
 *
 * Slug = tune name lowercased, non-alphanumeric chars → hyphen,
 *        multiple hyphens collapsed, leading/trailing hyphens trimmed.
 *
 * This module is safe to import from anywhere (no Node built-ins).
 */

import { tuneNameToSlug } from './tune-slug'
import { TUNE_JPG_MANIFEST } from './tune-jpg-manifest'

export { tuneNameToSlug }

/** Module-level constant — single source of truth for the JPG base URL. */
const R2_PUBLIC_BASE = 'https://cdn.psalter.gsdlabs.dev'

/**
 * Process-lifetime memo. R2 contents only change on deploy (which
 * restarts the process), so caching is safe.
 */
const jpgPageCache = new Map<string, { staffPages: string[]; solfegePages: string[] }>()

/**
 * Return arrays of https://cdn.psalter.gsdlabs.dev/{slug}-staff-{n}.jpg
 * and ...-solfege-{n}.jpg URLs for the pages that actually exist in R2.
 *
 * Page counts come from the generated manifest, not a filesystem probe —
 * Vercel has no local copy of the JPGs. A tune absent from the manifest
 * has no scans and yields empty arrays.
 */
export function deriveTuneJpgPages(
  tuneName: string,
  maxPages = 8
): { staffPages: string[]; solfegePages: string[] } {
  const cacheKey = `${tuneName}::${maxPages}`
  const cached = jpgPageCache.get(cacheKey)
  if (cached) return cached

  const slug = tuneNameToSlug(tuneName)
  const counts = TUNE_JPG_MANIFEST[slug]
  const staffPages: string[] = []
  const solfegePages: string[] = []

  const staffCount = Math.min(counts?.staff ?? 0, maxPages)
  const solfegeCount = Math.min(counts?.solfege ?? 0, maxPages)

  for (let i = 0; i < staffCount; i++) {
    staffPages.push(`${R2_PUBLIC_BASE}/${slug}-staff-${i}.jpg`)
  }
  for (let i = 0; i < solfegeCount; i++) {
    solfegePages.push(`${R2_PUBLIC_BASE}/${slug}-solfege-${i}.jpg`)
  }

  const result = { staffPages, solfegePages }
  jpgPageCache.set(cacheKey, result)
  return result
}
