---
phase: quick-20260511-ui-fixes-batch4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/PsalmTabs.tsx
  - src/components/PsalmNotationPlayer.tsx
  - src/components/TuneTable.tsx
  - src/components/PsalmListingGrid.tsx
  - src/components/TuneGrid.tsx
  - src/components/GlobalSearch.tsx
  - src/components/SelectPsalmDialog.tsx
  - src/components/ui/popover.tsx
autonomous: true
requirements: [UI-BATCH4]

must_haves:
  truths:
    - "No transparent gap between mobile sticky tab bar and score image"
    - "Score image alone sticks after scrolling past tune header; tune name and toggles scroll away"
    - "Meter cell shows abbreviation (e.g. CM) with full meter in a mobile-friendly Popover"
    - "Search bar on /psalms and filter row on /tunes stick below the site header while scrolling"
    - "GlobalSearch modal uses Dialog portal — renders correctly inside sticky parent contexts"
    - "SelectPsalmDialog shows matched lyrics snippet with query highlighted when lyrics match"
  artifacts:
    - path: src/components/PsalmTabs.tsx
      provides: Gap-fill sibling div after sticky tab bar
    - path: src/components/PsalmNotationPlayer.tsx
      provides: Progressive sticky — IntersectionObserver triggers imgSticky state
    - path: src/components/TuneTable.tsx
      provides: Popover replaces Tooltip for meter cell; abbreviation shown in trigger
    - path: src/components/ui/popover.tsx
      provides: shadcn Popover primitive (new file)
    - path: src/components/PsalmListingGrid.tsx
      provides: Sticky wrapper around search bar + Advanced Filters toggle
    - path: src/components/TuneGrid.tsx
      provides: Sticky wrapper around meter/mood filter row
    - path: src/components/GlobalSearch.tsx
      provides: Dialog-based modal replacing fixed div overlay
    - path: src/components/SelectPsalmDialog.tsx
      provides: Lyrics snippet with highlighted query shown for lyric matches
  key_links:
    - from: PsalmNotationPlayer.tsx
      to: tuneHeaderRef
      via: IntersectionObserver on tune header div
      pattern: "tuneHeaderRef\\.current"
    - from: GlobalSearch.tsx
      to: Dialog
      via: "open/onOpenChange props wired to open prop and onClose callback"
      pattern: "Dialog.*open=\\{open\\}"
---

<objective>
UI fixes batch 4: five independent polish items across psalm detail, tune table, listing pages, and global search.

Purpose: Close gaps introduced in previous batches — literal layout gap (T4), mobile touch tooltip (T5), sticky usability (A3, TuneGrid), Dialog correctness (T6), and lyrics preview (T7).
Output: Seven modified files + one new shadcn primitive (popover.tsx). No new routes or DB changes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
</context>

<interfaces>
<!-- Key facts extracted from source files for executor reference. No codebase exploration needed. -->

PsalmTabs.tsx line 489-507:
  The mobile sticky tab bar is the `div` with ref={mobileTabsRef}.
  Current classes include `mb-4 sticky top-14 z-10 bg-background`.
  The gap fix: remove `mb-4` from this div; add `<div className="h-4 bg-background" />` as a sibling
  IMMEDIATELY after the closing `</div>` of the tab bar div (before `<TabsContent value="sing">`).

PsalmNotationPlayer.tsx — score section structure (lines 183-368):
  `scoreSection` is a JSX fragment (`<>...</>`). Inside it, in order:
    1. Tune header div (line 186) — `<div className="flex items-center gap-2 flex-wrap">`
    2. Embedded recording section (conditional, line 215)
    3. Controls div (line 244) — Staff/Solfège/Lyrics toggles + A±
    4. Score area (conditional, line 302) — AbcRenderer or Image divs

  The outer render (lines 447-463) wraps scoreSection in:
    `<div className={stickyScoreMode ? 'flex-shrink-0 space-y-3' : mobileStickyScore ? 'sticky top-[6.5rem] z-10 bg-background pb-2 space-y-3' : 'space-y-3'}>`

  Progressive sticky changes:
  - Add `useRef` to imports (line 3: `import { useState, useEffect, useRef } from 'react'`)
  - Add `tuneHeaderRef = useRef<HTMLDivElement>(null)` after existing state declarations
  - Add `const [imgSticky, setImgSticky] = useState(false)`
  - Add IntersectionObserver useEffect after the existing useEffects
  - In scoreSection JSX: add `ref={tuneHeaderRef}` to the tune header div at line 186
  - The score area wrapper div (lines 302-366) gains conditional sticky classes when imgSticky
  - The OUTER scoreSection wrapper div (line 449): remove mobileStickyScore branch entirely,
    leaving just: `stickyScoreMode ? 'flex-shrink-0 space-y-3' : 'space-y-3'`

