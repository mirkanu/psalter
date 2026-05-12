---
quick_id: 20260511-ui-fixes-batch5
status: complete
date: 2026-05-11
commits:
  - 75acead
---

# Quick Task: UI Fixes Batch 5

## What was done

**Commit 75acead** — T4 + tunes sticky + book sections + versifications

**T4 fix — progressive sticky score on mobile:**
- Replaced IntersectionObserver (condition `!isIntersecting && top < 0` never fired when element hid behind nav) with a `scroll` event listener checking `tuneHeaderRef.current.getBoundingClientRect().bottom < 80`
- Score image goes sticky on mobile once tune header's bottom edge scrolls above 80px (nav height + buffer)
- File: `src/components/PsalmNotationPlayer.tsx`

**Tunes sticky search bar:**
- Batch 4 had applied sticky to `TuneGrid.tsx` but `/tunes` page uses `TuneTable.tsx` — fixed by wrapping TuneTable's search + Advanced Filters in `sticky top-14 z-20 bg-background py-2 -mx-4 px-4`
- File: `src/components/TuneTable.tsx`

**Psalm list — 5 books grouping:**
- Added BOOKS constant (I:1–41, II:42–72, III:73–89, IV:90–106, V:107–150)
- Grouped view rendered when query empty AND no meter filter; flat otherwise
- Each book gets a header: "Book I · · · · · · 1–41"
- Psalm 119 gets its own sub-section (dashed divider) within Book V; labels shortened to "1–8", "9–16" etc.
- File: `src/components/PsalmListingGrid.tsx`

**Mobile vertical book tabs:**
- Fixed right-side stack of 5 buttons (1–41, 42–72, 73–89, 90–106, 107–150)
- Smooth-scroll to corresponding section on click
- Hidden on md+ screens; hidden when search is active (no sections to scroll to)
- `pr-8 md:pr-0` on content div prevents overlap with rightmost boxes

**"versifications" text:**
- "184 psalms" → "184 versifications" (singular/plural both updated)

**Enter key fix:**
- `router.push` now uses `selectedPsalm.slug` instead of `selectedPsalm.id` — fixes broken Enter navigation for Psalm 119 parts

## Verification

- TypeScript: clean
- Playwright (mobile 390px + desktop):
  - "184 versifications" text ✅
  - Book I section id exists ✅
  - 5 book headers rendered ✅
  - Psalm 119 sub-section visible ✅
  - Mobile vertical tabs (1–41) visible ✅
  - Book sections hidden when search active ✅
  - Tunes sticky `.sticky.top-14` visible ✅
  - Psalm 23 page loads correctly ✅
- App rebuilt, restarted, 200 on /psalms
