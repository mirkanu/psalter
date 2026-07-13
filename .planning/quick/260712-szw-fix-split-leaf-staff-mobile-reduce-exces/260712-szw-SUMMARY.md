---
phase: quick-260712-szw
plan: 01
subsystem: notation
tags: [abcjs, split-leaf, mobile, staff, diagnostics]
requires: [260712-kov]
provides:
  - "Mobile-only compact spacing + height-fit scale for split-leaf Staff (AbcPlayer.tsx, NotationRenderer.tsx)"
  - "Extended split-leaf diagnostic with a dev-server-independent abcjs harness (tests/diagnostics/split-leaf-staff-diff.mjs)"
affects:
  - "SingingView mobile split-leaf Staff rendering"
tech-stack:
  added: []
  patterns:
    - "abcjs %% directive prepend for spacing overrides (JS-level format option does not honor topmargin/botmargin/staffsep/systemsep)"
    - "two-layer CSS transform:scale + static overflow:hidden clipping wrapper for height-fit-to-container"
key-files:
  created: []
  modified:
    - tests/diagnostics/split-leaf-staff-diff.mjs
    - src/components/notation/NotationRenderer.tsx
    - src/components/AbcPlayer.tsx
decisions:
  - "abcjs JS-level options.format silently ignores topmargin/botmargin/staffsep/systemsep (only fonts/scale/stretchlast/fontboxpadding/stafftopmargin are recognized by globalFormatting) — these keys only work as %% directive lines inside the ABC text itself"
  - "Height-fit CSS transform must be split across two elements: a static (untransformed) wrapper holding height+overflow:hidden, and the transformed element holding transform:scale — combining all three on one element clips content pre-transform (crops the tune) instead of shrinking it"
  - "compactSplitMobile = chromeless && isSplitMode(viewMode) && viewportW < 768, computed once in NotationRenderer and forwarded as a single boolean prop to AbcPlayer — false everywhere except mobile chromeless split-leaf Staff"
metrics:
  duration: ~55 min
  completed: 2026-07-12
---

# Quick Task 260712-szw: Fix split-leaf Staff mobile — reduce excess whitespace + eliminate 4th-system scroll — Summary

