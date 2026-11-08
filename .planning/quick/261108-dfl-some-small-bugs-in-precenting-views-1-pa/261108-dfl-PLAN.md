---
phase: 261108-dfl-some-small-bugs-in-precenting-views
plan: "dfl"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/parse-psalm-list.ts
  - src/lib/parse-psalm-list.test.ts (NEW)
  - src/components/PsalmListingGrid.tsx
  - src/db/queries/psalms.ts
  - src/app/precent/[id]/page.tsx
  - src/app/precent/[id]/sing/[pos]/page.tsx
  - next.config.ts
  - src/middleware.ts
  - src/app/api/precent/[id]/items/route.ts
  - src/components/precent/PrecentingBar.tsx
  - src/components/precent/PrecentingBar.test.tsx (NEW)
autonomous: true
requirements: []
must_haves:
  truths:
    - "Pasting a bare number for a multi-version psalm (e.g. 50, 45) resolves to the RECOMMENDED versification instead of being reported as 'not found' and silently dropped."
    - "The resolved versification is recorded on the set item (psalmVersionId), so the sing view renders that exact version rather than the lowest-id fallback."
    - "A psalm added to an existing set immediately appears in the item list, raises the 'pos / total' counter, and is reachable with the Next arrow."
    - "The two precenting set routes are served dynamically - no build-time enumeration, no year-long Cache-Control, no stale edge copy."
  artifacts:
    - path: "src/lib/parse-psalm-list.ts"
      provides: "Version-aware psalm-list resolver (recommended version, psalm-119 stanza, parenthetical 'b' version matched by label)"
      exports: ["parsePsalmList", "nextSunday"]
    - path: "src/lib/parse-psalm-list.test.ts"
      provides: "Unit tests for the resolver (new file)"
    - path: "src/components/PsalmListingGrid.tsx"
      provides: "PsalmRow.isRecommended flag"
    - path: "src/db/queries/psalms.ts"
      provides: "fetchPsalmListRows populating isRecommended from psalm_versions.psalter_number"
    - path: "src/app/precent/[id]/page.tsx"
      provides: "Dynamic precenting set detail route (force-dynamic, no generateStaticParams)"
    - path: "src/app/precent/[id]/sing/[pos]/page.tsx"
      provides: "Dynamic precenting sing route (force-dynamic, no generateStaticParams)"
    - path: "next.config.ts"
      provides: "headers() with both precent cache entries removed"
  key_links:
    - from: "src/db/queries/psalms.ts"
      to: "src/lib/parse-psalm-list.ts"
      via: "PsalmRow.isRecommended read by the resolver"
      pattern: "isRecommended"
    - from: "src/lib/parse-psalm-list.ts"
      to: "src/components/precent/PastePsalmsDialog.tsx"
      via: "ParsedPsalmEntry.psalmVersionId forwarded to POST /api/precent/[id]/items"
      pattern: "psalmVersionId"
    - from: "src/app/precent/[id]/sing/[pos]/page.tsx"
      to: "set_items"
      via: "raw untagged Drizzle query re-read on every request under force-dynamic"
      pattern: "force-dynamic"
---

<objective>
Fix two small bugs in the precenting views.

**Bug 1 — a pasted psalm number is not recognised when the psalm has two versifications.**
Pasting `50` into the "Paste Psalm List" dialog (or into the New Set form) shows
"— not found" and the psalm is silently dropped, because the resolver only matches
the bare number against `displayLabel`, and a multi-version psalm's labels are
`50a*` / `50b` — never `50`. 13 psalms are affected (6, 25, 45, 50, 67, 70, 100,
102, 124, 136, 143, 145, 148). Fix: a pasted bare number must resolve to the
**recommended** versification, and that version must be recorded on the set item
(`psalmVersionId`) so the sing view renders that exact versification instead of
guessing.

**Bug 2 — a psalm added to an existing set cannot be reached in the precenting view.**
The two set routes are `force-static` with `generateStaticParams`, pinned by a
one-year `Cache-Control` header and by a Cloudflare edge-cache rule. A set
created today with 3 psalms and later extended to 4 keeps serving the 3-item
HTML, so the 4th psalm is unreachable (counter reads "3 / 3", no Next arrow).
Fix: precenting sets are per-user mutable data — serve both set routes
dynamically so they always reflect the current set contents.

Both fixes are independent: Task 1 is pure parser logic, Task 2 is route
configuration. They touch disjoint files and can be committed separately.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@AGENTS.md
@src/lib/parse-psalm-list.ts
@src/components/PsalmListingGrid.tsx

<!-- Facts verified against the code and the live DB on 2026-11-08. Do not re-derive; just implement. -->

## Bug 1 — verified facts

- `src/lib/parse-psalm-list.ts:48-53` (non-parenthetical branch) resolves a bare
  number only via `displayLabel === numStr` then `displayLabel.startsWith(numStr + ':')`.
  A multi-version psalm's `displayLabel` is `50a*` / `50b` — never `50` — so the
  lookup yields `null`.
- `src/lib/psalm-slugs.ts:47-66` (`deriveVersionSlug`) builds the label: it returns
  `String(psalmId)` for a single-version psalm, `119-<range>` for a psalm-119
  stanza, and `${psalmId}${a|b}${*}` for a First/Second pair. The `*` is present
  exactly when `psalterNumber` contains the word `Recommended`.
- **"Recommended" exists ONLY as free text inside `psalm_versions.psalter_number`.**
  There is no `is_recommended` column. Live values (verified against the DB):
  - recommended = FIRST version: `6a*` (id 144), `25a*` (130), `50a*` (20), `67a*` (98),
    `70a*` (91), `100a*` (25), `136a*` (181)
  - recommended = SECOND version: `45b*` (160), `102b*` (17), `124b*` (138),
    `143b*` (101), `145b*` (76), `148b*` (85)
  → "first row wins" is NOT a valid substitute for "recommended wins".
- Psalm 119 has **22** stanza rows (`119:1-8 (1)` … `119:169-176 (22)`), none
  marked recommended. The current resolver binds every `119:*` paste to `119:1-8`
  because `startsWith('119:')` matches the first row in array order.
