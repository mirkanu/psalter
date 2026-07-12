---
phase: quick-260712-tmm
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/notation/NotationRenderer.tsx
  - src/db/queries/tunes.ts
  - src/components/singing/SingingView.tsx
  - src/app/psalms/[id]/page.tsx
  - src/app/precent/[id]/sing/[pos]/page.tsx
autonomous: true
requirements: [QUICK-260712-tmm-a, QUICK-260712-tmm-b]

must_haves:
  truths:
    - "Desktop split-leaf Solfège: the scanned JPG occupies at most 50% of the psalm viewport height, leaving lyrics a guaranteed >=50%."
    - "Mobile split-leaf Solfège 50/50 cap is unchanged (still capped)."
    - "Split-leaf Staff desktop layout is byte-identical to before this change (still uncapped / md:max-h-none preserved — no 260712-kov regression)."
    - "Switching tune via the in-app tune switcher updates the Solfège JPG (and its multi-page thumbnail array) to the newly selected tune, on both /psalms/[id] and /precent/[id]/sing/[pos]."
    - "Staff notation still updates correctly on tune switch (unchanged)."
    - "fetchTunesByMeter returns tunes with real staffPages/solfegePages populated, so ALL its consumers (including /psalms/[id]/study) stay type-safe with no undefined arrays."
  artifacts:
    - path: "src/components/notation/NotationRenderer.tsx"
      provides: "renderSplitLeaf differentiates Solfège (desktop 50% cap) from Staff (desktop uncapped)"
      contains: "renderSplitLeaf"
    - path: "src/db/queries/tunes.ts"
      provides: "AlternateTune type carries per-tune staffPages/solfegePages arrays AND fetchTunesByMeter populates them via deriveTuneJpgPages (centralised, so every caller gets real values)"
      contains: "staffPages"
    - path: "src/components/singing/SingingView.tsx"
      provides: "Derives active tune's page arrays from activeTune (not stale server props)"
      contains: "activeTune"
    - path: "src/app/psalms/[id]/page.tsx"
      provides: "Populates staffPages/solfegePages for primaryTune AND every alternateTune"
    - path: "src/app/precent/[id]/sing/[pos]/page.tsx"
      provides: "Populates staffPages/solfegePages for primaryTune AND every alternateTune"
  key_links:
    - from: "src/components/singing/SingingView.tsx"
      to: "NotationRendererClient solfegePages prop"
      via: "activeTune.solfegePages derivation"
      pattern: "activeTune\\??\\.(solfege|staff)Pages"
    - from: "src/components/notation/NotationRenderer.tsx renderSplitLeaf"
      to: "Solfège split-leaf call site"
      via: "cap-notation-half flag"
      pattern: "renderSplitLeaf\\("
    - from: "src/db/queries/tunes.ts fetchTunesByMeter"
      to: "AlternateTune.staffPages/solfegePages"
      via: "deriveTuneJpgPages per-row map"
      pattern: "deriveTuneJpgPages"
---

<objective>
Fix two UAT-confirmed bugs in the split-leaf Solfège (scanned JPG) view.

Purpose:
- (a) On desktop, the Solfège JPG currently fills ~85% of the psalm viewport
  (measured 672.5px of ~787px available). It must cap at max 50% of the
  viewport's vertical space — the same 50/50 split already enforced on mobile —
  guaranteeing lyrics a minimum 50%.
- (b) Switching tune while staying on the same psalm (via the in-app tune
  switcher) fails to update the Solfège JPG — it keeps showing the PREVIOUS
  tune's scanned image, because the `staffPages`/`solfegePages` page arrays are
  computed ONCE server-side for the page's original `primaryTune` and never
  recomputed for a client-side tune switch.

Output: renderSplitLeaf differentiates Solfège from Staff for the desktop cap;
per-tune page arrays are threaded through so `activeTune` always drives the
correct JPG on both public and precenting singing views.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

<diagnosis>
ROOT CAUSES ARE CONFIRMED — do NOT re-derive. Implement directly.

