---
phase: quick-260712-szw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/diagnostics/split-leaf-staff-diff.mjs
  - src/components/notation/NotationRenderer.tsx
  - src/components/AbcPlayer.tsx
autonomous: false
requirements: [UI-07]

must_haves:
  truths:
    - "On mobile (<768px) split-leaf Staff, ALL systems of the tune render inside the ~50%-viewport notation region without needing to scroll (e.g. all 4 systems of a CM tune like Ps 78 Azmon/Denfield are visible at once)."
    - "Mobile split-leaf Staff has minimal white space above and below the staff rows — no vertical room reserved for the inline lyrics that split-leaf does not render (lyrics live in the separate StanzaList below)."
    - "Desktop (≥768px) split-leaf Staff geometry is NOT regressed — it remains byte-identical to inline Staff, preserving the 260712-kov guarantee."
    - "Inline Staff (mobile + desktop), inline Solfège, and split-leaf Solfège (JPG) rendering are unchanged by this fix."
  artifacts:
    - path: "tests/diagnostics/split-leaf-staff-diff.mjs"
      provides: "Extended diagnostic that measures mobile split-leaf notation-slot container height vs rendered SVG height (does it overflow / scroll?), decomposes the SVG vertical budget (per-system height vs inter-system spacing vs top/bottom margins), AND runs a dev-server-independent abcjs-direct harness to test which lever (reduced vertical spacing vs a height-aware fit-scale) makes a CM tune fit the ~50%-viewport region without scroll — producing a VERDICT before any fix."
    - path: "src/components/notation/NotationRenderer.tsx"
      provides: "Mobile-only (chromeless && split-leaf && <768px) gating that forwards the compact/fit-height directive to AbcPlayer, leaving desktop split-leaf and all other view modes untouched."
    - path: "src/components/AbcPlayer.tsx"
      provides: "Height-aware fit-to-container and/or reduced abcjs vertical spacing, applied ONLY when the new mobile-split-leaf prop is set."
  key_links:
    - from: "src/components/notation/NotationRenderer.tsx (staff / staff-split branch, ~L1097-1119)"
      to: "AbcPlayer"
      via: "new mobile-split-leaf compact/fit-height prop, gated chromeless && isSplitMode(viewMode) && viewportW < 768"
      pattern: "isSplitMode\\(viewMode\\).*viewportW"
    - from: "src/components/AbcPlayer.tsx (render effect ~L337-369)"
      to: "abcjs.renderAbc format options / post-render height rescale"
      via: "reduced staffsep/topmargin/botmargin and/or measure-and-shrink when SVG height exceeds available container height"
      pattern: "topmargin|botmargin|staffsep|maxRenderHeight|fitHeight"
---

<objective>
Follow-up to quick task 260712-kov. That task fixed split-leaf Staff sizing so
it matches inline Staff on DESKTOP (confirmed byte-identical: 847.98×358.91px,
28 notes on a 1200px viewport). New human UAT on Ps 78 (Azmon/Denfield, a CM
tune) found TWO problems that remain specific to MOBILE split-leaf Staff:

(a) Too much white space above and below the staff rows — split-leaf shows
    lyrics separately (StanzaList below), so no vertical space should be
    reserved for absent inline lyrics.
(b) Only 3 of 4 systems display; the 4th requires scrolling. The user expects to
    see the whole tune at once (as inline Staff naturally would on a full page).

Purpose: Precentors on a phone using split-leaf must see the entire tune's
notation compactly, without scrolling the notation region and without a sea of
empty vertical space.

Output: An extended diagnostic that proves WHY the mobile notation overflows and
looks sparse (spacing vs no-height-fit), plus a mobile-only fix in
NotationRenderer.tsx / AbcPlayer.tsx — with desktop split-leaf (byte-identical to
inline) and all other view modes strictly preserved.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/quick/260712-kov-fix-split-leaf-staff-notation-rendering-/260712-kov-SUMMARY.md