TuneTable.tsx meter cell (line 468-479):
  Currently: `<Tooltip open={openMeterRow === tune.id} onOpenChange={...}>` wrapping a Badge.
  Replace entirely with a Popover. The `openMeterRow` state (line 64) can be removed.
  Trigger text: `tune.meter.split(' ')[0]` (the abbreviation, e.g. "CM").
  Popover content: full `tune.meter` string.

src/components/ui/popover.tsx — MISSING, must be created.
  Standard shadcn Radix pattern:
  ```tsx
  'use client'
  import * as PopoverPrimitive from '@radix-ui/react-popover'
  import { cn } from '@/lib/utils'
  const Popover = PopoverPrimitive.Root
  const PopoverTrigger = PopoverPrimitive.Trigger
  const PopoverContent = React.forwardRef<...>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset}
        className={cn('z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ...', className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ))
  export { Popover, PopoverTrigger, PopoverContent }
  ```
  Check if @radix-ui/react-popover is in package.json; if not, install it.

PsalmListingGrid.tsx search bar area (lines 141-183):
  The outer `<div className="space-y-4">` wraps everything.
  Change the search `<div className="relative">` at line 144 and the Advanced Filters
  `<div>` at line 169 to live inside a single sticky wrapper:
  ```tsx
  <div className="sticky top-14 z-20 bg-background py-2 -mx-4 px-4 space-y-2">
    {/* search bar relative div */}
    {/* Advanced Filters toggle div */}
  </div>
  ```
  The Advanced Filters PANEL (the `advancedOpen &&` block at line 184) stays inside this sticky div.
  The grid below (psalm grid) is NOT in the sticky wrapper.

TuneGrid.tsx filter row (line 82):
  `<div className="flex flex-wrap items-center gap-3 mb-6">` becomes:
  `<div className="flex flex-wrap items-center gap-3 sticky top-14 z-20 bg-background py-3 -mx-4 px-4 mb-0">`