Bug (a) — src/components/notation/NotationRenderer.tsx `renderSplitLeaf()` (~1088-1110):
The helper is SHARED by both `staff-split` and `solfege-split`. In chromeless
mode both slots use:
  `flex-1 min-h-0 max-h-[50%] overflow-y-auto md:max-h-none md:overflow-visible md:flex-none`
and the wrapper is `flex flex-col h-full gap-4 px-4 pt-4 md:h-auto md:gap-4`.
On desktop the `md:h-auto` wrapper + `md:max-h-none md:flex-none` tokens
EXPLICITLY remove the 50% cap. That is CORRECT for Staff (260712-kov confirmed
byte-identical-to-inline unconstrained desktop geometry) and must NOT change.
For the Solfège JPG it produces the bug (a full-res scan is unconstrained).
NOTE: a percentage `max-h-[50%]` only resolves when the flex parent has a
resolved height. So for Solfège the wrapper must keep `h-full` at ALL widths
(drop `md:h-auto`), AND the notation/stanza slots must drop the
`md:max-h-none md:overflow-visible md:flex-none` overrides — i.e. use the
mobile 50/50 behaviour at every width. SingingView's `<main>` is fixed-height
on desktop (`md:h-[calc(100dvh-116px)]`), so `h-full` resolves correctly.

Bug (b) — page arrays are stale on tune switch:
- src/app/psalms/[id]/page.tsx (~174-179): `activeTunePages` = deriveTuneJpgPages
  for `primaryTune` ONLY, passed as static `staffPages`/`solfegePages` props.
- src/components/singing/SingingView.tsx: forwards those props verbatim to
  NotationRendererClient; `activeTune` changes on client tune switch but the
  page-array props do NOT.
- NotationRenderer.activePages()/currentSrc: whenever the STALE `solfegePages`
  array is non-empty it WINS over `activeTune.solfegeJpgUrl` → wrong tune shown.
  Staff has no such array (reads activeTune.abcNotation directly) → no bug.
- deriveTuneJpgPages is fs-based (Node-only) → cannot run client-side. Fix is
  server-side: compute page arrays for EVERY tune and attach them to each
  TuneOption, then let SingingView read the ACTIVE tune's arrays.
- src/app/precent/[id]/sing/[pos]/page.tsx is a SECOND caller of SingingView
  and has the same gap (it passes NO page props today) — apply the fix there too.

REVISION NOTE (blocker fix): making AlternateTune.staffPages/solfegePages
REQUIRED breaks `fetchTunesByMeter`'s own `Promise<AlternateTune[]>` return
(it builds objects purely from DB columns and never calls the fs-based
deriveTuneJpgPages). It also silently poisons a THIRD, out-of-plan caller
(/psalms/[id]/study/page.tsx → PsalmTabs → ChangeTuneDialog). Both are resolved
by CENTRALISING the deriveTuneJpgPages computation inside fetchTunesByMeter
(Task 2 step 2): every consumer then receives real arrays via `...t` spread with
no per-caller work, mirroring how solfegeOcrText/melismaPositions are already
plain fields on the type.
</diagnosis>

<interfaces>
From src/db/queries/tunes.ts — AlternateTune (= TuneOption via types.ts):
```typescript
export interface AlternateTune {
  id: number
  name: string
  meter: string | null
  abcNotation: string | null
  abcSatb: string | null
  scoreJpgUrl: string | null
  solfegeJpgUrl: string | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
  doubleLength: boolean
  solfegeOcrText: string | null
  melismaPositions: number[][] | null
  phraseShapeOverride: number[] | null
  // ADD: staffPages / solfegePages (full server-derived page arrays,
  // populated inside fetchTunesByMeter via deriveTuneJpgPages)
}
```

From src/lib/tune-jpg-urls.ts (server-only, fs-based):
```typescript
export function deriveTuneJpgPages(
  tuneName: string, maxPages?: number
): { staffPages: string[]; solfegePages: string[] }
```

