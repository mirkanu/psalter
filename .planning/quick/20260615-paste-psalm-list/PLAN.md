---
slug: paste-psalm-list
status: in_progress
---

# Quick Task: Paste Psalm List Parser

Add a "Paste List" button to the precent set detail page that parses a pasted string like "11:1-7; 24:1-5; 55:4-11; 72:9-14" and batch-adds those psalms with verse ranges to the set.

## Tasks
1. Create `PastePsalmsDialog.tsx` component with textarea, fuzzy regex parser, live preview, and batch submit
2. Add "Paste List" button + dialog wiring to `SetDetail.tsx`
