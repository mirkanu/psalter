---
quick_id: 20260511-ui-fixes-batch4
status: complete
date: 2026-05-11
commits:
  - 4fdcfc6
  - 5775c68
  - cb9b448
---

# Quick Task: UI Fixes Batch 4

## What was done

**Commit 4fdcfc6** — T4: Mobile gap fill + progressive sticky score image
- Removed `mb-4` from sticky tab bar in PsalmTabs.tsx; added `<div className="h-4 bg-background" />` sibling to fill transparent gap
- PsalmNotationPlayer.tsx: added `tuneHeaderRef` + `imgSticky` state + IntersectionObserver; score image area becomes `sticky top-[6rem] z-10 bg-background` only after tune header scrolls out of view; outer scoreSection wrapper no longer sticky by default

**Commit 5775c68** — T6 + T7: GlobalSearch→Dialog, lyrics snippet in psalm selector
- GlobalSearch.tsx: replaced `div.fixed.inset-0` with shadcn `Dialog` + `DialogContent` (uses Portal — correct positioning regardless of sticky parent context); `showCloseButton={false}` suppresses auto-added close button
- SelectPsalmDialog.tsx: shows `bibleTitle` as primary, matched lyrics snippet (via `buildSnippet`) with `renderSnippet` highlight as secondary preview when searching; falls back to `firstLine` when no lyrics match

**Commit cb9b448** — T5 + sticky: Popover meter tooltip + sticky search bars
- TuneTable.tsx: Tooltip replaced with shadcn Popover (click/touch compatible); trigger shows `meter.split(' ')[0]` abbreviation (e.g. "CM", "LM"); full meter in PopoverContent
- Created `src/components/ui/popover.tsx` (standard shadcn/Radix pattern)
- PsalmListingGrid.tsx: search bar + Advanced Filters wrapped in `sticky top-14 z-20 bg-background`
- TuneGrid.tsx: filter row wrapped in `sticky top-14 z-20 bg-background`

## Verification

- TypeScript: clean
- Playwright: GlobalSearch renders as Dialog ✅, meter abbreviation "CM" shown ✅, Popover opens on click ✅, sticky classes applied ✅, app serves 200 ✅
- App rebuilt and restarted
