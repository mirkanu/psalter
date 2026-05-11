---
phase: quick
plan: 20260511-ui-fixes-batch3
type: execute
wave: 2
depends_on: []
files_modified:
  - src/components/PsalmNotationPlayer.tsx
  - src/components/PsalmNotationPlayerClient.tsx
  - src/components/PsalmTabs.tsx
  - src/components/TuneTable.tsx
  - src/db/queries/psalms.ts
  - src/components/SelectPsalmDialog.tsx
  - src/components/PsalmsByTuneSection.tsx
  - src/components/GlobalSearch.tsx
  - src/components/PsalmListingGrid.tsx
  - src/components/PsalmNumberBox.tsx
  - src/app/api/search/route.ts
  - src/lib/search-utils.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Tune format displays as 'Tune (CM): Name' — parenthesised meter before colon"
    - "Mobile Sing tab fills full viewport height with sticky score, no double-scroll constraint"
    - "Tapping a meter value in TuneTable shows a tooltip with the full text (no title= attribute)"
    - "GlobalSearch overlay is vertically centred with visible dark backdrop above and below"
    - "SelectPsalmDialog search matches psalm lyrics, not just id/title/firstLine"
    - "PsalmListingGrid text search shows results (filter logic reaches lyrics field)"
    - "renderSnippet correctly bolds the matched term and only the matched term"
    - "GlobalSearch results list shows bolded keyword highlights"
    - "Search API preserves a/b psalm versions instead of deduplicating by psalmId"
    - "buildSnippet and renderSnippet are defined once in src/lib/search-utils.ts and imported everywhere"
  artifacts:
    - path: "src/lib/search-utils.ts"
      provides: "Shared buildSnippet and renderSnippet utilities"
      exports: ["buildSnippet", "renderSnippet"]
    - path: "src/components/TuneTable.tsx"
      provides: "Meter tooltip via shadcn Tooltip component"
    - path: "src/components/GlobalSearch.tsx"
      provides: "Centred overlay + keyword highlights in results"
    - path: "src/app/api/search/route.ts"
      provides: "Text search without psalmId deduplication"
  key_links:
    - from: "src/components/PsalmListingGrid.tsx"
      to: "src/lib/search-utils.ts"
      via: "import { buildSnippet, renderSnippet }"
    - from: "src/components/GlobalSearch.tsx"
      to: "src/lib/search-utils.ts"
      via: "import { renderSnippet }"
    - from: "src/app/api/search/route.ts"
      to: "src/lib/search-utils.ts"
      via: "import { buildSnippet }"
---

<objective>
Complete UI fixes batch 3: commit partially-done T2/T4 changes (tune format + mobile sticky score) after fixing the remaining T4 call site; add meter tooltip (T5); wire lyrics into psalm selector search (T7); fix search overlay centering (T6); fix all search bugs including snippet bolding, a/b version deduplication, and extract shared search utilities (T8).

Purpose: Close the gap between the WIP uncommitted state and a clean, polished UI with correct search behaviour.
Output: 11 files modified or created; all changes committed.
</objective>

<execution_context>
@/data/home/psalter/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@/data/home/psalter/.planning/PROJECT.md
@/data/home/psalter/.planning/ROADMAP.md

<!-- Partially-done uncommitted work already in these three files: -->
<!-- src/components/PsalmNotationPlayer.tsx — T2 tune format done, T4 prop added -->
<!-- src/components/PsalmNotationPlayerClient.tsx — T4 mobileStickyScore prop wired -->
<!-- src/components/PsalmTabs.tsx — T4 prop added to makeSingPanel signature BUT mobile call site at line 511 still uses makeSingPanel(true) inside a height-constrained wrapper; must be changed -->

