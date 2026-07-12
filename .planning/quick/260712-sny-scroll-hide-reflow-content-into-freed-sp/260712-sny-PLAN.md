---
phase: 260712-sny
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: false
requirements:
  - SNY-a   # reflow notation content into the space freed by hidden bars (true fullscreen)
  - SNY-b   # scroll-hide must be mobile-only (below the md 768px breakpoint)
files_modified:
  - src/components/singing/SingingView.tsx
  - tests/e2e/split-leaf.spec.ts

must_haves:
  truths:
    - "On mobile (<768px), scrolling the notation area down grows the notation/lyrics content region to fill the space vacated by the hidden top and bottom bars (true fullscreen), not just sliding bars away over a same-sized content box."
    - "When the top bar hides on mobile, the <main data-notation-region> element's top edge moves to y≈0 (reclaiming the ~104px SiteHeader+PsalmTopBar strip) and its height grows to ~100dvh."
    - "When the bottom bar hides on mobile, the bottom padding reserved for GlassBottomBar collapses so content extends to the bottom viewport edge."
    - "On desktop (≥768px), scrolling the notation area NEVER hides any chrome — SiteHeader, PsalmTopBar and GlassBottomBar all stay visible, and <main> keeps its resting md height/padding."
    - "Scrolling up on mobile restores all three bars AND shrinks <main> back to its resting size with a smooth 200ms transition (no snap, no leftover gap)."
    - "Resizing the viewport from mobile to desktop while scrolled-down/hidden restores all chrome and the resting <main> size (nothing stuck off-screen or reflowed)."
    - "The PlayMiniBar dynamic-height spacer (04.9.14-03) still composes correctly — it is not removed or broken by the new bottom-padding reflow."
  artifacts:
    - path: "src/components/singing/SingingView.tsx"
      provides: "Mobile-only gated scroll-hide effect (matchMedia 767px) + reflowing <main> whose height/margin-top/padding-bottom respond to topBarHidden/bottomBarHidden"
      contains: "matchMedia"
  key_links:
    - from: "src/components/singing/SingingView.tsx scroll handler"
      to: "topBarHidden / bottomBarHidden / miniBarAutoHidden setters"
      via: "matchMedia('(max-width: 767px)') gate — desktop returns early, never sets hidden flags"
      pattern: "matchMedia\\('\\(max-width: 767px\\)'\\)"
    - from: "topBarHidden / bottomBarHidden state"
      to: "<main data-notation-region> box"
      via: "inline style overriding height + marginTop (top) and paddingBottom (bottom) with a transition"
      pattern: "topBarHidden \\?"
---

<objective>
Two follow-up fixes to the mobile scroll-hide feature built in quick task 260712-kd1 (bars now translate fully off-screen; that part is deployed and confirmed working).

Purpose:
- **(a) Reflow into freed space (true fullscreen).** The 260712-kd1 plan explicitly scoped itself to translate-only and deferred "reflow the notation region to grow into the freed top strip … a separate enhancement" — THIS task is that enhancement. Today the bars slide away but `<main data-notation-region>`'s height and padding are fixed, so the freed ~104px top strip (and the bottom-bar strip) show as a blank gap instead of being used by the notation/lyrics.
- **(b) Mobile-only.** Scroll-hide currently fires on desktop too (confirmed live: `data-scroll-hidden` appears at 1200px). It should only apply below the `md` 768px breakpoint — desktop has ample vertical room and hiding chrome there is jarring.

Output: On mobile, hiding the bars reflows the content area to fill the whole viewport; on desktop, scrolling never hides anything.

Scope boundary: Do NOT change the bar-hide CSS from 260712-kd1 (PsalmTopBar/GlassBottomBar/SiteHeader translate + chrome-hidden store all stay exactly as-is). This plan only (1) gates the scroll effect to mobile and (2) makes `<main>`'s box reflow. Both edits live in `SingingView.tsx`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/quick/260712-kd1-fix-scroll-hide-navigation-bugs-in-singi/260712-kd1-PLAN.md