- `src/components/precent/PastePsalmsDialog.tsx:29` and
  `src/components/precent/CreateSetForm.tsx:57` filter on `entry.psalm !== null`,
  so an unresolved entry is dropped from the batch without any error.
- Both consumers already forward `entry.psalmVersionId` to
  `POST /api/precent/[id]/items` (`PastePsalmsDialog.tsx:36`,
  `CreateSetForm.tsx:91`) and the API accepts it (`src/app/api/precent/[id]/items/route.ts:43-47`).
  **No change is needed in either consumer.**
- `src/app/precent/[id]/sing/[pos]/page.tsx:70-72` picks the sung version as
  `item.psalmVersionId ? sortedVersions.find(v => v.id === item.psalmVersionId) ?? sortedVersions[0] : sortedVersions[0]`.
  With `psalmVersionId` null it falls back to `sortedVersions[0]` = **lowest id** —
  which is the WRONG (non-recommended) version for 45/102/124/143/145/148.
- `src/app/precent/[id]/page.tsx:67-89` has the same lowest-id fallback for the
  "Historically sung" tune-tier lookup (legacy items with a null `psalmVersionId`).
  Recording the version at paste time fixes this for every NEW item.
- `PsalmRow` (`src/components/PsalmListingGrid.tsx:13-22`) has no `isRecommended`
  field. `fetchPsalmListRows` (`src/db/queries/psalms.ts:123-186`) already SELECTs
  `psalterNumber` (line 130) but does not expose it on the row.

## Bug 2 — verified facts

- `src/app/precent/[id]/page.tsx:1-2` → `export const dynamic = 'force-static'`
  and `export const revalidate = false`; `generateStaticParams` (lines 17-25)
  enumerates set ids at BUILD time.
- `src/app/precent/[id]/sing/[pos]/page.tsx:1-2` → same; `generateStaticParams`
  (lines 28-46) enumerates `(setId, pos)` pairs from the item COUNT at build time.
- `next.config.ts:61-68` sets `Cache-Control: public, s-maxage=31536000,
  stale-while-revalidate=604800` on `/precent/:id(\d+)` and
  `/precent/:id(\d+)/sing/:pos(\d+)`. Note `/precent/:id(\d+)` matches a single
  path segment only, so `/precent/50/sing/1` is covered by the second entry.
- Cloudflare cache rule `e6a916ba9f5244bda0815cffd1e02c86` (zone
  `6c322a054d869df9450e4c99e8d4d4a8`, ruleset `d8c78a9291dd40b38f9a3523e5bd6bcc`)
  matches `http.host eq "psalter.gsdlabs.dev" and http.request.uri.path contains
  "/precent/" and http.request.uri.path contains "/sing/"` with `cache: true`,
  `edge_ttl: 31536000`, `browser_ttl: 31536000` (mode `override_origin`).
  **That rule covers the `/sing/` family ONLY — the ruleset contains NO rule for
  the `/precent/:id` detail page.** The detail page was pinned by
  `next.config.ts` + `force-static` alone.
- Live proof (2026-11-08, `curl -sI https://psalter.gsdlabs.dev/precent/50/sing/1`):
  `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`,
  `cache-control: public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800`,
  `cf-cache-status: HIT`.
- The set query itself is **raw untagged Drizzle** (`db.query.precentingSets.findFirst`),
  so the `revalidateTag(PRECENT_CACHE_TAG, "max")` calls in the `/api/precent/**`
  mutation routes (which only tag the *tune* caches in `src/db/queries/tunes.ts`)
  have zero effect on these routes. `router.refresh()` in `SetDetail.tsx` cannot
  help a `force-static` route either.
- `src/middleware.ts` deliberately de-auth-gates `/precent/<id>` and
  `/precent/<id>/sing/<pos>` (Phase 19 carve-out) — so `curl` without a cookie
  works and the orchestrator's post-deploy check needs no session cookie.
- `set_items.position` is 0-based for some sets (set 50 uses 0,1,2,3) and 1-based
  for others (set 49 uses 1,2,3,4). The sing route treats the URL `pos` as a
  1-based INDEX into the position-ordered array (`parseInt(pos) - 1` →
  `set.setItems[position]`), which is correct. **Do not change this.**

## Repo conventions

- Unit tests live next to the source as `src/**/*.test.ts` (vitest include
  pattern: `tests/**`, `src/**`, `scripts/**`). Run with `npx vitest run <path>`.
- `npx tsc --noEmit` currently reports **78 pre-existing errors** (17 under
  `src/`, all in unrelated `*.test.ts(x)` files: `src/app/api/changelog/**`,
  `src/components/singing/GearPopover.points-2-3.test.tsx`,
  `src/db/queries/daily.test.ts`, `src/lib/changelog-broadcast.test.ts`; the rest
  under `tests/`). The repo does NOT currently type-check clean. The gate is
  therefore **"no NEW errors in the files this task touches"**, not "0 errors".
- `npx eslint <files>` is clean on every file this task touches.
- `npm run build` works on this box (~2 min, `experimental.cpus: 1`).
  `prebuild` runs `scripts/check-airtable-pat.sh` + `scripts/capture-deploy-info.ts`;
  the latter reads HEAD at build start, so COMMIT BEFORE BUILDING.
- The app runs under PM2 as `psalter` → `scripts/start-with-db-wait.sh` →
  `npm run start -- --port 3005`, DB on `localhost:5435`.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Resolve pasted multi-version psalms to the RECOMMENDED versification</name>
  <files>
    src/components/PsalmListingGrid.tsx,
    src/db/queries/psalms.ts,
    src/lib/parse-psalm-list.ts,
    src/lib/parse-psalm-list.test.ts (NEW)
  </files>
  <behavior>
    - Paste `50` (psalm 50 has versions `50a*` id 20 and `50b` id 173) → resolves
      to displayLabel `50a*`, `psalmVersionId` 20.
    - Paste `45` (versions `45a` id 29 and `45b*` id 160) → resolves to
      displayLabel `45b*`, `psalmVersionId` 160 — NOT the first row.
    - Paste `23` (single version) → displayLabel `23`, `psalmVersionId` null.
    - Paste `23:1-6` → psalm `23`, `verseRange` `1-6`, `psalmVersionId` null.
    - Paste `119:9-16` → displayLabel `119:9-16` (that exact stanza), `psalmVersionId` 150.
    - Paste `119` → displayLabel `119:1-8` (first stanza), `psalmVersionId` 84.
    - Paste `50 (AOTS)` → displayLabel `50b` (matched by LABEL, not array position).
    - Paste `119 (AOTS)` → displayLabel `119:1-8` — the old array-position logic
      would have returned the arbitrary 2nd stanza `119:9-16`.
    - Paste a psalm with no rows → `psalm` null, entry still returned.
  </behavior>
  <action>
