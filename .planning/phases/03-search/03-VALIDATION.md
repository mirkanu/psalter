---
phase: 3
slug: search
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-08
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (vitest.config.mts) |
| **Config file** | `/data/home/psalter/vitest.config.mts` |
| **Quick run command** | `npx vitest run tests/search.test.ts tests/explore.test.ts tests/tune-grid.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/search.test.ts tests/explore.test.ts tests/tune-grid.test.ts`
- **After every wave:** Run `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| SRCH-01 | PsalmSearchWidget navigates to /psalms/[n] for valid input 1-150 | unit | `npx vitest run tests/search.test.ts` | Wave 0 |
| SRCH-02 | fetchSearchResults('shepherd') returns Psalm 23 with snippet | integration | `npx vitest run tests/search.test.ts` | Wave 0 |
| SRCH-02 | fetchSearchResults('') returns empty array without DB call | unit | `npx vitest run tests/search.test.ts` | Wave 0 |
| SRCH-02 | fetchSearchResults('zzznomatch') returns [] | integration | `npx vitest run tests/search.test.ts` | Wave 0 |
| SRCH-03 | fetchNavesTopicsWithCounts returns 488 topics each with psalm_count | integration | `npx vitest run tests/explore.test.ts` | Wave 0 |
| SRCH-03 | fetchPsalmsByNavesTopic(topicId) returns psalms with correct join | integration | `npx vitest run tests/explore.test.ts` | Wave 0 |
| SRCH-03 | fetchTopicsWithCounts returns >0 topics with non-null names | integration | `npx vitest run tests/explore.test.ts` | Wave 0 |
| SRCH-04 | TuneGrid filters to CM meter correctly | unit | `npx vitest run tests/tune-grid.test.ts` | Wave 0 |
