---
status: resolved
trigger: "MOBILE-03 production bug: abcjs SVG renders 722px wide in 375px container on /psalms/23 at 375x812 viewport"
created: 2026-05-16T00:00:00Z
updated: 2026-07-29T00:00:00Z
resolved_via: "Re-enabled responsive:'resize' + staffwidth/phraseSubdivisions rework in AbcPlayer.tsx and NotationRenderer.tsx — verified live on production via Playwright (mobile + desktop, no overflow)"
---

## Current Focus

hypothesis: After commit bd6dbbc removed `responsive: 'resize'`, abcjs's SVG no longer carries a viewBox. With `staffwidth = container/scale`, abcjs's emitted SVG `width` attribute (e.g. 457.83 at iPhone13 size=13) EXCEEDS the requested staffwidth and exceeds the container content width (374). CSS `max-width:100%` clamps the SVG element to 374, but the inner content (laid out in raw abcjs-pixel-coordinates without viewBox) does not rescale — so visible content occupies only ~347 of 390 (left=8, right=355), leaving a ~35px white gap on the right. Additionally, lyrics that abcjs draws past the requested staffwidth get visually clipped by the SVG's intrinsic width box. On desktop at scale > 1.5, the SVG attrWidth grows past viewport (1301 > 1024) confirming the same root cause for Bug 2: increasing baseSize grows abcjs's intrinsic pixel size rather than wrapping to more systems.
test: Re-add `responsive: 'resize'`, drop the `staffwidth/scale` division, pass `staffwidth = containerWidth * staffWidthFactor` directly. Verify A+/A− still visibly grows the SVG (vertically, via more wraps).
expecting: SVG fills container width exactly (boundW within 8px of container content width), no overflow at any A+ press, A+ visibly grows SVG height as scale rises.
next_action: Apply fix to AbcPlayer.tsx render effect

## Symptoms

expected: SVG width ≤ 375px on mobile viewport
actual: SVG width = 722px in 375px container, SVG attribute width=777.66, transform matrix scale 0.928
errors: none (no JS errors, just visual overflow clipped by parent overflow-x-hidden)
reproduction: Open /psalms/23 at viewport 375x812
started: After Plan 04.9.3 mobile-first UI work

## Eliminated

## Evidence

- timestamp: initial
  checked: AbcPlayer.tsx render effect (line 305-311)
  found: renderAbc called with scale=scale ?? 1 and staffwidth=Math.max(0, (staffWidth || 600) - 16). The `scale` value comes from NotationRenderer = baseSize/14. For chromeless mobile baseSize=13, scale=0.9285714... — matches observed transform matrix(0.928571, 0, 0, 0.928571).
  implication: Confirms scale path. abcjs applies scale to internal SVG sizing (NOT post-CSS-transform). SVG attribute width=777.66 × scale 0.928 ≈ 722. So natural unscaled width would be 722/0.928 ≈ 777... wait this matches SVG attr width=777.66. So SVG attribute is the pre-transform "intended" width. The transform on the inner <g> is the scale matrix.
- timestamp: initial
  checked: NotationRenderer.tsx defaults
  found: chromeless && innerWidth < 768 → MOBILE_DEFAULT_SIZE_CHROMELESS = 13. scale = 13/14 = 0.9285714.
  implication: Default baseSize is already smaller than 14; further reduction needed to fit Psalm 23 (which has dense SATB+lyrics content).

## Resolution

root_cause: After commit bd6dbbc removed `responsive: 'resize'`, abcjs emitted SVGs with intrinsic `width`/`height` exceeding requested staffwidth when content can't wrap tighter (Psalm 23 SATB dense). CSS `max-width:100%` scaled the SVG ELEMENT down but the inner content's coordinate space wasn't a viewBox, so visible content occupied only ~83% of the available width (right gap ~35px on iPhone13) and lyrics extending past the staffwidth got clipped by the SVG's intrinsic width. On desktop the same code path produced SVG widths growing 886→1301 as scale rose past 1.5, overflowing viewport.
fix: Re-enable `responsive: 'resize'` (viewBox + width:100%). Keep abcjs internal `scale: 1` and modulate visual size by varying `staffwidth = (containerWidth * factor) / effectiveScale`. Higher size → narrower staffwidth → more wraps → taller viewBox → SVG renders taller. For dense mobile content where abcjs hits a structural minimum staffwidth, additionally bump `phraseSubdivisions` at size thresholds (≥18: +1, ≥28: +2) so each phrase splits into more sub-staves, giving abcjs material to wrap differently.
verification: Playwright (chromium iPhone13 Pro emulation AND desktop 1024) on LIVE production https://psalter.gsdlabs.dev/psalms/23. Mobile init: SVG width 373.98 (= container content width 374), left=8 right=382 inside 390 viewport, no right gap, all lyrics visible inside viewBox. Mobile A+ from 13 hits threshold 18 and SVG height grows 453→560. Desktop A+ grows height 627→1291 across 5 presses, width pinned at 1008 (never overflows viewport 1024). /tunes/23 desktop+iPhone regressions verified: SVG fits within container with no overflow. Diagnostics in /tmp/uat-shots-v7/diagnostics.json, screenshots in /tmp/uat-shots-v7/.
files_changed: ["src/components/AbcPlayer.tsx", "src/components/notation/NotationRenderer.tsx"]
