---
phase: quick-260723-cpt-fix-ios-home-screen-landscape-safe-area
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/layout.tsx
  - src/components/SiteHeader.tsx
  - src/components/singing/SingingView.tsx
  - src/app/psalms/[id]/loading.tsx
  - src/app/precent/[id]/sing/[pos]/loading.tsx
autonomous: true
requirements: [QUICK-260723-CPT]

must_haves:
  truths:
    - "The rendered HTML <head> contains a viewport meta tag with viewport-fit=cover."
    - "The rendered HTML <head> contains exactly one mobile-web-app-capable=yes (auto-emitted by Next from appleWebApp.capable), one apple-mobile-web-app-capable=yes (added via metadata.other for older iOS Safari), and apple-mobile-web-app-status-bar-style=black-translucent."
    - "The global SiteHeader reserves env(safe-area-inset-top) padding at the top, so its content is never drawn behind the iOS status bar in standalone portrait."
    - "The singing view <main> height and hide-margin both fold env(safe-area-inset-top) into their calc, so the layout is unchanged when the inset is 0 (browser tab / landscape) and correct when it is non-zero (standalone portrait notch)."
    - "The two loading skeletons subtract env(safe-area-inset-top) from their body height calc, matching the live singing view."
    - "Existing env(safe-area-inset-bottom) handling in GlassBottomBar, PlayMiniBar, and the two loading skeletons is untouched."
    - "next build exits 0 (Compiled successfully)."
  artifacts:
    - path: "src/app/layout.tsx"
      provides: "viewport export (viewport-fit=cover) + appleWebApp metadata + apple-mobile-web-app-capable via metadata.other"
      contains: "viewportFit"
    - path: "src/components/SiteHeader.tsx"
      provides: "safe-area-inset-top top padding on the sticky global header"
      contains: "safe-area-inset-top"
    - path: "src/components/singing/SingingView.tsx"
      provides: "inset-top-aware body height + hide-margin math"
      contains: "safe-area-inset-top"
    - path: "src/app/psalms/[id]/loading.tsx"
      provides: "inset-top-aware skeleton body height"
      contains: "safe-area-inset-top"
    - path: "src/app/precent/[id]/sing/[pos]/loading.tsx"
      provides: "inset-top-aware skeleton body height"
      contains: "safe-area-inset-top"
  key_links:
    - from: "src/app/layout.tsx viewport export"
      to: "rendered <meta name=viewport ... viewport-fit=cover>"
      via: "Next.js Viewport export"
      pattern: "viewportFit:\\s*'cover'"
    - from: "src/app/layout.tsx metadata.appleWebApp + metadata.other"
      to: "rendered mobile-web-app-capable=yes (auto) + apple-mobile-web-app-capable=yes (other) + status-bar-style meta"
      via: "Next metadata rendering — appleWebApp.capable emits ONLY the unprefixed tag; other adds the apple-prefixed one"
      pattern: "apple-mobile-web-app-capable"
    - from: "src/components/SiteHeader.tsx header padding-top"
      to: "content pushed below the status bar in cover mode"
      via: "env(safe-area-inset-top)"
      pattern: "safe-area-inset-top"
    - from: "src/components/singing/SingingView.tsx <main> calc"
      to: "notation fills exactly the space below the padded header + topbar"
      via: "calc subtracting 104px/116px + env(safe-area-inset-top)"
      pattern: "safe-area-inset-top"
---

