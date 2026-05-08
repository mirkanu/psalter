---
phase: 2
slug: public-browse
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (against live psalter-db) + `npx tsc --noEmit` + `next build` |
| **Config file** | `vitest.config.ts` (created in plan 02-01, Task 3) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds (type-check) / ~30 seconds (vitest full) |

Rationale: Plans 02-01 through 02-05 implement vitest-driven verification (db query smoke tests + per-route data-shape tests) backed by `npx tsc --noEmit` and `npm run build` for static-rendering verification. Playwright was scoped out — static pre-rendering and DB query shape provide stronger coverage at lower runtime cost than browser-driven E2E for this read-heavy Phase.

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green AND `npm run build` exits 0
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 02-01-01 | 01 | 0 | (schema/queries foundation) | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-01-02 | 01 | 0 | (shadcn UI install) | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-01-03 | 01 | 0 | (vitest + db smoke tests) | unit | `npx vitest run tests/db-queries.test.ts` | ⬜ pending |
| 02-02-01 | 02 | 1 | (SiteHeader + lib/daily) | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-03-01 | 03 | 2 | PSALM-01 | build | `npx tsc --noEmit && npm run build` | ⬜ pending |
| 02-03-02 | 03 | 2 | PSALM-02/03/04/05/06 | unit + build | `npx vitest run tests/psalm-detail.test.ts && npm run build` | ⬜ pending |
| 02-04-01 | 04 | 2 | TUNE-01 | unit + build | `npx vitest run tests/tune-detail.test.ts && npm run build` | ⬜ pending |
| 02-05-01 | 05 | 2 | (homepage) | type-check | `npx tsc --noEmit` | ⬜ pending |
| 02-05-02 | 05 | 2 | PLAN-01 / PSALM-06 | unit + build | `npx vitest run tests/daily-plan.test.ts && npm run build` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is implemented entirely by plan **02-01** (Foundation):

- [ ] `vitest.config.ts` — Vitest config with `vite-tsconfig-paths` and dotenv loader
- [ ] `tests/db-queries.test.ts` — Smoke tests for `fetchPsalmDetail`, `fetchTuneDetail`, `fetchAllDailyReadings`, `fetchDailyReading` (5 cases, all green against live psalter-db)
- [ ] `package.json` script `"test": "vitest"` registered
- [ ] `vitest` + `@vitejs/plugin-react` + `vite-tsconfig-paths` + `dotenv` installed as devDependencies
- [ ] shadcn `tabs`, `badge`, `select`, `separator`, `card` components present
- [ ] Drizzle relations `psalmTopicsRelations`, `psalmVersionTunesRelations`, `tuneMoodsRelations`, `verseNavesTopicsRelations`, `verseDoctrinesRelations` exported from `src/db/schema.ts`
- [ ] `src/db/queries/psalms.ts`, `src/db/queries/tunes.ts`, `src/db/queries/daily.ts` exist

Downstream test files created during Wave 2 plans (each gated by `npx vitest run <file>` in its plan's task verify):
- `tests/psalm-detail.test.ts` (plan 02-03 task 2)
- `tests/tune-detail.test.ts` (plan 02-04)
- `tests/daily-plan.test.ts` (plan 02-05 task 2)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Static pre-rendering confirmed in build output | PSALM-06 | Requires reading `next build` summary table | After `npm run build`, confirm `/psalms`, `/psalms/[id]`, `/tunes`, `/tunes/[id]`, `/daily`, `/daily/[day]` are marked `○` (Static), not `ƒ` (Dynamic). Each Wave 2 plan greps the build log for this. |
| Today's entry highlighted on /daily | PLAN-01 | Depends on current date and JS hydration | Open /daily today, verify today's row has `bg-muted` + `border-l-2 border-primary` + visible "Today" badge + auto-scroll behavior |
| Visual layout matches UI-SPEC | (cross-cutting) | Visual perception | Spot-check / vs UI-SPEC.md after Wave 2 ships |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (vitest + queries + shadcn from 02-01)
- [x] No watch-mode flags (`vitest run` is non-watch)
- [x] Feedback latency < 30s for both type-check and vitest paths
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-05-07 — reconciled with plans 02-01 through 02-05 (vitest, not Playwright)