Three source edits plus one new test file. Write the test file FIRST (RED), then
implement (GREEN).

**(a) `src/components/PsalmListingGrid.tsx` — add the flag to `PsalmRow` (lines 13-22).**
Append one OPTIONAL field to the interface (optional, not required: four existing
test files under `src/` build `PsalmRow` object literals — `PsalmNav.test.tsx`,
`PsalmPickerModalClient.test.tsx`, `PsalmListingGrid.test.tsx`,
`PsalmListingGridClient.test.tsx` — and a required field would add NEW
`tsc --noEmit` errors to this repo, which is not clean to begin with):

```ts
export interface PsalmRow {
  id: number
  versionId: number | null
  displayLabel: string
  slug: string
  firstLine: string | null
  meter: string | null
  kjvExcerpt: string | null
  recommendedTune?: string | null
  /**
   * True when this row is the RECOMMENDED versification of a multi-version
   * psalm. There is no `is_recommended` column — the marker lives only in
   * `psalm_versions.psalter_number` free text ("50 (First Version, Recommended)"),
   * the same source of truth `deriveVersionSlug` uses for the `*` in displayLabel.
   * Optional so existing PsalmRow literals keep type-checking.
   */
  isRecommended?: boolean
}
```

**(b) `src/db/queries/psalms.ts` — populate the flag in `fetchPsalmListRows`.**
`psalterNumber` is already selected (line 130). Add one field to the object
returned by `sorted.map(...)` (lines 171-185), after `recommendedTune`:

```ts
      recommendedTune: row.recommendedTune,
      // "Recommended" lives only in psalm_versions.psalter_number free text
      // ("50 (First Version, Recommended)") — there is no is_recommended column.
      isRecommended: row.psalterNumber?.includes('Recommended') ?? false,
```

Do NOT change the query, the sort, or `displayLabel`/`slug` derivation.

**(c) `src/lib/parse-psalm-list.ts` — rewrite the resolver.**
Keep the exported interface and `nextSunday()` exactly as they are, but update
the `psalmVersionId` doc comment and replace the body of `parsePsalmList`
(lines 18-58) with:

```ts
export function parsePsalmList(input: string, psalms: PsalmRow[]): ParsedPsalmEntry[] {
  const results: ParsedPsalmEntry[] = []
  // Match: optional whitespace, psalm number, optional ":verses", optional "(anything)"
  const regex = /\b(\d{1,3})(?::([0-9]+(?:-[0-9]+)?))?(?:\s*\(([^)]+)\))?/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    const psalmNum = parseInt(match[1], 10)
    if (psalmNum < 1 || psalmNum > 150) continue
    const verseRange = match[2] ?? null
    const parenthetical = match[3] ?? null   // e.g. "AOTS", "Second Version"
    const numStr = String(psalmNum)

    // All rows for this psalm number. A First/Second pair has 2 rows ("50a*"/"50b");
    // psalm 119 has 22 stanza rows ("119:1-8" … "119:169-176").
    const allForPsalm = psalms.filter((r) => r.id === psalmNum)
    const isMultiVersion = allForPsalm.length > 1

    let psalm: PsalmRow | null = null

    if (parenthetical) {
      // "(AOTS)" / "Second Version" → the "b" version, matched by LABEL, never by
      // array position (for psalm 119, array position [1] is an arbitrary stanza).
      psalm =
        allForPsalm.find((r) => r.displayLabel.startsWith(numStr + 'b')) ??
        allForPsalm.find((r) => r.isRecommended === true) ??
        allForPsalm[0] ??
        null
    } else {
      // 1. exact single-version label ("23")
      // 2. exact psalm-119 stanza ("119:9-16") when a verse range was pasted
      // 3. RECOMMENDED version of a multi-version psalm ("50" → "50a*")
      // 4. any psalm-119 stanza, i.e. the first one (fallback for an unranged "119")
      psalm =
        allForPsalm.find((r) => r.displayLabel === numStr) ??
        (verseRange
          ? allForPsalm.find((r) => r.displayLabel === `${numStr}:${verseRange}`)
          : null) ??
        allForPsalm.find((r) => r.isRecommended === true) ??
        allForPsalm.find((r) => r.displayLabel.startsWith(numStr + ':')) ??
        null
    }

    // Record the resolved version whenever the psalm has more than one version
    // row, so the sing view renders THAT versification instead of falling back to
    // sortedVersions[0] (lowest id) — which is the non-recommended version for
    // 45/102/124/143/145/148. Single-version psalms stay null: there is no a/b
    // choice to record, and it keeps the paste preview free of "(23)" noise.
    const psalmVersionId = psalm && isMultiVersion ? psalm.versionId ?? null : null

    results.push({ psalmNum, verseRange, psalm, psalmVersionId })
  }
  return results
}
```

Also update the two doc comments above the function:
- The `ParsedPsalmEntry.psalmVersionId` comment (lines 7-8) → say it holds the
  resolved `psalm_versions.id` whenever the psalm has more than one version row
  (an a/b pair, or a psalm-119 stanza), and is null for single-version psalms.
- The function's block comment (lines 11-17) → document the four-step bare-number
  resolution order and state that a parenthetical selects the "b" version BY LABEL.

**Do NOT touch** `src/components/precent/PastePsalmsDialog.tsx` or
`src/components/precent/CreateSetForm.tsx` — they already forward
`entry.psalmVersionId` and already render `(${entry.psalm.displayLabel})` in the
preview when it is set. With this fix the preview reads "Psalm 50 (50a*)", which
matches the `*`-suffixed labels used everywhere else in the app.