From src/components/notation/NotationRenderer.tsx:
```typescript
// props already accept staffPages?: string[]; solfegePages?: string[]
function activePages(viewMode, staffPages?, solfegePages?): string[]
// effect already resets pageIndex on [staffPages?.[0], solfegePages?.[0]] change
const [pageIndex, setPageIndex] = useState(0)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Cap the Solfège split-leaf JPG at 50% viewport height on desktop (Bug a)</name>
  <files>src/components/notation/NotationRenderer.tsx</files>
  <action>
Differentiate Solfège from Staff inside `renderSplitLeaf()` (~1088-1110) WITHOUT
touching the Staff branch's desktop geometry (260712-kov confirmed-correct).

1. Add a third parameter to `renderSplitLeaf`, e.g.
   `function renderSplitLeaf(notationSlot: ReactNode, stanzaSlot: ReactNode, capBothHalvesOnDesktop = false): ReactNode`.

2. In the `chromeless` branch, when `capBothHalvesOnDesktop === true`, return a
   variant that keeps the 50/50 cap at ALL widths:
   - Wrapper: `flex flex-col h-full gap-4 px-4 pt-4` (NOTE: NO `md:h-auto` — the
     percentage max-heights need a resolved parent height at desktop widths;
     SingingView's <main> is fixed-height on md so `h-full` resolves).
   - Both slots: `flex-1 min-h-0 max-h-[50%] overflow-y-auto` (NO
     `md:max-h-none md:overflow-visible md:flex-none`).
   - Keep the existing `data-notation-slot` marker on the notation slot div.
   When `capBothHalvesOnDesktop === false` (the default / Staff path), return the
   EXISTING chromeless markup verbatim (wrapper `... md:h-auto md:gap-4`, slots
   with `md:max-h-none md:overflow-visible md:flex-none`) — byte-identical to
   today so Staff desktop is untouched.
   The non-chromeless (grid) return branch is unchanged for both.

3. At the SOLFÈGE split-leaf call sites (~1223 and ~1226 inside the
   `viewMode === 'solfege' || 'solfege-split'` block), pass `true` as the third
   argument: `renderSplitLeaf(notationSlot, stanzaBlock, true)`.
   Leave the STAFF split-leaf call site (~1143) calling
   `renderSplitLeaf(notationBlock, stanzaBlock)` with NO third arg (defaults false).

4. The Solfège `<img>` already uses `isSplit ? 'max-h-full w-auto object-contain mx-auto'`
   — leave it. With the parent now capped at `max-h-[50%]` on desktop, `max-h-full`
   makes the image fit the capped region. No img change needed.

Do NOT alter the Staff notationBlock, its call site, or any Staff-specific class.
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx tsc --noEmit 2>&1 | grep -i "NotationRenderer" | grep -v "^#" | head; echo "typecheck-done"; grep -c "renderSplitLeaf(notationSlot, stanzaBlock, true)" src/components/notation/NotationRenderer.tsx; grep -c "md:h-auto md:gap-4" src/components/notation/NotationRenderer.tsx</automated>
  </verify>
  <done>
`npx tsc --noEmit` reports no new errors in NotationRenderer.tsx. The Solfège
split-leaf call sites pass `true` (capBothHalvesOnDesktop); the Staff call site
and the Staff `md:h-auto md:gap-4` wrapper still exist unchanged. Solfège slots
in the capped variant have no `md:max-h-none` token.
  </done>
</task>

<task type="auto">
  <name>Task 2: Thread per-tune page arrays so tune switch updates the Solfège JPG (Bug b)</name>
  <files>src/db/queries/tunes.ts, src/app/psalms/[id]/page.tsx, src/app/precent/[id]/sing/[pos]/page.tsx, src/components/singing/SingingView.tsx</files>
  <action>
Make the page arrays travel WITH each tune, and have SingingView read the ACTIVE
tune's arrays instead of stale page-level server props.

1. src/db/queries/tunes.ts — extend the `AlternateTune` interface (~85-116) with:
   ```ts
   /** Server-derived (fs) full ordered JPG page arrays for THIS tune. Populated
    *  in fetchTunesByMeter (and each page RSC's primary-tune builder) via
    *  deriveTuneJpgPages so client-side tune switches show the correct multi-page
    *  scan (260712-tmm bug b). Empty = no pages on disk. */
   staffPages: string[]
   solfegePages: string[]
   ```

2. src/db/queries/tunes.ts — populate the new REQUIRED fields INSIDE
   `fetchTunesByMeter` (~118-140) so its `Promise<AlternateTune[]>` return
   satisfies the type, AND so every consumer receives real values for free — this
   is the blocker fix. In particular the out-of-plan caller
   /psalms/[id]/study/page.tsx (→ PsalmTabs → ChangeTuneDialog) gets correct
   arrays via `...t` spread with NO edit needed there.
   - Add `import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'` at the top of
     the file.
   - Change the current filter-only return into filter-THEN-map, attaching the
     arrays per row:
     ```ts
     return rows
       .filter((t) => !PLACEHOLDER_PREFIXES.some((p) => t.name.toLowerCase().startsWith(p)))
       .map((t) => {
         const { staffPages, solfegePages } = deriveTuneJpgPages(t.name)
         return { ...t, staffPages, solfegePages }
       })
     ```
   SAFETY (confirmed): fetchTunesByMeter is a server-only DB query (imports `@/db`)
   invoked ONLY from RSC page components (psalms/[id], psalms/[id]/study, precent
   sing). deriveTuneJpgPages is server-only fs — running it here crosses NO client
   boundary. PsalmTabs is `'use client'` but imports ONLY the AlternateTune TYPE
   (erased at compile time), so the new fs-derived fields never force fs into a
   client bundle.

