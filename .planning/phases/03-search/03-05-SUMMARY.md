---
phase: 03-search
plan: "05"
subsystem: explore-taxonomy
tags: [explore, taxonomy, static-rendering, topics, naves, messianic, authors]
dependency_graph:
  requires: [03-02, 03-03]
  provides: [explore-hub, explore-sub-routes]
  affects: [site-navigation]
tech_stack:
  added: []
  patterns: [generateStaticParams, slug-collision-handling, url-encode-author, client-expand-toggle]
key_files:
  created:
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
  modified: []
decisions:
  - buildNavesSlugMap appends topic ID to base slug only on collision (verified: only mercy-seat-269 vs mercy-seat-477 collide)
  - NavesExpand extracted to src/components/NavesExpand.tsx to keep /explore/page.tsx as RSC
  - slugify defined inline in each file (5-line utility, acceptable duplication)
  - Authors section conditional on >= 2 distinct authors per UI-SPEC
metrics:
  duration_minutes: 10
  completed_date: "2026-05-08"
  tasks_completed: 2
  files_created: 11
  files_modified: 0
---

# Phase 03 Plan 05: Explore Taxonomy Hub Summary

One-liner: Static /explore hub with 4 taxonomy sections (Topics, Nave's, Messianic, Authors) and 4 statically-pre-rendered sub-route families with collision-safe Nave's slugs.

## What Was Built

### Task 1: /explore hub page and loading skeleton

- `src/app/explore/page.tsx` — Static RSC hub. Fetches all taxonomy counts in parallel via `Promise.all`. Renders 4 sections: Topics grid, Nave's Topics (via NavesExpand), Messianic single-card link, Authors grid. Authors section only renders if >= 2 distinct authors exist.
- `src/components/NavesExpand.tsx` — `'use client'` component receiving the full Nave's topics array. Renders top 24 by default with a toggle button ("View all N topics" / "Show fewer") to expand the rest.
- `src/app/explore/loading.tsx` — Skeleton with 4 animate-pulse section placeholders.

### Task 2: All explore sub-route pages with generateStaticParams and loading skeletons

- `src/app/explore/topics/[slug]/page.tsx` — Static slug lookup against `fetchTopicsWithCounts()` array; notFound() if no match; `fetchPsalmsByTopic` for psalm list.
- `src/app/explore/naves/[slug]/page.tsx` — `buildNavesSlugMap` collision handling (appends ID suffix for colliding slugs); `fetchPsalmDetailsByNavesTopic` for the verse join chain query.
- `src/app/explore/messianic/page.tsx` — Single static page; `fetchMessianicPsalms` with classification subtitle under each psalm first line.
- `src/app/explore/authors/[author]/page.tsx` — `encodeURIComponent` in `generateStaticParams`; `decodeURIComponent` in page to recover author string; `fetchPsalmsByAuthor` with notFound() if empty.
- 4 loading skeletons with breadcrumb + title + 5 psalm row placeholders.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` — exits 0 (TypeScript clean)
- `npx vitest run tests/explore.test.ts` — 3/3 tests green
- All 11 files created and confirmed present

## Security / Threat Model

Per plan threat register:
- T-03-10: Slug injection mitigated — [slug] used only to filter in-memory pre-fetched topics array, not interpolated into SQL
- T-03-11: Author injection mitigated — `decodeURIComponent(author)` passed to Drizzle `eq()` parameterized query; `notFound()` if empty
- T-03-12: No PII exposure — all taxonomy data is public domain

## Known Stubs

None.

## Self-Check: PASSED

Files confirmed present:
- src/app/explore/page.tsx — FOUND
- src/app/explore/loading.tsx — FOUND
- src/components/NavesExpand.tsx — FOUND
- src/app/explore/topics/[slug]/page.tsx — FOUND
- src/app/explore/naves/[slug]/page.tsx — FOUND
- src/app/explore/messianic/page.tsx — FOUND
- src/app/explore/authors/[author]/page.tsx — FOUND

Commits confirmed:
- 0f50be8 feat(03-05): build /explore hub page and loading skeleton
- 67cf603 feat(03-05): build explore sub-route pages with generateStaticParams and loading skeletons
