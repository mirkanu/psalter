# Quick Task 261108-dfl — Some small bugs in precenting views — SUMMARY

**Plan:** 261108-dfl-PLAN.md (3 tasks, autonomous)
**Branch:** `fix/261108-precent-bugs`
**Executed:** 2026-11-08
**Status:** All 3 tasks implemented, committed, and verified. Not deployed (the orchestrator deploys and applies the Cloudflare change).

---

## Commit SHAs

| Task | Commit | Message |
|---|---|---|
| 1 — resolver picks the RECOMMENDED versification | `e514df05` | `fix(precent): resolve pasted multi-version psalms to the recommended versification` |
| 2 — precenting set routes served dynamically | `613c3df4` | `fix(precent): serve precenting set routes dynamically` |
| 3 — self-heal a stale precenting page | `12c5a497` | `fix(precent): self-heal a stale precenting page whose item count changed` |

Files touched (code only, no `.planning/` artifacts committed):

- Task 1: `src/lib/parse-psalm-list.ts`, `src/lib/parse-psalm-list.test.ts` (NEW), `src/components/PsalmListingGrid.tsx`, `src/db/queries/psalms.ts`
- Task 2: `src/app/precent/[id]/page.tsx`, `src/app/precent/[id]/sing/[pos]/page.tsx`, `next.config.ts`, `src/middleware.ts`
- Task 3: `src/app/api/precent/[id]/items/route.ts`, `src/components/precent/PrecentingBar.tsx`, `src/components/precent/PrecentingBar.test.tsx` (NEW)

---

## Test results

```
$ npx vitest run src/lib/parse-psalm-list.test.ts
 ✓ src/lib/parse-psalm-list.test.ts (12 tests) 15ms
 Test Files  1 passed (1)
      Tests  12 passed (12)
```

```
$ npx vitest run src/components/precent/PrecentingBar.test.tsx
 ✓ src/components/precent/PrecentingBar.test.tsx (4 tests) 121ms
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

```
$ npx vitest run src/lib/parse-psalm-list.test.ts src/components/precent/PrecentingBar.test.tsx
 ✓ src/lib/parse-psalm-list.test.ts (12 tests) 15ms
 ✓ src/components/precent/PrecentingBar.test.tsx (4 tests) 306ms
 Test Files  2 passed (2)
      Tests  16 passed (16)