**(d) `src/lib/parse-psalm-list.test.ts` (NEW).**
Create the file with the behaviour block above as the source of truth. Use
`import { describe, it, expect } from 'vitest'` and a type-only import of
`PsalmRow` (`import type { PsalmRow } from '@/components/PsalmListingGrid'`) so
no React/client module is pulled into the node test environment. Use fixture
rows whose ids/labels match the live DB:

```ts
function row(o: { id: number; versionId: number; displayLabel: string; isRecommended?: boolean }): PsalmRow {
  return {
    id: o.id,
    versionId: o.versionId,
    displayLabel: o.displayLabel,
    slug: o.displayLabel.replace('*', '').replace(':', '-'),
    firstLine: null,
    meter: null,
    kjvExcerpt: null,
    isRecommended: o.isRecommended ?? false,
  }
}

const ROWS: PsalmRow[] = [
  row({ id: 6,  versionId: 144, displayLabel: '6a*',  isRecommended: true }),
  row({ id: 6,  versionId: 157, displayLabel: '6b' }),
  row({ id: 45, versionId: 29,  displayLabel: '45a' }),
  row({ id: 45, versionId: 160, displayLabel: '45b*', isRecommended: true }),
  row({ id: 50, versionId: 20,  displayLabel: '50a*', isRecommended: true }),
  row({ id: 50, versionId: 173, displayLabel: '50b' }),
  row({ id: 23, versionId: 42,  displayLabel: '23' }),
  row({ id: 119, versionId: 84,  displayLabel: '119:1-8' }),
  row({ id: 119, versionId: 150, displayLabel: '119:9-16' }),
  row({ id: 119, versionId: 176, displayLabel: '119:73-80' }),
]
```

Cases to assert (one `it()` each, names describing the behaviour):
1. `50` → `displayLabel '50a*'`, `psalmVersionId 20` (recommended = first version).
2. `45` → `displayLabel '45b*'`, `psalmVersionId 160` (recommended = second
   version; assert `psalmVersionId !== 29` so a regression to "first row wins" fails).
3. `23` → `displayLabel '23'`, `psalmVersionId null`.
4. `23:1-6` → `verseRange '1-6'`, `psalm.displayLabel '23'`, `psalmVersionId null`.
5. `119:9-16` → `displayLabel '119:9-16'`, `psalmVersionId 150`.
6. `119` → `displayLabel '119:1-8'`, `psalmVersionId 84`.
7. `50 (AOTS)` → `displayLabel '50b'`, `psalmVersionId 173`.
8. `119 (AOTS)` → `displayLabel '119:1-8'` (label matching, not array position).
9. Reordered fixture (`[50b, 50a*]`) + `50 (AOTS)` → still `'50b'` — proves the
   match is by label, not by array order.
10. `99` (no rows) → `psalm` null, `psalmVersionId null`.
11. `999` → `[]` (out of the 1-150 range, skipped entirely).
12. `'23:1-6; 45; 119:9-16'` → 3 entries, each resolved as above.
  </action>
  <verify>
<automated>
- `npx vitest run src/lib/parse-psalm-list.test.ts` → all tests pass (expect 12 passing).
- `npx tsc --noEmit 2>&1 | grep -E '^src/(lib/parse-psalm-list|db/queries/psalms|components/PsalmListingGrid)' | grep -v '^#'` → prints NOTHING (no type errors in the three touched source files). NOTE: the repo has 78 pre-existing `tsc` errors (17 in `src/`, all in unrelated `*.test.ts(x)` files) — the gate is "no NEW errors in these files", not "0 errors overall".
- `npx eslint src/lib/parse-psalm-list.ts src/lib/parse-psalm-list.test.ts src/db/queries/psalms.ts src/components/PsalmListingGrid.tsx` → exit 0, no output.
- `grep -c 'isRecommended' src/lib/parse-psalm-list.ts` → ≥3 (the two `find` calls + the flag read); `grep -c 'isRecommended' src/db/queries/psalms.ts` → ≥1 (the population line).
</automated>
  </verify>
  <done>
A pasted bare number resolves to the RECOMMENDED versification for all 13
multi-version psalms, the resolved `psalmVersionId` is recorded on the set item
(so the sing view renders that versification, not the lowest-id one), psalm-119
range pastes bind to the exact pasted stanza, the parenthetical form picks the
"b" version by label, and single-version psalms are unchanged (`psalmVersionId`
null). 12 new unit tests in `src/lib/parse-psalm-list.test.ts` pass; no new
TypeScript or ESLint errors in the touched files.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Serve the precenting set routes dynamically so set mutations are visible immediately</name>
  <files>
    src/app/precent/[id]/page.tsx,
    src/app/precent/[id]/sing/[pos]/page.tsx,
    next.config.ts,
    src/middleware.ts
  </files>
  <action>
The approach is already decided — implement the mechanics exactly as follows.
Precenting sets are per-user mutable data; static pre-rendering is the wrong
model for them.

**(a) `src/app/precent/[id]/page.tsx`**
- Replace lines 1-2:
  `export const dynamic = 'force-static'` / `export const revalidate = false`
  → `export const dynamic = 'force-dynamic'` (ONE line; delete the `revalidate`
  export entirely — `force-dynamic` implies no ISR).
- Delete the Phase 19 PERF-02 comment block (lines 14-16) and the whole
  `generateStaticParams` function (lines 17-25).
- Line 6: `import { precentingSets, setItems, psalmVersions } from '@/db/schema'`
  → `import { setItems, psalmVersions } from '@/db/schema'`.
  `precentingSets` was used ONLY by the removed `generateStaticParams`; the
  `db.query.precentingSets.findFirst` call further down is the relational-query
  API and needs no import.
- Everything else stays. In particular do NOT touch the `setItems.position`
  ordering (`orderBy: [asc(setItems.position)]`), the `notFound()` guards, the
  `effectiveVersionIdByItemId` fallback block (lines 67-89), or the serialized
  set payload.
