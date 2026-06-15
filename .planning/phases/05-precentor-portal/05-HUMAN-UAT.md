---
status: partial
phase: 05-precentor-portal
source: [05-VERIFICATION.md]
started: 2026-06-15T09:10:41Z
updated: 2026-06-15T09:10:41Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Set Creation + Navigation
expected: Click "New Set" on /precent, submit the form with a date and type; confirm browser navigates to /precent/[new-id] and the new set detail page loads.
result: [pending]

### 2. Drag-Reorder Persistence
expected: Drag a psalm row in the set detail table to a different position, then reload the page; confirm the order persisted in the database (items appear in the new order).
result: [pending]

### 3. PsalmPickerModal + TunePickerModal Flow
expected: Click "Add Psalm" in a set detail page; pick a psalm and enter a verse range; click "Add to Set". Then click the tune cell on a set item and select a tune with a different meter; confirm the amber "Meter mismatch" badge appears on that row.
result: [pending]

### 4. Meter Mismatch Tooltip
expected: Hover the amber meter mismatch badge on a mismatched row; confirm tooltip text shows both psalm and tune meter labels explaining the mismatch.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