```

TDD gates honoured: RED was observed before each implementation (Task 1 → 7 failed / 5 passed; Task 3 → 4 failed / 4 failed), then GREEN after the source edits.

---

## Build — route table

`npm run build` ran AFTER all three commits (the `prebuild` step `scripts/capture-deploy-info.ts` reads HEAD at build start).

**Exit code: 0.** No warnings or errors in the build log (`grep -inE 'warn|error|failed' /tmp/precent-build.log` → no output).

Exact route-table lines for the two precenting set routes:

```
├ ƒ /precent/[id]
├ ƒ /precent/[id]/sing/[pos]
```

Both are `ƒ` (Dynamic) — server-rendered on demand, with **no `●`/`○` marker**:

```
$ grep -E '/precent/\[id\]' /tmp/precent-build.log | grep -v '^#' | grep -cE '●|○'
0
```

Build ID captured: `ccqjgZXSzlcg9SH297lxl`.

---

## Verification detail per task

### Task 1

| Check | Result |
|---|---|
| `npx vitest run src/lib/parse-psalm-list.test.ts` | 12/12 pass |
| `npx tsc --noEmit \| grep -E '^src/(lib/parse-psalm-list\|db/queries/psalms\|components/PsalmListingGrid)'` | no output (clean) |
| `npx eslint` on the 3 changed source files + the new test | exit 0, no output |
| `grep -c 'isRecommended' src/db/queries/psalms.ts` | 1 (the population line) — as specified |
| `grep -c 'isRecommended' src/lib/parse-psalm-list.ts` | **2, not ≥3** — see deviation D-2 |

### Task 2

| Check | Result |
|---|---|
| `grep -c 'force-static'` on both routes | 0, 0 |
| `grep -c 'generateStaticParams'` on both routes | 0, 0 |
| `grep -c 'revalidate = false'` on both routes | 0, 0 |
| `grep -c 'precent/:id' next.config.ts` | 0 |
| `grep -c "source: '/precent" next.config.ts` | 0 |
| `grep -c 'headers: t2CacheControl' next.config.ts` | 6 (the six surviving T2 routes) |
| `npx eslint` on the 4 touched files | exit 0, no output |
| `npx tsc --noEmit` filtered on `^src/(app/precent/\|middleware\|...)` | no output (clean) |

### Task 3

| Check | Result |
|---|---|
| `npx vitest run src/components/precent/PrecentingBar.test.tsx` | 4/4 pass |
| `npx eslint src/app/api/precent/[id]/items/route.ts src/components/precent/PrecentingBar.tsx src/components/precent/PrecentingBar.test.tsx` | exit 0, no output |
| `npx tsc --noEmit \| grep -E '^src/(app/api/precent/\|components/precent/)'` | no output (clean) |
| `grep -c 'router.refresh' src/components/precent/PrecentingBar.tsx` | 1 |

### Repo-wide

`npx tsc --noEmit` total error count: **78** — identical to the plan's stated pre-existing baseline. No new type errors anywhere.

---

## Deviations from the plan

### D-1 (Rule 1/3 — plan error, auto-fixed): the `precentingSets` schema import was KEPT in both routes

The plan instructed:

> `src/app/precent/[id]/page.tsx` line 6: `import { precentingSets, setItems, psalmVersions }` → `import { setItems, psalmVersions }`.
> `precentingSets` was used ONLY by the removed `generateStaticParams`; the `db.query.precentingSets.findFirst` call further down is the relational-query API and needs no import.

and the same for the sing route.

**This is incorrect.** Both files still use the imported table object in a Drizzle column reference:

```ts
const set = await db.query.precentingSets.findFirst({
  where: eq(precentingSets.id, setId),   // <-- needs the import
```

`db.query.precentingSets.findFirst` (the relational API) needs no import, but `eq(precentingSets.id, setId)` does. Removing the import produces `TS2304: Cannot find name 'precentingSets'` and breaks the build.

**Action taken:** the `precentingSets` import was kept in both files; everything else in the plan for Task 2 was applied exactly as written. Verified by the plan's own gate (`npx tsc --noEmit` filtered on `^src/app/precent/` → no output) and by `npm run build` exiting 0.

### D-2 (plan verify-block inconsistency, no code impact): `grep -c 'isRecommended' src/lib/parse-psalm-list.ts` returns 2, the plan expected ≥3

The plan's own implementation snippet for `parsePsalmList` contains exactly **two** `isRecommended` reads — one `allForPsalm.find((r) => r.isRecommended === true)` in the parenthetical branch and one in the bare-number branch. `grep -c` counts matching lines, so the plan's own code yields 2, not ≥3. The implementation matches the plan's specified code byte-for-byte in the resolver body; only the doc comments were rewritten as instructed.

No third read was invented to satisfy the counter. The functional requirement — the flag is read from `PsalmRow.isRecommended` and drives version selection — is met and covered by 12 passing tests (cases 1, 2, 8 and 9 assert recommended-first, recommended-second, and label-not-position behaviour).

### D-3 (pre-existing failures, out of scope — not fixed): ESLint fails on `src/components/PsalmListingGrid.tsx`

The plan's Task 1 gate states `npx eslint src/lib/parse-psalm-list.ts src/lib/parse-psalm-list.test.ts src/db/queries/psalms.ts src/components/PsalmListingGrid.tsx` → exit 0, no output.

**That is not true of the repo at HEAD.** `src/components/PsalmListingGrid.tsx` already carries 3 `react-hooks/set-state-in-effect` errors and 1 `@typescript-eslint/no-unused-vars` warning, all in code this task did not touch (the localStorage-hydration effect, the `matchMedia` effect, the `updatePersisted` effect, and the `_r` destructure in `filteredPsalms`).

Verified pre-existing by stashing only this task's changes and re-running ESLint at HEAD — the identical 3 errors + 1 warning appear (at lines 136/175/267/244, shifted to 144/183/275/252 by the 8-line interface addition).

**Action taken:** not fixed — these are pre-existing lint failures in unrelated code, out of scope per the scope-boundary rule. All ten OTHER touched files lint clean:

```
$ npx eslint <the other 10 touched files>
ESLINT_EXIT_EXCLUDING_PREEXISTING=0
```

### D-4 (documentation): the middleware comment was rewritten, not merely corrected

The plan said the Phase 19 carve-out comment "says the routes 'are T2-cacheable'… Rewrite that sentence to say the routes are de-auth-gated (no confidential content) but served DYNAMICALLY because precenting sets are per-user mutable data." The comment now reads:

```
  // Phase 19 PERF-02 de-auth-gate carve-out: /precent/[id] and
  // /precent/[id]/sing/[pos] contain no confidential content (the precentor's
  // own set), so they are de-auth-gated and must NOT redirect to /login.
  // They are served DYNAMICALLY, not cached: precenting sets are per-user
  // mutable data, so a cached copy would hide a psalm added to the set.
  // /precent (list) and /api/precent/* STAY gated below. Order matters — this
  // MUST run before the sessionCookie check below.
```

Comment only — no matcher, allow-list regex, or control-flow change. Recorded here because the plan's `<out_of_scope>` did not name it explicitly; the substance matches the plan's intent exactly.

---

## What was NOT done (as instructed)

- **No deploy.** `pm2 restart psalter` was not run. The build was verification only.
- **No push.** The branch stays local to `fix/261108-precent-bugs` for the orchestrator.
- **No Cloudflare change.** The cache rule `e6a916ba9f5244bda0815cffd1e02c86` was not touched and the Cloudflare API was not called. The rule change and the edge-cache purge remain the orchestrator's `<orchestrator_steps>` 1 and 1b.
- **No `.planning/` docs commit.** `261108-dfl-SUMMARY.md` and any STATE/ROADMAP updates are the orchestrator's docs commit.
- **`.planning/ROADMAP.md` untouched.**
- **Legacy set items with a null `psalmVersionId`** still fall back to the lowest-id version in `src/app/precent/[id]/page.tsx` and `src/app/precent/[id]/sing/[pos]/page.tsx`. Only NEW pasted items are fixed — per the plan's `<out_of_scope>`.
- **Server-side validation** that `psalmVersionId` belongs to `psalmId` in `POST /api/precent/[id]/items` (threat T-261108-01) was not added — out of scope.
- **`set_items.position` base inconsistency** was not touched — the sing route's 1-based-URL-index semantics are correct as they stand.

---

## Threat flags

None introduced beyond the plan's own register. The three changes were reviewed against the plan's `<threat_model>`:

- **T-261108-05 (spoofing)** — mitigated as planned: the "Recommended" marker is read from the DB via `fetchPsalmListRows` (`psalterNumber.includes('Recommended')`), never from user input, and is only used to choose among that psalm's own version rows. Never used for authorization.
- **T-261108-04 (cache integrity)** — code side done (`force-dynamic`, no `Cache-Control` override). The edge side (Cloudflare rule → `cache: false` + `browser_ttl: bypass`, plus the URL purge) is still outstanding and belongs to the orchestrator.
- **New in Task 3**: `GET /api/precent/[id]/items` is a new authenticated read endpoint. It reuses the POST handler's exact auth helpers (`getSessionOr401()` → 401, `loadSetWithAccess()` → 404/403), returns only the set's own item metadata, and is owner/admin-gated — it does not widen the Phase 19 de-auth carve-out on the `/precent/<id>` HTML routes.
