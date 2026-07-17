---
phase: quick-260717-mwv
plan: 01
subsystem: ui
tags: [nextjs, react, abcjs, notation, singing-view, scroll-hide]

requires:
  - phase: 04.9.15-04
    provides: staffInlineApproved gating helpers (src/lib/inline-staff-gating.ts)
provides:
  - Split-Leaf Staff respects tune-approval status (shared renderScannedPages helper)
  - Split-Leaf multi-page JPEGs use flanking prev/next nav instead of a thumbnail strip
  - Real Lyrics Only content (not a placeholder message) for psalm-versions with no active tune
  - Proactive tune-selector flow from Music Notes / Play when no tune is active yet
  - Zero-notation tunes silently force Lyrics Only with a greyed, tap-to-explain Music Notes toggle
  - Scroll-hide-on-scroll now works regardless of whether the active tune has ABC notation
  - Scrolling and hide-on-scroll are disabled entirely when content fits the viewport
affects: [singing-view, notation-renderer, play-mini-bar, gear-popover]

tech-stack:
  added: []
  patterns:
    - "renderScannedPages(pages, fallbackUrl, altText) shared helper in NotationRenderer.tsx returns a single imageBlock (image + flanking prev/next buttons), reused by solfege-split and staff-split JPG-fallback branches"
    - "hasAnyNotation (staffAvailable || solfegeSplitAvailable) as the single source of truth for whether a tune has any renderable notation"
    - "pendingTuneIntent ('music-notes' | 'play' | null) state in SingingView tracks WHY the tune switcher was opened so the post-selection effect can route correctly (inline Staff vs stay-in-Lyrics-Only-and-play)"
    - "data-lyrics-scroll / data-notation-slot data attributes mark the REAL scroll containers (not structural wrappers) for SingingView's content-fits-viewport measurement"

key-files:
  created: []
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/components/singing/SingingView.tsx
    - src/components/singing/PlayMiniBar.tsx
    - src/components/singing/GearPopover.tsx
    - src/app/psalms/[id]/page.tsx
    - src/app/precent/[id]/sing/[pos]/page.tsx

key-decisions:
  - "staffInlineApproved threaded straight through to NotationRendererClient (Task 1) so Split-Leaf Staff can reuse the exact same JPG-fallback mechanism Split-Leaf Solfège already used"
  - "hasAnyNotation guards both the mount-hydration viewMode restore and the existing shouldFallbackToSplit effect, with a new dedicated forced-Lyrics-Only effect taking priority for zero-notation tunes"
  - "PlayMiniBar's audioSource state now lazy-initializes to 'soundcloud' when hasAbc is false, plus a defensive re-force effect, so a fresh mount into an audio-only tune never attempts broken ABC audio controls"
  - "Checkpoint round 1: lyrics come from the psalm VERSION not the tune, so SingingView now always renders NotationRendererClient — no-tune psalms show real Lyrics Only content instead of a blocking placeholder message; the 'not recommended' context moved to a one-time toast"
  - "Checkpoint round 1: GearPopover's Music Notes toggle branches three ways — no active tune -> open tune switcher; tune with zero notation -> greyed out + tap-to-explain toast; normal tune -> unchanged behavior"
  - "Checkpoint round 1: scroll-hide effect re-keyed from [abc] to [activeTune?.id, viewMode] — the old abc-gate meant it never attached at all for empty-abc tunes, the actual root cause of item 3(c)"
  - "Checkpoint round 1 + follow-up: content-fits-viewport gating (scrollHeight <= clientHeight + 2px tolerance) forces overflow-y:hidden and skips hide-on-scroll entirely for regions that don't need to scroll (mobile only) — sidesteps the 'barely fits' boundary bug rather than patching its arithmetic"
  - "Found empirically via Playwright while verifying the round-1 fixes: the capBothHalvesOnDesktop split-leaf lyrics half was overflow-hidden (no scroll at all, pre-existing bug from 260712-tmm) and its outer data-lyrics-slot wrapper always reported scrollHeight===clientHeight (real scrolling happens in a nested child) — both fixed as they directly undermined item 1's and item 4's goals during this same verification pass"

requirements-completed: []

duration: ~3h (across checkpoint round 1 iteration)
completed: 2026-07-17
---

# Quick Task 260717-mwv: Fix three notation-fallback bugs (+ checkpoint round 1 follow-ups) Summary

**Split-Leaf Staff respects tune-approval via a shared JPG-fallback helper with flanking page nav (no thumbnails); no-tune psalm-versions show real Lyrics Only content with a proactive tune-selector flow; zero-notation tunes silently force Lyrics Only with a greyed Music Notes toggle; scroll-hide-on-scroll now works for every tune (including empty-abc ones) and disables itself entirely when content already fits the viewport.**

## Performance

- **Tasks:** 2 original auto-fix tasks + 5 follow-up fixes from checkpoint round 1 feedback, all committed atomically
- **Files modified:** 6

## Accomplishments

### Original 2 tasks (commits `c943597`, `e81bc5a`)

