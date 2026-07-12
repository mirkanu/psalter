# Phase 04.9.14: Single Psalm View - Fix Phase 4.9.13 Issues - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Source:** Phase 4.9.13 verification and new requirements for corrections

## <domain>
## Phase Boundary

This phase addresses regressions and missing features from Phase 4.9.13 (Single Psalm UI Streamlining). Phase 4.9.13 successfully implemented:
- Gear menu replaced with compact popover (Music Notes / Lyrics Only + Staff/Solfege + Split-leaf/Inline toggles)
- Desktop player bar floating right-aligned
- Split-leaf view overhaul with mobile-first design
- Desktop max-width constraint

Phase 4.9.14 fixes six specific issues:

(a) **Split-Leaf view fixes**:
   (i) Desktop lyrics stacking: Lyrics must appear under notation instead of beside (stacked 2-column layout)
   (ii) Mobile notation height: abc rendering must respect ≤50% vertical height limit (current behavior inconsistent with JPG fallback)
   (iii) Mobile full-screen experience: Add fullscreen icon (first-open onboarding overlay) that hides site header and psalm navigator bar; supports close/exit functionality
   (iv) Zoom control decoupling: A-/A+ size buttons must only affect lyrics font size, not notation rendering size
   (v) Mobile tune pagination: For longer tunes (>4 lines), split-leaf view needs tune-level pagination control ("< Tune x/y >") in bottom area

(b) **Inline view implementation**:
   (i) Active Directory abstraction: Solfege rendering with inline lyrics, matching Staff view behavior
   (ii) Approval gate: Inline view disabled for non-approved tunes based on melisma editor status

(c) **PlayMiniBar positioning**:
   (i) Vertical extension: Player bar must permanently sit ABOVE GlassBottomBar, not below requiring scroll

## <decisions>
## Implementation Decisions

### Split-Leaf Layout Decisions

#### Desktop Lyrics Stacking Decision
**Locked Decision:** In split-leaf mode (`viewMode: 'staff-split'`), lyrics must stack under notation (2-column grid), not beside (incorrect current implementation at NotationRenderer.tsx line 1064).

**What it means:** `grid-cols-1 md:grid-cols-5` must be updated so notation column is first, lyrics column second.

#### Mobile Full-Screen Experience Decision
**Locked Decision:** Mobile full-screen with hide-on-scroll navigation. Use top-row hide when scrolling down, show when scrolling up. Entry/exit visual: fullscreen icon in top-right morphs to close icon.

**What it means:** Remove fullscreen button; implement scroll-hide for `.psalm-top-bar`, `main[data-notation-region]`, and `.glass-bottom-bar`. Add entry/exit animation and onboarding tour (OnboardingTour component) with swipe-up/detect instruction.

#### Mobile Notation Height Constraint Decision
**Locked Decision:** abc rendering must respect staffwidthFactor for vertical height allocation when staffPage is active. In split-leaf mode, min-height constraints must adapt.

**What it means:** Modify `staffWidthFactor` and `viewportW` logic in NotationRenderer to limit that part of layout to ≤50% height (change from fixed `max-h-[80vh]` to `h-[50%]`).

#### Zoom Control Decoupling Decision
**Locked Decision:** Separate touch targets for lyrics font size vs notation rendering size. Use A-/A+ buttons exclusively for lyrics; consider adding dedicated zoom control for notation.

**What it means:** Modify NotationRenderer's `setBaseSize` logic to conditionally affect only lyrics scaling in split-leaf mode, potentially adding dedicated notation-only zoom.

#### Mobile Tune Pagination Decision
**Locked Decision:** Adaptive pagination in split-leaf when phrase count exceeds viewport height. Use bottom area previously reserved for stanza pagination for tune-level control.

**What it means:** Add tune pagination controls to split-leaf when `viewMode: 'staff-split'` (line 1137-1159). Reuse existing page navigation but for tune pages.

### Inline View Implementation Decisions

#### AD-on-Chinese Abstraction Decision
**Locked Decision:** Use `PickABCTunes` infrastructure for inline AD rendering: render generated w: line in ABC, pass through `sopranoOnly` for clean soprano output.

**What it means:** In `SingingView` use `activeTune?.abcNotation` with `sopranoOnly(pickAbcWithMarkers())`; ensure Transition from `AbcAudioControls` to `AbcPlayer` handles AD correctly.

#### Approval Gate Decision
**Locked Decision:** `melismaStatus` (`approved`/`not_approved`) controls inline view availability. Fail early if not approved; show alert or fallback.

**What it means:** In `SingingView`, block `viewMode='solfege'` (or `'staff'`) when `melismaStatus !== 'approved'` unless AD rendering pipeline includes approval bypass.

### PlayMiniBar Positioning Decision
**Locked Decision:** Vertical stacking: PlayMiniBar must always appear ABOVE GlassBottomBar, with lower z-index (40). Must maintain responsiveness across break points.

**What it means:** Update `SingingView` position: move PlayMiniBar to render after `GlassBottomBar` (line 446). Inverts to be above in DOM order, apply `top: -56px` or similar to overlap.

## <canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing:**

