---
quick_id: 20260511-ui-fixes-batch3
status: complete
date: 2026-05-11
commits:
  - 4230f86
  - 96248f2
  - 133507a
---

# Quick Task: UI Fixes Batch 3

## What was done

Three commits covering 6 tasks (T2, T4, T5, T6, T7, T8):

**Commit 4230f86** — T2 + T4: Mobile sing tab + tune format
- T2: Tune header now displays "Tune (CM): Name" format (second occurrence, line ~186 in PsalmNotationPlayer.tsx, was missed in previous batch)
- T4: Mobile Sing tab no longer uses height-constrained `h-[calc(100vh-6.5rem)]` wrapper; switched to `makeSingPanel(false, true)` so score section sticks at top via page scroll (`sticky top-[6.5rem]`) and lyrics scroll freely via normal page flow

**Commit 96248f2** — T6 + T8: Search overlay centering + search bug fixes
- T6: GlobalSearch overlay changed from `items-start pt-[15vh]` to `items-center` — dark backdrop now visible above and below the dialog
- T8a: PsalmListingGrid filter logic investigated — search reaches lyrics field
- T8b: renderSnippet uses `matchRegex.test(part)` instead of `.toLowerCase()` string comparison — fixes random bolding of wrong chars
- T8c: GlobalSearch results now wrap firstLine and snippet with renderSnippet to show bolded keywords
- T8d: Search API no longer deduplicates by psalmId — multi-version psalms (a/b) preserved with correct slugs
- T8e: Extracted shared `buildSnippet`/`renderSnippet` to `src/lib/search-utils.ts`; PsalmListingGrid, PsalmNumberBox, GlobalSearch, and API route all import from there

**Commit 133507a** — T5 + T7: Meter tooltip + lyrics search
- T5: TuneTable meter cells use shadcn Tooltip (open/onOpenChange + onClick) instead of `title=` attribute — works on mobile tap
- T7: `fetchPsalmsByMeter` now fetches `lyrics` column; SelectPsalmDialog filters on lyrics; PsalmsByTuneSection prop type updated

## Verification

- TypeScript: clean (no errors)
- Playwright: T2 (tune format) ✅, T6 (overlay centering) ✅, T8b (snippet bolding) ✅, T8d (search API) ✅
- App rebuilt and restarted — psalter.gsdlabs.dev serving new code

## Deviations

- Wave A executor used shadcn Tooltip via `@/components/ui/tooltip` and created a `Providers.tsx` client wrapper + `TooltipProvider` in app layout — necessary since Next.js App Router RSC layout can't use client hooks directly