GlobalSearch.tsx:
  Current: `if (!open) return null` guard at line 90; outer `div.fixed.inset-0` at line 96.
  New structure:
  ```tsx
  import { Dialog, DialogContent } from '@/components/ui/dialog'
  // Remove: if (!open) return null
  // Remove: outer fixed div + its onClick={onClose}
  // Remove: inner div stopPropagation
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl p-0 gap-0 flex flex-col max-h-[80vh] overflow-hidden [&>button]:hidden">
        {/* keep: search input div as-is */}
        {/* keep: results div as-is */}
        {/* keep: footer hint div as-is */}
      </DialogContent>
    </Dialog>
  )
  ```
  Note: `[&>button]:hidden` hides the default DialogContent close button (the X icon added by shadcn).
  The GlobalSearch has its own X button inside the search input row — keep that.
  Remove the `onKeyDown` handler from the outer container (it's on the input which stays).
  The autoFocus on the input handles focus — no change needed there.

SelectPsalmDialog.tsx:
  buildSnippet signature: `buildSnippet(text: string | null, query: string, maxLen = 100): string | null`
  renderSnippet signature: `renderSnippet(snippet: string, query: string): React.ReactNode`
  Both exported from `@/lib/search-utils`.
  The `psalm.lyrics` field already exists on `PsalmOption` (line 13 of SelectPsalmDialog.tsx).
  Replace line 94 (the `<span className="font-medium truncate">`) with the IIFE snippet logic
  described in the task description. Import both from `@/lib/search-utils`.
</interfaces>

<tasks>

<task type="auto">
  <name>Task A1: Fix mobile gap + implement progressive sticky score image</name>
  <files>src/components/PsalmTabs.tsx, src/components/PsalmNotationPlayer.tsx</files>
  <action>
    **PsalmTabs.tsx — gap fix:**
    In the mobile sticky tab bar div (the one with ref={mobileTabsRef}), remove `mb-4` from its className.
    After the closing tag of that div (before `<TabsContent value="sing">`), insert:
    `<div className="h-4 bg-background" />`

    **PsalmNotationPlayer.tsx — progressive sticky:**
    1. Update the import on line 3 to include `useRef`: `import { useState, useEffect, useRef } from 'react'`

    2. After the `lyricsSize` state declaration block (after line ~101), add:
       ```ts
       const tuneHeaderRef = useRef<HTMLDivElement>(null)
       const [imgSticky, setImgSticky] = useState(false)
       ```

    3. After the existing `useEffect` for lyricsSize (after line ~109), add:
       ```ts
       useEffect(() => {
         if (!mobileStickyScore || !tuneHeaderRef.current) return
         const observer = new IntersectionObserver(
           ([entry]) => setImgSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
           { threshold: 0 }
         )
         observer.observe(tuneHeaderRef.current)
         return () => observer.disconnect()
       }, [mobileStickyScore])
       ```

    4. In `scoreSection`, add `ref={tuneHeaderRef}` to the tune header div:
       `<div ref={tuneHeaderRef} className="flex items-center gap-2 flex-wrap">`

    5. The score area block (`{viewMode !== 'lyrics' && (...)}`  starting at line 302) — wrap the
       outermost `<>` fragment inside a div that gains sticky classes when imgSticky:
       ```tsx
       <div className={mobileStickyScore && imgSticky ? 'sticky top-[6rem] z-10 bg-background pb-2' : ''}>
         {viewMode !== 'lyrics' && (
           /* existing content unchanged */
         )}
       </div>
       ```

    6. In the outer render (lines 449-455), change the scoreSection wrapper div:
       Remove the `mobileStickyScore` ternary branch entirely.
       New className logic: `stickyScoreMode ? 'flex-shrink-0 space-y-3' : 'space-y-3'`
       i.e.:
       ```tsx
       <div className={stickyScoreMode ? 'flex-shrink-0 space-y-3' : 'space-y-3'}>
         {scoreSection}
       </div>
       ```
  </action>
  <verify>
    Build passes: `cd /data/home/psalter && npm run build 2>&1 | tail -20`
    Manual: On mobile viewport at /psalms/1, scroll down — no transparent gap between tab bar and score; after scrolling past tune name+toggles, only the score image sticks.
  </verify>
  <done>No TypeScript errors; h-4 bg-background sibling div present in PsalmTabs; IntersectionObserver effect present in PsalmNotationPlayer; outer sticky removed from scoreSection wrapper.</done>
</task>

<task type="auto">
  <name>Task A2: Popover for meter cell + sticky bars on /psalms and /tunes</name>
  <files>src/components/ui/popover.tsx, src/components/TuneTable.tsx, src/components/PsalmListingGrid.tsx, src/components/TuneGrid.tsx</files>
  <action>
    **1. Create src/components/ui/popover.tsx:**
    First check if @radix-ui/react-popover is installed:
    `grep '"@radix-ui/react-popover"' /data/home/psalter/package.json`
    If missing: `cd /data/home/psalter && npm install @radix-ui/react-popover`

    Create the file:
    ```tsx
    'use client'

    import * as React from 'react'
    import * as PopoverPrimitive from '@radix-ui/react-popover'
    import { cn } from '@/lib/utils'

    const Popover = PopoverPrimitive.Root
    const PopoverTrigger = PopoverPrimitive.Trigger
    const PopoverAnchor = PopoverPrimitive.Anchor

    const PopoverContent = React.forwardRef<
      React.ElementRef<typeof PopoverPrimitive.Content>,
      React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
    >(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Portal>
    ))
    PopoverContent.displayName = PopoverPrimitive.Content.displayName

    export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent }
    ```

    **2. TuneTable.tsx — replace Tooltip with Popover:**
    - Remove the Tooltip import (line 3).
    - Add: `import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"`
    - Remove the `openMeterRow` useState declaration (line 64).
    - Find the meter cell block (lines 468-479). Replace the entire Tooltip wrapper with:
      ```tsx
      {tune.meter ? (
        <Popover>
          <PopoverTrigger asChild>
            <span className="cursor-pointer text-xs underline decoration-dotted">
              {tune.meter.split(' ')[0]}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 text-xs" side="top">
            {tune.meter}
          </PopoverContent>
        </Popover>
      ) : null}
      ```
    - Remove any remaining references to `openMeterRow` and `setOpenMeterRow`.

    **3. PsalmListingGrid.tsx — sticky search + filters:**
    Wrap the search bar div (line 144) and the Advanced Filters toggle div (line 169) together
    in a sticky container. The resulting structure inside the outer `<div className="space-y-4">`:
    ```tsx
    <div className="sticky top-14 z-20 bg-background py-2 -mx-4 px-4 space-y-2">
      {/* search bar: <div className="relative">...</div> */}
      {/* Advanced Filters toggle + panel: <div>...</div> */}
    </div>
    {/* psalm grid follows — NOT in sticky div */}
    ```
    The Advanced Filters PANEL (the `advancedOpen &&` block) stays inside the sticky wrapper
    as part of the Filters toggle `<div>`.

    **4. TuneGrid.tsx — sticky filter row:**
    Change `<div className="flex flex-wrap items-center gap-3 mb-6">` to:
    `<div className="flex flex-wrap items-center gap-3 sticky top-14 z-20 bg-background py-3 -mx-4 px-4 mb-0">`
  </action>
  <verify>
    `cd /data/home/psalter && npm run build 2>&1 | tail -20`
    Manual: On /tunes table view, tap a meter abbreviation on mobile — Popover shows full meter. On /psalms scroll down — search bar stays visible. On /tunes grid scroll down — filter selects stay visible.
  </verify>
  <done>popover.tsx exists; TuneTable has no Tooltip import and no openMeterRow state; PsalmListingGrid search row is inside sticky div; TuneGrid filter row has sticky classes.</done>
</task>

<task type="auto">
  <name>Task B1+B2: Convert GlobalSearch to Dialog + lyrics snippet in SelectPsalmDialog</name>
  <files>src/components/GlobalSearch.tsx, src/components/SelectPsalmDialog.tsx</files>
  <action>
    **GlobalSearch.tsx — Dialog refactor:**
    1. Add import: `import { Dialog, DialogContent } from '@/components/ui/dialog'`
    2. Remove the `if (!open) return null` guard (line 90).
    3. Replace the outer `<div className="fixed inset-0 ...">` and the inner content `<div>` with:
       ```tsx
       return (
         <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
           <DialogContent className="max-w-xl p-0 gap-0 flex flex-col max-h-[80vh] overflow-hidden [&>button]:hidden">
             {/* Search input */}
             <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
               ... (unchanged inner content)
             </div>
             {/* Results */}
             {query.trim() && (
               <div className="flex-1 overflow-y-auto">
                 ... (unchanged)
               </div>
             )}
             {/* Footer hint */}
             {!query.trim() && (
               <div className="px-4 py-3 text-xs text-muted-foreground">
                 Type a psalm number, keyword, or tune name
               </div>
             )}
           </DialogContent>
         </Dialog>
       )
       ```
    4. The `onKeyDown` handler stays on the `<input>` element — no change needed.
    5. The `autoFocus` on the input stays — no change needed.
    6. The `[&>button]:hidden` Tailwind selector suppresses the auto-added close X button
       from DialogContent (GlobalSearch has its own X in the input row).

    **SelectPsalmDialog.tsx — lyrics snippet:**
    1. Add import at top: `import { buildSnippet, renderSnippet } from '@/lib/search-utils'`
    2. In the results list, find the button at line ~88 and replace the `<span className="font-medium truncate">` display line (line 94) with:
       ```tsx
       {(() => {
         if (!trimmed) return (
           <span className="font-medium truncate">
             {psalm.firstLine ?? psalm.bibleTitle ?? `Psalm ${psalm.id}`}
           </span>
         )
         const lyricsSnippet = buildSnippet(psalm.lyrics ?? '', trimmed)
         if (lyricsSnippet) return (
           <span className="font-medium truncate">
             {renderSnippet(lyricsSnippet, trimmed)}
           </span>
         )
         return (
           <span className="font-medium truncate">
             {renderSnippet(psalm.firstLine ?? psalm.bibleTitle ?? `Psalm ${psalm.id}`, trimmed)}
           </span>
         )
       })()}
       ```
    Note: `trimmed` is already declared at line 32 in SelectPsalmDialog.tsx — reuse it.
  </action>
  <verify>
    `cd /data/home/psalter && npm run build 2>&1 | tail -20`
    Manual: Open GlobalSearch (Cmd+K) — modal appears with correct backdrop, dismisses on outside click. In SelectPsalmDialog (from a tune page), type a lyric keyword — matching result shows the lyric snippet with keyword highlighted rather than firstLine.
  </verify>
  <done>GlobalSearch has no fixed div; Dialog import present; SelectPsalmDialog imports buildSnippet and renders IIFE snippet logic; build passes with zero type errors.</done>
</task>

</tasks>

<verification>
`cd /data/home/psalter && npm run build` passes with no TypeScript errors.

Spot checks via Playwright or manual browser at psalter.gsdlabs.dev:
- /psalms/1 mobile: tab bar sticks, score image sticks progressively, no gap
- /tunes table: meter cell shows abbreviation, Popover opens on tap
- /psalms scroll: search bar remains visible
- /tunes grid scroll: meter/mood selects remain visible
- GlobalSearch (Cmd+K): correct modal behaviour
- Tune page "Select Psalm" dialog: lyric snippets shown when query matches lyrics
</verification>

<success_criteria>
- npm run build exits 0
- No `mb-4` on mobile tab bar div; h-4 bg-background sibling present in PsalmTabs
- IntersectionObserver watches tuneHeaderRef in PsalmNotationPlayer; outer sticky removed from scoreSection wrapper
- Tooltip import gone from TuneTable; openMeterRow state removed; Popover renders meter abbreviation
- src/components/ui/popover.tsx exists
- PsalmListingGrid search + filters wrapped in sticky top-14 z-20 div
- TuneGrid filter row has sticky top-14 z-20 classes
- GlobalSearch renders Dialog, not fixed div
- SelectPsalmDialog imports and uses buildSnippet/renderSnippet
</success_criteria>

<output>
After completion, create `.planning/quick/20260511-ui-fixes-batch4/20260511-ui-fixes-batch4-SUMMARY.md`
</output>