<!-- BINDING PROJECT RULE (CLAUDE.md + lyric-to-note-alignment.md):
     melisma = slur = underline = `_` in the ABC w: line; the `.` solfège dot is
     rhythm, NOT a melisma marker. This fix does NOT touch how `w:` lines or `_`
     melisma tokens are GENERATED. It only changes vertical SPACING and
     FIT-TO-HEIGHT sizing of the already-built split-leaf staff on mobile. Any
     change to w:-line CONTENT is out of scope and must be flagged, not made. -->

<!-- DO-NOT-REGRESS (260712-kov, commit 6e19a28):
     Desktop (≥768px) split-leaf Staff was made byte-identical to inline Staff by
     forcing staffWidthFactor=1 for chromeless split-leaf. That guarantee is
     verified and MUST survive this fix. Therefore every change here is gated to
     MOBILE (<768px) chromeless split-leaf. Do NOT alter the desktop branch, the
     inline branch, or the shared staffWidthFactor=1 value. -->

<interfaces>
<!-- Extracted from the current source — no codebase exploration needed. -->

renderSplitLeaf chromeless branch caps the notation region (NotationRenderer.tsx ~L1076-1088):
```tsx
function renderSplitLeaf(notationSlot, stanzaSlot) {
  if (chromeless) {
    return (
      <div className="flex flex-col h-full gap-4 px-4 pt-4 md:h-auto md:gap-4">
        {/* NOTATION slot — hard-capped to ≤50% viewport height, own scroll */}
        <div className="flex-1 min-h-0 max-h-[50%] overflow-y-auto md:max-h-none md:overflow-visible md:flex-none">
          {notationSlot}
        </div>
        {/* STANZA slot — same cap */}
        <div className="flex-1 min-h-0 max-h-[50%] overflow-y-auto md:max-h-none md:overflow-visible md:flex-none">
          {stanzaSlot}
        </div>
      </div>
    )
  }
  // desktop: plain unconstrained stack — DO NOT TOUCH
  return <div className="grid grid-cols-1 gap-4">...</div>
}
```
The `max-h-[50%]` + `overflow-y-auto` on the notation slot is why the 4th system
scrolls: the SVG is taller than the capped region. There is NO code that shrinks
the SVG to fit that cap.

Staff branch (NotationRenderer.tsx ~L1097-1119):
```tsx
if (viewMode === 'staff' || viewMode === 'staff-split') {
  const abcForView = isSplit ? unifiedAbcNoLyrics : unifiedAbc
  const notationBlock = (
    <div ref={staffRef} ...>
      <AbcPlayer abc={abcForView} scale={scale} staffWidthFactor={staffWidthFactor} ... />
    </div>
  )
  viewArea = isSplit ? renderSplitLeaf(notationBlock, stanzaBlock) : notationBlock
}
```

Width/scale math + the WIDTH-ONLY fit (AbcPlayer.tsx ~L337-369):
```ts
const containerWidth = Math.max(0, (staffWidth || 600) - 16)   // measured from outerRef
const effectiveScale = scale ?? 1
const targetStaffwidth = (containerWidth * staffWidthFactor) / effectiveScale
const effectiveStaffWidth = Math.max(120, Math.floor(targetStaffwidth))
abcjs.renderAbc(el, abc, {
  scale: 1,
  staffwidth: effectiveStaffWidth,
  responsive: 'resize',            // viewBox stretch → fills container WIDTH; HEIGHT follows aspect ratio
  format: { stretchlast: 1 },
})
```
KEY GAP: `responsive: 'resize'` + this staffwidth math size the SVG to the
container WIDTH only. There is NO height-aware equivalent — the SVG renders at
whatever height (systems × per-system height + spacing + margins) results, and
the `max-h-[50%]` slot just scrolls the overflow. abcjs `format` also accepts
vertical-spacing levers (`topmargin`, `botmargin`, `staffsep`, `%%vskip`) that
this call does not currently set.
</interfaces>

