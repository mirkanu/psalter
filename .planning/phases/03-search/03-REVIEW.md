---
phase: 03-search
reviewed: 2026-05-08T00:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - tests/search.test.ts
  - tests/explore.test.ts
  - tests/tune-grid.test.ts
  - src/components/ui/input.tsx
  - src/components/ui/skeleton.tsx
  - scripts/migrate-airtable.ts
  - src/db/schema.ts
  - src/db/queries/search.ts
  - src/db/queries/explore.ts
  - src/components/TuneGrid.tsx
  - src/components/SiteHeader.tsx
  - src/app/search/page.tsx
  - src/app/search/loading.tsx
  - src/app/globals.css
  - src/app/explore/page.tsx
  - src/app/explore/loading.tsx
  - src/components/NavesExpand.tsx
  - src/app/explore/topics/[slug]/page.tsx
  - src/app/explore/topics/[slug]/loading.tsx
  - src/app/explore/naves/[slug]/page.tsx
  - src/app/explore/naves/[slug]/loading.tsx
  - src/app/explore/messianic/page.tsx
  - src/app/explore/messianic/loading.tsx
  - src/app/explore/authors/[author]/page.tsx
  - src/app/explore/authors/[author]/loading.tsx
  - src/app/tunes/loading.tsx
  - src/app/tunes/page.tsx
findings:
  critical: 3
  warning: 7
  info: 3
  total: 13
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-05-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

