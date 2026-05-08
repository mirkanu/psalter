---
status: partial
phase: 02-public-browse
source: [02-VERIFICATION.md]
started: 2026-05-08T07:30:00.000Z
updated: 2026-05-08T07:30:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Psalm grid client-side filtering
expected: Visit /psalms, use book and meter dropdowns. Instant client-side filter with AND composition, no page reload.
result: [pending]

### 2. Tab switching on psalm detail
expected: Visit /psalms/23, click each tab. URL updates to ?tab=lyrics via router.replace without full navigation; refreshing with ?tab=lyrics opens to that tab.
result: [pending]

### 3. Daily plan today highlight and auto-scroll
expected: Visit /daily. Day 128 row has left border accent + "Today" badge + page auto-scrolls to it via DailyPlanClient useEffect.
result: [pending]

### 4. Homepage TodayCard correct day
expected: Visit /. Shows "Day 128 of 365" with link to correct psalm (today = 2026-05-08).
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
