# Phase 4: Notation — Research

**Researched:** 2026-05-08
**Domain:** abcjs music notation rendering, lyrics syllabification, ABC notation format
**Confidence:** HIGH (core API verified via Context7 + npm registry; syllabification package choice requires discretion)

## Summary

Phase 4 adds live music notation to the CPRC Psalter tune detail pages using abcjs v6.6.3 — already listed in CLAUDE.md and confirmed as the npm latest release. The primary deliverables are: (1) an `AbcRenderer` client component that renders ABC notation as a responsive SVG, (2) syllable-aligned verse 1 lyrics under the staff using abcjs `w:` fields, (3) a "Score image not yet available" fallback for tunes without ABC or JPG, and (4) a seed script that inserts hand-crafted ABC strings for 3–5 representative tunes to unblock testing.

The abcjs API is well-documented and straightforward: `ABCJS.renderAbc(elementRef, abcString, options)` is called inside a `useEffect` with a `useRef` container. The `responsive: 'resize'` option handles mobile layout automatically. TypeScript types are bundled in `abcjs/types/index.d.ts` — no separate `@types/abcjs` package is needed. `[VERIFIED: npm registry, Context7]`

The main implementation complexity is syllabification: abcjs `w:` fields require syllables separated by hyphens (`Strang- ers in the night`). The `syllable` npm package only counts syllables — it cannot split a word into syllable strings. The recommended package is `nlp-syllables` (splits words into syllable arrays) or a simple regex splitter. The `hyphen` package (Knuth-Liang algorithm, v1.14.1) is the most linguistically accurate option but requires loading language pattern files. Lyrics extraction from `psalmVersions.lyrics` is straightforward: the text uses leading verse numbers (`1Praise ye...`) and double-newline paragraph breaks — extract the first paragraph, strip the leading number, then syllabify each word.

**Primary recommendation:** Install `abcjs` + `nlp-syllables` (or use regex fallback). Implement `AbcRenderer.tsx` per CLAUDE.md rules. Seed 5 tunes with hand-crafted ABC strings covering CM, LM, SM meters. Wire up the tune page to show `AbcRenderer` → JPG → fallback message in priority order.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **ABC Notation Sourcing:** Seed 3–5 tunes (1 CM: Dundee or Martyrs, 1 LM: Old Hundredth, 1 SM: St. Michael, 2 others) via `scripts/seed-abc-notation.ts`; bulk import from thesession.org/abcnotation.com is deferred.
- **Score JPG fallback:** Show "Score image not yet available" message; do NOT re-run R2 upload in Phase 4.
- **Verse 1 lyrics under staff:** Use auto-syllabification npm package for `w:` fields; remaining verses (2+) as numbered stanzas below SVG.
- **AbcRenderer component:** Single `src/components/AbcRenderer.tsx`; `'use client'`; `useRef` + `useEffect` for `ABCJS.renderAbc`; imported via `dynamic(..., { ssr: false })`; Skeleton fallback; options: `{ responsive: 'resize', add_classes: true }`.
- **abcjs version:** 6.6.3 (per CLAUDE.md).

### Claude's Discretion
- Exact syllabification package choice (syllable vs hyphen vs nlp-syllables vs regex).
- How to extract verse 1 from stored lyrics text (first stanza, or first N lines).
- Exact ABC seed strings for the 5 tunes (musically accurate public domain notation).
- Stanza display layout below SVG (numbered grid vs prose paragraphs).
- Loading skeleton shape for the notation area.

