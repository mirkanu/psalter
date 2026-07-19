---
phase: quick-260717-mwv
plan: 01
subsystem: ui
tags: [nextjs, react, abcjs, notation, singing-view, scroll-hide, sonner]

requires:
  - phase: 04.9.15-04
    provides: staffInlineApproved gating helpers (src/lib/inline-staff-gating.ts)
provides:
  - Split-Leaf Staff respects tune-approval status (shared renderScannedPages helper)
  - Split-Leaf multi-page JPEGs use narrow flanking prev/next nav instead of a thumbnail strip
  - Real Lyrics Only content (not a placeholder message) for psalm-versions with no active tune
  - Tune-selection flow from Music Notes / Play hands control back to the Gear popover (pre-scoped to Music Notes) rather than auto-picking a view
  - Zero-notation tunes force Lyrics Only with an automatic explanatory toast AND a greyed, tap-to-explain Music Notes toggle
  - Scroll-hide-on-scroll works regardless of whether the active tune has ABC notation, and catches abcjs's async render timing
  - Scrolling and hide-on-scroll are disabled entirely when content fits the viewport (mobile only)
  - Toasts render clear of the fixed bottom bar and are dismissible by tapping anywhere on them
  - "Made by GSD Labs" reachable on mobile singing view via the hamburger menu
  - Trailing stanza-height whitespace at the end of lyrics content as a scroll-hide timing safety margin
affects: [singing-view, notation-renderer, play-mini-bar, gear-popover, site-header, root-layout]

tech-stack:
  added: []
  patterns:
    - "renderScannedPages(pages, fallbackUrl, altText) shared helper in NotationRenderer.tsx returns a single imageBlock (image + narrow flanking prev/next buttons), reused by solfege-split and staff-split JPG-fallback branches"
    - "hasAnyNotation (staffAvailable || solfegeSplitAvailable) as the single source of truth for whether a tune has any renderable notation"
    - "pendingTuneIntent ('music-notes' | 'play' | null) state in SingingView tracks WHY the tune switcher was opened so the post-selection effect can route correctly (reopen Gear popover scoped to Music Notes vs stay-in-Lyrics-Only-and-play)"
    - "data-lyrics-scroll / data-notation-slot data attributes mark the REAL scroll containers (not structural wrappers) for SingingView's content-fits-viewport measurement; each candidate's first child is also ResizeObserver'd to catch async content settling (abcjs SVG render, image onload) that doesn't resize the fixed-size flex parent itself"
    - "ToastTapDismiss: document-level click listener providing tap-anywhere-on-toast dismissal, since sonner's built-in dismiss-by-click is scoped only to its closeButton, not the toast body"

key-files:
  created:
    - src/components/ToastTapDismiss.tsx
  modified:
    - src/components/notation/NotationRenderer.tsx
    - src/components/singing/SingingView.tsx
    - src/components/singing/PlayMiniBar.tsx
    - src/components/singing/GearPopover.tsx
    - src/components/SiteHeader.tsx
    - src/app/layout.tsx
    - src/app/psalms/[id]/page.tsx
    - src/app/precent/[id]/sing/[pos]/page.tsx

key-decisions:
  - "staffInlineApproved threaded straight through to NotationRendererClient (Task 1) so Split-Leaf Staff can reuse the exact same JPG-fallback mechanism Split-Leaf Solfège already used"
  - "hasAnyNotation guards both the mount-hydration viewMode restore and the existing shouldFallbackToSplit effect, with a dedicated forced-Lyrics-Only effect taking priority for zero-notation tunes"
  - "Round 1: lyrics come from the psalm VERSION not the tune, so SingingView always renders NotationRendererClient — no-tune psalms show real Lyrics Only content instead of a blocking placeholder message; the 'not recommended' context moved to a one-time toast"
  - "Round 1: scroll-hide effect re-keyed from [abc] to [activeTune?.id, viewMode] — the old abc-gate meant it never attached at all for empty-abc tunes, the actual root cause of round-1 item 3(c)"
  - "Round 1 + round 2: content-fits-viewport gating (scrollHeight <= clientHeight + 2px tolerance) forces overflow-y:hidden and skips hide-on-scroll entirely for regions that don't need to scroll (mobile only) — sidesteps the 'barely fits' boundary bug rather than patching its arithmetic"
  - "Round 2, item 2 (REVERSAL of round-1 item 2b): picking a tune via the Music-Notes-triggered switcher no longer silently commits to inline Staff — it sets Music Notes as the active category AND re-opens the Gear popover so the user explicitly finishes the choice (Staff/Solfège, Inline/Split-Leaf)"
  - "Round 2, item 3 (REVERSAL of round-1 item 3a): the automatic 'no notation, showing Lyrics Only' toast is restored on page load/tune-switch, in addition to (not instead of) the tap-triggered explanation"
  - "Round 2, item A: sonner's dismiss-by-click is scoped to its own closeButton only, not the toast body (verified against source) — added a dedicated ToastTapDismiss listener for true tap-anywhere dismissal, plus an 88px bottom offset so toasts clear SingingView's fixed GlassBottomBar"
  - "Round 2, item B: ResizeObserver only fires when an OBSERVED element's own border-box changes — SingingView's fixed-height flex containers don't themselves resize when their content grows asynchronously (abcjs SVG finishing render after mount), so each candidate's first child (the naturally-sized content wrapper) is now also observed, plus three defensive delayed re-checks as a safety net"
  - "Round 2, item C: pragmatic mitigation — pb-28 (112px, roughly a stanza) trailing whitespace at the end of scrollable lyrics content in both Lyrics Only and Split-Leaf, chromeless-only, so the last stanza can be scrolled fully above the bottom bar even if the deeper scroll-hide timing fix isn't perfect in every case"
  - "Found empirically via Playwright while verifying round-1 item 1: the capBothHalvesOnDesktop split-leaf lyrics half was overflow-hidden (no scroll at all, pre-existing bug from 260712-tmm) and its outer data-lyrics-slot wrapper always reported scrollHeight===clientHeight (real scrolling happens in a nested child) — both fixed as they directly undermined round-1 item 1's and item 4's goals during that same verification pass"

