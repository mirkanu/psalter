---
phase: 2
slug: public-browse
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + `next build` type-check |
| **Config file** | `playwright.config.ts` (Wave 0 installs) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds (type-check) / ~90 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 0 | PSALM-01 | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-01-02 | 01 | 1 | PSALM-01 | e2e | `npx playwright test psalms-list` | ⬜ pending |
| 02-02-01 | 02 | 1 | PSALM-02/03/04 | e2e | `npx playwright test psalm-detail` | ⬜ pending |
| 02-02-02 | 02 | 1 | PSALM-05 | e2e | `npx playwright test psalm-lyrics` | ⬜ pending |
| 02-03-01 | 03 | 1 | TUNE-01 | e2e | `npx playwright test tune-detail` | ⬜ pending |
| 02-04-01 | 04 | 1 | PLAN-01 | e2e | `npx playwright test daily-plan` | ⬜ pending |
| 02-05-01 | 05 | 2 | PSALM-06 | build | `npx next build 2>&1 \| grep -v warning` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — Playwright config pointing at http://localhost:3005
- [ ] `tests/e2e/psalms-list.spec.ts` — stub for PSALM-01
- [ ] `tests/e2e/psalm-detail.spec.ts` — stub for PSALM-02/03/04/05
- [ ] `tests/e2e/tune-detail.spec.ts` — stub for TUNE-01
- [ ] `tests/e2e/daily-plan.spec.ts` — stub for PLAN-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Static pre-rendering confirmed (no DB query on browse) | PSALM-06 | Requires network tab inspection | Open psalm page, check Network tab — no DB requests after hydration |
| Today's entry highlighted correctly | PLAN-01 | Depends on current date | Open /daily today, verify today's row has visual highlight |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
