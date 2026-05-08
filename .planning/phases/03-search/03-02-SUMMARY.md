---
phase: 03-search
plan: 02
subsystem: database-queries
tags: [fts, postgresql, drizzle-orm, search, explore, taxonomy]
dependency_graph:
  requires: [03-01]
  provides: [search.ts, explore.ts query modules]
  affects: [03-03-search-ui, 03-04-explore-ui, 03-05-meter-filter]
tech_stack:
  added: []
  patterns: [drizzle sql template tag, plainto_tsquery FTS, cache() memoisation, verse join chain]
key_files:
  created:
    - src/db/queries/search.ts
    - src/db/queries/explore.ts
  modified: []
decisions:
  - fetchDistinctAuthors/fetchPsalmsByAuthor use psalms.author (psalmVersions has no author column)
  - psalm_count cast to integer in SQL to satisfy TypeScript number type assertion
  - fetchPsalmDetailsByNavesTopic added as bonus export for /explore/naves/[slug] detail pages
metrics:
  duration: ~5 min
  completed: 2026-05-08T16:55:26Z
  tasks_completed: 2
  files_created: 2
---

# Phase 03 Plan 02: Search and Explore Query Modules Summary

PostgreSQL FTS query module and taxonomy explore query module — pure data-access layer for all search and explore pages.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/db/queries/search.ts — FTS query module | b170ece | src/db/queries/search.ts |
| 2 | Create src/db/queries/explore.ts — taxonomy query module | ff0c943 | src/db/queries/explore.ts |

## What Was Built

### src/db/queries/search.ts
- `fetchSearchResults(query)` — PostgreSQL FTS using `plainto_tsquery` across psalms.kjv_text + psalm_versions.lyrics
- Early return for empty/whitespace queries (no DB call)
- `ts_headline` snippet generation with `<b>` tags, ranked by `ts_rank`
- `SearchResult` interface with id, firstLine, meter, rank, snippet fields
- SQL injection mitigated: `sql` template tag parameterizes `${query}`; `plainto_tsquery` sanitizes tsquery syntax

### src/db/queries/explore.ts
- `fetchTopicsWithCounts` — themes with psalm counts, filters null names
- `fetchNavesTopicsWithCounts` — distinct psalm count via correct join chain (naves_topics → verse_naves_topics → verses)
- `fetchPsalmsByNavesTopic` — returns psalm_ids via verse join, not direct FK
- `fetchPsalmDetailsByNavesTopic` — full psalm rows for detail pages
- `fetchMessianicPsalms` — with classification and firstLine
- `fetchDistinctAuthors` / `fetchPsalmsByAuthor` — uses psalms.author (psalmVersions has no author column)

## Test Results

All 7 integration tests pass:
- `tests/search.test.ts`: 4 tests (empty query, shepherd→Psalm 23, no match, widget nav)
- `tests/explore.test.ts`: 3 tests (topics with psalm_count, verse join chain, non-null names)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Author column is on psalms, not psalmVersions**
- Found during: Task 2 implementation
- Issue: Plan's note flagged this possibility — `psalmVersions` has no `author` column (confirmed in schema.ts)
- Fix: `fetchDistinctAuthors` and `fetchPsalmsByAuthor` query `psalms.author` instead
- Files modified: src/db/queries/explore.ts

**2. [Rule 1 - Bug] psalm_count BigInt vs number type**
- Found during: Task 2 verification
- Issue: PostgreSQL `COUNT()` returns BigInt in Node.js; TypeScript assertion would fail at runtime
- Fix: Added `::integer` cast in SQL: `COUNT(DISTINCT v.psalm_id)::integer AS psalm_count`
- Files modified: src/db/queries/explore.ts

**3. [Rule 2 - Missing] fetchPsalmDetailsByNavesTopic added**
- Found during: Task 2 implementation
- Issue: Plan's action section specified this function for `/explore/naves/[slug]` detail pages; it was in the action code block but not in the exports list in must_haves
- Fix: Included in explore.ts as it's referenced by downstream plan 03-04
- Files modified: src/db/queries/explore.ts

## Security Review (Threat Model)

| Threat ID | Status |
|-----------|--------|
| T-03-03 SQL injection via query param | Mitigated — `sql` template tag parameterizes `${query}`; `plainto_tsquery` sanitizes syntax |
| T-03-04 Information disclosure | Accepted — all psalm content is public domain |

## Known Stubs

None — all functions are fully implemented and tested against live database.

## Self-Check: PASSED

- [x] src/db/queries/search.ts exists and exports fetchSearchResults, SearchResult
- [x] src/db/queries/explore.ts exists and exports all 8 functions
- [x] Commits b170ece and ff0c943 verified in git log
- [x] All 7 tests pass
- [x] TypeScript compiles clean