- The Phase 19 de-auth comment at lines 52-56 (it explains why the route is
  reachable without a session) stays accurate — do not rewrite it.

**(b) `src/app/precent/[id]/sing/[pos]/page.tsx`**
- Replace lines 1-2 with `export const dynamic = 'force-dynamic'` (delete the
  `revalidate` export).
- Delete the Phase 19 PERF-02 comment block (lines 24-27) and the whole
  `generateStaticParams` function (lines 28-46).
- Line 6: `import { eq, asc, sql } from 'drizzle-orm'` → `import { eq, asc } from 'drizzle-orm'`
  (`sql` was used only by the removed `COUNT(*)::int` query).
- Line 5: `import { precentingSets, setItems } from '@/db/schema'` →
  `import { setItems } from '@/db/schema'` (`precentingSets` was import-only for
  the removed function; `db.query.precentingSets.findFirst` needs no import).
- Leave `const position = parseInt(pos) - 1` and `set.setItems[position]` EXACTLY
  as they are. The URL `pos` is a 1-based INDEX into the position-ordered array;
  the stored `set_items.position` column is 0-based for some sets and 1-based for
  others, and the index semantics are what make both work. Do not "fix" this.
- Leave the guards alone: `if (isNaN(setId) || isNaN(position) || position < 0) notFound()`
  (line 53) and `if (!set || !set.setItems[position]) notFound()` (line 59).
  With `force-dynamic` and `dynamicParams` defaulting to true, `/precent/50/sing/4`
  renders on demand even though it was not in the build-time enumeration, and
  `/precent/50/sing/99` still 404s.
- Leave the `revalidateTag(PRECENT_CACHE_TAG, "max")` calls in
  `src/app/api/precent/**` exactly as they are — they still serve the *tune*
  caches in `src/db/queries/tunes.ts`. Do NOT add cache-tag machinery for the
  set query: the routes are dynamic now, so the raw query is always fresh.

**(c) `next.config.ts`**
Delete these two entries from the `headers()` array (lines 61-68):
```ts
      {
        source: '/precent/:id(\\d+)',
        headers: t2CacheControl,
      },
      {
        source: '/precent/:id(\\d+)/sing/:pos(\\d+)',
        headers: t2CacheControl,
      },
```
Keep the other six T2 entries (`/psalms/:id/study`, `/tunes/:slug`,
`/explore/authors/:author`, `/explore/topics/:slug`, `/explore/naves/:slug`,
`/explore/messianic`) and the `t2CacheControl` constant unchanged. With the two
precent entries gone, Next's own dynamic-route header applies:
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.

**(d) `src/middleware.ts` — COMMENT ONLY, no logic change.**
The Phase 19 carve-out comment (above the `/precent/<id>` allow-list) says the
routes "are T2-cacheable". That is no longer true and the comment would mislead
the next reader into re-adding caching. Rewrite that sentence to say the routes
are de-auth-gated (no confidential content) but served DYNAMICALLY because
precenting sets are per-user mutable data. Do not change the matcher, the
allow-list regexes, or any control flow.
  </action>
  <verify>
<automated>
- `grep -c 'force-static' 'src/app/precent/[id]/page.tsx' 'src/app/precent/[id]/sing/[pos]/page.tsx'` → 0 for both files.
- `grep -c 'generateStaticParams' 'src/app/precent/[id]/page.tsx' 'src/app/precent/[id]/sing/[pos]/page.tsx'` → 0 for both files.
- `grep -c 'revalidate = false' 'src/app/precent/[id]/page.tsx' 'src/app/precent/[id]/sing/[pos]/page.tsx'` → 0 for both files.
- `grep -c "precent/:id" next.config.ts` → 0 (both precent header entries removed).
- `grep -c "source: '/precent" next.config.ts` → 0 (both precent header entries removed).
- `grep -c 'headers: t2CacheControl' next.config.ts` → 6 (the six surviving T2 routes: /psalms/:id/study, /tunes/:slug, /explore/authors/:author, /explore/topics/:slug, /explore/naves/:slug, /explore/messianic).
- `npx eslint 'src/app/precent/[id]/page.tsx' 'src/app/precent/[id]/sing/[pos]/page.tsx' next.config.ts src/middleware.ts` → exit 0, no output.
- `npx tsc --noEmit 2>&1 | grep -E '^src/(app/precent/|middleware|lib/parse-psalm-list|db/queries/psalms|components/PsalmListingGrid)' | grep -v '^#'` → prints NOTHING. (The repo has 78 pre-existing `tsc` errors in unrelated files — the gate is "no NEW errors in the touched files".)
- `npm run build 2>&1 | tee /tmp/precent-build.log` → exits 0. Then:
  `grep -E '/precent/\[id\]' /tmp/precent-build.log | grep -v '^#' | grep -cE '●|○'` → 0 — neither precent route may still be marked as prerendered (●) or static (○) in the build route table; both must render as `ƒ` (Dynamic).
  NOTE: COMMIT before running the build — `prebuild` runs `scripts/capture-deploy-info.ts`, which reads HEAD at build start.
</automated>
  </verify>
  <done>