Runtime facts (from the orchestrator — act on these, do NOT re-derive):
- At 375px, `/psalms/78`, split-leaf Staff: notation slot clientHeight ≈ 260px
  but scrollHeight ≈ 340px (genuine overflow, correctly scrolls, not clipped).
  Rendered `<svg>` ≈ 340.375px tall × 326.98px wide — tall-for-width for a
  4-system CM tune.
- localhost:3005 currently serves a PRE-fix build and the orchestrator batches
  ONE rebuild after all pending quick tasks this session. Do NOT trust a live
  localhost:3005 measurement of THIS fix. Prefer the dev-server-independent
  abcjs-direct harness (Task 1) which renders a representative ABC body in an
  isolated page and measures spacing/height without the Next build. Clearly flag
  anything that can only be confirmed after the rebuild.
- Shared Playwright daemon: http://localhost:3099 (CLAUDE.md). Use `runPlaywright`
  / `getStatus` from `/home/services/playwright-daemon/client.js`. Poll `/status`
  until `browserReady: true`. NEVER spawn raw Chromium.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend the diagnostic to isolate the mobile split-leaf overflow + whitespace cause</name>
  <files>tests/diagnostics/split-leaf-staff-diff.mjs, src/components/notation/NotationRenderer.tsx</files>
  <action>
Turn the two "looks wrong" mobile complaints into measured levers so the fix
task commits to the right approach. EXTEND the existing diagnostic — do not
rewrite it. Keep the existing Ps 23 inline-vs-split MATCH checks intact.

Part A — measure the real overflow (live, best-effort; may reflect pre-fix build):
1. Add a mobile (375×667) capture on `/psalms/78` in split-leaf Staff that reads,
   in addition to the SVG rect already captured:
     - the NOTATION-SLOT container's `clientHeight` and `scrollHeight` (the first
       `overflow-y-auto max-h-[50%]` div in renderSplitLeaf's chromeless branch).
       To select it reliably, add a `data-notation-slot` attribute to that div in
       NotationRenderer.tsx (the ONLY NotationRenderer edit in this task — a
       measurement hook, no behaviour change), then query `[data-notation-slot]`.
     - whether it overflows: `scrollHeight > clientHeight + 2`.
   Print: `RESULT [mobile split /psalms/78] slotClient=<h> slotScroll=<h> overflow=<yes|no> svg=<w>x<h> systems=<n>`.
   Guard in try/catch; on any failure print `DIAGNOSTIC-UNAVAILABLE: <reason>` and
   continue (exit 0). This live number will match the PRE-fix build until the
   batched rebuild — label it as such.

Part B — dev-server-independent abcjs harness (the decisive measurement):
2. Add a second harness that does NOT depend on localhost:3005. In a daemon page,
   `page.goto('about:blank')`, inject abcjs via
   `page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/abcjs@6.6.3/dist/abcjs-basic-min.js' })`
   (abcjs 6.6.3 per CLAUDE.md stack), then render a REPRESENTATIVE 4-phrase CM
   ABC body with NO `w:` lines into a fixed-width (~311px = 327 − 16) container,
   mirroring AbcPlayer's `{ scale: 1, staffwidth: 311, responsive: 'resize' }`
   call. Use a real Azmon/Denfield-style CM body if you can extract one from the
   codebase/DB; otherwise embed a synthetic 4-line CM ABC (K:, M:C, one music
   line per phrase, quarter/eighth notes) — the goal is to measure the SPACING
   LEVERS, so an accurate CM shape is sufficient.
3. For that same body, render it under each candidate lever and record the
   resulting SVG height:
     (i)   baseline (current options: no vertical-spacing overrides)
     (ii)  reduced vertical spacing — pass `format: { topmargin: 0, botmargin: 0,
           staffsep: <small>, systemsep: <small> }` (and/or `%%` directives via a
           header prepend); sweep 2-3 spacing values
     (iii) a height-fit downscale — compute a scale factor = availableHeight /
           renderedHeight (availableHeight ≈ 260 from Part A) and re-render / apply
           it, reporting the fitted height
