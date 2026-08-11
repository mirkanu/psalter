---
phase: 14-launch-polish
plan: 02
subsystem: og-images
tags: [nextjs, opengraph, social-previews, edge-runtime, deviation]

# Dependency graph
requires: []
provides:
  - "Psalm OG image route at src/app/psalms/[id]/opengraph-image.tsx (1200x630 PNG, edge runtime)"
  - "Tune OG image route at src/app/tunes/[slug]/opengraph-image.tsx (1200x630 PNG, nodejs runtime — see deviation)"
  - "Per-URL social preview for /psalms/* and /tunes/*"
affects: [polish, seo, social-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js 15 file-convention opengraph-image.tsx route segment — auto-discovers and wires into metadata.openGraph.images"
    - "next/og ImageResponse with inline JSX (no external CSS) for deterministic 1200x630 PNG rendering"
    - "Title/subtitle JSX with {title} and conditional {subtitle && ...} keeps missing data from layout shifting"
    - "truncate() helper with .trimEnd() before ellipsis to avoid hanging spaces before the single-char ellipsis"
  - "Truncation rule: subtitle clamped to 100 chars with single-char '…' ellipsis per UI-SPEC §2"
  - "Subtitle layering for psalms: bibleTitle > first version's firstLine > empty"

key-files:
  created:
    - src/app/psalms/[id]/opengraph-image.tsx
    - src/app/tunes/[slug]/opengraph-image.tsx
  modified: []

key-decisions:
  - "Dropped unused tuneNameToSlug import in the tune OG file (as the plan directed — keeps lint no-unused-vars happy)"
  - "Switched the tune OG route to runtime = 'nodejs' (deviation, see Deviations) — Node's fs.existsSync and path.join / process.cwd() in @/lib/tune-jpg-urls.ts are transitively imported by @/db/queries/tunes.ts and cannot run on edge runtime. The plan's preferred edge runtime was incompatible with the existing query module graph."
  - "Kept the psalm OG route on runtime = 'edge' as planned — psalm-slugs.ts is a pure module (no fs/path imports) and fetchPsalmDetail does not transitively pull Node-only modules, so edge runtime works cleanly."
  - "Mirror src/app/tunes/[slug]/page.tsx lookup exactly in the OG route: numeric slug -> fetchTuneDetail(Number(slug)), name slug -> fetchTuneBySlug(slug). Same code path = same correctness, including handling of legacy numeric ids that should always have been redirected by middleware."

requirements-completed: [POLISH-01]

# Metrics
duration: 30min
completed: 2026-08-11
---

# Phase 14 Plan 02: OG Image Generation Summary

**Next.js 15 file-convention OG image routes for psalms (edge runtime) and tunes (nodejs runtime — deviation): both 1200x630 PNG via `next/og` `ImageResponse`, reading title/subtitle from the existing query helpers and appending the locked "CPRC Psalter / psalter.gsdlabs.dev" attribution row.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-08-11T13:00:00Z (worktree session start)
- **Completed:** 2026-08-11T13:30:00Z
- **Tasks:** 2 completed
- **Files modified:** 3 (2 created + 1 fix commit amending Task 2)

## Accomplishments

- Created `src/app/psalms/[id]/opengraph-image.tsx` — Next.js 15 file-convention OG image route. 1200x630 PNG via `ImageResponse`, edge runtime. Title: `Psalm {id}` at 72px Geist semibold (fallback `sans-serif`); subtitle: `bibleTitle ? bibleTitle : psalmVersions[0].firstLine` truncated to 100 chars; attribution row: "CPRC Psalter" / "psalter.gsdlabs.dev" at 24px `oklch(0.708 0 0)`. `parseSlug` handles `23`, `55a`, `119-1-8` and slips gracefully to a `?` fallback.
- Created `src/app/tunes/[slug]/opengraph-image.tsx` — Mirror of the psalm route for tunes. Title: `tune.name` (or `"Tune"` fallback). Subtitle: **raw DB `tune.meter` string**, never abbreviated to `"LM"` alone, truncated to 100 chars. Same attribution row. Dropped the unused `tuneNameToSlug` import per the plan's explicit instruction.
- Build verified: `npm run build` (with `DATABASE_URL` set) reports `Compiled successfully`, `Finished TypeScript` with **zero TypeScript errors**, both OG routes listed as `/psalms/-/opengraph-image` and `/tunes/-/opengraph-image`.
- Pushed the worktree branch to origin: `worktree-agent-a31fb9ffc2f59b2d2` is now on `github.com/mirkanu/psalter` (3 commits ahead of base `691e0b0`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create `src/app/psalms/[id]/opengraph-image.tsx`** — `b226e38` (`feat(14-02): psalm page OG image (1200x630, edge runtime)`)
2. **Task 2: Create `src/app/tunes/[slug]/opengraph-image.tsx`** — `7e32491` (`feat(14-02): tune page OG image (1200x630, edge runtime)`)
3. **Auto-fix commit (Rule 3 — blocker): swap tune OG runtime to nodejs** — `72e2e66` (`fix(14-02): tune OG image runtime to nodejs (deviation)`)

**Plan metadata:** committed separately per worktree convention (`SUMMARY.md` only; `STATE.md` / `ROADMAP.md` owned by orchestrator).

## Files Created/Modified

- `src/app/psalms/[id]/opengraph-image.tsx` — NEW. 79 lines. `runtime = "edge"`, `size = { width: 1200, height: 630 }`, `contentType = "image/png"`, `alt = "CPRC Psalter"`. Uses `parseSlug` + `fetchPsalmDetail`. Subtitle layering: `bibleTitle ?? psalmVersions?.[0]?.firstLine`. Truncate to 100 chars.
- `src/app/tunes/[slug]/opengraph-image.tsx` — NEW. 84 lines (post-fix). `runtime = "nodejs"` (deviation), `size = { width: 1200, height: 630 }`, `contentType = "image/png"`, `alt = "CPRC Psalter"`. Mirrors `src/app/tunes/[slug]/page.tsx` lookup with `isNumericTuneSlug` branch. Subtitle = raw `tune.meter`. **Explicitly drops `tuneNameToSlug` import** (lint `no-unused-vars` would have rejected the plan's verbatim snippet).

## Decisions Made

- Followed the plan's verbatim file contents for both routes **except** the `runtime` export on the tune OG (forced to `"nodejs"` to make the build work — see Deviations).
- Kept the `alt = "CPRC Psalter"` constant export on both files, per the plan's notes ("the `alt` export above is the canonical way to set the OG alt text in Next.js 15"). Note: this means the literal string `"CPRC Psalter"` appears twice in each file (once in the `alt` export, once as the bottom-left `<span>CPRC Psalter</span>` attribution). The plan's acceptance criterion that says "appears exactly once as the bottom-left attribution" was satisfied by the `<span>` element on the rendered card; the `alt` export is the canonical Next.js pattern for OG alt text and is required to be the same string.
- Used `truncate(s, 100)` with `.trimEnd()` before appending the single-character ellipsis, so a subtitle that happens to end in whitespace doesn't render as `"<text> …"` with a stray space.
- Did **not** preload Geist for the edge runtime font path — UI-SPEC's 72px Geist semibold directive was explicitly downgraded to `sans-serif` by the plan's note: "Geist is not available in edge runtime by default; using `sans-serif` is the safe default."
- Did not add `generateStaticParams` or `generateImageMetadata` to either route — both are explicitly excluded by the plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Tune OG route runtime forced to `"nodejs"`**
- **Found during:** Task 2 build verification (`npm run build`)
- **Issue:** The verbatim plan snippet set `export const runtime = "edge"` on `src/app/tunes/[slug]/opengraph-image.tsx`. But the file imports `fetchTuneBySlug` / `fetchTuneDetail` from `@/db/queries/tunes`, which **transitively** imports `@/lib/tune-jpg-urls.ts`. That module uses Node's `existsSync` from `'fs'`, `join` from `'path'`, and `process.cwd()`. Turbopack build emitted **4 warnings** ("A Node.js API/Module is loaded which is not supported in the Edge Runtime") on this route — meaning the build succeeded but the route would have failed at request time in production.
- **Fix:** Changed `export const runtime = "edge"` to `export const runtime = "nodejs"` on the tune OG file. This matches the existing project's pattern: `src/middleware.ts` (the only other consumer of `@/db/queries/tunes` with edge constraints) is also `runtime = 'nodejs'` per its own self-documented "MANDATORY" note.
- **Acceptance impact:** The plan's Task 2 `runtime = "edge"` acceptance criterion is no longer met. All other Task 2 acceptance criteria (ImageResponse count, fetchTuneBySlug present, isNumericTuneSlug present, tuneNameToSlug absent, 1200, 630, attribution strings, file size) **still pass**. Build warning count dropped from 5 to 1 (the remaining 1 is unrelated `next.config.ts` NFT trace from `api/dev/test-ocr`).
- **Trade-off:** Tune OG image generation now runs on Node, not edge. Slower cold start. Matches `middleware.ts`. Functional in production.
- **Why not the architectural fix:** A clean architectural fix would refactor `tune-jpg-urls.ts` to be edge-safe or split it so that the slug helpers live in a separate module that `db/queries/tunes.ts` can import without pulling `fs`/`path`. That's a **Rule 4 architectural change** affecting multiple downstream callers (`middleware.ts`, study pages, OCR dev routes) — out of scope per the deviation rules.
- **Files modified:** `src/app/tunes/[slug]/opengraph-image.tsx`
- **Commit:** `72e2e66`

### Architectural decision deferred to a future plan

The root cause — `@/db/queries/tunes` transitively pulling `@/lib/tune-jpg-urls` (Node-only) into every edge-bound consumer — is a pre-existing project-wide issue, not caused by this plan. The middleware has the same warnings and chose `nodejs` runtime for the same reason. A future refactor that splits `tune-jpg-urls.ts` into a pure slug helper + a Node-only filesystem probe would unblock edge runtime for both middleware and tune OG, and clean up the 4 pre-existing warnings. Out of scope here.

### Out-of-scope items noticed (not fixed)

- 1 unrelated pre-existing build warning remains: `next.config.ts` "Encountered unexpected file in NFT list" traced to `api/dev/test-ocr/route.ts`. Pre-existing — not caused by this plan. Logged for future cleanup.

## Issues Encountered

- `npm run build` initially failed with `DATABASE_URL environment variable is not set` because the build runs Next.js's page-data collection which instantiates the DB client at module load. Solution: invoke the build with `DATABASE_URL=postgresql://postgres:psalter_secure_2024@localhost:5435/psalter npm run build`. Connection itself isn't made (DB is down on this worktree), but the env var must be present. No code change required.

## Known Stubs

None.

## Auth Gates

None — no authentication or external service was touched.

## User Setup Required

None — `metadataBase` set in Plan 01 (not yet merged at execution time per prompt context) will resolve the OG image URL to `https://psalter.gsdlabs.dev/...` on next deploy. Plan 14-01 is responsible for that.

## Next Phase Readiness

- POLISH-01 (psalm + tune OG images) is closed on the worktree branch. Plans 14-01 (`metadataBase`) and 14-03 (verification) can run independently against the same base.
- When the orchestrator merges this worktree branch back to `master`, the OG routes will be live at:
  - `https://psalter.gsdlabs.dev/psalms/23` → unfurls a "Psalm 23" card with bibleTitle subtitle
  - `https://psalter.gsdlabs.dev/tunes/crimond` → unfurls a "Crimond" card with the raw meter subtitle
- No blockers for Phase 14 Plan 03 (visual verification of plan-level must-haves).

---

*Phase: 14-launch-polish*
*Completed: 2026-08-11*

## Self-Check: PASSED

- [x] `src/app/psalms/[id]/opengraph-image.tsx` exists — 2258 bytes
- [x] `src/app/tunes/[slug]/opengraph-image.tsx` exists — 2567 bytes (post-fix)
- [x] Commit `b226e38` present in `git log` — `feat(14-02): psalm page OG image (1200x630, edge runtime)`
- [x] Commit `7e32491` present in `git log` — `feat(14-02): tune page OG image (1200x630, edge runtime)`
- [x] Commit `72e2e66` present in `git log` — `fix(14-02): tune OG image runtime to nodejs (deviation)`
- [x] Worktree branch pushed to `origin/worktree-agent-a31fb9ffc2f59b2d2` — confirmed by push output (commit `b226e38..72e2e66` now on remote)
- [x] `npm run build` (with `DATABASE_URL` set) reports `Compiled successfully` and `Finished TypeScript` with zero errors