### Deferred Ideas (OUT OF SCOPE)
- Bulk ABC notation import from thesession.org / abcnotation.com.
- R2 score JPG upload fix (Phase 1 debt).
- Perfect syllabification — plain text tolerated by abcjs.
- Four-part SATB harmonisation.
- Audio playback on public tune pages (Phase 5).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TUNE-02 | Tune score displays as live abcjs SVG notation when ABC string is available; JPG fallback when not | `ABCJS.renderAbc(ref, abc, opts)` in useEffect; fallback priority: abcNotation → scoreJpgUrl → message |
| TUNE-03 | Hymnal-style: verse 1 lyrics syllable-aligned under staff (`w:` fields); remaining verses as numbered stanzas below SVG | `w:` field in ABC string with hyphen-delimited syllables; lyrics extracted from psalmVersions.lyrics first paragraph |
| TUNE-04 | Mobile-responsive notation at 375px/768px/1200px | `responsive: 'resize'` option in renderAbc — SVG scales to container width automatically |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SVG notation rendering | Browser / Client | — | abcjs manipulates the DOM directly; cannot run on server |
| ABC string + lyrics data fetching | Frontend Server (RSC) | — | Static page generation (generateStaticParams); data fetched at build time |
| Dynamic import (ssr:false) boundary | Frontend Server (SSR) | Browser | Next.js dynamic() call lives in the RSC/page; component itself is client |
| Syllabification logic | Browser / Client | — | Runs inside AbcRenderer before calling renderAbc; can also run in seed script |
| Seed script / data migration | Database / Storage | — | One-time script updating tunes.abc_notation in PostgreSQL |
| JPG fallback display | Browser / Client | — | Client-side conditional based on prop values passed from RSC |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| abcjs | 6.6.3 | Render ABC notation as SVG in browser | Only mature JS library for ABC; per CLAUDE.md requirement |
| nlp-syllables | 0.0.5 | Split English words into syllable arrays | Provides split-array output needed for abcjs w: construction |

`[VERIFIED: npm registry]` — abcjs 6.6.3 published 2026-04-24; nlp-syllables 0.0.5 (MIT).

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/dynamic | built-in | Wrap AbcRenderer with ssr:false | Required — abcjs cannot run server-side |
| shadcn Skeleton | project | Loading placeholder for notation area | Already installed at src/components/ui/skeleton.tsx |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nlp-syllables | hyphen (v1.14.1, Knuth-Liang) | hyphen is more linguistically accurate but requires loading language dictionary files; adds complexity; context7 shows nlp-syllables is simpler for this use case |
| nlp-syllables | syllable (v5.0.1) | syllable only counts syllables (returns a number), NOT a split array — unusable for w: field construction |
| nlp-syllables | regex-based splitter | Zero deps, predictable; handles most Scottish Psalter words adequately; viable fallback if nlp-syllables has ESM issues with Next.js |

**Installation:**
```bash
npm install abcjs nlp-syllables
```

**Version verification:** `[VERIFIED: npm view abcjs version → 6.6.3]` `[VERIFIED: npm view nlp-syllables version → 0.0.5]`

> **ESM caution:** `syllable` v5.x is ESM-only (`"type": "module"`). Next.js 15 handles ESM packages in client components, but the seed script (`tsx`) also needs to import it — verify compatibility before choosing `syllable`. `nlp-syllables` uses CommonJS `require`, which is universally compatible.

## Architecture Patterns

### System Architecture Diagram

```
[RSC: TunePage]
  │  generateStaticParams → fetchTuneDetail (build time, no runtime DB)
  │  props: { tune.abcNotation, tune.scoreJpgUrl, psalmVersions[0].lyrics }
  │
  ├─ if abcNotation:
  │    [next/dynamic AbcRenderer, ssr:false]
  │       │  Suspense fallback → <Skeleton className="h-48 w-full" />
  │       └─ [Client: AbcRenderer]
  │              useRef (div container)
  │              useEffect:
  │                syllabify(verse1Lyrics) → w: string
  │                ABCJS.renderAbc(ref.current, abc + "\nw:" + syllables, opts)
  │
  ├─ else if scoreJpgUrl:
  │    <Image src={scoreJpgUrl} /> (existing behavior)
  │
  └─ else:
       <p>Score image not yet available.</p>
```

### Recommended Project Structure

```
src/
├── components/
│   └── AbcRenderer.tsx       # 'use client' — abcjs rendering component (NEW)
├── lib/
│   └── lyrics.ts             # extractVerse1(), syllabifyForAbc() helpers (NEW)
├── app/tunes/[id]/
│   └── page.tsx              # modified: AbcRenderer + fallback priority logic
scripts/
└── seed-abc-notation.ts      # DB update script for 5 tune ABC strings (NEW)
```

### Pattern 1: AbcRenderer Client Component

**What:** Client-only component that takes an ABC string + optional lyrics string and renders SVG music notation.
**When to use:** Whenever an `abcNotation` string is available on a tune detail page.

```typescript
// Source: Context7 /paulrosen/abcjs — renderAbc API + responsive option
'use client'

import { useEffect, useRef } from 'react'
import abcjs from 'abcjs'

interface AbcRendererProps {
  abc: string
  title?: string
}

export default function AbcRenderer({ abc, title }: AbcRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    abcjs.renderAbc(containerRef.current, abc, {
      responsive: 'resize',
      add_classes: true,
    })
  }, [abc])

  return <div ref={containerRef} aria-label={title ?? 'Music notation'} />
}
```