`/precent/[id]` and `/precent/[id]/sing/[pos]` are `force-dynamic` with no
`generateStaticParams` and no `revalidate = false`; `next.config.ts` no longer
emits a one-year `Cache-Control` for the precent paths; the build route table
marks both routes `ƒ` (Dynamic); the `notFound()` guards still reject an
out-of-range position; and the middleware's de-auth carve-out is unchanged
apart from a comment that no longer claims the routes are cacheable.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Self-heal a precenting page served from a stale browser cache</name>
  <files>
    src/app/api/precent/[id]/items/route.ts,
    src/components/precent/PrecentingBar.tsx,
    src/components/precent/PrecentingBar.test.tsx (NEW)
  </files>
  <behavior>
    - The precenting page renders from a server-provided `total` (the item count).
    - On mount, the client fetches the set's CURRENT item count from
      `GET /api/precent/[id]/items` with `cache: 'no-store'`.
    - If the live count differs from the server-rendered `total`, the client calls
      `router.refresh()` so the page re-renders with the correct `pos / total`
      counter and a live Next arrow.
    - If the counts match, nothing happens (no refresh).
    - If the fetch fails (401 for an anonymous visitor, offline, etc.), nothing
      happens — the error is swallowed, never surfaced to the user.
    - The check must not loop: it re-runs only when `total` changes, and a
      refresh that does not change `total` does not re-trigger it.
  </behavior>
  <action>
    **Why this task exists.** Cloudflare's `browser_ttl: 31536000` told the user's
    browser to keep the `/precent/*/sing/*` HTML for a YEAR. The code fix in Task 2
    stops NEW responses from being cached that way, but a copy stored BEFORE the
    fix stays in the user's browser cache until it expires (or is cleared
    manually) — so the precentor would still see the stale "3 / 3" page with no
    Next arrow, i.e. the exact reported symptom would survive the fix. This task
    makes the page detect the mismatch and heal itself, so the fix is complete
    without asking the user to clear their browser cache.

    **(a) `src/app/api/precent/[id]/items/route.ts` — add a GET handler.**
    The file currently exports only `POST`. Add a `GET` alongside it that returns
    the set's ordered items and their count. Use the same auth helpers the POST
    handler already uses — `getSessionOr401()` and `loadSetWithAccess(setId, session)`
    — so the endpoint is owner/admin only and returns 401/403/404 exactly like the
    mutation route. The response shape:

    ```ts
    NextResponse.json({ count: rows.length, items: rows })
    ```

    where `rows` is selected from `setItems` for `setId`, ordered by
    `asc(setItems.position)`, selecting only `id`, `psalmId`, `psalmVersionId`,
    `tuneId`, `verseRange`, `position`. Add `asc` to the existing `drizzle-orm`
    import. Do NOT change the POST handler. Do NOT remove the
    `revalidateTag(PRECENT_CACHE_TAG, "max")` call in the POST handler.

    **(b) `src/components/precent/PrecentingBar.tsx` — add the freshness check.**
    The component is `'use client'` and receives `setId`, `pos`, `total`. Add:

    ```tsx
    'use client'

    import { useEffect } from 'react'
    import { useRouter } from 'next/navigation'
    import Link from 'next/link'
    import { ChevronLeft } from 'lucide-react'

    // ... existing props interface unchanged ...

    export function PrecentingBar({ setId, pos, total }: PrecentingBarProps) {
      const router = useRouter()

      // Self-heal a stale page. Before the Task-2 fix Cloudflare served these
      // pages with `max-age=31536000`, so a browser could hold a year-old copy
      // of the set (counter "3 / 3", no Next arrow) after a psalm was added.
      // The server-rendered `total` is compared against the live item count and
      // the page refreshes itself when they disagree.
      useEffect(() => {
        let cancelled = false
        const check = async () => {
          try {
            const res = await fetch(`/api/precent/${setId}/items`, {
              cache: 'no-store',
              credentials: 'same-origin',
            })
            if (!res.ok || cancelled) return
            const data = (await res.json()) as { count?: unknown }
            if (cancelled) return
            if (typeof data?.count === 'number' && data.count !== total) {
              router.refresh()
            }
          } catch {
            // Network/auth failure — leave the page exactly as rendered.
          }
        }
        void check()
        return () => {
          cancelled = true
        }
      }, [setId, total, router])

      // ... existing JSX unchanged ...
    }
    ```

    IMPORT NOTE: `src/components/precent/PrecentingBar.tsx` ALREADY imports
    `Link` from 'next/link' and `ChevronLeft` from 'lucide-react' (lines 3-4).
    MERGE into the existing import block — do NOT append a second `Link` /
    `ChevronLeft` import (duplicate identifier → TS error). The only additions
    are `import { useEffect } from 'react'` and
    `import { useRouter } from 'next/navigation'`.

    Keep the existing markup byte-identical apart from the added import and the
    effect. Do NOT change the counter rendering, the "Back to Set" link, or the
    class names.

    **(c) `src/components/precent/PrecentingBar.test.tsx` (NEW).**
    Follow the established component-test pattern in this repo — see
    `src/components/singing/GearPopover.test.tsx` for the `next/navigation` mock:

    ```tsx
    vi.mock('next/navigation', () => ({
      useRouter: () => ({ push: vi.fn(), refresh: mockRefresh, replace: vi.fn(), back: vi.fn() }),
    }))
    ```

    where `mockRefresh` is a module-level `vi.fn()` asserted against. Mock
    `global.fetch` with `vi.fn()` resolving to `{ ok: true, json: async () => ({ count: 4 }) }`.
    Assert:
    1. live count differs from `total` → `mockRefresh` called once.
    2. live count equals `total` → `mockRefresh` NOT called.
    3. fetch rejects → `mockRefresh` NOT called and the component still renders
       the counter (no throw).
    4. fetch resolves with a non-ok status → `mockRefresh` NOT called.
  </action>
  <verify>
<automated>
- `npx vitest run src/components/precent/PrecentingBar.test.tsx` → all tests pass.
- `npx vitest run src/lib/parse-psalm-list.test.ts src/components/precent/PrecentingBar.test.tsx` → both files pass.
- `npx eslint src/app/api/precent/[id]/items/route.ts src/components/precent/PrecentingBar.tsx src/components/precent/PrecentingBar.test.tsx` → exit 0, no output.
- `npx tsc --noEmit 2>&1 | grep -E '^src/(app/api/precent/|components/precent/)' | grep -v '^#'` → prints NOTHING.
- `grep -c 'router.refresh' src/components/precent/PrecentingBar.tsx` → 1.
</automated>
  </verify>
  <done>
