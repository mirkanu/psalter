
## Plan 02 (2026-07-16)

- Pre-existing `npx tsc --noEmit` errors in `tests/e2e/*.spec.ts` and `tests/precent-*.spec.ts` /
  `tests/tune-notation.spec.ts` (duplicate `chromium`/`BASE`/`results` block-scoped redeclarations,
  missing `playwright` module types). Unrelated to files touched by this plan
  (notation-scale.ts, NotationRenderer.tsx, GlassBottomBar.tsx, SingingView.tsx) — zero errors
  reported in those files. Out of scope per plan's scope boundary; not fixed.