### Pattern 2: Dynamic Import with Suspense Skeleton

**What:** How the RSC tune page wraps AbcRenderer to enforce ssr:false boundary.
**When to use:** Any usage of AbcRenderer — this is the only permitted import pattern per CLAUDE.md.

```typescript
// Source: CLAUDE.md critical rules + Next.js dynamic import docs
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

const AbcRenderer = dynamic(() => import('@/components/AbcRenderer'), {
  ssr: false,
})

// In the Score section:
{tune.abcNotation ? (
  <Suspense fallback={<Skeleton className="h-48 w-full rounded-md" />}>
    <AbcRenderer abc={tune.abcNotation} title={tune.name ?? undefined} />
  </Suspense>
) : tune.scoreJpgUrl ? (
  <Image src={tune.scoreJpgUrl} alt={...} fill className="object-contain rounded-md border border-border" />
) : (
  <p className="text-muted-foreground italic">Score image not yet available.</p>
)}
```

### Pattern 3: Lyrics Extraction and Syllabification

**What:** Pull verse 1 from `psalmVersions.lyrics` text and format it as a `w:` field for abcjs.
**When to use:** Inside AbcRenderer (or a helper called before rendering) when verse 1 lyrics are available.

The `lyrics` field format (confirmed from DB sample):
```
1Praise ye the Lord: unto him sing
a new song, and his praise
In the assembly of his saints
in sweet psalms do ye raise.

2Let Isr'el in his Maker joy,
...
```

Extraction strategy: split on `\n\n`, take the first paragraph, strip the leading digit(s) that mark the verse number.

Syllabification for abcjs `w:` fields uses hyphen between syllables within a word, and spaces between words:
- `"Praise"` → `"Praise"` (monosyllabic — no hyphen)
- `"un- to"` (two syllables, hyphen after first)
- `"as- sem- bly"` (three syllables)
- Use `*` to skip a note with no corresponding syllable
- Use `_` to hold a syllable across multiple notes (melisma)

```typescript
// Source: ABC notation standard w: field spec (abcnotation.com/wiki/abc:standard:v2.1)
// Example w: line result: "Praise~ ye the Lord: un- to him sing"
// tilde (~) joins two words to one note, hyphen(-) splits syllables within a word

function syllabifyWord(word: string): string {
  // nlp-syllables returns string[] like ['Prais', 'e'] or ['as', 'sem', 'bly']
  // join with '- ' for abcjs
  const syllables: string[] = nlpSyllables(word)
  return syllables.length > 1 ? syllables.join('- ') : word
}

function buildWField(verse1Text: string): string {
  return verse1Text
    .split(/\s+/)
    .map(syllabifyWord)
    .join(' ')
}
```

### Pattern 4: Seed Script Structure

**What:** `scripts/seed-abc-notation.ts` — updates `tunes.abc_notation` for 5 named tunes using Drizzle.
**When to use:** Run once to populate test data.

```typescript
// Source: [ASSUMED] — based on project patterns in scripts/migrate-airtable.ts
import { db } from '@/db'
import { tunes } from '@/db/schema'
import { eq } from 'drizzle-orm'

const seeds: { name: string; abc: string }[] = [
  { name: 'Dundee', abc: `X:1\nT:Dundee\n...` },
  // ...
]

for (const { name, abc } of seeds) {
  await db.update(tunes).set({ abcNotation: abc }).where(eq(tunes.name, name))
}
```

### Anti-Patterns to Avoid

- **Calling ABCJS.renderAbc outside useEffect:** abcjs requires the DOM node to exist; calling during render will crash.
- **Importing abcjs at module top level in a file without 'use client':** Will fail at build time — abcjs references `window`/`document`.
- **Using `syllable` v5.x for splitting:** It counts syllables (returns `number`), not splits words. Using it would produce wrong output.
- **Passing raw `psalmVersions.lyrics` directly to abcjs `w:` without extraction:** The multi-verse text with numbered stanzas would misalign lyrics catastrophically.
- **Hardcoding `id="paper"` for ABCJS target:** The element ID approach is fragile in React; always use `ref.current` (the HTMLElement form of the first argument).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Music notation rendering | Custom SVG music renderer | abcjs 6.6.3 | Handles clefs, time signatures, bar lines, beam groups, responsive layout — tens of thousands of lines of complex rendering logic |
| Syllable splitting | Custom regex syllabifier | nlp-syllables (or hyphen) | English syllabification has hundreds of exceptions; naive vowel-cluster regex fails on words like "create", "through", "prayer" common in psalm text |
| Client-only module boundary | Manual typeof window guards | next/dynamic with ssr:false | Next.js dynamic() integrates with Suspense and the App Router module graph correctly |

