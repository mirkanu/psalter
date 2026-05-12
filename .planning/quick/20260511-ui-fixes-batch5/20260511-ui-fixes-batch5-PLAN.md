---
quick_id: 20260511-ui-fixes-batch5
status: in-progress
date: 2026-05-11
---

# Quick Task: UI Fixes Batch 5

## Tasks

### T4-fix: Progressive sticky score on mobile
- **Problem**: IntersectionObserver approach never fires correctly; `boundingClientRect.top < 0` check fails when element is behind nav bar
- **Fix**: Replace with scroll event listener checking `tuneHeaderRef.current.getBoundingClientRect().bottom < 80` (nav=56px + buffer)
- **File**: `src/components/PsalmNotationPlayer.tsx`

### Tunes sticky search bar
- **Problem**: Batch 4 sticky applied to TuneGrid.tsx but /tunes page uses TuneTable.tsx
- **Fix**: Wrap search bar + Advanced Filters toggle in `sticky top-14 z-20 bg-background py-2 -mx-4 px-4`
- **File**: `src/components/TuneTable.tsx`

### Psalm list: 5 books grouping + Psalm 119 sub-section + mobile vertical tabs + text fix
- **Books**: I (1-41), II (42-72), III (73-89), IV (90-106), V (107-150)
- **Grouping**: Only when query is empty AND no meter filter; flat otherwise
- **Ps 119**: Sub-section within Book V; show "1-8", "9-16" labels (strip "119:")
- **Mobile tabs**: Fixed right sidebar with range labels (1–41, 42–72, etc.), scrolls to section
- **Text**: "N psalms" → "N versifications"
- **File**: `src/components/PsalmListingGrid.tsx`