### Phase Dependencies
- Phase 4.9.13 (04.9.13-VERIFICATION.md) — Complete current state snapshot, all approved features, existing UI architecture
- Phase 4.9.3 (Mobile-First Psalm Display) — Viewport detection and responsive design patterns
- Phase 4.9.4 (Staff View Refinements) — GlassBottomBar styling and responsive chrome
- Phase 4.9.9 (Staff Alignment — Melisma Support) — Melisma Approval workflow and solfege OCR pipeline
- Phase 4.9.12 (Melisma positions as tune-level data) — Positions-based melisma rendering and approval workflow

### Research Documents
- `.planning/research/lyric-to-note-alignment.md` — Lyric-to-note mapping, melisma continuation identification
- `.planning/research/tonic-solfa-notation.md` — Solfege OCR underline preserving prompt
- `.planning/research/tune-digitisation-research.md` — Tune conversion pipeline and melisma support in ABC

### Codebase References
- `src/components/notation/NotationRenderer.tsx` — Split-leaf view (lines ~1057-1074), mobile breakpoint logic, scrolling composition
- `src/components/singing/SingingView.tsx` — ViewMode, playbar position, gear dropdown binding
- `src/components/singing/GearPopover.tsx` — Split-leaf/Inline toggle, view selection, approval status use
- `src/components/singing/PlayMiniBar.tsx` — Player bar styling, mounting/visible state, scrolling behavior
- `src/components/singing/GlassBottomBar.tsx` — Bottom bar fixed positioning, z-index layering
- `src/components/singing/OnboardingTour.tsx` — Tour step overlay, scrolling instruction hints

### UI-SPEC Reference
- Phase 4.9.13-UI-SPEC.md — Updated desktop/mobile split-leaf layout specifications, touch target sizes, visual hierarchy for mobile full-screen

### Architecture Constraints
- `CLAUDE.md` hard rules 1-3, 8-9 — Client-only abcjs usage, baseSize/Z index layering, async data loading

## <specifics>
## Specific Ideas

**Technical Implementation Specifics**:

#### Scroll-Hide Navigation Implementation
```typescript
// In component DidMount, add to observer for scroll Y positions:
useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    setTopBarHidden(scrollY > 40);
    setBottomBarHidden(scrollY > 100);
    setPlayerBarVisible(!scrollY);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**CSS for immediate effect:**
```css
.data-scroll-hidden {
  transform: translateY(-100%); opacity: 0; pointer-events: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.data-scroll-shown {
  transform: translateY(0); opacity: 1; pointer-events: auto;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
```

#### Approval Gate Implementation
**Guard in SingingView:**
```typescript
// Before any solfege rendering in split-leaf:
const isTuneApproved = melismaStatus === 'approved';
const enableInlineAD = !!activeTune && isTuneApproved;
```

**Component Prop:**
```typescript
<SingingView
  // ... existing props
  enableInlineAD={isTuneApproved}
  enableInlineSolfegonaut={isTuneApproved}
/>;
```

**Error message:**
```
if (!isTuneApproved && viewMode !== 'staff') {
  return <div className="p-4 text-center">
    This tune's notation hasn't been approved yet. Please check the melisma editor for updates.
  </div>;
}
```

#### StopPropagation Decorator
**Add to touch events in GearPopover:**
```typescript
const stopProp = (e: React.MouseEvent) => e.stopPropagation();
```

**Apply:**
```typescript
<PopoverTrigger asChild onClick={stopProp}>
  // Gear button
</PopoverTrigger>
```

#### PlayerBar AboveGlassBottomBar
**Structural order change in SingingView:**
```typescript
// Current line 434-446 -> restructured:
<main data-notation-region>...</main>
<GlassBottomBar .../>     
<PlayMiniBar               // Comes AFTER GlassBottomBar
  visible={!isScrollingDown}  // Auto-hide when scrolling  
  ...
/>
```

#### OnboardingTour for Full-Screen
**Quick tutorial content:**
```typescript
const fullScreenTourSteps = [
  {
    target: '[data-tour-target="top-bar"]',
    content: "This is the top navigation that can be hidden. Scroll down to hide.",
    placement: "bottom"
  },
  {
    target: '[data-tour-target="scroll-up"]',
    content: "Scroll up to show the navigation quickly.",
    placement: "right"
  },
  {
    target: '[data-tour-target="bottom-bar"]',
    content: "Bottom controls also hide to give you more space.",
    placement: "top"
  }
];
```

## <deferred>
## Deferred Ideas

**Explicitly Deferred (FOD, v2, Out-of-Scope):**

1. **Original Fullscreen Button:** Initial user request for a fullscreen button has been replaced with scroll-hide navigation experience. No requirement to implement dual solution.

2. **Native iOS-style Swiping Gestures:** Swipe from edges to show navigation (standard iOS pattern). Deferred due to test cycle constraints and lack of play-wright evidence for gesture acceptance.

3. **Accessibility Semaphore:** Live announcements for navigation hide/show. Defer to polishing phase as UX priority lower than core functionality.

4. **URL State for Hidden Navigation:** Persist navigation hidden state across page reloads. Defer to future version; current focus is functional implementation.

**Implementation Status:**
- Core functionality ready for development
- Testing planned for real devices (375/768/1024px)
- QA will validate both desktop and mobile user flows
- Post-launch iteration will address deferred items