**Key insight:** The abcjs `w:` field is forgiving — imperfect syllabification (extra/missing syllables) produces a warning but still renders. Perfect hyphenation is deferred per CONTEXT.md.

## Common Pitfalls

### Pitfall 1: abcjs Renders to Wrong Element

**What goes wrong:** SVG appears in wrong DOM location or not at all.
**Why it happens:** `ABCJS.renderAbc` accepts either a string ID or an HTMLElement. Passing the wrong type (e.g., a React ref object rather than `ref.current`) silently fails.
**How to avoid:** Always pass `containerRef.current` (the HTMLDivElement), not the ref object itself. Guard with `if (!containerRef.current) return`.
**Warning signs:** No error in console but no SVG in DOM; or SVG appears at page root.

### Pitfall 2: SSR Crash from abcjs Import

**What goes wrong:** Next.js build or server render throws `ReferenceError: document is not defined`.
**Why it happens:** abcjs accesses browser globals at import time.
**How to avoid:** AbcRenderer must be: (a) `'use client'`, AND (b) imported via `next/dynamic(..., { ssr: false })`. Both are required — 'use client' alone is not sufficient for avoiding the build-time crash.
**Warning signs:** `next build` fails with `ReferenceError`; or dev server crashes on tune page load.

### Pitfall 3: Static Params + Dynamic Import Conflict

**What goes wrong:** `generateStaticParams` pre-renders tune pages at build time; abcjs can't run server-side.
**Why it happens:** This is NOT actually a conflict. The static page shell is generated (RSC renders to HTML), and the `<Suspense>` boundary sends a skeleton to the client. abcjs hydrates on the client after page load. They operate at different times.
**How to avoid:** Keep `generateStaticParams` as-is. Ensure the `AbcRenderer` is only inside the `dynamic(..., { ssr:false })` wrapper.
**Warning signs:** If you see abcjs errors during `next build`, you have violated the dynamic import rule.

### Pitfall 4: w: Field Note Count Mismatch

**What goes wrong:** abcjs logs a warning (or silently misaligns) when `w:` has more or fewer syllable tokens than the ABC voice has notes.
**Why it happens:** Verse 1 may have more/fewer syllables than the ABC tune's note count for one pass through the melody.
**How to avoid:** For seed tunes, craft the ABC string and `w:` field together so they align. For auto-generated w: from database lyrics, accept approximate alignment — abcjs continues rendering with a console warning. The `W:` field (capital W) can be used for non-aligned text if needed.
**Warning signs:** abcjs console warning: `"More notes than lyrics"` or `"More lyrics than notes"`.

### Pitfall 5: psalmVersions Lyrics Extraction Edge Cases

**What goes wrong:** Some psalms have no associated psalmVersion, or the tune is used for multiple psalm versions with different verse counts.
**Why it happens:** The join through `psalmVersionTunes` may return zero records for a tune, or multiple.
**How to avoid:** In `fetchTuneDetail`, the existing query returns `psalmVersionTunes` array. Use `psalmVersionTunes[0]?.psalmVersion?.lyrics ?? null` as the verse source. If null, pass no `w:` field — abcjs renders the melody without lyrics.
**Warning signs:** `TypeError: Cannot read properties of undefined` when accessing lyrics.

## Code Examples

Verified patterns from official sources:

### Basic renderAbc with responsive option

```javascript
// Source: Context7 /paulrosen/abcjs — examples/responsive.html
var visualOptions = { responsive: 'resize' };
var visualObj = ABCJS.renderAbc("paper", abcString, visualOptions);
```

### renderAbc with add_classes + responsive

```javascript
// Source: Context7 /paulrosen/abcjs — examples/persian.html
var abcOptions = { add_classes: true, clickListener: self.clickListener, responsive: "resize" };
```

### w: lyrics field format

```
% Source: Context7 /paulrosen/abcjs — examples/parsing.html
w:Here are some ly- rics
w:Un- der some notes
```