<objective>
Fix the iOS home-screen (standalone PWA) landscape blank-gap bug: iOS silently reserves a status-bar-shaped blank strip at the top of "Add to Home Screen" web apps in landscape unless the page opts into `viewport-fit=cover`. Add the correct Next.js viewport + apple-web-app meta tags, then make the layout safe under cover mode by handling `env(safe-area-inset-top)` on the top-most chrome (so portrait-standalone doesn't flip the bug into "header behind the notch").

Purpose: Users who add the site to their Home Screen (to bypass the existing iOS-landscape rotate-block) currently see ~15% of the viewport wasted as a blank white strip in landscape. Root cause is a well-documented WebKit standalone-mode quirk; the standard mitigation is `viewport-fit=cover` + explicit `env(safe-area-inset-top)` handling.

Output: Edited `layout.tsx`, `SiteHeader.tsx`, `SingingView.tsx`, and the two `loading.tsx` skeletons.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/app/layout.tsx
@src/components/SiteHeader.tsx
@src/components/singing/SingingView.tsx
@src/app/psalms/[id]/loading.tsx
@src/app/precent/[id]/sing/[pos]/loading.tsx

<key-facts>
- Project runs Next.js 16 (installed `next` v16.2.5), App Router. In this version, `width`/`initialScale`/`viewportFit` go in a `Viewport` export; `appleWebApp` goes in the `Metadata` export.
- VERIFIED (against installed `node_modules/next/dist/lib/metadata/metadata.js`): `appleWebApp.capable: true` in this Next version emits ONLY `<meta name="mobile-web-app-capable" content="yes">` — the UNPREFIXED tag. It does NOT emit the apple-prefixed `apple-mobile-web-app-capable`. To get the apple-prefixed tag (wanted for older iOS Safari), add it explicitly via `metadata.other`. Do NOT also put `mobile-web-app-capable` in `other` — that duplicates the auto-generated tag.
- `src/app/layout.tsx` currently exports only `metadata` (title/description) — NO viewport export, NO appleWebApp, NO viewport-fit=cover, NO manifest.
- `grep -rn "safe-area" src/` shows the codebase handles ONLY `env(safe-area-inset-bottom)` (GlassBottomBar.tsx line 59, PlayMiniBar.tsx, and both loading.tsx skeletons). There is ZERO `safe-area-inset-top` handling anywhere. This plan adds the first uses.
- Project uses Tailwind CSS 4 (@tailwindcss/postcss v4.3.1). Tailwind v4 auto-normalizes calc() spacing, so underscore-escaped and plain-space arbitrary calc values compile to byte-identical CSS. The underscore form (`h-[calc(100dvh_-_104px)]`) is used below purely for readability/consistency — it is harmless, not load-bearing.
- SiteHeader is `sticky top-0`, inner row `h-14` (56px), hides via `-translate-y-full` (NOT unmounted — still reserves flow height). PsalmTopBar is `sticky top-14`, `h-12 md:h-14 landscape:h-10`.
- The singing view sets `document.documentElement.style.overflow = 'hidden'` while mounted, so the window never scrolls there — sticky offsets never engage; chrome sits in natural flow. This is why only SiteHeader (the physically-topmost element) needs inset-top padding; PsalmTopBar sits below it and must NOT get inset-top padding.
</key-facts>

<inset-top-arithmetic>
Why the env() terms are safe no-ops in the exact bug scenario, and correct in the new one:

- iPhone LANDSCAPE (where the reported bug happens): `safe-area-inset-top` = 0 (the notch becomes inset-left/right). So every `- env(safe-area-inset-top)` term collapses to 0 → layout math is byte-for-byte identical to today. The `viewport-fit=cover` meta tag alone removes the reserved blank strip.
- Non-standalone browser tab (iOS Safari / Android), portrait or landscape: `safe-area-inset-top` = 0 → no-op. No regression.
- iPhone PORTRAIT standalone (notch): `safe-area-inset-top` ≈ 47-59px. Turning on cover mode would otherwise let the sticky SiteHeader render BEHIND the status bar. The header's new `padding-top: env(safe-area-inset-top)` pushes its content down; `<main>` subtracts the same inset so notation still fits exactly. This is the NEW case the env() math exists for.

Header occupies `env(safe-area-inset-top) + 56px`; topbar occupies 48px (mobile) / 56-60px (md). So `<main>` height = `100dvh - 104px - env(safe-area-inset-top)` (mobile) / `100dvh - 116px - env(safe-area-inset-top)` (md). When chrome is hidden, `<main>` is pulled to the physical top: `marginTop = -(104px + env(safe-area-inset-top))`, `height = 100dvh`. All existing constants (104/116) are preserved verbatim; only the `- env(safe-area-inset-top)` term is appended.
</inset-top-arithmetic>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add cover/apple-web-app meta tags + guard the global header for cover mode</name>
  <files>src/app/layout.tsx, src/components/SiteHeader.tsx</files>
  <action>
In `src/app/layout.tsx`:
1. Import the `Viewport` type from `next` alongside the existing `Metadata` import (e.g. `import type { Metadata, Viewport } from "next";`).
2. Add a new `export const viewport: Viewport = { viewportFit: 'cover' };` (leave Next's default `width=device-width, initial-scale=1` alone — do not override them). This emits `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
3. Extend the existing `metadata` export with:
   - `appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CPRC Psalter' }`.
     VERIFIED BEHAVIOR for this repo's installed Next (v16.2.5): `capable: true` auto-emits `<meta name="mobile-web-app-capable" content="yes">` (UNPREFIXED only — it does NOT emit the apple-prefixed variant). `statusBarStyle` emits `apple-mobile-web-app-status-bar-style=black-translucent`; `title` emits `apple-mobile-web-app-title=CPRC Psalter`. Use `black-translucent` per the researched mitigation so content goes edge-to-edge (a plain `default` reserves space and can re-introduce a gap-like reservation).
   - `other: { 'apple-mobile-web-app-capable': 'yes' }` — the apple-PREFIXED tag, added explicitly because `appleWebApp.capable` does NOT produce it in this Next version. This restores compatibility with older iOS Safari versions that only recognize the apple-prefixed name. IMPORTANT: do NOT put `mobile-web-app-capable` in `other` — `appleWebApp.capable: true` already auto-generates that unprefixed tag, and adding it again would duplicate it.
   Keep the existing `title` and `description` fields unchanged.

Net result in the rendered head: `viewport-fit=cover`, `mobile-web-app-capable=yes` (once, auto from appleWebApp), `apple-mobile-web-app-capable=yes` (from other), `apple-mobile-web-app-status-bar-style=black-translucent`, `apple-mobile-web-app-title=CPRC Psalter`.

In `src/components/SiteHeader.tsx`:
4. On the `<header>` element (the one with `data-scroll-hidden` and `sticky top-0 z-50 ...`), add the Tailwind class `pt-[env(safe-area-inset-top)]` to the className list (inside the existing `cn(...)` call — add it to the first string with the sticky/bg classes). This reserves the status-bar-height padding above the header content so, under `viewport-fit=cover`, the logo/nav is never drawn behind the notch/status bar in standalone portrait. In every non-notched / non-standalone context `env(safe-area-inset-top)` resolves to 0, so this is a visual no-op. Do NOT change the inner `h-14` row height, the border, or the `-translate-y-full` hide behavior (translating by 100% still moves the now-taller header fully off-screen).

Do NOT touch PsalmTopBar or add inset-top anywhere else in this task.
  </action>
  <verify>
    <automated>cd /home/services/psalter && grep -q "viewportFit: 'cover'" src/app/layout.tsx && grep -q "statusBarStyle: 'black-translucent'" src/app/layout.tsx && grep -q "'apple-mobile-web-app-capable': 'yes'" src/app/layout.tsx && ! grep -q "'mobile-web-app-capable'" src/app/layout.tsx && grep -q "pt-\[env(safe-area-inset-top)\]" src/components/SiteHeader.tsx && npx next build > /tmp/psalter-build-t1.log 2>&1; [ $? -eq 0 ] && echo VERIFY_OK</automated>
  </verify>
  <done>
`next build` exits 0. `layout.tsx` exports a `Viewport` with `viewportFit: 'cover'` and a `metadata.appleWebApp` with `capable: true` + `statusBarStyle: 'black-translucent'` + title, plus `other['apple-mobile-web-app-capable'] = 'yes'` (and NO `mobile-web-app-capable` key in `other`, to avoid duplicating the auto-generated tag). `SiteHeader.tsx`'s sticky header carries `pt-[env(safe-area-inset-top)]`. Existing header height/hide behavior unchanged.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fold env(safe-area-inset-top) into the singing-view body height + hide-margin</name>
  <files>src/components/singing/SingingView.tsx</files>
  <action>
Edit the `<main ref={mainRef} ...>` block (around line 876-885).

1. Base height classes: change
   `h-[calc(100dvh-104px)] md:h-[calc(100dvh-116px)]`
   to (underscore = literal space; purely for readability — Tailwind v4 normalizes calc spacing either way):
   `h-[calc(100dvh_-_104px_-_env(safe-area-inset-top))] md:h-[calc(100dvh_-_116px_-_env(safe-area-inset-top))]`
   Leave the rest of the className string (`overflow-hidden flex flex-col ... pb-11 md:pb-13 transition-[height,margin-top,padding-bottom] duration-200 ease-out motion-reduce:transition-none`) exactly as-is.

2. Inline `style` prop: change the `marginTop` line from
   `marginTop: topBarHidden ? '-104px' : undefined,`
   to
   `marginTop: topBarHidden ? 'calc(-104px - env(safe-area-inset-top))' : undefined,`
   Leave `height: topBarHidden ? '100dvh' : undefined,` and `paddingBottom: bottomBarHidden ? '0px' : undefined,` unchanged. (marginTop stays a single mobile value: chrome only ever hides on mobile where the topbar is 48px → 104px total; md never hides.)

3. Update the explanatory comment block directly above `<main>` (the `104 = 56 SiteHeader + 48 topbar` note) to record that both the height calc and the hide-margin now additionally subtract `env(safe-area-inset-top)` for iOS standalone/notch safe-area, and that it collapses to the old 104/116 math when the inset is 0 (browser tab / landscape).

Do NOT alter the scroll-hide effect, `phoneLandscapeChromeHide`, the split-leaf logic, or `env(safe-area-inset-bottom)` handling. This change is purely the two calc expressions + the comment.
  </action>
  <verify>
    <automated>cd /home/services/psalter && grep -q "100dvh_-_104px_-_env(safe-area-inset-top)" src/components/singing/SingingView.tsx && grep -q "100dvh_-_116px_-_env(safe-area-inset-top)" src/components/singing/SingingView.tsx && grep -q "calc(-104px - env(safe-area-inset-top))" src/components/singing/SingingView.tsx && npx next build > /tmp/psalter-build-t2.log 2>&1; [ $? -eq 0 ] && echo VERIFY_OK</automated>
  </verify>
  <done>
Arithmetic check: with `env(safe-area-inset-top)=0` (landscape / browser tab) the base classes reduce to `calc(100dvh - 104px)` / `calc(100dvh - 116px)` and the hide-margin to `-104px` — identical to pre-change behavior (no regression). With a non-zero inset (standalone portrait notch) the `<main>` shrinks by exactly the extra header padding added in Task 1, and the hide-margin pulls `<main>` to the physical top. `next build` exits 0.
  </done>
</task>

<task type="auto">
  <name>Task 3: Apply the same inset-top height subtraction to the two loading skeletons</name>
  <files>src/app/psalms/[id]/loading.tsx, src/app/precent/[id]/sing/[pos]/loading.tsx</files>
  <action>
Both files use an inline-style body `<div>` with `height: 'calc(100dvh - NNNpx)'` and already keep `paddingBottom: 'calc(56px + env(safe-area-inset-bottom))'`. Add the top-side safe-area term to the HEIGHT only; leave the paddingBottom (inset-bottom) and the glass-bottom-bar skeleton's `env(safe-area-inset-bottom)` untouched.

1. `src/app/psalms/[id]/loading.tsx` (line ~20): change
   `height: 'calc(100dvh - 104px)'`
   to
   `height: 'calc(100dvh - 104px - env(safe-area-inset-top))'`.

2. `src/app/precent/[id]/sing/[pos]/loading.tsx` (line ~22): change
   `height: 'calc(100dvh - 114px)'`
   to
   `height: 'calc(100dvh - 114px - env(safe-area-inset-top))'`.
   (114 = 56 SiteHeader + 48 topbar + 10 precenting bar — keep the constant, just append the inset term.)

These are plain inline-style strings (not Tailwind arbitrary values), so real spaces around the minus are correct and unambiguous — no underscores needed here. The real SiteHeader (padded in Task 1) sits above these skeletons, so only the body height needs the inset subtraction for the skeleton to match the live view.
  </action>
  <verify>
    <automated>cd /home/services/psalter && grep -q "calc(100dvh - 104px - env(safe-area-inset-top))" src/app/psalms/[id]/loading.tsx && grep -q "calc(100dvh - 114px - env(safe-area-inset-top))" "src/app/precent/[id]/sing/[pos]/loading.tsx" && grep -q "env(safe-area-inset-bottom)" src/app/psalms/[id]/loading.tsx && grep -q "env(safe-area-inset-bottom)" "src/app/precent/[id]/sing/[pos]/loading.tsx" && npx next build > /tmp/psalter-build-t3.log 2>&1; [ $? -eq 0 ] && echo VERIFY_OK</automated>
  </verify>
  <done>
Both loading skeletons subtract `env(safe-area-inset-top)` from their body height, matching the live singing view's math (Task 2). Their existing `env(safe-area-inset-bottom)` handling (body paddingBottom + glass-bottom-bar skeleton) is intact. `next build` exits 0.
  </done>
</task>

</tasks>

<verification>
Overall checks after all three tasks:

1. Meta output — after `next build`, confirm the emitted head. Reason from source + verified Next v16.2.5 behavior: `viewport` export → `<meta name="viewport" ... viewport-fit=cover>`; `metadata.appleWebApp.capable` → ONE `mobile-web-app-capable=yes` (unprefixed); `metadata.appleWebApp.statusBarStyle` → `apple-mobile-web-app-status-bar-style=black-translucent`; `metadata.other` → `apple-mobile-web-app-capable=yes` (the apple-prefixed one). Optional runtime spot-check if a dev/prod server is running:
   `curl -s localhost:3005 | grep -io 'name="[a-z-]*web-app[a-z-]*"\|viewport-fit=cover'` — expect exactly one `mobile-web-app-capable`, one `apple-mobile-web-app-capable`, and `viewport-fit=cover`.
2. No inset-bottom regression — `grep -rn "safe-area-inset-bottom" src/` still returns GlassBottomBar.tsx, PlayMiniBar.tsx, and both loading.tsx (unchanged).
3. Non-standalone no-op reasoning — every added term is `- env(safe-area-inset-top)`, which is `0` in a browser tab and in iPhone landscape, so portrait/landscape browser rendering and the landscape standalone case (the reported bug) are mathematically unchanged except for the reserved-strip removal from the meta tag.
4. `npx next build` exits 0 (each task's verify captures the exit code; the build log is at `/tmp/psalter-build-t{1,2,3}.log` if a failure needs inspection).
</verification>

<success_criteria>
- `layout.tsx` emits `viewport-fit=cover`, exactly one `mobile-web-app-capable=yes` (auto from appleWebApp.capable), `apple-mobile-web-app-capable=yes` (from metadata.other), and `apple-mobile-web-app-status-bar-style=black-translucent`.
- `SiteHeader` reserves `env(safe-area-inset-top)` top padding.
- `SingingView` body height + hide-margin both subtract `env(safe-area-inset-top)`, collapsing to today's exact 104/116/-104 values when the inset is 0.
- Both loading skeletons subtract `env(safe-area-inset-top)` from their body height.
- Existing `env(safe-area-inset-bottom)` handling untouched; `next build` exits 0.
</success_criteria>

<output>
After completion, create `.planning/quick/260723-cpt-fix-ios-home-screen-landscape-safe-area-/260723-cpt-SUMMARY.md`.
</output>