<root_cause_analysis>
Confirmed by reading source (implement against these findings — do not re-derive):

- **Layout geometry.** Outer chain (layout.tsx): `<body className="min-h-full flex flex-col">` → `SiteHeader` (`sticky top-0`, 56px, IN flow) + `<main className="flex-1">` → SingingView `<div data-singing-view>` → `PsalmTopBar` (`sticky top-14`, `h-12`=48px mobile, IN flow) + `<main data-notation-region>` + `GlassBottomBar` (`fixed bottom-0`, OUT of flow) + `PlayMiniBar` (fixed). So the TOP chrome (56+48 = 104px on mobile) consumes real document-flow space above the notation `<main>`; the BOTTOM bar does not — its space is reserved by `pb-11` (44px) padding INSIDE the notation `<main>`.

- **Bug (a) root cause.** `<main data-notation-region>` (SingingView.tsx ~line 442-446) has a FIXED box: `h-[calc(100dvh-104px)] md:h-[calc(100dvh-116px)] pb-11 md:pb-13`. This never changes with `topBarHidden`/`bottomBarHidden`, so when the sticky top chrome translates off-screen its 104px of flow space remains reserved, leaving `<main>` parked at y≈104 with a blank strip above; and `pb-11` keeps reserving bottom-bar room even after the bottom bar hides.