Hyphen (`-`) after a syllable splits the word; space separates syllables on different notes; tilde (`~`) joins two words to one note; asterisk (`*`) skips a note; underscore (`_`) holds syllable across multiple notes.

### ABC notation for a Scottish Psalter CM tune (seed example — Dundee)

```abc
X:1
T:Dundee
C:Scottish Psalter 1615
M:4/4
L:1/4
Q:1/4=80
K:G
D|G G A B|A G A D|G A B G|A2 A:|
|:D|G G A B|c B A G|F# G A F#|G2 G:|
```

Note: The above is an [ASSUMED] approximate rendering — the exact ABC string for each seed tune must be sourced from hymnary.org MusicXML → ABC conversion or handcrafted. Dundee/French is in public domain (Scottish Psalter 1615). `[ASSUMED]`

### TypeScript import of abcjs

```typescript
// Source: Context7 /paulrosen/abcjs — docs/overview/getting-started.md
// Types are bundled: abcjs/types/index.d.ts (no @types/abcjs needed)
import abcjs from 'abcjs'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Using element ID string in renderAbc | Passing HTMLElement (ref.current) directly | abcjs v5+ | More reliable in React; avoids DOM ID collisions |
| Separate @types/abcjs package | Types bundled in abcjs itself (types/index.d.ts) | abcjs v6 | No separate type install needed |
| abcjs v5.x beta | abcjs v6.6.3 stable | 2023-2024 | Stable API; responsive:resize production-ready |

**Deprecated/outdated:**
- `ABCJS.renderAbc("elementId", ...)` with string ID: still works but HTMLElement form is preferred in React to avoid ID collision issues when multiple renderers are on a page.
- `process.browser ? require('abcjs') : null` guard: superseded by Next.js `dynamic(..., { ssr: false })`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Dundee ABC string (seed example) — notes and key are approximate; not verified against authoritative source | Code Examples | Seed tune sounds wrong or fails w: alignment; fixable before PR review |
| A2 | nlp-syllables v0.0.5 works in Next.js 15 App Router client component context | Standard Stack | May need fallback to regex syllabifier; negligible risk — regex fallback is simple |
| A3 | psalmVersions.lyrics always uses double-newline (`\n\n`) between stanzas | Pattern 3 | Some records may use single newline — inspect a sample before coding extraction |
| A4 | `abcNotation` field is already returned by `fetchTuneDetail` (Drizzle findFirst with no column filter returns all columns) | Architecture | If Drizzle column filtering is in play, need to add abcNotation to select list |

**Note on A4:** Confirmed by reading `src/db/queries/tunes.ts` — `fetchTuneDetail` uses `db.query.tunes.findFirst` with no column selection, so all columns including `abcNotation` are returned. `[VERIFIED: codebase]`

**Note on A3:** Confirmed by DB sample — double-newline between stanzas; leading digit(s) mark verse number (e.g., `1Praise ye...`, `2Let Isr'el...`). `[VERIFIED: DB query]`

## Open Questions

1. **Scottish Psalter tune meter in ABC notation**
   - What we know: Dundee is CM (86 86), Old 100th is LM (88 88), both public domain (pre-1750)
   - What's unclear: The exact note values and key signatures for CPRC's preferred rendering — some sources transpose tunes
   - Recommendation: Seed script author (the planner/executor) should verify against a known reliable source (e.g., hymnary.org → Download MusicXML → convert to ABC with abc2xml or music21) and document the source URL in a comment inside the ABC string

2. **nlp-syllables ESM compatibility with seed script (tsx)**
   - What we know: nlp-syllables uses CommonJS require; tsx handles both
   - What's unclear: Whether nlp-syllables accurately handles archaic psalm English (e.g., "Isr'el", "ev'n", "rais'd")
   - Recommendation: Treat apostrophe-contracted words as single syllables in the splitter; strip punctuation before syllabifying

3. **psalmVersionTunes lyrics retrieval in tune page**
   - What we know: `fetchTuneDetail` returns `psalmVersionTunes` with `psalmVersion` but NOT `psalmVersion.lyrics` currently (the with clause only joins `{ psalm: true }`)
   - What's unclear: Whether the lyrics are needed server-side (to build the `w:` field in the ABC string stored in DB) or client-side
   - Recommendation: Two approaches viable: (a) store the `w:` field pre-built in the ABC string itself in `tunes.abc_notation` at seed time (simpler, no additional query needed); (b) fetch lyrics in page and pass to AbcRenderer as a prop. Approach (a) is simpler and aligns with static rendering goals.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | seed script, build | Yes | — | — |