requirements-completed: []

duration: ~5h across 3 checkpoint rounds
completed: 2026-07-19
---

# Quick Task 260717-mwv: Fix three notation-fallback bugs (+ 2 rounds of checkpoint follow-ups) Summary

**Split-Leaf Staff respects tune-approval via a shared JPG-fallback helper with narrow flanking page nav; no-tune psalm-versions show real Lyrics Only content with a Gear-popover-driven tune-selection flow; zero-notation tunes force Lyrics Only with both an automatic and a tap-triggered explanation; scroll-hide-on-scroll works for every tune and disables itself when content already fits; toasts clear the bottom bar and are fully tap-dismissible.**

This quick task went through 3 rounds of live checkpoint feedback — round 1 (initial 2 auto-fix tasks), round 2 (5 follow-up items after live testing), and round 3 (6 more items, including 2 explicit reversals of round-1 decisions). Documented chronologically below.

## Performance

- **Tasks:** 2 original auto-fix tasks + 12 follow-up fixes across 2 checkpoint rounds, all committed atomically
- **Files modified:** 8 (1 new file)

## Round 1: Original 2 tasks

- **commit `c943597` — Bug 1 (Split-Leaf Staff JPG fallback):** Extracted the scanned-image rendering already used by Split-Leaf Solfège into a shared `renderScannedPages()` helper in `NotationRenderer.tsx`, reused for Split-Leaf Staff whenever `staffInlineApproved` is false.
- **commit `e81bc5a` — Bug 2 ("not recommended" messaging) / Bug 3 (zero-notation tunes):** Added `hasAnyNotation` as the deciding signal; a dedicated effect forced Lyrics Only for zero-notation tunes; top-level render and `PlayMiniBar` gate keyed off `activeTune`/`(abc || soundcloudUrl)` instead of `abc` alone.

## Checkpoint round 1 feedback — 5 follow-up fixes + 2 empirically-found bugs

- **`2b2312a` (item 1):** Multi-page JPEGs (e.g. Ps 42/Orlington) showed a thumbnail strip below the main image. `renderScannedPages()` returns a single `imageBlock` with Prev/Next buttons flanking the image left/right instead — no thumbnails.
- **`d59d88c` (items 2, 3a, 3b):** `SingingView` always renders `NotationRendererClient` (lyrics come from the psalm version, not the tune) so a no-tune psalm shows real Lyrics Only content; the "not recommended" context became a toast. `GearPopover`'s "Music Notes" toggle: no active tune → opens the Tune Switcher and (at the time) loaded directly into inline Staff; Play with no tune → opens the switcher and stays in Lyrics Only + opens the Play panel. Zero-notation tunes: removed the automatic toast, greyed the Music Notes toggle with a tap-to-explain message.
- **`d17beb4` (items 3c, 4):** Root cause of 3(c): the scroll-hide effect was gated on `if (!abc) return`, so it never attached for empty-abc tunes. Re-keyed to `[activeTune?.id, viewMode]`. Implemented content-fits-viewport gating (disable scroll + hide-on-scroll when `scrollHeight <= clientHeight`, mobile only).
- **`f2b476b`, `8f4f6b7` (found via Playwright while verifying the above):** The `capBothHalvesOnDesktop` split-leaf lyrics half was `overflow-hidden` with no scroll at all (pre-existing since 260712-tmm) — fixed to scrollable. The content-fit measurement's `data-lyrics-slot` selector was targeting a purely structural wrapper that always reported `scrollHeight === clientHeight` regardless of real content — retargeted at the actual inner scroll container (`data-lyrics-scroll`).

