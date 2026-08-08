/**
 * Tune name → URL slug. Pure string transform, deliberately kept in its own module with no
 * Node built-ins so it is safe to import from anywhere.
 *
 * Historically this lived in src/lib/tune-jpg-urls.ts alongside deriveTuneJpgPages(), which
 * imports `fs` — importing that module from a 'use client' component fails the build with
 * "Module not found: Can't resolve 'fs'".
 */
export function tuneNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * True when a /tunes/<segment> path segment is a bare legacy numeric tune id, e.g. "169".
 * Strict: rejects whitespace, signs, decimals, exponent forms, and mixed alphanumerics, so the
 * redirect branch can never be entered with anything that isn't a plain integer id.
 */
export function isNumericTuneSlug(slug: string): boolean {
  return /^\d+$/.test(slug)
}