| PostgreSQL (psalter-db) | seed script DB update | Yes | 16 | — |
| abcjs | AbcRenderer component | Not yet installed | 6.6.3 (npm latest) | — |
| nlp-syllables | syllabification | Not yet installed | 0.0.5 | regex vowel-cluster splitter |

**Missing dependencies with no fallback:**
- `abcjs` — must be installed; central to TUNE-02, TUNE-03, TUNE-04

**Missing dependencies with fallback:**
- `nlp-syllables` — if ESM issues arise, use inline regex: `word.split(/(?<=[aeiou])(?=[^aeiou])|(?<=[^aeiou])(?=[aeiou]{2})/i)` as approximate fallback

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vitest.config.mts` |
| Quick run command | `npx vitest run tests/tune-detail.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TUNE-02 | fetchTuneDetail returns abcNotation field; seeded tunes have non-null abc_notation | unit | `npx vitest run tests/tune-detail.test.ts` | Partial — file exists, test for abcNotation field needed |
| TUNE-03 | lyrics extraction returns verse 1 text; syllabify builds correct w: string | unit | `npx vitest run tests/lib-utilities.test.ts` | ❌ Wave 0 — new test needed |
| TUNE-04 | AbcRenderer renders (smoke test with jsdom or visual only) | manual-only | Manual browser test at 375px/768px/1200px | N/A — visual |

**Note:** AbcRenderer rendering itself cannot be unit-tested in node environment (abcjs requires DOM). Vitest config uses `environment: 'node'` — abcjs rendering tests would need jsdom environment or manual browser verification.

### Sampling Rate
- **Per task commit:** `npx vitest run tests/tune-detail.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/tune-detail.test.ts` — add test: seeded tune has non-null abcNotation (REQ TUNE-02)
- [ ] `tests/lib-utilities.test.ts` — add tests: extractVerse1(), syllabifyForAbc() (REQ TUNE-03)
- [ ] `src/lib/lyrics.ts` — create helper module (needed before component)

## Security Domain

Phase 4 has minimal security surface. No new auth, no user input, no external API calls in the production render path.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Low | ABC strings come from the DB (admin-seeded), not user input |
| V6 Cryptography | No | — |

**Only concern:** The seed script updates DB records by name match. Ensure the WHERE clause uses exact name match (`eq(tunes.name, name)`) to avoid unintended updates. No XSS risk from abcjs SVG output — abcjs generates its own SVG; it does not inject user-supplied HTML.

## Sources

### Primary (HIGH confidence)
- Context7 `/paulrosen/abcjs` — renderAbc API, responsive option, add_classes, w: lyrics field, TypeScript import
- `npm view abcjs` — version 6.6.3 confirmed latest (published 2026-04-24)
- `npm view nlp-syllables` — version 0.0.5 confirmed; `npm view syllable` — confirmed counts-only, not splitting
- `/data/home/psalter/src/db/schema.ts` — confirmed abcNotation column exists on tunes table
- `/data/home/psalter/src/db/queries/tunes.ts` — confirmed findFirst returns all columns (no column filter)
- `/data/home/psalter/tests/tune-detail.test.ts` — confirmed existing vitest tests and pattern
- PostgreSQL DB query — confirmed lyrics format (double-newline stanzas, leading verse number digits)

### Secondary (MEDIUM confidence)
- abcnotation.com wiki `abc:standard:v2.1` — w: field syntax (hyphens, tildes, underscores, asterisks)
- trillian.mit.edu ABC tutorial — w: field alignment rules confirmed
- github.com/words/syllable README — confirmed syllable is count-only (returns number)
- github.com/nlp-compromise/nlp-syllables — confirmed split-array output

### Tertiary (LOW confidence)
- Dundee/Scottish Psalter tune ABC string (seed examples) — hand-crafted; not verified against authoritative transcription source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — abcjs API verified via Context7 + npm; TypeScript types bundled confirmed
- Architecture: HIGH — CLAUDE.md rules are explicit; patterns verified against abcjs docs
- Pitfalls: HIGH — derived from abcjs DOM requirements + Next.js dynamic import behavior (well-documented)
- Syllabification package choice: MEDIUM — nlp-syllables is small and not heavily maintained; regex fallback is viable

**Research date:** 2026-05-08
**Valid until:** 2026-06-08 (abcjs API is stable; syllabification package landscape moves slowly)