<interfaces>
<!-- PsalmTabs.tsx: makeSingPanel signature (current, needs updating) -->
<!-- function makeSingPanel(stickyScore: boolean, mobileStickyScore?: boolean) -->
<!-- Mobile TabsContent (line 509-513, current broken state): -->
<!--   <TabsContent value="sing" className="pb-4"> -->
<!--     <div className="h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden"> -->
<!--       {makeSingPanel(true)} -->
<!--     </div> -->
<!--   </TabsContent> -->
<!-- Target state (remove wrapper div, pass mobileStickyScore=true): -->
<!--   <TabsContent value="sing" className="pb-4"> -->
<!--     {makeSingPanel(false, true)} -->
<!--   </TabsContent> -->

<!-- TuneTable.tsx: meter cell currently renders as plain text in a <td>; -->
<!-- no Tooltip import; shadcn Tooltip is at @/components/ui/tooltip -->
<!-- State needed: const [openMeterRow, setOpenMeterRow] = useState<number | null>(null) -->

<!-- GlobalSearch.tsx line 95: -->
<!-- className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/70 px-4" -->
<!-- Change to: -->
<!-- className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" -->

<!-- src/db/queries/psalms.ts fetchPsalmsByMeter — add lyrics: true to columns -->
<!-- columns: { psalmId: true, firstLine: true, lyrics: true } -->

<!-- src/components/SelectPsalmDialog.tsx — PsalmOption needs lyrics field; filter must include it -->

<!-- src/app/api/search/route.ts — text branch currently deduplicates by psalmId (seen Map). -->
<!-- To preserve a/b: remove the seen Map; generate slug as psalmId + version index suffix. -->
<!-- Multi-version detection: if rows for the same psalmId > 1, append a/b suffix to slug. -->
<!-- Group rows by psalmId first to compute suffix, then push all. -->

<!-- src/components/PsalmNumberBox.tsx renderSnippet: the split regex -->
<!-- new RegExp(`(${escaped})`, 'gi') can split on empty strings or mismatch -->
<!-- when part.toLowerCase() === query.toLowerCase() is used to detect match. -->
<!-- This logic is correct as written — the bug is likely the 'gi' flag combined -->
<!-- with zero-length matches. Simplify: after split, test each part with -->
<!-- new RegExp(escaped, 'i').test(part) instead of .toLowerCase() comparison. -->

<!-- src/lib/search-utils.ts (new file) — export buildSnippet and renderSnippet -->
<!-- buildSnippet: pure function, no React needed -->
<!-- renderSnippet: returns React.ReactNode — requires 'use client' or 'react' import -->
</interfaces>
</context>

<tasks>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- WAVE A — three parallel tasks, no cross-file conflicts         -->
<!-- ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task A1: Commit T2+T4 — fix mobile Sing tab call site then commit all three WIP files</name>
  <files>src/components/PsalmTabs.tsx, src/components/PsalmNotationPlayer.tsx, src/components/PsalmNotationPlayerClient.tsx</files>
  <action>
In PsalmTabs.tsx, find the mobile TabsContent for "sing" (around line 509). Replace:

```tsx
<TabsContent value="sing" className="pb-4">
  <div className="h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden">
    {makeSingPanel(true)}
  </div>
</TabsContent>
```

with:

```tsx
<TabsContent value="sing" className="pb-4">
  {makeSingPanel(false, true)}
</TabsContent>
```

This removes the outer height-constraining wrapper and passes `mobileStickyScore=true` to enable the score sticky behaviour already implemented inside PsalmNotationPlayer/PsalmNotationPlayerClient. PsalmNotationPlayer.tsx and PsalmNotationPlayerClient.tsx already have the correct changes from the WIP state — do not alter them, only confirm they are correct before staging.

After the edit, stage all three files and commit:
  git add src/components/PsalmNotationPlayer.tsx src/components/PsalmNotationPlayerClient.tsx src/components/PsalmTabs.tsx
  git commit -m "fix(psalms): mobile sing tab sticky score + tune format (T2, T4)"

Then push.
  </action>
  <verify>
    <automated>grep -n "makeSingPanel(false, true)" /data/home/psalter/src/components/PsalmTabs.tsx | grep -c "makeSingPanel" && echo "call site ok"</automated>
  </verify>
  <done>The mobile Sing TabsContent calls makeSingPanel(false, true) with no wrapper div; all three files committed and pushed.</done>