4. Print a VERDICT block that answers, for a 260px available height:
     - Does spacing-reduction ALONE bring a 4-system CM under 260px? (yes/no + the
       height it reaches)
     - Is a height-fit scale REQUIRED on top of spacing? (yes/no)
     - How much of the baseline height is per-system content vs inter-system
       spacing vs top/bottom margins (the "too much whitespace" breakdown)?
   Emit a single machine-readable line: `VERDICT spacing-only=<yes|no> needs-fit-scale=<yes|no> baselineH=<h> spacingH=<h> fittedH=<h>`.

Report the chosen root cause + recommended fix direction (spacing-only /
fit-scale / both) directly in your task report — not a separate .md file. This
verdict drives Task 2.
  </action>
  <verify>
    <automated>node tests/diagnostics/split-leaf-staff-diff.mjs 2>&1 | grep -Eq 'VERDICT|DIAGNOSTIC-UNAVAILABLE'</automated>
  </verify>
  <done>Diagnostic runs via the Playwright daemon (or prints DIAGNOSTIC-UNAVAILABLE), measures the mobile notation-slot client vs scroll height on /psalms/78, runs a dev-server-independent abcjs harness that reports SVG height under baseline / reduced-spacing / height-fit levers for a 4-system CM body, and emits a `VERDICT ...` line. `[data-notation-slot]` attribute added to the chromeless notation-slot div (measurement hook only). Root-cause + fix direction stated in the task report.</done>
</task>

<task type="auto">
  <name>Task 2: Apply the mobile-only split-leaf fix (compact spacing and/or fit-to-height)</name>
  <files>src/components/AbcPlayer.tsx, src/components/notation/NotationRenderer.tsx</files>
  <action>
Implement the fix Task 1's VERDICT selected. Scope EVERY change to MOBILE
(<768px) chromeless split-leaf. Desktop split-leaf must stay byte-identical to
inline (260712-kov guarantee), and inline Staff / inline Solfège / split-leaf
Solfège must be untouched. Do NOT change how `w:` lines or `_` melisma tokens are
generated.

Wiring (NotationRenderer.tsx): in the `staff`/`staff-split` branch, compute a
mobile-split flag and forward it to AbcPlayer as a new prop, e.g.
`const compactSplitMobile = chromeless && isSplitMode(viewMode) && viewportW < 768`
then pass `compactSplitMobile={compactSplitMobile}` (or a more descriptive
prop name / a `maxRenderHeight` number). `viewportW` already exists in this
component (the resize-tracked state ~L500-508). When false, AbcPlayer behaves
exactly as today.

Fix in AbcPlayer.tsx (gate ALL of the following on the new prop being truthy):

  If VERDICT = spacing-only or both:
    Add vertical-spacing overrides to the `abcjs.renderAbc(...)` options so no
    space is reserved for absent lyrics and inter-system gaps are tight — e.g.
    merge `format: { ...existing, topmargin: 0, botmargin: 0, staffsep: <chosen>,
    systemsep: <chosen> }` using the exact values Task 1 proved. Keep
    `stretchlast: 1`. These options must be applied ONLY when the prop is set so
    desktop split-leaf and inline keep their current spacing.

  If VERDICT = needs-fit-scale or both:
    Add a HEIGHT-aware fit — the missing counterpart to the WIDTH-only MOBILE-03
    fallback. After render, measure the rendered SVG's height; if it exceeds the
    available notation-region height, shrink to fit. Prefer the mechanism that
    mirrors the existing width approach (adjust staffwidth/scale and re-render
    once, guarded by a ref to avoid loops), OR apply a CSS transform:scale /
    max-height on the SVG wrapper — whichever Task 1 showed reliably fits all
    systems without distorting note aspect. The available height can be read from
    the `[data-notation-slot]` ancestor's clientHeight (or a `maxRenderHeight`
    prop passed from NotationRenderer). Ensure the fit runs on resize/orientation
    (reuse the existing staffWidth effect deps).

