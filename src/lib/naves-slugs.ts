/**
 * Shared slug utilities for Nave's Topics.
 * Used by both explore/page.tsx and explore/naves/[slug]/page.tsx so that
 * slug generation is always identical between the list and detail routes.
 */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Build a Map<topicId, slug> with disambiguation suffixes appended when
 * two topic names produce the same base slug (e.g. "love" from two different
 * topics would become "love-<id>").
 */
export function buildNavesSlugMap(
  topics: Array<{ id: number; name: string }>
): Map<number, string> {
  const slugCount = new Map<string, number>()
  for (const t of topics) {
    const base = slugify(t.name)
    slugCount.set(base, (slugCount.get(base) ?? 0) + 1)
  }
  const result = new Map<number, string>()
  for (const t of topics) {
    const base = slugify(t.name)
    result.set(t.id, (slugCount.get(base) ?? 1) > 1 ? `${base}-${t.id}` : base)
  }
  return result
}