</task>

<task type="auto">
  <name>Task A2: T5 — meter tooltip in TuneTable using shadcn Tooltip</name>
  <files>src/components/TuneTable.tsx</files>
  <action>
Replace the plain meter cell (which uses title= or bare text) with a shadcn Tooltip that is tappable on mobile.

1. Add import at top of TuneTable.tsx:
   ```tsx
   import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
   ```

2. Add state for which row's meter tooltip is open:
   ```tsx
   const [openMeterRow, setOpenMeterRow] = useState<number | null>(null)
   ```

3. Find every place the meter value is rendered in the table cell (it may have a `title=` attribute — remove that). Wrap the meter text in a Tooltip:
   ```tsx
   <Tooltip open={openMeterRow === tune.id} onOpenChange={(o) => setOpenMeterRow(o ? tune.id : null)}>
     <TooltipTrigger asChild>
       <span
         className="cursor-help underline decoration-dotted"
         onClick={() => setOpenMeterRow(openMeterRow === tune.id ? null : tune.id)}
       >
         {tune.meter}
       </span>
     </TooltipTrigger>
     <TooltipContent>
       <p>{tune.meter}</p>
     </TooltipContent>
   </Tooltip>
   ```

   The open/onOpenChange pattern lets desktop hover work while the onClick toggles on mobile. Using a single shared openMeterRow state ensures only one tooltip is shown at a time across all rows.

Remove any `title=` attribute on the meter cell — it does nothing on iOS.
  </action>
  <verify>
    <automated>grep -c "TooltipTrigger" /data/home/psalter/src/components/TuneTable.tsx</automated>
  </verify>
  <done>TuneTable.tsx has no title= on meter cells; Tooltip wraps meter text; openMeterRow state is declared; file compiles (npx tsc --noEmit --project /data/home/psalter/tsconfig.json passes for this file).</done>
</task>

<task type="auto">
  <name>Task A3: T7 — wire lyrics into SelectPsalmDialog search + fetchPsalmsByMeter</name>
  <files>src/db/queries/psalms.ts, src/components/SelectPsalmDialog.tsx, src/components/PsalmsByTuneSection.tsx</files>
  <action>
**src/db/queries/psalms.ts** — in `fetchPsalmsByMeter`, add `lyrics: true` to the columns object so lyrics are fetched:
```ts
columns: { psalmId: true, firstLine: true, lyrics: true },
```
Update the result type annotation and the seen-Map loop to preserve lyrics:
```ts
const result: { id: number; bibleTitle: string | null; firstLine: string | null; lyrics: string | null }[] = []
// Inside loop:
result.push({ id: psalm.id, bibleTitle: psalm.bibleTitle, firstLine: row.firstLine ?? null, lyrics: row.lyrics ?? null })
```

**src/components/SelectPsalmDialog.tsx** — add `lyrics: string | null` to `PsalmOption` interface. In the `filtered` computation, extend the filter condition:
```ts
(p.lyrics ?? '').toLowerCase().includes(trimmed.toLowerCase())
```

**src/components/PsalmsByTuneSection.tsx** — update the `psalmsForMeter` prop type to include `lyrics: string | null` so it matches the updated query return type:
```ts
psalmsForMeter: { id: number; bibleTitle: string | null; firstLine: string | null; lyrics: string | null }[]
```
(SelectPsalmDialog receives this as the `psalms` prop — the type must be consistent end-to-end.)
  </action>
  <verify>
    <automated>grep -c "lyrics" /data/home/psalter/src/components/SelectPsalmDialog.tsx</automated>
  </verify>
  <done>fetchPsalmsByMeter returns lyrics field; SelectPsalmDialog filters on lyrics; PsalmsByTuneSection prop type includes lyrics; no TypeScript errors in these three files.</done>
</task>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- WAVE B — two parallel tasks; no overlap with Wave A files      -->
<!-- ═══════════════════════════════════════════════════════════════ -->

<task type="auto">
  <name>Task B1: T6 — center GlobalSearch overlay vertically</name>
  <files>src/components/GlobalSearch.tsx</files>
  <action>