Add a brief comment referencing this quick task (260712-szw) and the UAT finding
(mobile split-leaf: excess whitespace + 4th-system overflow). Keep the change
localized to the render options / a post-render height pass and the new prop.
  </action>
  <verify>
    <automated>npx tsc --noEmit -p . 2>&1 | grep -E 'error TS' | grep -v 'tests/.*\.spec\.ts' | grep -q . && echo TSC_FAIL || echo TSC_OK</automated>
  </verify>
  <done>`npx tsc --noEmit` reports no NEW errors in AbcPlayer.tsx / NotationRenderer.tsx (pre-existing tests/*.spec.ts errors out of scope → TSC_OK). The new mobile-split prop is computed in NotationRenderer as `chromeless && isSplitMode(viewMode) && viewportW < 768` and consumed in AbcPlayer to apply compact vertical spacing and/or a height-fit, both gated so they never run for desktop split-leaf, inline Staff, inline Solfège, or split-leaf Solfège. After the batched rebuild, the Task 1 diagnostic (or manual check) is expected to show the mobile /psalms/78 notation slot no longer overflowing (scrollHeight ≤ clientHeight) with all systems visible and minimal top/bottom whitespace.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Mobile split-leaf Staff now renders compactly: reduced vertical whitespace and a
height-aware fit so the whole tune's systems fit the ~50%-viewport notation
region without scrolling. All changes are gated to mobile (<768px) chromeless
split-leaf — desktop split-leaf stays byte-identical to inline Staff, and inline
Staff / inline Solfège / split-leaf Solfège are unchanged. Requires the batched
rebuild before it is visible on the running site.
  </what-built>
  <how-to-verify>
1. After the orchestrator confirms the rebuild, open on a phone-width window
   (~375px): `https://psalter.gsdlabs.dev/psalms/78`.
2. Gear → Notation: Staff, Layout: Split-Leaf. Try the CM tunes (Azmon /
   Denfield). Confirm:
   - ALL systems of the tune are visible at once in the notation region — no need
     to scroll the notation area to see the last system.
   - The staff rows are compact — minimal empty space above the top staff and
     below the bottom staff / between systems (no gap where inline lyrics would
     sit).
   - The lyrics still appear separately below in the StanzaList.
3. Switch Layout back to Inline (still mobile) — inline Staff should look exactly
   as before (unchanged).
4. On a DESKTOP-width window (~1200px), Staff + Split-Leaf should look identical
   to Staff + Inline minus the lyric words (260712-kov behaviour — unchanged).
5. Spot-check inline Solfège and split-leaf Solfège (scanned image) — unchanged.
  </how-to-verify>
  <resume-signal>Type "approved" if mobile split-leaf Staff shows the whole tune without scrolling and with minimal whitespace, AND desktop split-leaf + all other views are unchanged. Otherwise describe exactly what is still wrong (e.g. "still scrolls to see 4th system", "notes too tiny now", "desktop split-leaf changed").</resume-signal>
</task>

</tasks>

<verification>
- `node tests/diagnostics/split-leaf-staff-diff.mjs` emits a `VERDICT ...` line and
  (post-rebuild) shows the mobile /psalms/78 notation slot no longer overflowing.
- `npx tsc --noEmit -p .` — no new errors in AbcPlayer.tsx / NotationRenderer.tsx.
- Human confirms mobile split-leaf shows the whole tune without scrolling and with
  minimal whitespace, with desktop split-leaf and all other views unchanged.
</verification>

<success_criteria>
Mobile (<768px) split-leaf Staff displays every system of a CM tune within the
~50%-viewport notation region without scrolling and without excess vertical
whitespace, while desktop split-leaf Staff remains byte-identical to inline Staff
and inline Staff / inline Solfège / split-leaf Solfège are unchanged.
</success_criteria>

<output>
After completion, create
`.planning/quick/260712-szw-fix-split-leaf-staff-mobile-reduce-exces/260712-szw-SUMMARY.md`
recording the confirmed root cause (spacing / fit-scale / both), the exact
mobile-gated fix applied, the desktop non-regression check, and the human
verification result (noting rebuild dependency if pending).
</output>