- **Bug 1 (Split-Leaf Staff JPG fallback):** Extracted the scanned-image rendering already used by Split-Leaf Solfège into a shared `renderScannedPages()` helper in `NotationRenderer.tsx`, reused for Split-Leaf Staff whenever `staffInlineApproved` is false.
- **Bug 2 ("not recommended" messaging) / Bug 3 (zero-notation tunes):** Added `hasAnyNotation` as the deciding signal; a dedicated effect forced Lyrics Only for zero-notation tunes; top-level render and `PlayMiniBar` gate keyed off `activeTune`/`(abc || soundcloudUrl)` instead of `abc` alone.

### Checkpoint round 1 feedback — 5 follow-up fixes

**Item 1 (commit `2b2312a`): Split-Leaf JPEG layout.** Multi-page JPEGs (e.g. Ps 42/Orlington) showed a thumbnail strip below the main image. `renderScannedPages()` now returns a single `imageBlock` with Prev/Next chevron buttons flanking the image left/right — no thumbnails, maximizing the JPEG's display size.

**Item 2 + 3(a)/3(b) (commit `d59d88c`): no-tune and zero-notation UX.**
- Lyrics come from the psalm *version*, not the tune — `SingingView` now always renders `NotationRendererClient` instead of a placeholder message, so a non-recommended versification with no tune shows real Lyrics Only content (verified byte-identical render path — no special casing). The "not recommended" context is now a one-time toast.
- `GearPopover`'s "Music Notes" toggle: with **no active tune**, tapping it opens the Tune Switcher sheet instead of a dead-end message; picking a tune from that flow loads directly into **inline Staff**. Tapping **Play** with no active tune likewise opens the switcher; picking a tune there **stays in Lyrics Only** and immediately opens the Play panel (tracked via a `pendingTuneIntent` state resolved by an effect watching `activeTune?.id` transitions).
- For a tune that **exists but has zero notation** (Bug 3's case), the automatic toast on load/switch was removed (item 3a); the "Music Notes" toggle is now visually greyed (`aria-disabled`, not native `disabled`, so real taps still fire) and explains why via toast on tap (item 3b).

**Item 3(c) + 4 (commit `d17beb4`): scroll-hide root cause + content-fit gating.** The scroll-hide effect was gated on `if (!abc) return` — it never attached at all for empty-abc tunes (Ps 45b, or no tune at all), which was the exact root cause of item 3(c). Re-keyed to `[activeTune?.id, viewMode]`. Also implemented the user's explicit follow-up clarification: when a scrollable region's content actually fits its viewport slot (`scrollHeight <= clientHeight + 2px`), scrolling is disabled entirely (`overflow-y: hidden`, mobile-only) and hide-on-scroll never activates — this sidesteps the "last lines unreachable" boundary bug rather than patching its arithmetic. A `ResizeObserver` re-evaluates on every relevant layout change.

**Two additional bugs found empirically via Playwright while verifying the above** (commits `f2b476b`, `8f4f6b7`):
- The `capBothHalvesOnDesktop` split-leaf lyrics half (used by Solfège split-leaf and now also Staff's new JPG fallback) was `overflow-hidden` with **no scroll at all**, silently clipping any lyrics beyond the 50% slot — pre-existing since 260712-tmm, but far more consequential once this task's Bug 1 fix routed Split-Leaf Staff through the same branch. Made scrollable.
- The content-fit measurement's `data-lyrics-slot` selector was targeting a purely structural wrapper (always reports `scrollHeight === clientHeight` via `h-full`, since the REAL scrolling happens in a nested child div) — defeating the fits-viewport gate for split-leaf lyrics entirely. Tagged the actual inner scroll container with `data-lyrics-scroll` and retargeted the selector.

## Task Commits

1. **Task 1: Split-Leaf Staff falls back to the staff JPEG for non-approved tunes** - `c943597` (fix)
2. **Task 2: Non-recommended-versification messaging + forced Lyrics Only for zero-notation tunes** - `e81bc5a` (fix)
3. **Checkpoint round 1, item 1: flank Split-Leaf JPEG with prev/next nav, drop thumbnail strip** - `2b2312a` (fix)
4. **Checkpoint round 1, items 2 + 3a/3b: real lyrics for no-tune versions, proactive tune-selector flow** - `d59d88c` (fix)
5. **Checkpoint round 1, items 3c + 4: scroll-hide root-cause fix + content-fit gating** - `d17beb4` (fix)
6. **Empirical fix found during verification: scrollable capBothHalvesOnDesktop lyrics half** - `f2b476b` (fix)
7. **Empirical fix found during verification: retarget content-fit measurement to the real scroll container** - `8f4f6b7` (fix)

**Checkpoint:** App rebuilt (`npm run build`, no new tsc errors) and `pm2 restart psalter` executed twice (after the original 2 tasks, then again after all round-1 follow-ups) — process online with fresh uptime both times. All live URLs (Ps 42, 45a, 45b, 23) return HTTP 200. All items verified empirically via the Playwright daemon against `localhost:3005` (bypassing Cloudflare Tunnel latency) before returning each checkpoint.

## Files Created/Modified

- `src/components/notation/NotationRenderer.tsx` - `staffInlineApproved` prop, `renderScannedPages()` (single `imageBlock` with flanking nav, no thumbnails), `forceStaffJpgFallback` branch, `data-lyrics-scroll` tagging, scrollable `capBothHalvesOnDesktop` lyrics half
- `src/components/singing/SingingView.tsx` - `isRecommendedVersion`/`hasAnyNotation` derivations, unconditional `NotationRendererClient` render, `pendingTuneIntent` state + resolution effect, `handleRequestTuneSelection`/`handleTuneSwitcherOpenChange`, rewritten scroll-hide effect (content-fit gating + `[activeTune?.id, viewMode]` deps)
- `src/components/singing/PlayMiniBar.tsx` - `hasAbc`, lazy `audioSource` initializer, re-force effect, updated toggle/disclaimer gating
- `src/components/singing/GearPopover.tsx` - `hasActiveTune`/`onRequestTuneSelection` props, `musicNotesBlocked` derivation, three-way Music Notes tap routing
- `src/app/psalms/[id]/page.tsx` / `src/app/precent/[id]/sing/[pos]/page.tsx` - compute and pass `isRecommendedVersion`

## Decisions Made

See `key-decisions` in frontmatter above for the full list; notably: the "not recommended" messaging moved from a blocking placeholder to a toast (checkpoint-directed), and the `aria-disabled` (not native `disabled`) pattern was used for the greyed Music Notes toggle specifically so a real tap still fires its explanatory toast — verified this trade-off means Playwright's `.click()` treats it as non-actionable (needs `force: true`) while a real mouse/touch tap fires normally, since `aria-disabled` alone doesn't block pointer events without `pointer-events: none`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-scrollable capBothHalvesOnDesktop split-leaf lyrics half**
- **Found during:** Empirical Playwright verification of checkpoint round-1 item 1 fix
- **Issue:** The lyrics half of the `capBothHalvesOnDesktop` split-leaf branch (used by Solfège split-leaf, and now also Staff's JPG fallback per this task's Bug 1) was `overflow-hidden` with no way to scroll at all, silently clipping lyrics beyond the 50% slot at any screen width — pre-existing since quick task 260712-tmm.
- **Fix:** Changed to `overflow-y-auto overscroll-y-none`, matching the sibling non-capped branch.
- **Files modified:** `src/components/notation/NotationRenderer.tsx`
- **Verification:** Playwright — all 13 verses of Ps 42 reachable via scroll after the fix (previously clipped beyond ~467px).
- **Committed in:** `f2b476b`

**2. [Rule 1 - Bug] Content-fit measurement targeting a non-scrolling structural wrapper**
- **Found during:** Empirical Playwright verification of the item 4 content-fit gating fix
- **Issue:** `data-lyrics-slot` (the outer `renderSplitLeaf` wrapper) always reported `scrollHeight === clientHeight` regardless of actual lyrics length, because the REAL scroll container is a nested child div sized via `h-full` — this silently defeated the fits-viewport gate for split-leaf lyrics (always read as "fits", disabling scroll even for genuinely long content).
- **Fix:** Tagged the actual inner scroll container with `data-lyrics-scroll` in both split-leaf `stanzaBlock` definitions; retargeted `SingingView`'s measurement selector at it instead of `data-lyrics-slot`.
- **Files modified:** `src/components/notation/NotationRenderer.tsx`, `src/components/singing/SingingView.tsx`
- **Verification:** Playwright — `scrollHeight` (1206) now correctly exceeds `clientHeight` (467) for Ps 42's split-leaf lyrics; overflow stays `auto`.
- **Committed in:** `8f4f6b7`

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs, found empirically while verifying this task's own checkpoint-directed fixes)
**Impact on plan:** Both were necessary corrections to make the checkpoint round-1 fixes actually achieve their stated goals (readable lyrics, correct scroll-hide gating). No scope creep beyond what verification required.

## Issues Encountered

- Initial Playwright daemon jobs against `https://psalter.gsdlabs.dev` timed out (Cloudflare Tunnel latency); switched to `http://localhost:3005` directly for all verification, which was fast and reliable.
- Early test runs showed misleading results due to stale `localStorage` (`psalter-score-mode`) carried over between navigations in the same persistent browser context — resolved by explicitly clearing `localStorage` before each independent test.
- `npx eslint` flags pre-existing `react-hooks/set-state-in-effect` / `react-hooks/preserve-manual-memoization` warnings throughout `SingingView.tsx` and `PlayMiniBar.tsx` — confirmed via `git stash` comparison that these are pre-existing and not introduced by this task's changes (one new instance follows an identical pre-existing pattern in the same file). Out of scope per Scope Boundary rule.

## User Setup Required

None - no external service configuration required.

## Checkpoint Status

Checkpoint round 1 feedback (all 4 items + 1 follow-up clarification) addressed and verified empirically via Playwright against the rebuilt, restarted app. Awaiting human re-verification on the live site.

---
*Phase: quick-260717-mwv*
*Completed: pending final checkpoint approval*