`GET /api/precent/[id]/items` returns the set's ordered item count to an
authenticated owner/admin; the precenting page compares that live count against
its server-rendered `total` and calls `router.refresh()` when they disagree, so a
precentor whose browser holds a stale cached copy of the set is repaired without
any manual cache clearing; failures are swallowed and the page renders normally;
and new unit tests cover the mismatch, match, and failure paths.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → `/api/precent/**` | Untrusted JSON body (`psalmId`, `psalmVersionId`, `verseRange`) from the paste dialog / set form. |
| client → `/precent/<id>[/sing/<pos>]` | Unauthenticated-by-design (Phase 19 de-auth carve-out) GET of per-user set content; set ids are sequential integers. |
| origin → Cloudflare edge | A shared edge cache that previously stored per-user set HTML for a year. |
| DB → origin | `psalm_versions.psalter_number` free text is the sole carrier of the "Recommended" marker; it is read, never written, by this task. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-261108-01 | Tampering | `POST /api/precent/[id]/items` accepts an arbitrary `psalmVersionId` | accept | Not introduced by this task and not exploitable for cross-psalm data: the sing page resolves the version with `sortedVersions.find(v => v.id === item.psalmVersionId) ?? sortedVersions[0]` over the psalm fetched by `item.psalmId`, so a mismatched id falls back to that psalm's own first version. Recorded as a follow-up to validate the pairing server-side. |
| T-261108-02 | Information Disclosure | `/precent/<id>` and `/precent/<id>/sing/<pos>` are reachable without a session; the rendered HTML carries the precentor's display name and the set's psalms/tunes/verse ranges | accept | Pre-existing, deliberate Phase 19 decision (documented in the route comment and the middleware carve-out). This task does not change the auth model. It does REMOVE the year-long edge copy, shrinking the window in which one user's set HTML is served to another. |
| T-261108-03 | Denial of Service | Making both set routes dynamic removes the edge cache, so every request hits the origin | accept | Load is bounded: precenting sets are per-user and few; `fetchAllTunes`, `fetchTunesByMeter` and `enrichAlternateTunesToTuneRows` remain `unstable_cache`d with the `PRECENT_CACHE_TAG`; the set query is a single indexed `findFirst` + one ordered child relation. |
| T-261108-04 | Tampering (cache integrity) | The Cloudflare edge cache served year-old set HTML, so a mutation was invisible to every later reader | mitigate | Code side (this task): `force-dynamic` + no `Cache-Control` override in `next.config.ts`. Edge side (orchestrator, after deploy): rule `e6a916ba9f5244bda0815cffd1e02c86` is set to `cache: false` with `browser_ttl: bypass` — see the orchestrator steps below. |
| T-261108-05 | Spoofing | The "recommended" marker is free text in `psalm_versions.psalter_number`; a typo or a re-import could mark the wrong version | mitigate | The resolver reads the marker from the DB via `fetchPsalmListRows` (`psalterNumber.includes('Recommended')`), never from user input, and it is only ever used to CHOOSE among that psalm's own version rows. It is never used for authorization. |
</threat_model>

<orchestrator_steps>
These steps are performed by the ORCHESTRATOR after the code is deployed. The
executor must NOT run them (the task explicitly forbids deploying and modifying
the Cloudflare rule).

**1. Cloudflare — stop edge-caching the `/precent/*/sing/*` family (AFTER deploy).**
Rule id `e6a916ba9f5244bda0815cffd1e02c86`, zone `6c322a054d869df9450e4c99e8d4d4a8`,
ruleset `d8c78a9291dd40b38f9a3523e5bd6bcc`. Current rule JSON (verbatim, for revert):

```json
{
  "action": "set_cache_settings",
  "action_parameters": {
    "browser_ttl": { "default": 31536000, "mode": "override_origin" },
    "cache": true,
    "edge_ttl": { "default": 31536000, "mode": "override_origin" }
  },
  "description": "Phase 19 PERF-03 - /precent/[id]/sing/[pos] family",
  "enabled": true,
  "expression": "http.host eq \"psalter.gsdlabs.dev\" and http.request.uri.path contains \"/precent/\" and http.request.uri.path contains \"/sing/\"",
  "id": "e6a916ba9f5244bda0815cffd1e02c86",
  "version": "1"
}
```

Target payload — write it to `/tmp/cf-precent-rule.json`:

```json
{
  "action": "set_cache_settings",
  "action_parameters": {
    "browser_ttl": { "mode": "bypass" },
    "cache": false
  },
  "description": "Precenting sets are per-user mutable data - never edge-cache them",
  "enabled": true,
  "expression": "http.host eq \"psalter.gsdlabs.dev\" and http.request.uri.path contains \"/precent/\" and http.request.uri.path contains \"/sing/\""
}
```

`browser_ttl: { mode: "bypass" }` is REQUIRED alongside `cache: false`: with
`override_origin` the rule would keep stamping `max-age=31536000` on the
BROWSER's copy of the response, so the user's own tab would still serve a
year-old set page even once the edge stops caching. `bypass` leaves the origin's
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` alone.
(The `bypass` mode is already used by the debates rule in the same ruleset.)

Apply it:

```bash
set -a; . /home/services/.env.production; set +a
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/6c322a054d869df9450e4c99e8d4d4a8/rulesets/d8c78a9291dd40b38f9a3523e5bd6bcc/rules/e6a916ba9f5244bda0815cffd1e02c86" \
  -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
  -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
  -H "Content-Type: application/json" \
  --data @/tmp/cf-precent-rule.json
```

**1b. PURGE the already-cached edge copies (REQUIRED — the rule change alone is NOT enough).**
Changing the rule to `cache: false` stops NEW edge caching but does NOT evict the
objects already sitting in the edge cache. Those have a 1-year TTL and would keep
being served (`cf-cache-status: HIT`) until they expire — i.e. the reported symptom
would survive the deploy. The zone is on the Free plan, so purge by URL (30 URLs
per request); prefix purge is Pro+ only.

```bash
set -a; . /home/services/.env.production; . /home/services/psalter/.env; set +a
FILES=""
while read -r sid cnt; do
  FILES="$FILES\"https://psalter.gsdlabs.dev/precent/$sid\","
  for ((p=1; p<=cnt+1; p++)); do
    FILES="$FILES\"https://psalter.gsdlabs.dev/precent/$sid/sing/$p\","
  done