In GlobalSearch.tsx, find the outermost div (line ~95):
```tsx
className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/70 px-4"
```
Change to:
```tsx
className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
```
Remove `items-start` and `pt-[15vh]`; add `items-center`. This ensures the modal dialog floats in the true vertical centre of the viewport and the dark backdrop is visibly present both above and below the dialog on all screen sizes.
  </action>
  <verify>
    <automated>grep -c "items-center justify-center bg-black" /data/home/psalter/src/components/GlobalSearch.tsx</automated>
  </verify>
  <done>GlobalSearch outer div has items-center and no pt-[15vh]; no items-start on that element.</done>
</task>

<task type="auto">
  <name>Task B2: T8 — extract search-utils, fix renderSnippet, add highlights in GlobalSearch, fix API deduplication</name>
  <files>src/lib/search-utils.ts, src/components/PsalmListingGrid.tsx, src/components/PsalmNumberBox.tsx, src/components/GlobalSearch.tsx, src/app/api/search/route.ts</files>
  <action>
**Step 1 — Create src/lib/search-utils.ts** with the canonical implementations:

```ts
import React from 'react'

/**
 * Extracts a short excerpt from text centred around the first occurrence of query.
 * Returns null if query is not found in text.
 */
export function buildSnippet(text: string | null, query: string, maxLen = 100): string | null {
  if (!text || !query) return null
  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lower.indexOf(lowerQuery)
  if (idx === -1) return null
  const start = Math.max(0, idx - 30)
  const end = Math.min(text.length, start + maxLen)
  let excerpt = text.slice(start, end)
  if (start > 0) excerpt = '…' + excerpt
  if (end < text.length) excerpt = excerpt + '…'
  return excerpt
}

/**
 * Splits snippet around all case-insensitive occurrences of query and wraps
 * matches in <strong>. Uses RegExp test instead of string comparison to avoid
 * failures with gi flag edge cases.
 */
export function renderSnippet(snippet: string, query: string): React.ReactNode {
  if (!query) return React.createElement('span', null, snippet)
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = snippet.split(regex).filter(Boolean)
  const matchRegex = new RegExp(`^${escaped}$`, 'i')
  return React.createElement(
    React.Fragment,
    null,
    ...parts.map((part, i) =>
      matchRegex.test(part)
        ? React.createElement('strong', { key: i }, part)
        : React.createElement('span', { key: i }, part)
    )
  )
}
```