3. src/app/psalms/[id]/page.tsx:
   - `alternateTunes` map (~106-113): `t` NOW already carries staffPages/
     solfegePages from fetchTunesByMeter. DROP the now-redundant local
     `deriveTuneJpgPages(t.name)` destructure and read the arrays off `t`:
     ```ts
     const alternateTunes = rawAlternateTunes.map((t) => ({
       ...t,
       scoreJpgUrl: t.staffPages[0] ?? t.scoreJpgUrl,
       solfegeJpgUrl: t.solfegePages[0] ?? t.solfegeJpgUrl,
     }))
     ```
     (`...t` carries staffPages/solfegePages forward — do not re-list them.)
   - `primaryTune` builder IIFE (~116-135): this builds from a RAW tune row (NOT
     via fetchTunesByMeter), so it MUST keep its own `deriveTuneJpgPages` call.
     The `{ staffPages, solfegePages }` are ALREADY destructured there — add
     `staffPages,` and `solfegePages,` fields to the returned TuneOption object.
     KEEP the `deriveTuneJpgPages` import (still used here).
   - Remove the now-redundant `activeTunePages` computation (~174-179) and the
     `staffPages={activeTunePages.staffPages}` / `solfegePages={activeTunePages.solfegePages}`
     props on `<SingingView>` (~199-200). SingingView will derive them from activeTune.

4. src/app/precent/[id]/sing/[pos]/page.tsx:
   - `alternateTunes` map (~57-64): same as psalms page — DROP the redundant local
     `deriveTuneJpgPages(t.name)` destructure, read off `t`:
     ```ts
     const alternateTunes = rawAlternateTunes.map((t) => ({
       ...t,
       scoreJpgUrl: t.staffPages[0] ?? t.scoreJpgUrl,
       solfegeJpgUrl: t.solfegePages[0] ?? t.solfegeJpgUrl,
     }))
     ```
   - `buildTuneOption()` (~147-165): builds from a RAW tune row → MUST keep its own
     `deriveTuneJpgPages` call. The `{ staffPages, solfegePages }` are ALREADY
     destructured — add `staffPages,` and `solfegePages,` to the returned
     AlternateTune object. KEEP the `deriveTuneJpgPages` import (still used here).
   - The `<SingingView>` here passes NO page props today — leave it that way
     (SingingView now derives from activeTune).