One-liner: Mobile split-leaf Staff now injects `%%` ABC spacing directives (abcjs's JS `format` option silently ignores topmargin/botmargin/staffsep/systemsep) and applies a two-layer CSS transform:scale height-fit so a 4-system CM tune renders compactly without scrolling — desktop split-leaf stays byte-identical to inline.

## What was built

Follow-up to 260712-kov (which fixed split-leaf Staff *width* sizing on desktop). New UAT on Ps 78 (Azmon/Denfield, CM) found two remaining mobile-only split-leaf problems: excess vertical whitespace (no lyrics reserve that space) and a 4th system requiring scroll. This plan:

1. **Extended the diagnostic** (`tests/diagnostics/split-leaf-staff-diff.mjs`) with two new measurements on top of the existing 260712-kov inline-vs-split MATCH checks:
   - **Part A** (live, best-effort): mobile `/psalms/78` split-leaf notation-slot `clientHeight` vs `scrollHeight`, via a new `[data-notation-slot]` measurement hook added to `NotationRenderer`'s chromeless `renderSplitLeaf` branch (measurement-only, no behaviour change).
   - **Part B** (decisive, dev-server-independent): loads abcjs 6.6.3 from the CDN into an `about:blank` page and renders a representative 4-system CM body (derived from the real Azmon/Denfield DB row, no `w:` lines) under baseline / reduced-spacing / height-fit levers, mirroring `AbcPlayer`'s `{ scale: 1, staffwidth, responsive: 'resize' }` call.
   - **Key discovery during Task 1**: abcjs's JS-level `options.format` is routed through `ABCParse.parse`'s `switches.format` → `parseDirective.globalFormatting`, which only recognizes a small allowlist (font directives, `scale`, `stretchlast`, `fontboxpadding`, `stafftopmargin`). `topmargin`/`botmargin`/`staffsep`/`systemsep` are **silently ignored** there (confirmed by reading `node_modules/abcjs/src/parse/abc_parse_directive.js`) — they only work as `%%directive value` lines written *inside* the ABC text itself (the per-line directive parser, `oneParameterMeasurement`). The diagnostic's spacing sweep was corrected to prepend `%%` directives rather than pass a `format` object, which produced a real, measurable effect (baseline 434px → 299px).
   - **VERDICT**: `spacing-only=no needs-fit-scale=yes baselineH=434 spacingH=299 fittedH=260` — spacing reduction alone brings the tune to 299px, still above the ~260px mobile notation-slot budget, so a height-fit scale is required on top of spacing. This drove Task 2's fix direction: **both** levers.

2. **Implemented the mobile-only fix** (Task 2), gated entirely on a new `compactSplitMobile` boolean:
   - `NotationRenderer.tsx` computes `compactSplitMobile = chromeless && isSplitMode(viewMode) && viewportW < 768` and forwards it as a prop to `AbcPlayer`. False everywhere except mobile chromeless split-leaf Staff.
   - `AbcPlayer.tsx`, when the prop is true:
     - `injectCompactSpacingDirectives()` prepends `%%topmargin 0`, `%%botmargin 0`, `%%staffsep 10`, `%%systemsep 10` right after the ABC `K:` line (the exact values the diagnostic's "spacing-tighter" sweep proved best).
     - A new post-render height-fit `useEffect` (declared after the main render effect so it always observes the freshly-rendered SVG) measures the rendered SVG's natural height against the `[data-notation-slot]` ancestor's `clientHeight` (observed via a self-contained `ResizeObserver` — no extra prop threading needed beyond the boolean). If it overflows, it computes `fitScale = slotHeight / naturalHeight` and applies a uniform CSS `transform: scale(fitScale)`.
     - **Correctness fix during implementation**: the height-fit CSS must be split across **two** DOM elements — a new static `fitWrapRef` wrapper holding `height` + `overflow: hidden`, and the existing `containerRef` (the abcjs mount target) holding the `transform`. Combining all three properties (height, overflow:hidden, transform) on the *same* element would clip the overflowing content in its own *untransformed* coordinate space before the transform ran — cropping the tune to a truncated snippet and then shrinking that crop, rather than shrinking the whole tune. The two-layer split (well-established CSS pattern for "scale to fit") avoids this; because `fitScale` is computed so `naturalHeight * fitScale === slotHeight`, the scaled content exactly fills the static wrapper's clipped viewport with no visible cropping.

## Root cause (confirmed)

Both problems (whitespace + scroll) trace to the same gap already flagged in the plan's interfaces: `AbcPlayer`'s existing `responsive: 'resize'` + `staffwidth` math is **width-only** — there was no height-aware equivalent, and no vertical-spacing overrides were ever applied. The diagnostic proved spacing reduction alone is insufficient for this tune; a height-fit scale is also required.

## Desktop non-regression

`compactSplitMobile` is `false` whenever `viewportW >= 768` (regardless of `chromeless`/split state), so on desktop: `abcForRender === abc` (no `%%` directives injected) and the height-fit effect's early-return leaves `fitWrapRef`/`containerRef` styles reset to `''` (a harmless no-op). Desktop split-leaf Staff therefore renders through the exact same code path as before this change — the 260712-kov byte-identical-to-inline guarantee is untouched. Inline Staff, inline Solfège, and split-leaf Solfège never read the new prop at all (Solfège modes don't render `AbcPlayer`; inline Staff always has `isSplitMode(viewMode) === false`).

## Alignment/melisma scope compliance

No `w:` line or `_` melisma-token generation code was touched. `unifiedAbc` / `unifiedAbcNoLyrics` construction in `NotationRenderer.tsx` is unmodified — only the render-time vertical spacing (`%%` directive prepend) and post-render CSS scale of the already-built split-leaf ABC/SVG were changed, per the binding scope note in `lyric-to-note-alignment.md` and `CLAUDE.md`.

## Verification status

- `node tests/diagnostics/split-leaf-staff-diff.mjs` — PASSES the automated check (`VERDICT` line present). Part A correctly reports `DIAGNOSTIC-UNAVAILABLE` against the current PRE-fix production build (localhost:3005 runs `next start` from a prior `.next` build via PM2, not a hot-reloading dev server — the new `[data-notation-slot]` attribute won't be visible there until the batched rebuild). Part B (decisive, dev-server-independent) confirms the VERDICT numerically.
- `npx tsc --noEmit -p .` — zero new errors in `AbcPlayer.tsx` / `NotationRenderer.tsx` (all remaining errors are pre-existing, confined to `tests/*.spec.ts`, out of scope per the plan's done criteria).
- `npx vitest run` — 18 failed / 490 passed, **identical** count with and without this change (verified via `git stash`); failures are pre-existing and unrelated (Next.js `headers()` request-scope issue in `precent-auth` route tests).
- **Task 3 (checkpoint:human-verify) is PENDING** — requires the batched rebuild the orchestrator is deferring until all pending quick-fix tasks this session complete (solfège JPG cap+stale bug, disable inline solfège, SoundCloud desktop privacy page). Not rebuilt or human-verified as part of this execution.

### Exact steps for the pending human verification (from the plan, plus the plan-checker's suggested addition)

1. After the orchestrator confirms the rebuild, open on a phone-width window (~375px): `https://psalter.gsdlabs.dev/psalms/78`.
2. Gear → Notation: Staff, Layout: Split-Leaf. Try the CM tunes (Azmon / Denfield). Confirm:
   - ALL systems of the tune are visible at once in the notation region — no need to scroll the notation area to see the last system.
   - The staff rows are compact — minimal empty space above the top staff and below the bottom staff / between systems (no gap where inline lyrics would sit).
   - The lyrics still appear separately below in the StanzaList.
3. Switch Layout back to Inline (still mobile) — inline Staff should look exactly as before (unchanged).
4. On a DESKTOP-width window (~1200px), Staff + Split-Leaf should look identical to Staff + Inline minus the lyric words (260712-kov behaviour — unchanged).
5. Spot-check inline Solfège and split-leaf Solfège (scanned image) — unchanged.
6. **Plan-checker's suggested addition**: re-run `node tests/diagnostics/split-leaf-staff-diff.mjs` against the rebuilt deployment (`TEST_BASE_URL=https://psalter.gsdlabs.dev node tests/diagnostics/split-leaf-staff-diff.mjs`) to get the objective Part A signal (`overflow=no` on `/psalms/78` mobile split-leaf) rather than relying on visual eyeballing alone.

**Resume signal expected**: "approved" if mobile split-leaf Staff shows the whole tune without scrolling and with minimal whitespace, AND desktop split-leaf + all other views are unchanged. Otherwise describe exactly what is still wrong (e.g. "still scrolls to see 4th system", "notes too tiny now", "desktop split-leaf changed").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Diagnostic's initial spacing sweep had zero effect — corrected during Task 1**
- **Found during:** Task 1, first diagnostic run
- **Issue:** The first implementation passed `topmargin`/`botmargin`/`staffsep`/`systemsep` via abcjs's JS-level `format:` option (matching the plan's suggested approach). All three sweep configurations produced identical output to baseline (434px unchanged) — no effect at all.
- **Root cause:** Read `node_modules/abcjs/src/parse/abc_parse_directive.js` `globalFormatting` — confirmed these four keys are not in its recognized-directive allowlist and are silently dropped (with only a console warning).
- **Fix:** Rewrote the harness's `render()` to prepend `%%directive value` lines into the ABC text after the `K:` line (the code path that *does* handle these directives, `oneParameterMeasurement`), which produced the expected effect (434px → 299px). Task 2's implementation uses the same `%%` prepend mechanism in `AbcPlayer.tsx`.
- **Files modified:** `tests/diagnostics/split-leaf-staff-diff.mjs`
- **Commit:** 95dd8ed

**2. [Rule 1 - Bug] Height-fit CSS design would have cropped instead of shrunk the tune**
- **Found during:** Task 2, code review before committing
- **Issue:** Initial implementation applied `transform: scale()`, a reduced `height`, and `overflow: hidden` all to the same `containerRef` element. On analysis, this combination clips overflowing content in the element's own *untransformed* coordinate space before its own transform is applied — the result would have been a cropped snippet (roughly the top system or two) scaled down further, not the whole tune shrunk to fit.
- **Fix:** Split the height-fit mechanism across two elements: a new static `fitWrapRef` wrapper (holds `height` + `overflow: hidden`, never transformed) and the existing `containerRef` (holds only the `transform: scale()`). Because `fitScale` is computed so `naturalHeight * fitScale === slotHeight`, the scaled content exactly fills the static wrapper's clipped viewport.
- **Files modified:** `src/components/AbcPlayer.tsx`
- **Commit:** f031d28 (caught and fixed before commit — no separate follow-up commit needed)

## Known Stubs

None — both artifacts (diagnostic extension, mobile fix) are fully wired; no placeholder/mock data introduced.

## Threat Flags

None — this change is limited to client-side ABC text formatting (a `%%` directive prepend on notation the app already renders) and CSS layout/scale, both applied only inside a static, size-known mobile chromeless split-leaf context. No new network endpoints, auth paths, file access, or schema changes.

## Self-Check: PASSED

- FOUND: `tests/diagnostics/split-leaf-staff-diff.mjs`
- FOUND: `src/components/notation/NotationRenderer.tsx`
- FOUND: `src/components/AbcPlayer.tsx`
- FOUND commit: `95dd8ed` (test(260712-szw): extend split-leaf staff diagnostic for mobile overflow root-cause)
- FOUND commit: `f031d28` (fix(260712-szw): mobile split-leaf Staff compact spacing + height-fit scale)