**Step 2 — Update src/components/PsalmListingGrid.tsx**:
- Remove the local `buildSnippet` function definition (lines ~46-58).
- Add import: `import { buildSnippet } from '@/lib/search-utils'`
- The local `renderSnippet` is not defined here (it's in PsalmNumberBox) — no change needed for renderSnippet here.

**Step 3 — Update src/components/PsalmNumberBox.tsx**:
- Remove the local `renderSnippet` function definition (lines ~3-16).
- Add import: `import { renderSnippet } from '@/lib/search-utils'`

**Step 4 — Update src/components/GlobalSearch.tsx**:
- Add import: `import { renderSnippet } from '@/lib/search-utils'`
- In the results list, find the psalm result button. After the `firstLine` span (which renders plain text), add snippet rendering if `result.snippet` is present:
  ```tsx
  {result.snippet && (
    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
      {renderSnippet(result.snippet, query)}
    </p>
  )}
  ```
  Also, where firstLine is rendered inside the psalm result button, wrap it with renderSnippet too:
  ```tsx
  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
    {renderSnippet(result.firstLine ?? '', query)}
  </p>
  ```

**Step 5 — Update src/app/api/search/route.ts**:
- Remove the local `buildSnippet` function definition.
- Add import: `import { buildSnippet } from '@/lib/search-utils'`
- In the text search branch, remove the `seen` Map deduplication. Replace the forEach that uses `seen` with logic that:
  1. Groups rows by psalmId to determine which psalms have multiple versions.
  2. Pushes ALL rows (not just the first per psalmId), appending 'a'/'b' suffixes to slugs for multi-version psalms.

  Replacement logic for the text branch:
  ```ts
  // Group by psalmId to detect multi-version psalms
  const byPsalm = new Map<number, typeof rows>()
  rows.forEach((v) => {
    const pid = v.psalmId
    if (!pid) return
    if (!byPsalm.has(pid)) byPsalm.set(pid, [])
    byPsalm.get(pid)!.push(v)
  })

  byPsalm.forEach((versions, psalmId) => {
    const multiVersion = versions.length > 1
    versions.forEach((v, i) => {
      const suffix = multiVersion ? (i === 0 ? 'a' : 'b') : ''
      const snippet = buildSnippet(v.lyrics, q) ?? buildSnippet(v.firstLine, q)
      const firstLineLower = (v.firstLine ?? '').toLowerCase()
      const relevance = firstLineLower.includes(qLower) ? 2 : 3
      psalmMatches.push({
        type: 'psalm',
        relevance,
        id: psalmId,
        slug: `${psalmId}${suffix}`,
        firstLine: v.firstLine ?? null,
        snippet,
        isRecommended: i === 0,
      })
    })
  })
  ```
  </action>
  <verify>
    <automated>cd /data/home/psalter && npx tsc --noEmit 2>&1 | tail -20</automated>
  </verify>
  <done>src/lib/search-utils.ts exists and exports buildSnippet and renderSnippet; PsalmListingGrid and PsalmNumberBox and GlobalSearch and the API route all import from search-utils rather than defining their own copies; TypeScript compilation passes with no errors in these files; API route no longer deduplicates by psalmId.</done>
</task>

</tasks>

<verification>
After both waves complete:

1. TypeScript compile check:
   ```bash
   cd /data/home/psalter && npx tsc --noEmit 2>&1 | grep -v node_modules | head -30
   ```
   Must produce no errors.

2. Dev build smoke check (or check running container):
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/psalms
   ```
   Must return 200.

3. Commit Wave A tasks (A2, A3) and Wave B tasks (B1, B2) in a single follow-up commit after Wave A1 commit:
   ```bash
   git add src/components/TuneTable.tsx src/db/queries/psalms.ts src/components/SelectPsalmDialog.tsx src/components/PsalmsByTuneSection.tsx src/components/GlobalSearch.tsx src/lib/search-utils.ts src/components/PsalmListingGrid.tsx src/components/PsalmNumberBox.tsx src/app/api/search/route.ts
   git commit -m "fix(ui): meter tooltip, search overlay centering, lyrics search, search bug fixes (T5-T8)"
   git push
   ```

4. Playwright smoke test — visit psalter.gsdlabs.dev and verify:
   - Tune detail page shows "Tune (CM): Name" format
   - Mobile /psalms/{id} Sing tab: score image sticks at top while lyrics scroll
   - /tunes page: tapping a meter value shows a tooltip
   - Cmd/Ctrl+K search overlay appears centred vertically
   - Type "wrath" in /psalms grid — matching psalm boxes appear with "wrath" bolded in snippet
</verification>

<success_criteria>
- All 3 WIP files committed (T2, T4 complete)
- Mobile Sing tab no longer has the height-constraint wrapper — score sticks, lyrics scroll freely
- Meter cells in TuneTable have shadcn Tooltip instead of title= attribute
- GlobalSearch overlay is vertically centred with dark backdrop visible above and below
- Typing a lyric word in SelectPsalmDialog returns psalm matches
- PsalmListingGrid text search finds psalms by lyric content
- renderSnippet bolds exactly the matched substring — no random character bolding
- GlobalSearch results show bolded keyword in firstLine and snippet
- Search API returns both 23a and 23b (a/b psalm versions) when lyrics of both match
- src/lib/search-utils.ts is the single source of truth for buildSnippet and renderSnippet
- TypeScript compilation clean
- Changes pushed to GitHub
</success_criteria>

<output>
After completion, note any issues or deviations in a brief comment at the end of this PLAN.md file. No separate SUMMARY.md needed for quick tasks.
</output>