done < <(psql "$DATABASE_URL" -t -A -F' ' -c "SELECT ps.id, count(si.id) FROM precenting_sets ps LEFT JOIN set_items si ON si.set_id = ps.id GROUP BY ps.id ORDER BY ps.id;")
curl -X POST "https://api.cloudflare.com/client/v4/zones/6c322a054d869df9450e4c99e8d4d4a8/purge_cache" \
  -H "X-Auth-Email: $CLOUDFLARE_EMAIL" -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
  -H "Content-Type: application/json" \
  --data "{\"files\":[${FILES%,}]}"
```

The zone currently holds 14 sets, so one request is enough; if the list ever
exceeds 30 URLs, split it into batches of 30.

Read back with the RULESET endpoint (the single-rule GET returns
`10405 Method not allowed for this authentication scheme` with this account's
auth scheme — verified):

```bash
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/6c322a054d869df9450e4c99e8d4d4a8/rulesets/d8c78a9291dd40b38f9a3523e5bd6bcc" \
  -H "X-Auth-Email: $CLOUDFLARE_EMAIL" -H "X-Auth-Key: $CLOUDFLARE_API_KEY"
```

Note: the ruleset contains NO rule for the `/precent/:id` DETAIL page — that page
was pinned by `next.config.ts` + `force-static` alone, so removing the
`next.config.ts` header is sufficient for it; Cloudflare will not cache a
`private, no-store` response.

**2. Post-deploy live verification.**
The `/precent/<id>` routes are de-auth-gated, so no session cookie is needed.

```bash
curl -sI https://psalter.gsdlabs.dev/precent/50/sing/4 | grep -iE 'cache-control|x-nextjs-cache|x-nextjs-prerender|cf-cache-status'
```
Expected: `cache-control` contains `no-store` (or `private, no-cache`), there is
NO `x-nextjs-cache` and NO `x-nextjs-prerender` header, and `cf-cache-status` is
`DYNAMIC` (not `HIT`).

```bash
curl -s https://psalter.gsdlabs.dev/precent/50/sing/4 | grep -o '[0-9] / [0-9]' | head -1
```
Expected: `4 / 4` for the 4-item set.

```bash
curl -s https://psalter.gsdlabs.dev/precent/50/sing/3 | grep -o '/precent/50/sing/4' | head -1
```
Expected: the Next arrow on position 3 points at `/precent/50/sing/4`.

**3. One-time browser-side note for the user.**
The pre-fix responses carried `Cache-Control: public, max-age=31536000`, so the
precentor's own browser may still hold a year-old copy of the set HTML. No
server-side change can evict a copy already in a user's browser cache, and that
cached HTML carries the PRE-fix JS bundle — so Task 3's self-heal cannot run
from that copy. Ask the user to hard-refresh once (or open the page in a private
window) after the deploy. Every response after the fix carries
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`, so the
browser replaces its copy on the next load and the problem never recurs.

**4. Bug 1 live check.** Create a NEW set, paste `50` into the psalm list, and
confirm the preview row reads "Psalm 50 (50a*)" (not "— not found") and that the
set item is created. Repeat with `45` — the preview must read "Psalm 45 (45b*)"
(the recommended SECOND version), proving the resolver does not fall back to the
first row.
</orchestrator_steps>

<verification>
Phase-level checks after both tasks:

1. `npx vitest run src/lib/parse-psalm-list.test.ts` → 12 tests pass.
2. `npx tsc --noEmit 2>&1 | grep -E '^src/(lib/parse-psalm-list|db/queries/psalms|components/PsalmListingGrid|app/precent/|middleware)' | grep -v '^#'` → no output (no NEW type errors in the touched files; the repo has 78 pre-existing errors elsewhere).
3. `npx eslint` on every touched file → exit 0.
4. `npm run build` → exits 0 and the route table shows both precent routes as `ƒ` (Dynamic), with no `●`/`○` marker.
5. A new set created via the paste dialog with `50` resolves to `50a*`; with `45` resolves to `45b*`.
6. After deploy, `/precent/50/sing/4` renders the 4th psalm and the counter reads `4 / 4`, with no `x-nextjs-cache` header.
</verification>

<final_steps>
1. Commit each task atomically on the current branch `fix/261108-precent-bugs`,
   code changes only (no `.planning/` docs artifacts):
   - Task 1: `fix(precent): resolve pasted multi-version psalms to the recommended versification`
   - Task 2: `fix(precent): serve precenting set routes dynamically`
   - Task 3: `fix(precent): self-heal a stale precenting page whose item count changed`
   Run `npm run build` AFTER the commits (the `prebuild` step reads HEAD).
2. DO NOT deploy: do not run `pm2 restart psalter`, do not push, do not modify
   the Cloudflare rule. This task's constraints override the standing
   auto-deploy rule — the orchestrator deploys and applies the Cloudflare change
   (see `<orchestrator_steps>`).
3. Do NOT touch `.planning/ROADMAP.md`.
</final_steps>

<out_of_scope>
Deliberately NOT part of this task — do not implement, do not silently drop:

- **Legacy set items with a null `psalmVersionId`** still fall back to the
  lowest-id version in `src/app/precent/[id]/page.tsx:67-89` and in
  `src/app/precent/[id]/sing/[pos]/page.tsx:70-72`. For sets created BEFORE this
  fix, a psalm 45/102/124/143/145/148 item therefore still sings the
  non-recommended versification, and psalm 119 still binds to an arbitrary
  stanza. Only NEW pasted items are fixed. A follow-up could backfill
  `set_items.psalm_version_id` from the recommended version.
- **Server-side validation** that `psalmVersionId` belongs to `psalmId` in
  `POST /api/precent/[id]/items` (see T-261108-01).
- **`set_items.position` base inconsistency** (0-based for some sets, 1-based
  for others) — the sing route's index semantics are correct as they stand; do
  not change them.
- **The `/precent/:id` detail page's Cloudflare coverage** — there is no edge
  rule for it and none is needed once `next.config.ts` no longer stamps a
  one-year `Cache-Control`.
</out_of_scope>

<output>
After completion, create `.planning/quick/261108-dfl-some-small-bugs-in-precenting-views-1-pa/261108-dfl-SUMMARY.md` with: the two commit SHAs, the vitest pass count, the build route-table line for both precent routes, and any deviations from this plan (especially if the Cloudflare PATCH payload needed adjusting).
</output>
