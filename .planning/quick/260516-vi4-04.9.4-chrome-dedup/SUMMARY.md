---
quick_id: 260516-vi4
slug: 04.9.4-chrome-dedup
created: 2026-05-16
completed: 2026-05-16
status: complete
---

# Summary: Fix 04.9.4 chrome dedup

## What

Phase 04.9.4 verifier reported `passed: 6/6` but the user observed that
the OLD A−/A+ zoom row and the OLD stanza prev/next nav were still
rendering above the new GlassBottomBar at all viewports. The original
UAT scripts only checked PRESENCE of new chrome — not ABSENCE of legacy
chrome — so the regression slipped through.

## Root cause

`NotationRenderer.tsx` lines 888-893 unconditionally rendered
`chromelessSizeRow` and `chromelessStanzaNav` whenever `chromeless={true}`
was set. These were introduced in Phase 04.9.3 as the SingingView's
inline controls; Phase 04.9.4 added GlassBottomBar to replace them but
neglected to suppress the old render path.

## Fix

**Commit `e47aae5` — code fix:**

- `src/components/notation/NotationRenderer.tsx`
  - Removed the duplicate `chromeless && (<div>{chromelessSizeRow}{chromelessStanzaNav}</div>)` render block.
  - Added controlled `stanzaPage` / `onStanzaPageChange` props so external
    chrome can drive pagination. Internal `cyclePage` now mirrors `stanzaPage - 1`
    when controlled; setter forwards to parent.
- `src/components/singing/GlassBottomBar.tsx`
  - Added `[data-stanza-prev]` / `[data-stanza-next]` chevron buttons
    flanking the existing `[data-stanzas-indicator]` (was text-only).
  - Tightened mobile layout so the full bar fits 375px:
    - View buttons drop label text under `sm` (icons-only)
    - A−/A+ and Gear/Play use `min-w-9` on mobile, `sm:min-w-11` on desktop
    - Centre group has `min-w-0` + chevrons use `px-1` (no fixed min-w)
- `src/components/singing/SingingView.tsx`
  - Owns `stanzaPage` state, `handleStanzaPrev` / `handleStanzaNext`.
  - Passes controlled `stanzaPage` to `NotationRendererClient`,
    `onStanzaPrev` / `onStanzaNext` to `GlassBottomBar`.
  - `handleStanzaChange` syncs `stanzaPage` from NotationRenderer's
    initial and internal-driven changes (e.g. auto-advance during playback).

**Commit `be4a99a` — UAT hardening:**

- `scripts/uat/test-04.9.4-quick.js` and `scripts/uat/test-04.9.4-full.js`
  now include SC4b (no-legacy-chrome) and SC4c (stanza-next click
  advances indicator) assertions.

## Validation

- Visual audit (`/tmp/visual-audit-04.9.4-v2.js`) across 375/768/1024:
  **36/36 checks pass** — no legacy elements, exactly one of each new
  control, clicking stanza-next advances the indicator text.
- `npm run build` clean at every iteration.
- All three Playwright UAT scripts PASS against `http://localhost:3005`
  with the freshly built bundle:
  - `test-04.9.4-quick` ✓
  - `test-04.9.4-full` ✓
  - `test-04.9.4-study-regression` ✓

## Commits

- `e47aae5` — fix(04.9.4-chrome-dedup): remove duplicate A+/A- and stanza nav rendered by NotationRenderer
- `be4a99a` — test(04.9.4-chrome-dedup): harden UATs to assert absence of legacy chrome