## Checkpoint round 2 feedback — 6 more items, including 2 reversals

- **`f5de34f` (item 1):** The flanking Prev/Next buttons were 44×44 with 4px gaps, reserving ~100px of horizontal width on mobile. Narrowed to a 28px-wide column with no gap, freeing more width for the JPEG.
- **`184404d` (item 2, REVERSAL of round-1 item 2b):** Picking a tune from the Music-Notes-triggered switcher no longer silently commits to inline Staff. It now sets Music Notes as the active category **and re-opens the Gear popover**, handing control back to the user to explicitly pick Staff/Solfège and Inline/Split-Leaf.
- **`184404d` (item 3, REVERSAL of round-1 item 3a):** The automatic "no notation, showing Lyrics Only" toast is restored on page load/tune-switch — both the automatic toast AND the tap-triggered explanation now fire (previously only the tap-triggered one, per round 1's request; now both, per round 2's reversal).
- **`f7f509b`, `cc2de44` (item A):** Toasts overlapped SingingView's fixed GlassBottomBar. Added an 88px bottom offset. Also discovered (empirically, against sonner's source) that clicking the toast *body* does not dismiss it by default — only its `closeButton`'s own X does. Added `ToastTapDismiss`, a document-level click listener providing true tap-anywhere-on-toast dismissal.
- **`ea7ba24` (item B, part 1):** Content-fit scroll gating wasn't catching abcjs's async SVG render completing after mount — the observed element's own border-box is fixed by flex layout and never itself resizes when its content grows, so `ResizeObserver` never fired again after the initial snapshot. Now also observes each candidate's first child (the actual content wrapper), plus 3 defensive delayed re-checks (300/800/1500ms).
- **`ea7ba24` (item B, part 2):** "Made by GSD Labs" was unreachable on the singing view (fixed-height layout, no page-level scroll reaches the root-layout footer there). Mirrored into the mobile hamburger menu.
- **`478b2e6` (item C):** Added `pb-28` (112px, roughly a stanza) trailing whitespace to the end of scrollable lyrics content in both Lyrics Only and Split-Leaf (chromeless only) — pragmatic mitigation so the last stanza can be scrolled fully into view even if the auto-hide timing isn't perfect in every case.

## Task Commits

1. `c943597` — Task 1: Split-Leaf Staff JPG fallback (Bug 1)
2. `e81bc5a` — Task 2: "not recommended" messaging + forced Lyrics Only (Bugs 2/3)
3. `2b2312a` — Round 1 item 1: flanking JPEG nav, drop thumbnails
4. `d59d88c` — Round 1 items 2/3a/3b: real lyrics for no-tune versions, proactive tune-selector flow
5. `d17beb4` — Round 1 items 3c/4: scroll-hide root-cause fix + content-fit gating
6. `f2b476b` — Empirical fix: scrollable capBothHalvesOnDesktop lyrics half
7. `8f4f6b7` — Empirical fix: retarget content-fit measurement to the real scroll container
8. `f5de34f` — Round 2 item 1: tighten JPEG nav button footprint
9. `184404d` — Round 2 items 2/3: reverse round-1 items 2b and 3a
10. `f7f509b` — Round 2 item A: toast offset + closeButton
11. `ea7ba24` — Round 2 item B: async-render-aware scroll gating + GSD credit on mobile
12. `478b2e6` — Round 2 item C: trailing stanza-height whitespace
13. `cc2de44` — Round 2 item A follow-up: true tap-anywhere toast dismissal