- **Fix (a) — reflow via negative margin + grown height (NOT transform).** A CSS transform would not collapse the reserved flow space and would risk a window scrollbar. A negative `margin-top` DOES reduce flow. When the top bar hides, set `<main>` `margin-top: -104px` and `height: 100dvh`; the flow arithmetic stays balanced: header(56) + topbar(48) + main(−104 + 100dvh) = 100dvh → no window scroll. When the bottom bar hides, collapse `padding-bottom` from 44px to 0 so content extends to the bottom edge (main's box already ends at the viewport bottom). Transition all three over 200ms so the content grows in sync with the bars sliding.

- **Because of fix (b), the reflow only ever runs on mobile.** `topBarHidden`/`bottomBarHidden` will never be true on desktop, so the resting desktop `md:h-[calc(100dvh-116px)] md:pb-13` classes are never overridden. This is why the hidden-state override can safely use the mobile-only pixel constants (104px, 44px) as inline style — no `md:` variant of the hidden state is needed.

- **Bug (b) root cause + fix.** The scroll effect (SingingView.tsx ~lines 359-394) sets the hidden flags on ANY viewport width. Gate it with `window.matchMedia('(max-width: 767px)')`: in the handler, `if (!mql.matches) return` before touching any flag; and add a `change` listener that force-resets all flags to false when crossing to desktop (handles resize-while-hidden).

- **PlayMiniBar spacer must survive.** The `<div style={{ height: effectiveMiniBarVisible ? miniBarHeight : 0 }}>` at the end of `<main>` (04.9.14-03) reserves room for the fixed PlayMiniBar. It stacks ON TOP of `pb-11`. My `paddingBottom` reflow and this spacer are independent and must both remain; when the bottom bar hides, `miniBarAutoHidden` is already set on the same 100px threshold so the spacer collapses to 0 in concert — leave that mechanism untouched.
</root_cause_analysis>

<interfaces>
Current scroll-hide effect (SingingView.tsx ~lines 359-394), keyed on `[abc]`:
```ts
useEffect(() => {
  if (!abc) return
  setTopBarHidden(false); setBottomBarHidden(false); setMiniBarAutoHidden(false)
  const main = mainRef.current
  if (!main) return
  const lastByEl = new WeakMap<EventTarget, number>()
  const handleScroll = (e: Event) => {
    const el = e.target as HTMLElement | null
    if (!el || typeof el.scrollTop !== 'number') return
    const scrollTop = el.scrollTop
    const scrollingDown = scrollTop > (lastByEl.get(el) ?? 0)
    setTopBarHidden(scrollTop > 40 && scrollingDown)
    setBottomBarHidden(scrollTop > 100 && scrollingDown)
    setMiniBarAutoHidden(scrollTop > 100 && scrollingDown)
    lastByEl.set(el, scrollTop)
  }
  main.addEventListener('scroll', handleScroll, { capture: true, passive: true })
  return () => { main.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions) }
}, [abc])
```

Current notation `<main>` (SingingView.tsx ~lines 442-446):
```tsx
<main
  ref={mainRef}
  data-notation-region
  data-tour-target="scroll-area"
  className="overflow-x-hidden flex flex-col h-[calc(100dvh-104px)] md:h-[calc(100dvh-116px)] pb-11 md:pb-13"
>
```

Available state (already declared, do NOT re-declare): `topBarHidden`, `bottomBarHidden`, `miniBarAutoHidden`, `effectiveMiniBarVisible`, `mainRef`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Gate scroll-hide to mobile-only (bug b)</name>
  <files>src/components/singing/SingingView.tsx</files>
  <action>
Fixes bug (b): scroll-hide must only apply below 768px.

In the scroll-hide `useEffect` keyed on `[abc]` (the one that attaches the capture-phase listener on `mainRef`), add a `matchMedia` gate:
- Inside the effect, after the `if (!main) return` guard, create `const mql = window.matchMedia('(max-width: 767px)')`.
- At the TOP of `handleScroll`, add `if (!mql.matches) return` — before reading `e.target`/`scrollTop` or calling any setter. This makes desktop scrolling a no-op (no chrome ever hides, `<main>` never reflows).
- Add a breakpoint-crossing safety listener so a viewport resized from mobile→desktop while scrolled/hidden restores everything:
  ```ts
  const handleMql = () => {
    if (!mql.matches) {
      setTopBarHidden(false); setBottomBarHidden(false); setMiniBarAutoHidden(false)
    }
  }
  mql.addEventListener('change', handleMql)
  ```
- In the cleanup return, also remove the mql listener: `mql.removeEventListener('change', handleMql)` alongside the existing scroll `removeEventListener`.
- Do NOT change the thresholds (40 / 100), the WeakMap direction tracking, the capture-phase attach, or the CR-03 reset at the top of the effect. Keep the `setChromeHidden(topBarHidden)` effect and the unmount reset exactly as-is (on desktop `topBarHidden` stays false, so SiteHeader stays visible — no extra work).
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx tsc --noEmit -p . 2>&1 | grep -E "SingingView" || echo "no new type errors in SingingView"; grep -q "matchMedia('(max-width: 767px)')" src/components/singing/SingingView.tsx && grep -q "if (!mql.matches) return" src/components/singing/SingingView.tsx && echo "mobile gate present"</automated>
  </verify>
  <done>The scroll handler returns early when `matchMedia('(max-width: 767px)')` does not match; a `change` listener resets all hidden flags when crossing to desktop; both are cleaned up. tsc clean for SingingView, gate grep passes.</done>
</task>

<task type="auto">
  <name>Task 2: Reflow &lt;main&gt; to reclaim freed space on hide (bug a)</name>
  <files>src/components/singing/SingingView.tsx</files>
  <action>
Fixes bug (a): grow the notation content region into the space vacated by the hidden bars, so hiding becomes a true fullscreen reading mode instead of a blank gap.

Edit the `<main data-notation-region>` element (SingingView.tsx ~lines 442-446):

1. Add a transition to the `className` (keep every existing class, including the resting `h-[calc(100dvh-104px)] md:h-[calc(100dvh-116px)] pb-11 md:pb-13`):
   append `transition-[height,margin-top,padding-bottom] duration-200 ease-out motion-reduce:transition-none`.

2. Add an inline `style` prop that OVERRIDES the resting box ONLY when hidden (mobile-only, guaranteed by Task 1 — so mobile pixel constants are correct and the desktop `md:` resting classes are never touched):
   ```tsx
   style={{
     height: topBarHidden ? '100dvh' : undefined,
     marginTop: topBarHidden ? '-104px' : undefined,
     paddingBottom: bottomBarHidden ? '0px' : undefined,
   }}
   ```
   Rationale for each value:
   - `marginTop: '-104px'` pulls `<main>` up over the 104px (56 SiteHeader + 48 PsalmTopBar) of in-flow sticky space the hidden top chrome leaves behind. Negative margin (not transform) so flow stays balanced — header(56)+topbar(48)+main(−104+100dvh)=100dvh, no window scrollbar.
   - `height: '100dvh'` regrows `<main>` so its bottom still reaches the viewport bottom after the top pull-up.
   - `paddingBottom: '0px'` collapses the `pb-11` (44px) bottom-bar reservation so content extends to the bottom edge once GlassBottomBar has slid away.
   - `undefined` (not a value) when not hidden, so the resting Tailwind classes (incl. desktop `md:` variants) apply and the transition animates back smoothly.

3. Do NOT remove or alter the PlayMiniBar spacer `<div style={{ height: effectiveMiniBarVisible ? miniBarHeight : 0 }} … />` at the end of `<main>` — it composes on top of this reflow and must remain.

Leave `ref`, `data-notation-region`, `data-tour-target`, and the `NotationRendererClient` child untouched.
  </action>
  <verify>
    <automated>cd /home/services/psalter && npx tsc --noEmit -p . 2>&1 | grep -E "SingingView" || echo "no new type errors in SingingView"; grep -q "marginTop: topBarHidden ? '-104px'" src/components/singing/SingingView.tsx && grep -q "paddingBottom: bottomBarHidden ? '0px'" src/components/singing/SingingView.tsx && grep -q "transition-\[height,margin-top,padding-bottom\]" src/components/singing/SingingView.tsx && echo "reflow wiring present"; grep -q "effectiveMiniBarVisible ? miniBarHeight" src/components/singing/SingingView.tsx && echo "minibar spacer intact"</automated>
  </verify>
  <done>`<main>` carries the height/margin-top/padding-bottom transition and an inline style that grows it to 100dvh, margin-top −104px, padding-bottom 0 when the respective bars are hidden (and falls back to resting classes otherwise). The PlayMiniBar spacer is still present. tsc clean for SingingView.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Rebuild, automate-measure, then verify fullscreen reflow + mobile-only on device</name>
  <what-built>
Mobile-only gating of the scroll-hide effect (bug b) and a reflowing notation `<main>` that grows into the space freed by the hidden bars (bug a). Before this checkpoint, the executor MUST complete the automated steps below.

IMPORTANT — stale build warning: the running instance at http://localhost:3005 reflects the PREVIOUSLY-deployed build and does NOT include this plan's edits. Do NOT measure against it until you rebuild. Steps:

1. `cd /home/services/psalter && npm run build` — must succeed (only pre-existing warnings allowed).
2. Restart the instance Playwright will hit so it serves the fresh build. Either restart the container/process serving :3005, OR start a throwaway server on another port for the test, e.g. `PORT=3010 npm start &` and point the spec at it via `TEST_BASE_URL=http://localhost:3010`. Confirm the served build is fresh before measuring (a stale :3005 will show the OLD behaviour and waste the run).
3. Extend `tests/e2e/split-leaf.spec.ts` following the repo's established convention — plain Node script using `require('/usr/lib/node_modules/playwright')` and `chromium.launch()` (NOT `@playwright/test`; see the file's header note). Prefer the shared Playwright daemon at http://localhost:3099 (client `/home/services/playwright-daemon/client.js`) if convenient; otherwise the repo convention is fine. Add two checks against a psalm with ABC + lyrics (e.g. `/psalms/23`):
   - **(a) Reflow — mobile 375px viewport, lyrics-only or default mode:** record the `[data-notation-region]` (the `<main>`) boundingBox `{ y, height }` at rest, then scroll the active scroll region down past 100px, wait ~300ms for the transition, and record again. Assert the region's top `y` decreased toward ~0 (reclaimed the top strip, expect a drop of roughly 100px) AND its `height` increased (grew into the freed space). Also assert `[data-notation-viewarea]` (or the inner scroll region) client/box height increased. Then scroll up, wait ~300ms, and assert `y`/`height` return to approximately their resting values.
   - **(b) Mobile-only — desktop 1200px viewport:** load the same psalm, scroll the notation region down past 100px, wait, and assert `[data-singing-topbar]` does NOT gain `data-scroll-hidden`, the `<header>` (SiteHeader) does NOT gain `data-scroll-hidden`, and `[data-notation-region]` boundingBox `y`/`height` are unchanged (no reflow on desktop).
   If the daemon/Chromium is unavailable in this environment, state that the spec type-checks and is ready to run, and rely on the human verification below.