This phase implements full-text search, explore pages (topics, Nave's topics, messianic, authors), the tunes grid, and the Airtable migration script. The implementation is largely solid, but there are three blockers: an XSS vulnerability in the search results page where unescaped database content is injected into the DOM, a slug-collision bug that causes duplicate topic routes to silently 404, and an unchecked `psalms.onConflictDoUpdate` target that can fail at runtime for re-runs. There are also several warnings around missing input sanitisation, duplicate query calls, and a missing `React` import in `skeleton.tsx`.

---

## Critical Issues

### CR-01: XSS via `dangerouslySetInnerHTML` with unsanitised database content

**File:** `src/app/search/page.tsx:79`
**Issue:** The `snippet` field from `fetchSearchResults` is rendered directly via `dangerouslySetInnerHTML`. The snippet is produced by PostgreSQL's `ts_headline`, which wraps matched terms in `<b>` tags. However, the underlying source text (`kjv_text`, `lyrics`) is ingested from Airtable and never sanitised before being stored in the database. If any record contains angle-bracket characters (e.g. `<`, `>`) in its text — common in older Bible typesetting — `ts_headline` will pass those characters through into the snippet, enabling HTML injection. Because this is a server component rendering database content, an attacker who can influence Airtable records can inject arbitrary HTML into every visitor's browser.

**Fix:** Sanitise the snippet before rendering. Since only `<b>` and `</b>` tags are legitimate output from `ts_headline`, strip everything else:

```typescript
// src/db/queries/search.ts — add helper
function sanitiseSnippet(raw: string): string {
  // Allow only the <b> tags that ts_headline produces; escape everything else
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;b&gt;/g, '<b>')
    .replace(/&lt;\/b&gt;/g, '</b>')
}

// Apply in fetchSearchResults before returning:
return (rows as unknown as SearchResult[]).map((r) => ({
  ...r,
  snippet: sanitiseSnippet(r.snippet ?? ''),
}))
```

Alternatively, replace `dangerouslySetInnerHTML` with a parse step that extracts the bold segments and renders them as React children — this eliminates the vector entirely without relying on sanitisation correctness.

---

### CR-02: Topic slug collision causes permanent 404 for duplicate-named topics

**File:** `src/app/explore/topics/[slug]/page.tsx:32` and `src/app/explore/page.tsx:79`

**Issue:** The `/explore/topics/[slug]` route uses a `slugify()` function to map topic names to URL slugs, but it has no collision handling — unlike the Nave's topics route which uses `buildNavesSlugMap` with an `id`-disambiguation suffix. If two topics produce the same slug (e.g. "Prayer" and "Prayer (NT)" both collide on `prayer` after stripping punctuation), `generateStaticParams` will emit two identical `{ slug: 'prayer' }` params, and the page's `topics.find((t) => slugify(t.name) === slug)` will silently match only the first one, making the second topic permanently unreachable.

The `buildNavesSlugMap` pattern already exists in the codebase and solves this correctly. The Topics route does not use it.

**Fix:** Apply the same disambiguation pattern used in the Nave's route:

```typescript
// src/app/explore/topics/[slug]/page.tsx

function buildTopicSlugMap(
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
```

Then use this map in both `generateStaticParams` and the page lookup, mirroring the Nave's page exactly. Also update `src/app/explore/page.tsx` to generate topic link hrefs from the same map, otherwise links on the explore index page point to the wrong slug for the collision case.

---

### CR-03: `onConflictDoUpdate` target is `airtable_id` but psalms PK is `id` — re-run will violate unique constraint

**File:** `scripts/migrate-airtable.ts:163-174`

**Issue:** `migratePsalms` uses `onConflictDoUpdate({ target: schema.psalms.airtableId, ... })` and also sets `id: psalmNum` explicitly. On initial insert this works. On a re-run where the psalm number (the PK) has changed in Airtable (e.g. a data correction), the upsert will find the existing row by `airtable_id` and attempt to update `id` to the new psalm number. Because `id` is the primary key and is referenced by foreign keys in multiple tables (`psalm_versions`, `verses`, `service_items`, etc.), this will throw a `foreign key violation` or `unique constraint violation` at runtime, halting the entire migration without a clear error message pointing to the root cause.

The deeper issue is that `id: sql\`excluded.id\`` in the `set` clause means re-runs can silently attempt to change the PK of a row that has FK dependents.

**Fix:** Remove `id` from the `set` clause of `onConflictDoUpdate`. The `id` (psalm number) should be immutable once written — if it truly needs to change, a manual migration is required. This also prevents the FK cascade failure:

```typescript
.onConflictDoUpdate({
  target: schema.psalms.airtableId,
  set: {
    // Do NOT include id here — PK is immutable once inserted
    book: sql`excluded.book`,
    bibleTitle: sql`excluded.bible_title`,
    haddingtonIntro: sql`excluded.haddington_intro`,
    kjvText: sql`excluded.kjv_text`,
    author: sql`excluded.author`,
  },
})
```

---

## Warnings

### WR-01: Missing `React` import in `skeleton.tsx`

**File:** `src/components/ui/skeleton.tsx:1`
**Issue:** The component uses `React.ComponentProps<"div">` in its function signature but there is no `import React from 'react'` or `import * as React from 'react'` at the top of the file. In a Next.js 15 / React 18+ project this may work if the build toolchain auto-imports React, but it is fragile and will fail in strict compilation contexts or when the file is tested in isolation (e.g. in vitest without a jsdom transform that polyfills the global).
**Fix:**
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"
```

---

### WR-02: Search results deduplicate on psalm `id` but query can return multiple rows per psalm

**File:** `src/db/queries/search.ts:15-36`

**Issue:** The FTS query joins `psalms` with `psalm_versions` via a `LEFT JOIN` but does not aggregate. A psalm with multiple versions (e.g. Psalm 23a, 23b) will produce multiple result rows with the same `p.id` but different `pv.first_line` and `pv.meter`. The calling code in `search/page.tsx` uses `r.id` as the React `key`, so duplicate IDs will trigger a React warning and the display will show the same psalm number multiple times in the results list.

**Fix:** Add `DISTINCT ON (p.id)` or use `GROUP BY` with aggregation to collapse per-psalm, picking the highest-ranked version:

```sql
SELECT DISTINCT ON (p.id)
  p.id,
  pv.first_line AS "firstLine",
  pv.meter,
  ts_rank(...) AS rank,
  ts_headline(...) AS snippet
FROM psalms p
LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
WHERE ...
ORDER BY p.id, rank DESC
```

Then wrap in an outer `ORDER BY rank DESC` via a subquery, or accept that DISTINCT ON results are ranked per-psalm rather than globally.

---

### WR-03: `fetchNavesTopicsWithCounts` called three times per page load in naves detail route

**File:** `src/app/explore/naves/[slug]/page.tsx:41, 47, 60`

**Issue:** `fetchNavesTopicsWithCounts()` is called independently in `generateStaticParams`, `generateMetadata`, and the page component body. At build time this is three separate database round-trips for the same data per slug. The function is not wrapped in React `cache()` (unlike `fetchPsalmsByNavesTopic` and `fetchPsalmDetailsByNavesTopic`), so there is no deduplication.

Same pattern applies to `fetchTopicsWithCounts` in `src/app/explore/topics/[slug]/page.tsx:31, 40`.

**Fix:** Wrap `fetchNavesTopicsWithCounts` and `fetchTopicsWithCounts` in `cache()` from React, matching the pattern already used for `fetchPsalmsByNavesTopic`:

```typescript
// src/db/queries/explore.ts
import { cache } from "react"

export const fetchNavesTopicsWithCounts = cache(async function fetchNavesTopicsWithCounts() {
  // ... existing implementation
})

export const fetchTopicsWithCounts = cache(async function fetchTopicsWithCounts() {
  // ... existing implementation
})
```

---

### WR-04: `fetchPsalmsByTopic` can return duplicate psalm rows when a psalm has multiple versions

**File:** `src/db/queries/explore.ts:28-36`

**Issue:** `fetchPsalmsByTopic` joins `psalms` to `psalm_versions` via `leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))` without any deduplication. A psalm with multiple versifications (23a, 23b) will appear multiple times in the result list on the topic detail page. The page renders them all with `key={p.id}`, causing duplicate React keys.

**Fix:** Add `.groupBy(psalms.id, psalmVersions.firstLine, psalmVersions.meter)` or use a subquery to select only the first/primary version, or add `DISTINCT ON (psalms.id)` equivalent. A simpler fix is to select the minimum psalm version per psalm:

```typescript
export const fetchPsalmsByTopic = cache(async function fetchPsalmsByTopic(topicId: number) {
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (p.id)
      p.id,
      pv.first_line AS "firstLine",
      pv.meter
    FROM psalm_topics pt
    JOIN psalms p ON p.id = pt.psalm_id
    LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
    WHERE pt.topic_id = ${topicId}
    ORDER BY p.id, pv.id
  `)
  return rows as unknown as Array<{ id: number; firstLine: string | null; meter: string | null }>
})
```

The same issue applies to `fetchPsalmsByAuthor` (`src/db/queries/explore.ts:107-113`) and `fetchMessianicPsalms` (`src/db/queries/explore.ts:81-92`).

---

### WR-05: `SiteHeader` active-link heuristic incorrectly highlights `/search` when on `/psalms`

**File:** `src/components/SiteHeader.tsx:15`

**Issue:** `isActive` uses `pathname.startsWith(href)`. The nav link `/psalms` uses `href="/psalms"`. Visiting `/psalms/23` correctly activates "Psalms". However, visiting `/search` also `startsWith('/search')` and activates "Search" — that part is correct. The bug is subtler: the root link `/` would match `startsWith('/')` for every page (since all paths start with `/`), which would make the home logo always appear active if it were in the nav list. More practically, if a future link with prefix overlap is added (e.g. `/tunes` and `/tunes-search`), the first would wrongly activate for the second. This is a latent defect rather than a current crash, but it is a logic error in the active-state predicate.

Additionally, the `aria-label="Primary"` on the `<nav>` should be `aria-label="Primary navigation"` per ARIA best practices; a landmark label of just "Primary" is opaque to screen reader users.

**Fix:**
```typescript
const isActive = (href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)
```

---

### WR-06: `author` URL param used directly after `decodeURIComponent` in DB query — no validation

**File:** `src/app/explore/authors/[author]/page.tsx:26-28`

**Issue:** The `[author]` dynamic segment is decoded with `decodeURIComponent` and passed directly to `fetchPsalmsByAuthor`, which uses a Drizzle `.where(eq(psalms.author, author))` — this is parameterised and safe from SQL injection. However, there is no length or character validation on the decoded author string. A crafted URL with an extremely long author segment (e.g. 10,000 characters) will issue a database query with that string as the parameter, causing unnecessary load. More importantly, the page calls `notFound()` only when `psalms.length === 0`, but if `decodeURIComponent` throws (e.g. for a malformed `%XX` sequence), the page will crash with an unhandled exception rather than returning a 404.

**Fix:** Wrap the decode in a try/catch:
```typescript
let decodedAuthor: string
try {
  decodedAuthor = decodeURIComponent(author)
} catch {
  notFound()
  return // TypeScript flow narrowing
}
```

---

### WR-07: `fetchPsalmDetailsByNavesTopic` can return duplicate psalm rows

**File:** `src/db/queries/explore.ts:66-77`

**Issue:** The query uses `SELECT DISTINCT p.id, pv.first_line, pv.meter` but `DISTINCT` in PostgreSQL applies to the full row, not just `p.id`. If a psalm has multiple `psalm_versions` rows, each with a different `first_line` or `meter`, then `DISTINCT` will return one row per unique `(id, first_line, meter)` combination — resulting in the same psalm appearing multiple times on the Nave's topic detail page with different first lines/meters.

**Fix:** Use `DISTINCT ON (p.id)` to guarantee one row per psalm:
```sql
SELECT DISTINCT ON (p.id)
  p.id,
  pv.first_line AS "firstLine",
  pv.meter
FROM verse_naves_topics vnt
JOIN verses v ON v.id = vnt.verse_id
JOIN psalms p ON p.id = v.psalm_id
LEFT JOIN psalm_versions pv ON pv.psalm_id = p.id
WHERE vnt.naves_topic_id = ${topicId}
ORDER BY p.id, pv.id
```

---

## Info

### IN-01: `tests/search.test.ts` SRCH-01 test is a permanent placeholder that asserts `true`

**File:** `tests/search.test.ts:8`
**Issue:** The test for psalm number navigation is a no-op placeholder (`expect(true).toBe(true)`) with a comment saying to replace it "when widget exposes validatePsalmNumber". This test will always pass and provides zero coverage. If it is left in the suite permanently it masks a gap in coverage.
**Fix:** Either implement the test with the actual validation logic extracted from the widget, or delete the test block until the component is ready. A permanently-passing placeholder is worse than no test.

---

### IN-02: `scripts/migrate-airtable.ts` has no transaction wrapping — partial failures leave DB in inconsistent state

**File:** `scripts/migrate-airtable.ts:547-578`
**Issue:** The migration runs as a long sequence of individual `INSERT`/`UPDATE` statements without a database transaction. If the script fails mid-way (e.g. during junction table population in Pass 2), the database is left in a partially-migrated state. Re-running the script will likely succeed for idempotent upserts, but the absence of a transaction means there is no atomic "all or nothing" guarantee. For a migration that is described as idempotent, this is an acceptable tradeoff, but it should be a documented decision.
**Fix:** At minimum, add a comment documenting why a transaction is intentionally omitted (e.g. "Transactions would time out for large datasets; idempotency is provided by onConflictDoUpdate instead"). If the dataset is small enough, wrapping `main()` body in `await db.transaction(async (tx) => { ... })` would be correct.

---

### IN-03: `TunesPage` wraps `<TuneGrid>` in `<Suspense>` but `TuneGrid` is a pure client component with no async boundary

**File:** `src/app/tunes/page.tsx:24`
**Issue:** The `<Suspense fallback={...}>` wrapping `<TuneGrid tunes={allTunes} />` provides no benefit because `TuneGrid` is a client component that receives all its data synchronously as props. The data is already fetched (`fetchAllTunes()`) before the Suspense boundary is reached. The `<Suspense>` here will never trigger its fallback — the loading state is handled by `tunes/loading.tsx` (the segment-level loading file), which is the correct mechanism.
**Fix:** Remove the redundant `<Suspense>` wrapper:
```tsx
<TuneGrid tunes={allTunes} />
```

---

_Reviewed: 2026-05-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
