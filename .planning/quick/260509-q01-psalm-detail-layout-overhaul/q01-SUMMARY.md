---
quick_id: q01
slug: psalm-detail-layout-overhaul
date: 2026-05-09
status: complete
commit: eebcbbb
---

# Summary: Psalm Detail Layout Overhaul

## What Changed

**page.tsx** (`src/app/psalms/[id]/page.tsx`):
- H1 now renders "Psalm {id}" (bold, large); bibleTitle moves to muted subtitle `<p>`
- Removed notation grid, SoundCloud iframe, and `<hr>` divider — all moved into PsalmTabs
- Removed unused `PsalmNotationPlayerClient` import and `lyrics`/`primaryVersion` variables

**PsalmTabs.tsx** (`src/components/PsalmTabs.tsx`):
- Fully restructured into two layout branches:
  - Mobile (`md:hidden`): `Tabs(defaultValue="sing")` with scrollable top tab list (Sing first) + all tab contents + sticky bottom nav
  - Desktop/landscape (`hidden md:grid grid-cols-2`): left = always-visible Sing panel, right = `Tabs(defaultValue="overview")` with 7 tabs
- Extracted shared content into inline components: `OverviewContent`, `DaysContent`, `StudyContent`, `MessianicContent`, `ParallelContent`, `BackupTunesContent`
- Sing panel includes `PsalmNotationPlayerClient` + SoundCloud iframe (when available)
- `md:` breakpoint (768px) triggers split — covers desktop AND landscape iPhone 13 Pro (844px)

## Verified

- TypeScript: 0 errors
- Build: clean (all 150 psalm pages statically generated)
- Desktop (1280px): split layout, Psalm 100 H1, A Psalm of praise subtitle, Overview tab active
- Mobile (390px): Sing tab first + selected, notation visible, sticky bottom nav present
- Landscape (844px): split layout active (display: grid confirmed)
