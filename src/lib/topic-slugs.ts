/**
 * Shared slug utilities for psalm Categories (topics table).
 *
 * This module is a thin re-export of `naves-slugs.ts`'s `slugify` and
 * `buildNavesSlugMap`. The two implementations were verified byte-identical
 * to the private copy previously duplicated inside
 * `/explore/topics/[slug]/page.tsx` during planning — delegating here makes
 * drift between them structurally impossible.
 *
 * IMPORTANT: this module and `/explore/topics/[slug]/page.tsx` MUST produce
 * identical slugs for identical topic-name inputs, or every
 * `/explore/topics/{slug}` category link generated elsewhere in the app
 * (e.g. the psalm study page's Overview tab) will 404.
 */
export { slugify } from './naves-slugs'
export { buildNavesSlugMap as buildTopicSlugMap } from './naves-slugs'