5. src/components/singing/SingingView.tsx:
   - Remove the `staffPages = []` / `solfegePages = []` props from the destructured
     Props (~94-95) AND from the `Props` interface (~47-50). (They are now carried
     on each TuneOption.)
   - Derive the active tune's arrays near where `activeTune` is defined (~117):
     ```ts
     const activeStaffPages = activeTune?.staffPages ?? []
     const activeSolfegePages = activeTune?.solfegePages ?? []
     ```
   - Pass `staffPages={activeStaffPages}` / `solfegePages={activeSolfegePages}` to
     `<NotationRendererClient>` (~494-495).
   - Update GearPopover's `solfegeAvailable` (~551) to use the derived array:
     `solfegeAvailable={!!(solfegeJpgUrl || activeSolfegePages.length > 0)}`.
   NotationRenderer's existing `useEffect(() => setPageIndex(0), [staffPages?.[0], solfegePages?.[0]])`
   already resets the thumbnail page index when the active tune's first page
   changes — no NotationRenderer change needed.

NOTE — /psalms/[id]/study/page.tsx is NOT in this plan's files_modified and needs
NO change: because step 2 attaches the arrays inside fetchTunesByMeter, that
page's `alternateTunes = rawAlternateTunes.map(...)` carries staffPages/
solfegePages forward via `...t` and stays a valid AlternateTune. Its
NotationRendererClient usage (via PsalmTabs) does not consume page arrays, so
behaviour is unchanged. Do not touch it.
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx tsc --noEmit 2>&1 | grep -v "^#" | grep -iE "tunes\.ts|page\.tsx|SingingView" | head; echo "typecheck-done"; grep -c "activeTune?.staffPages\|activeTune?.solfegePages\|activeStaffPages\|activeSolfegePages" src/components/singing/SingingView.tsx; grep -c "staffPages: string\[\]" src/db/queries/tunes.ts; grep -c "deriveTuneJpgPages" src/db/queries/tunes.ts; grep -c "activeTunePages" src/app/psalms/[id]/page.tsx</automated>
  </verify>
  <done>
`npx tsc --noEmit` passes (no errors in the four edited files NOR in the
untouched study/page.tsx chain). AlternateTune declares `staffPages`/`solfegePages`
and `fetchTunesByMeter` populates them via `deriveTuneJpgPages` (grep count >= 1).
SingingView derives active arrays from `activeTune` and passes them to
NotationRendererClient. `activeTunePages` no longer appears in psalms/[id]/page.tsx
(grep count 0). Both page.tsx callers populate the arrays on every tune (primary +
alternates via `...t`).
  </done>
</task>

</tasks>

<verification>
Full project typecheck must pass:
```
cd /home/services/psalter && npx tsc --noEmit
```
Structural greps (see per-task verify) confirm the Solfège cap flag, the new
type fields, `fetchTunesByMeter`'s centralised deriveTuneJpgPages population, and
the removal of the stale `activeTunePages` mechanism.

LIVE UAT (deferred): The orchestrator is batching ONE rebuild after all pending
quick tasks. Do NOT measure against localhost:3005 in this task. After the
batched rebuild, live verification via the Playwright daemon (http://localhost:3099):
- /psalms/78 desktop (1200x900), Gear → Solfège → Split-Leaf: the rendered
  `<img>` bounding-box height must be <= ~50% of available vertical space
  (was 672.5px of ~787px; expect <= ~394px).
- Same page, open tune switcher, select a DIFFERENT multi-page tune: the
  Solfège JPG `src` must change to the new tune's `-solfege-0.jpg` (not stay on
  the previous tune's scan). Repeat on mobile viewport (375-wide).
- Regression: Staff split-leaf desktop geometry must be visually unchanged.
</verification>

<success_criteria>
- Desktop split-leaf Solfège JPG capped at <=50% viewport height; lyrics get >=50%.
- Mobile split-leaf Solfège cap unchanged.
- Staff split-leaf desktop layout byte-identical to pre-change (260712-kov intact).
- Tune switch updates the Solfège JPG + page thumbnails to the active tune on
  both /psalms/[id] and /precent/[id]/sing/[pos].
- `fetchTunesByMeter` returns tunes with populated staffPages/solfegePages; the
  out-of-plan /psalms/[id]/study chain stays type-safe with zero edits.
- `npx tsc --noEmit` passes.
</success_criteria>

<output>
After completion, create `.planning/quick/260712-tmm-solfege-split-leaf-jpg-cap-at-50-viewpor/260712-tmm-SUMMARY.md`
</output>
</content>
</invoke>