**Checkpoint:** App rebuilt and `pm2 restart psalter` run 3 times (after round 1's original 2 tasks, after round 1's 5 follow-ups, after round 2's 6 items) — process confirmed online with fresh uptime each time. All URLs (Ps 42, 45a, 45b, 23, 90) return HTTP 200 on both `localhost:3005` and the public tunnel. Every item across all 3 rounds was verified empirically via the Playwright daemon against `localhost:3005` (the public tunnel had intermittent latency during this session) before each checkpoint was returned.

## Files Created/Modified

- `src/components/notation/NotationRenderer.tsx` — `staffInlineApproved` prop, `renderScannedPages()` (narrow flanking nav, no thumbnails), `forceStaffJpgFallback` branch, `data-lyrics-scroll` tagging, scrollable `capBothHalvesOnDesktop` lyrics half, `pb-28` trailing whitespace
- `src/components/singing/SingingView.tsx` — `isRecommendedVersion`/`hasAnyNotation` derivations, unconditional `NotationRendererClient` render, `pendingTuneIntent` state + resolution effect (reopen Gear popover vs stay-in-Lyrics-Only-and-play), restored zero-notation auto-toast, rewritten scroll-hide effect (async-aware content-fit gating + `[activeTune?.id, viewMode]` deps)
- `src/components/singing/PlayMiniBar.tsx` — `hasAbc`, lazy `audioSource` initializer, re-force effect, updated toggle/disclaimer gating
- `src/components/singing/GearPopover.tsx` — `hasActiveTune`/`onRequestTuneSelection` props, `musicNotesBlocked` derivation, three-way Music Notes tap routing
- `src/components/SiteHeader.tsx` — "Made by GSD Labs" link added to the mobile hamburger menu
- `src/app/layout.tsx` — Toaster offset/closeButton, `ToastTapDismiss` mount
- `src/components/ToastTapDismiss.tsx` (new) — document-level tap-anywhere-on-toast dismissal
- `src/app/psalms/[id]/page.tsx` / `src/app/precent/[id]/sing/[pos]/page.tsx` — compute and pass `isRecommendedVersion`

## Decisions Made

See `key-decisions` in frontmatter for the full list. Notable pattern across rounds: several round-1 decisions were explicitly reversed in round 2 based on live user testing (Music Notes tune-selection routing, the zero-notation auto-toast) — both reversals are implemented and documented inline in the code with round/item references so future readers understand *why* the behavior differs from the original plan text.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-scrollable capBothHalvesOnDesktop split-leaf lyrics half**
- **Found during:** Empirical Playwright verification of checkpoint round-1 item 1 fix
- **Issue:** The lyrics half of the `capBothHalvesOnDesktop` split-leaf branch was `overflow-hidden` with no way to scroll at all, silently clipping lyrics beyond the 50% slot at any screen width — pre-existing since quick task 260712-tmm.
- **Fix:** Changed to `overflow-y-auto overscroll-y-none`, matching the sibling non-capped branch.
- **Committed in:** `f2b476b`

**2. [Rule 1 - Bug] Content-fit measurement targeting a non-scrolling structural wrapper**
- **Found during:** Empirical Playwright verification of the item 4 content-fit gating fix
- **Issue:** `data-lyrics-slot` (the outer `renderSplitLeaf` wrapper) always reported `scrollHeight === clientHeight` regardless of actual lyrics length, because the REAL scroll container is a nested child div sized via `h-full`.
- **Fix:** Tagged the actual inner scroll container with `data-lyrics-scroll`; retargeted the measurement selector.
- **Committed in:** `8f4f6b7`

**3. [Rule 1 - Bug] Toast dismiss-by-click claim was incorrect**
- **Found during:** Empirical Playwright verification of the round-2 item A toast fix
- **Issue:** Assumed (from sonner docs' "Prevent swipe/click to dismiss" wording) that clicking the toast body dismissed it by default. Verified against sonner@2.0.7's source that click-dismiss is scoped only to the `closeButton`'s own onClick, not the toast `<li>`.
- **Fix:** Added `ToastTapDismiss`, a document-level click listener providing true tap-anywhere dismissal.
- **Committed in:** `cc2de44`

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs, found empirically while verifying this task's own checkpoint-directed fixes)
**Impact on plan:** All three were necessary corrections to make the checkpoint-directed fixes actually achieve their stated goals. No scope creep beyond what verification required.

## Issues Encountered

- Initial Playwright daemon jobs against `https://psalter.gsdlabs.dev` timed out (Cloudflare Tunnel latency); switched to `http://localhost:3005` directly for all verification, which was fast and reliable.
- Early test runs showed misleading results due to stale `localStorage` carried over between navigations in the same persistent browser context — resolved by explicitly clearing `localStorage` before each independent test.
- The playwright-daemon occasionally timed out mid-job and relaunched its browser (visible in its logs as "Job timed out — relaunching browser"); one apparent "reversion" during round-3 item 2 verification was traced to this daemon flakiness, not an app bug — re-running the same test with granular 300ms sampling showed consistent, correct behavior across 2.4 seconds.
- `npx eslint` flags pre-existing `react-hooks/set-state-in-effect` / `react-hooks/preserve-manual-memoization` warnings throughout `SingingView.tsx` and `PlayMiniBar.tsx` — confirmed via `git stash` comparison that these are pre-existing and not introduced by this task's changes. Out of scope per Scope Boundary rule.

## User Setup Required

None - no external service configuration required.

## Checkpoint Status

All 3 rounds of checkpoint feedback addressed and verified empirically via Playwright against the rebuilt, restarted app (3 separate rebuild+restart cycles). Awaiting final human re-verification on the live site.

---
*Phase: quick-260717-mwv*
*Completed: pending final checkpoint approval*
