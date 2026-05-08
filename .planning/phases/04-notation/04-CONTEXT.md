---
phase: 4
name: Notation
status: ready
gathered: 2026-05-08
---

# Phase 4: Notation — Context

**Gathered:** 2026-05-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Tune pages display live abcjs SVG notation with verse 1 lyrics syllable-aligned under the staff; remaining verses appear as numbered stanzas; JPG fallback shown when no ABC string exists.

**Requirements in scope:** TUNE-02, TUNE-03, TUNE-04
**Depends on:** Phase 2 (tune detail pages exist at `/tunes/[id]`)

### Current state (discovered during discuss)
- `tunes.abc_notation` column exists in schema — NULL for all 172 tunes (sourcing needed)
- `tunes.score_jpg_url` — NULL for all 172 tunes (SKIP_IMAGES=1 during Phase 1 migration, disk constraint)
- abcjs NOT yet installed in node_modules (CLAUDE.md lists version 6.6.3)
- Tune detail page at `src/app/tunes/[id]/page.tsx` — currently shows Score JPG section or "No score available"
- Static rendering via `generateStaticParams` — tune pages pre-rendered at build time
- Page is an RSC; abcjs requires client-side rendering (dynamic import, ssr: false per CLAUDE.md)

</domain>

<decisions>
## Implementation Decisions

### ABC Notation Sourcing
Seed 3–5 representative tunes with hand-crafted ABC strings:
- 1 Common Meter (CM) tune — e.g., Dundee or Martyrs
- 1 Long Meter (LM) tune — e.g., Old Hundredth
- 1 Short Meter (SM) tune — e.g., St. Michael
- 2 other representative tunes
These seed strings are inserted via a migration script (`scripts/seed-abc-notation.ts`) that updates `tunes.abc_notation` where the tune name matches. This unblocks component development and verification. Bulk ABC sourcing from public domain libraries (thesession.org, abcnotation.com) is future/editorial work outside Phase 4 scope.

### Score JPG Fallback
Show "Score image not yet available" contextual message for tunes with neither ABC nor JPG. Do NOT re-run R2 upload in Phase 4 — that is Phase 1 debt to fix when disk is available. The fallback state is therefore the normal state for most tunes.

### Verse 1 Lyrics Under Staff
Use an auto-syllabification npm package to split verse 1 lyrics before passing to abcjs `w:` fields. Candidate: `syllable` (MIT, no native deps) or `hyphen` (Knuth-Liang algorithm). Claude's discretion on which package to use. Remaining verses (2+) display as numbered stanzas below the SVG, pulled from the verse text in `psalmVersions.lyrics` (split by double-newline or numbered stanza markers).

### AbcRenderer Component Architecture
Single `src/components/AbcRenderer.tsx` client component:
- `'use client'`
- Accepts `{ abc: string; title?: string }` props
- Uses `useRef` container and `useEffect` to call `ABCJS.renderAbc`
- Imported in tune page via `dynamic(() => import('@/components/AbcRenderer'), { ssr: false })`
- Skeleton fallback during load (shadcn Skeleton)
- abcjs options: `{ responsive: 'resize' }` for mobile-responsive layout (TUNE-04)

### Claude's Discretion
- Exact syllabification package choice (syllable vs hyphen vs similar)
- How to extract verse 1 from stored lyrics text (first stanza, or first N lines)
- Exact ABC seed strings for the 5 tunes (use musically accurate public domain notation)
- Stanza display layout below SVG (numbered grid vs prose paragraphs)
- Loading skeleton shape for the notation area

</decisions>

<code_context>
## Existing Code Insights

### Integration Point — Tune Detail Page
- `src/app/tunes/[id]/page.tsx` — RSC, uses `fetchTuneDetail` from `@/db/queries/tunes`
- Currently renders a `Score` section: if `tune.scoreJpgUrl` → `<Image>`, else `<p>No score available</p>`
- Phase 4 replaces this section: if `tune.abcNotation` → `<AbcRenderer>`, else if `tune.scoreJpgUrl` → `<Image>`, else → "Score image not yet available"
- Static params via `generateStaticParams` — will still work (static pages embed the notation data)

### Query Layer
- `src/db/queries/tunes.ts` — `fetchTuneDetail` returns full tune with `psalmVersionTunes` (psalm → psalmVersion)
- Need to also return `abc_notation` field (check if already included — Drizzle `findFirst` with no column filter returns all columns)
- Need verse 1 lyrics: must join to `psalmVersions` through `psalmVersionTunes` to get lyrics text

### Schema
- `tunes.abc_notation: text('abc_notation')` — already present
- `tunes.score_jpg_url: text('score_jpg_url')` — already present
- `psalmVersions` has `lyrics` field — raw metrical text (need to extract verse 1)

### Existing Components
- `src/components/ui/skeleton.tsx` — shadcn Skeleton (use for AbcRenderer loading state)
- Pattern for dynamic imports: CLAUDE.md specifies exactly this pattern for abcjs

### Stack
- abcjs 6.6.3 (per CLAUDE.md) — must install
- `tw-animate-css` (not tailwindcss-animate) for animations

</code_context>

<specifics>
## Specific Ideas

- Seed script: `scripts/seed-abc-notation.ts` — updates 3–5 tunes by name with ABC strings
- AbcRenderer options to pass: `{ responsive: 'resize', add_classes: true }`
- Lyrics extraction: split `psalmVersion.lyrics` on `\n\n` or numbered stanza pattern; take first chunk as verse 1
- Below SVG: numbered stanza list (verse 1 under notation, verses 2+ as plain stanzas)
- Consider extracting lyrics from the tune's associated psalm version(s) — a tune may be used by multiple psalm versions; use the primary/first one

</specifics>

<deferred>
## Deferred Ideas

- Bulk ABC notation import from thesession.org / abcnotation.com (editorial/research work)
- R2 score JPG upload fix (Phase 1 debt, disk constraint)
- Perfect syllabification (hyphenation per word) — deferred, plain text tolerated by abcjs
- Four-part SATB harmonisation (explicitly out of scope per PROJECT.md)
- Audio playback on public tune pages (scoped to precentor portal in Phase 5)

</deferred>
