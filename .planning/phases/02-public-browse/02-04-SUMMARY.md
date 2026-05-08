---
phase: 02-public-browse
plan: "04"
subsystem: tune-browse
tags: [routes, tune-list, tune-detail, youtube, static-rendering, tdd]
dependency_graph:
  requires: ["02-01", "02-02"]
  provides: ["/tunes listing", "/tunes/[id] detail", "YouTubeEmbed component"]
  affects: ["/psalms/[id] tune chips now resolve", "SiteHeader Tunes link no longer 404s"]
tech_stack:
  added: []
  patterns: ["generateStaticParams SSG", "RSC with iframe sandbox", "Map-based deduplication"]
key_files:
  created:
    - src/app/tunes/page.tsx
    - src/app/tunes/[id]/page.tsx
    - src/components/YouTubeEmbed.tsx
    - tests/tune-detail.test.ts
  modified: []
decisions:
  - "YouTubeEmbed kept as RSC (no 'use client') — no client state required; toEmbedUrl called server-side"
  - "Build shows ● (SSG) for /tunes/[id] — generateStaticParams makes routes statically pre-rendered, equivalent to ○ for known IDs"
  - "soundcloudUrl ignored per RESEARCH.md note: all 27 values are placeholder text ('missing', 'need to upload')"
  - "youtubeUrl field stores both YouTube and other media URLs — non-YouTube URLs rendered as plain links"
metrics:
  duration: "~8 min"
  completed: "2026-05-08T07:04:37Z"
  tasks_completed: 2
  files_created: 4
  files_modified: 0
---

# Phase 02 Plan 04: Tune Browse — /tunes + /tunes/[id] Summary

Implemented the public-facing tune browse experience: alphabetical /tunes listing (172 tunes) and static /tunes/[id] detail pages with score JPG, YouTube embed, external media link, and reverse psalm links. Closes TUNE-01 and PSALM-06.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | /tunes listing page + YouTubeEmbed RSC component | 6d1e8bc | src/app/tunes/page.tsx, src/components/YouTubeEmbed.tsx |
| 2 (RED) | Failing tests for tune detail data shape | 3fd675a | tests/tune-detail.test.ts |
| 2 (GREEN) | /tunes/[id] static detail page | bf466df | src/app/tunes/[id]/page.tsx |

## Decisions Made

1. **YouTubeEmbed as RSC**: No client-side state is required — `toEmbedUrl` runs server-side, iframe is rendered as static HTML. Keeping it RSC avoids unnecessary hydration.

2. **SSG marker**: Build shows `●` (SSG with generateStaticParams) for `/tunes/[id]` rather than `○` (fully static). This is correct and expected — `●` means 172 pages pre-rendered at build time via `generateStaticParams`.

3. **soundcloudUrl ignored**: All 27 `soundcloudUrl` values in DB are placeholder text ("missing", "need to upload") per RESEARCH.md — these are not rendered in Phase 2.

4. **youtubeUrl dual-use**: The `youtubeUrl` schema field stores both YouTube URLs (embedded via `YouTubeEmbed`) and other media URLs (hymnary.org, hymnal.net — rendered as plain links). The `toEmbedUrl` function returns null for non-YouTube URLs, enabling this branching.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit`: clean (0 errors)
- `npm test -- --run tests/tune-detail.test.ts`: 5/5 passed
- `npm run build`: exits 0; 172 `/tunes/[id]` routes pre-rendered as SSG
- `/tunes` listed as `○` (static); `/tunes/[id]` listed as `●` (SSG, 172 paths)
- Tune chips from 02-03 PsalmTabs Lyrics tab now resolve to live pages

## Threat Flags

No new threat surface introduced beyond the plan's threat model. All mitigations from T-02-12 through T-02-16 implemented:
- T-02-12: `generateStaticParams` + `notFound()` bounds URL param
- T-02-13: iframe `sandbox` + `referrerPolicy` applied
- T-02-15: `rel="noopener noreferrer"` on all external links

## Known Stubs

None — score JPGs served from `/tunes/` path stored in `score_jpg_url` DB column. 35 tunes have NULL `score_jpg_url` which correctly renders the "No score available for this tune." empty state.

## Self-Check: PASSED

Files exist:
- /data/home/psalter/src/app/tunes/page.tsx: FOUND
- /data/home/psalter/src/app/tunes/[id]/page.tsx: FOUND
- /data/home/psalter/src/components/YouTubeEmbed.tsx: FOUND
- /data/home/psalter/tests/tune-detail.test.ts: FOUND

Commits exist:
- 6d1e8bc: feat(02-04): add /tunes listing page and YouTubeEmbed component
- 3fd675a: test(02-04): add failing tests for tune detail data shape (TUNE-01)
- bf466df: feat(02-04): add /tunes/[id] static detail page (TUNE-01, PSALM-06)
