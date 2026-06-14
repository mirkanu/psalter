---
phase: 5
slug: precentor-portal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x |
| **Config file** | `vitest.config.mts` (root) |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10–30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite green + Playwright smoke tests pass
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PREC-01 | T-05-01 | Input validation on set creation (type must be enum) | unit | `npx vitest run src/app/api/precent/route.test.ts` | ❌ Wave 0 | ⬜ pending |
| 05-02-01 | 02 | 2 | PREC-02 | T-05-02 | Input validation on item add (psalm_id must exist) | unit | `npx vitest run src/app/api/precent/[id]/items/route.test.ts` | ❌ Wave 0 | ⬜ pending |
| 05-03-01 | 03 | 2 | PREC-03 | T-05-03 | Reorder accepts only valid position arrays | unit | `npx vitest run src/app/api/precent/[id]/reorder/route.test.ts` | ❌ Wave 0 | ⬜ pending |
| 05-03-02 | 03 | 2 | PREC-03 | — | Optimistic reorder reverts on API error | smoke | `npx playwright test tests/precent-reorder.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 05-04-01 | 04 | 2 | PREC-04 | — | Set detail page renders psalm list + tune assignments | smoke | `npx playwright test tests/precent-detail.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 05-05-01 | 05 | 3 | PREC-05 | — | Precenting mode renders psalm notation at correct position | smoke | `npx playwright test tests/precent-sing.spec.ts` | ❌ Wave 0 | ⬜ pending |
| 05-06-01 | 05 | 3 | PREC-06 | — | abcjs audio play button present on /precent/[id]/sing/[pos] | smoke | included in `tests/precent-sing.spec.ts` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/api/precent/route.test.ts` — stubs for PREC-01 (set creation input validation)
- [ ] `src/app/api/precent/[id]/items/route.test.ts` — stubs for PREC-02 (item add validation)
- [ ] `src/app/api/precent/[id]/reorder/route.test.ts` — stubs for PREC-03 (reorder validation)
- [ ] `tests/precent-reorder.spec.ts` — Playwright smoke for dnd reorder revert
- [ ] `tests/precent-detail.spec.ts` — Playwright smoke for PREC-04 set detail
- [ ] `tests/precent-sing.spec.ts` — Playwright smoke for PREC-05 + PREC-06 precenting mode

*Wave 0 plan must install all test stubs before any feature tasks run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop reordering feels smooth on mobile | PREC-03 | Touch/pointer behaviour requires a real device or BrowserStack | Open /precent/[id] on mobile, drag rows, confirm order persists after reload |
| Meter mismatch warning appears for mismatched tune | PREC-04 | Requires specific DB fixtures + visual inspection | Assign a CM tune to a LM psalm, confirm orange warning row appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