4. Report the measured before/after numbers (region y and height at rest vs hidden, mobile) in your summary so the reflow is provably a real content-area growth, not just bars moving.
  </what-built>
  <how-to-verify>
On a real phone or DevTools mobile emulation (375px) at the freshly-rebuilt instance, on a psalm with notation + lyrics (e.g. `/psalms/23`):
1. **Fullscreen reflow (mobile):** scroll the notation area DOWN. Confirm the notation/lyrics content actually GROWS upward into the strip the top bar+header vacated (no blank gap at the top) and downward into the bottom-bar strip — the reading area visibly gets taller, not just bars sliding over a same-sized box. Scroll UP: the bars return and the content smoothly shrinks back with a 200ms slide (no jump/snap, no leftover gap).
2. **Split-leaf (mobile):** repeat in Gear → Staff (split) / Solfège (split), scrolling either half — reflow should still feel like real fullscreen growth.
3. **Mobile-only (desktop):** on a desktop-width browser (≥768px), scroll the notation area. Confirm NOTHING hides — SiteHeader, top bar, and bottom bar all stay put, and the content area does not resize/jump.
4. **Resize safety:** on mobile, scroll down until bars hide, then widen the window across 768px — all chrome should reappear and the content return to its resting size.
5. **Regression:** the previous 260712-kd1 behaviour on mobile (bars fully sliding off, restore on scroll-up, SiteHeader visible on non-singing pages like `/tunes`) must still hold.
  </how-to-verify>
  <resume-signal>Type "approved" if mobile scroll reflows the content into a true fullscreen area (grows and restores smoothly), desktop scroll hides nothing, and resize-across-breakpoint restores everything — or describe what still misbehaves.</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` succeeds with only pre-existing warnings.
- `npx tsc --noEmit -p .` introduces no new errors in SingingView.tsx.
- Automated Playwright (against a FRESH build) shows the `[data-notation-region]` box growing (y↓, height↑) on mobile scroll-down and returning on scroll-up, and unchanged on desktop with no `data-scroll-hidden`.
- Manual device check confirms true-fullscreen reflow on mobile, no hiding on desktop, and clean restore on scroll-up and on resize across the breakpoint.
</verification>

<success_criteria>
- Mobile scroll-down grows the notation/lyrics content region to fill the freed top (~104px) and bottom-bar space (true fullscreen); scroll-up restores it smoothly over 200ms.
- Desktop scrolling never hides chrome and never reflows `<main>`.
- Resizing mobile→desktop while hidden restores all chrome and the resting layout.
- No window-level scrollbar is introduced; the PlayMiniBar spacer still works.
- 260712-kd1 bar-hide behaviour and SiteHeader-on-other-pages are unregressed.
</success_criteria>

<output>
After completion, create `.planning/quick/260712-sny-scroll-hide-reflow-content-into-freed-sp/260712-sny-SUMMARY.md`.
</output>
