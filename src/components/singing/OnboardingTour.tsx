'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/components/notation/NotationRenderer'
import { useTour } from '@/components/TourProvider'

// Phase 20-01 (D-15/D-16): split the single linear tour into 3 independent
// triggers, each gated by its own localStorage flag. Existing users who
// completed the legacy `psalter_tour_v3` are migrated to the new
// initialDone flag on hydrate so they do not re-onboard.
const TOUR_INITIAL_KEY = 'psalter.tour.initialDone'
const TOUR_AUDIO_KEY = 'psalter.tour.audioStepDone'
const TOUR_SWIPE_KEY = 'psalter.tour.swipeStepDone'
const TOUR_KEY_LEGACY = 'psalter_tour_v3'

interface Step {
  target: string // data-tour-target value
  copy: string | { pre: string; highlight: string }
}

// 260517-ht8 #1a — re-insert "tap to change tune" as step 3; gear becomes step 4.
// Phase 20-01 (D-15): the initial tour excludes the audio step because the
// play button isn't visible on first visit to Lyrics Only or Legacy.
// Phase 21 (D-04): copy user-provided word-for-word; gear icon highlighted
// in orange on this step (see `ringStroke` derivation below).
// Phase 21 fqz (item 6): final step now flags the view-switch as a new
// feature — copy is the structured `{ pre, highlight }` form so the bubble
// can render the highlight portion in orange (#f97316) to match the gear
// ring's attention accent.
const INITIAL_STEPS: Step[] = [
  { target: 'prev-next', copy: 'Navigate to next/previous psalm' },
  { target: 'psalm-label', copy: 'Tap to quickly switch to any psalm' },
  { target: 'tune-name', copy: 'Tap to switch to a different tune' },
  {
    target: 'view-controls',
    copy: {
      pre: 'Open settings to access the study guide or ',
      highlight: '(new feature!) change views to Music Notes or Lyrics Only',
    },
  },
]

// Audio-player single-step popover (D-15). Fires on first Music Notes / Staff
// Inline entry once the initial tour has been completed. Highlights the
// existing `data-tour-target="play-button"` on GlassBottomBar's play icon.
const AUDIO_STEP: Step = {
  target: 'play-button',
  copy: 'Tap the play button to open the audio player.',
}

// 04.9.15.1-03 (MOBILE-10): swipe step reused from the previous tour, then
// replaced per Phase 21 (D-06) — desktop visitors don't swipe, they tap the
// prev/next stanza buttons; the target moved from 'scroll-area' (the whole
// notation region) to 'stanza-nav' (the prev/next buttons in GlassBottomBar).
// Mobile swipe still works because the buttons are still present; "Tap"
// covers both touch (mobile) and click (desktop) — single-text path so no
// viewMode branching needed.
const SWIPE_STEP: Step = {
  target: 'stanza-nav',
  copy: 'Tap < and > to navigate between stanzas',
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function measure(target: string): Rect[] | null {
  if (typeof document === 'undefined') return null
  const els = Array.from(
    document.querySelectorAll(`[data-tour-target="${target}"]`),
  ) as HTMLElement[]
  if (els.length === 0) return null
  // 260517-ht8 #1b — when multiple elements share a target (e.g. prev/next
  // arrows both tagged prev-next), each element gets its OWN spotlight rect
  // so they're highlighted individually rather than as one wide region.
  return els.map((el) => {
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  })
}

function unionBbox(rects: Rect[]): Rect {
  let minTop = Infinity
  let minLeft = Infinity
  let maxRight = -Infinity
  let maxBottom = -Infinity
  for (const r of rects) {
    if (r.top < minTop) minTop = r.top
    if (r.left < minLeft) minLeft = r.left
    if (r.left + r.width > maxRight) maxRight = r.left + r.width
    if (r.top + r.height > maxBottom) maxBottom = r.top + r.height
  }
  return { top: minTop, left: minLeft, width: maxRight - minLeft, height: maxBottom - minTop }
}

export interface OnboardingTourProps {
  /** 04.9.15.1-03 (MOBILE-10): current stanza-set count. Used to gate the
   *  swipe tutorial step — only shown when there's more than one set to
   *  swipe between. */
  totalStanzas?: number | null
  /** Phase 20-01 (D-15): current viewMode — gates the audio-step (fires
   *  only on Music Notes views) and swipe-step (fires only on staff-inline
   *  with >1 stanza). */
  viewMode: ViewMode
}

type Trigger = 'initial' | 'audio' | 'swipe'

export function OnboardingTour({ totalStanzas, viewMode }: OnboardingTourProps) {
  // Phase 21 (D-07): TourProvider context — OnboardingTour calls `tour.show()`
  // while the tour is active so DesktopOptimisedBanner can read `isOpen` and
  // hide until the tour closes. The provider is wrapped high in the layout so
  // both OnboardingTour (rendered inside SingingView via OnboardingTourClient)
  // and DesktopOptimisedBanner (rendered in <body>) share the same context.
  // The no-op fallback when rendered outside the provider means isolated tests
  // don't crash.
  const tour = useTour()

  // SSR-safe: render nothing until mounted; assume seen=true to suppress
  // first-paint flash for returning visitors (hydration reads the real value).
  const [mounted, setMounted] = useState(false)
  // Phase 20-01 (D-16): three independent completion flags. Returning users
  // start true so the tour doesn't flash on mount; hydrate sets the real
  // value after localStorage is read.
  const [tourInitialSeen, setTourInitialSeen] = useState(true)
  const [tourAudioSeen, setTourAudioSeen] = useState(true)
  const [tourSwipeSeen, setTourSwipeSeen] = useState(true)
  const [step, setStep] = useState(0)
  const [rects, setRects] = useState<Rect[] | null>(null)

  // 04.9.15.1-03: gate the swipe step to >1 stanza-set (nothing to swipe
  // between otherwise).
  const hasMultipleStanzas = totalStanzas != null && totalStanzas > 1

  // Hydrate from localStorage AFTER mount — three independent flags plus
  // legacy `psalter_tour_v3 === 'done'` → `psalter.tour.initialDone = true`
  // migration so existing completed users do not re-onboard (D-16 + Open
  // Question #2 from RESEARCH.md).
  useEffect(() => {
    let seenInitial = false
    let seenAudio = false
    let seenSwipe = false
    try {
      if (
        localStorage.getItem(TOUR_KEY_LEGACY) === 'done' &&
        localStorage.getItem(TOUR_INITIAL_KEY) !== 'true'
      ) {
        localStorage.setItem(TOUR_INITIAL_KEY, 'true')
      }
      localStorage.removeItem(TOUR_KEY_LEGACY)
      seenInitial = localStorage.getItem(TOUR_INITIAL_KEY) === 'true'
      seenAudio = localStorage.getItem(TOUR_AUDIO_KEY) === 'true'
      seenSwipe = localStorage.getItem(TOUR_SWIPE_KEY) === 'true'
    } catch {
      /* ignore — fail-open: treat as not-yet-seen so first-time experience
          runs even if localStorage is unavailable */
    }
    setTourInitialSeen(seenInitial)
    setTourAudioSeen(seenAudio)
    setTourSwipeSeen(seenSwipe)
    setMounted(true)
  }, [])

  // Phase 20-01 (D-15): derive which sub-tour to fire based on the three
  // independent gates + viewMode. Priority order:
  //   1. audio (Music Notes first entry, after initial tour)
  //   2. swipe (Staff Inline first entry, multi-stanza, after initial tour)
  //   3. initial (after the initial localStorage check)
  // Phase 21 (D-02): firstVisitAccepted gate removed — FirstVisitModal is
  // gone, so the initial tour fires on first visit by default (gated only
  // by mounted + tourInitialSeen).
  // Phase 21 fqz (item 7): include 'lyrics' so the audio-step fires on first
  // Lyrics Only entry too — same `psalter.tour.audioStepDone` key, so neither
  // path re-fires once the user has seen it once.
  const isMusicNotesView =
    viewMode === 'staff' ||
    viewMode === 'staff-split' ||
    viewMode === 'solfege' ||
    viewMode === 'solfege-split' ||
    viewMode === 'lyrics'
  const isStaffInlineView = viewMode === 'staff'

  const shouldFireInitial = mounted && !tourInitialSeen
  const shouldFireAudio =
    mounted && tourInitialSeen && !tourAudioSeen && isMusicNotesView
  const shouldFireSwipe =
    mounted &&
    tourInitialSeen &&
    !tourSwipeSeen &&
    isStaffInlineView &&
    hasMultipleStanzas

  const activeTrigger: Trigger | null = shouldFireAudio
    ? 'audio'
    : shouldFireSwipe
      ? 'swipe'
      : shouldFireInitial
        ? 'initial'
        : null

  const steps = useMemo<Step[]>(() => {
    if (activeTrigger === 'audio') return [AUDIO_STEP]
    if (activeTrigger === 'swipe') return [SWIPE_STEP]
    if (activeTrigger === 'initial') return INITIAL_STEPS
    return []
  }, [activeTrigger])

  const tourSeen = activeTrigger === null

  // CR-01 fix: if `steps` shrinks (e.g. totalStanzas drops to 1 mid-tour,
  // dropping SWIPE_STEP), clamp `step` so it never points past the end of
  // the new, shorter array. Floor at 0 so the initial render (steps=[])
  // doesn't drive step to -1 and trip the measure effect's safeStep
  // undefined check.
  useEffect(() => {
    setStep((s) => Math.max(0, Math.min(s, steps.length - 1)))
  }, [steps.length])

  const dismiss = useCallback(() => {
    const keyToWrite =
      activeTrigger === 'audio'
        ? TOUR_AUDIO_KEY
        : activeTrigger === 'swipe'
          ? TOUR_SWIPE_KEY
          : TOUR_INITIAL_KEY
    try {
      localStorage.setItem(keyToWrite, 'true')
    } catch {
      /* ignore — non-persistent dismissal still hides for this session */
    }
    if (activeTrigger === 'audio') setTourAudioSeen(true)
    else if (activeTrigger === 'swipe') setTourSwipeSeen(true)
    else setTourInitialSeen(true)
    setStep(0)
    // Phase 21 (D-07): notify TourProvider so DesktopOptimisedBanner
    // re-renders immediately (or remains hidden if user permanently dismissed
    // it via the localStorage flag — that path is independent of the
    // tour-open state).
    tour.dismiss()
  }, [activeTrigger, tour])

  // Measure target on step change / resize / orientation
  useEffect(() => {
    if (!mounted || tourSeen) return
    const update = () => {
      // CR-01 fix: clamp defensively in case this effect fires (e.g. via the
      // resize listener) in the same tick `steps` shrank but before the
      // clamping effect above has committed its `setStep` — never trust
      // `step` to be in-bounds for the CURRENT `steps` array. Floor at 0
      // so an empty steps array doesn't drive safeStep negative and trip
      // the undefined check below.
      const safeStep = Math.max(0, Math.min(step, steps.length - 1))
      if (!steps[safeStep]) {
        dismiss()
        return
      }
      const rs = measure(steps[safeStep].target)
      if (!rs || rs.length === 0) {
        // Target missing — dismiss gracefully (mitigates T-04.9.4.04-03 DoS).
        dismiss()
        return
      }
      setRects(rs)
    }
    // Double-rAF: wait two frames so any concurrent DOM mutation (e.g. the
    // 200ms transform/opacity transitions on topBarHidden/bottomBarHidden
    // or the viewMode-driven <main> height swap in SingingView) has at least
    // started to settle before getBoundingClientRect reads geometry.
    // Single-rAF was insufficient on the final step in dark mode — the
    // gear-button cutout landed on stale coordinates.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(update)
    })
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [mounted, tourSeen, step, dismiss, steps])

  // Escape dismisses at any step
  useEffect(() => {
    if (!mounted || tourSeen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, tourSeen, dismiss])

  // Phase 21 (D-07): TourProvider tracks open-state so
  // DesktopOptimisedBanner can hide while the tour is active; both the Done
  // dismiss and the X (escape) close already call `tour.dismiss()` above.
  // This effect publishes the open signal whenever the tour is rendering —
  // it isn't idempotent because TourProvider.show() is a useCallback, but
  // calling it again on every render is fine (React batches setState(true)
  // to a no-op).
  useEffect(() => {
    if (activeTrigger !== null) tour.show()
  }, [activeTrigger, tour])

  if (!mounted || tourSeen || !rects || rects.length === 0) return null

  // CR-01 fix: clamp for render too — `steps` can shrink (breakpoint cross)
  // in the same render pass before the clamping effect commits.
  const currentStep = Math.min(step, steps.length - 1)
  const isLast = currentStep === steps.length - 1
  const padding = 8

  // 04.9.15.1-03: identify the swipe step specifically (by target + copy —
  // 'scroll-area' is currently only used by SWIPE_STEP, but matching on
  // copy too keeps this correct if another step ever reuses the target)
  // so only this one step gets the extra in-spotlight hand visual.
  const isSwipeStep =
    activeTrigger === 'swipe' &&
    steps[currentStep]?.target === 'stanza-nav' &&
    steps[currentStep]?.copy === SWIPE_STEP.copy

  // Phase 21 (D-04): orange ring on the final gear step draws attention to
  // the settings button — site accent green is reserved, orange is unused.
  // Only on the INITIAL tour's last step so audio/swipe triggers keep their
  // default white ring.
  const ringStroke =
    isLast && activeTrigger === 'initial' ? '#f97316' : 'var(--tour-ring, #ffffff)'

  // Phase 20-01 visual markers — Playwright assertions (UI-SPEC §Visual
  // markers) and the `data-onboarding-tour` legacy marker (used by
  // existing tests + Playwright diagnostics).
  const triggerAttr =
    activeTrigger === 'audio'
      ? 'data-tour-audio-step'
      : activeTrigger === 'swipe'
        ? 'data-tour-swipe-step'
        : 'data-tour-initial'

  // Bubble placement is based on the union bbox so it never overlaps any spotlight.
  const bbox = unionBbox(rects)

  // Bubble below spotlight when target sits in top half; above otherwise.
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 375
  const placeBelow = bbox.top + bbox.height / 2 < viewportH / 2

  // Checkpoint round 2, issue 4: clamp the bubble's vertical position to the
  // visible viewport. 'scroll-area' (used by SWIPE_STEP) is an unusually
  // large/tall spotlight target — the whole notation region — so
  // `placeBelow` can evaluate false with a `bbox.top` near/above the top
  // edge, pushing the un-clamped `top: bbox.top - padding - 8` (bubble's
  // BOTTOM edge, since it's paired with `translate(-50%, -100%)`) high
  // enough that most or all of the bubble rendered above the visible
  // viewport (matching the reported "copy clipped/invisible" symptom).
  const BUBBLE_MARGIN = 12
  const ESTIMATED_BUBBLE_HEIGHT = 180
  const bubbleTop = placeBelow
    ? Math.max(
        BUBBLE_MARGIN,
        Math.min(bbox.top + bbox.height + padding + 8, viewportH - ESTIMATED_BUBBLE_HEIGHT - BUBBLE_MARGIN),
      )
    : Math.min(
        viewportH - BUBBLE_MARGIN,
        Math.max(bbox.top - padding - 8, ESTIMATED_BUBBLE_HEIGHT + BUBBLE_MARGIN),
      )
  const bubbleStyle: React.CSSProperties = placeBelow
    ? { top: bubbleTop, left: '50%', transform: 'translateX(-50%)' }
    : { top: bubbleTop, left: '50%', transform: 'translate(-50%, -100%)' }

  // Checkpoint fix: 'scroll-area' (the singing view's <main>) can be taller
  // than — or shifted above/below — the visible viewport (e.g. the
  // scroll-hide reflow applies a negative margin-top / grows to 100dvh when
  // the chrome bars are hidden), so centering the hand + dot-preview inside
  // the RAW bbox can place them off-screen (dot preview invisible) or over
  // real rendered content instead of clean space.
  const swipeVisualTop = Math.max(bbox.top, 0)
  const swipeVisualLeft = Math.max(bbox.left, 0)
  const swipeVisualRect = {
    top: swipeVisualTop,
    left: swipeVisualLeft,
    width: Math.min(bbox.width, viewportW - swipeVisualLeft),
    height: Math.min(bbox.height, viewportH - swipeVisualTop),
  }

  const overlay = (
    <div
      data-onboarding-tour
      data-tour-trigger={activeTrigger}
      data-tour-audio-step={activeTrigger === 'audio' ? '' : undefined}
      data-tour-swipe-step={activeTrigger === 'swipe' ? '' : undefined}
      data-tour-initial={activeTrigger === 'initial' ? '' : undefined}
      className="fixed inset-0 z-[200] pointer-events-auto"
    >
      {/* 260517-ht8 #1b — SVG-mask spotlight supports MULTIPLE simultaneous cutouts
         so e.g. the back and forward arrows are individually highlighted (instead
         of one wide region covering the whole top bar). Backdrop alpha is set
         via the --tour-wash CSS variable (0.30 light / 0.75 dark) so the
         dimming remains visible against both backgrounds. */}
      <svg
        data-tour-spotlight
        width={viewportW}
        height={viewportH}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 201 }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rects.map((r, i) => (
              <rect
                key={i}
                x={r.left - padding}
                y={r.top - padding}
                width={r.width + padding * 2}
                height={r.height + padding * 2}
                rx={8}
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="var(--tour-wash, rgba(0,0,0,0.30))" mask="url(#tour-mask)" />
      </svg>
      {/* Spotlight ring (260814): draws a 2px white outline around each
         cutout. The mask's fill=black only makes the wash transparent inside
         the cutout — without this ring, the cutout's edges blur into the
         dimmed backdrop, especially in dark mode. The ring uses
         var(--tour-ring, white) so light mode can soften if needed in the
         future; defaults to full white today. Sits between the wash
         (z 201) and the bubble (z 202) so it doesn't intercept clicks.
         Phase 21 (D-04): `ringStroke` overrides to #f97316 (orange) on the
         final step of the initial tour so the gear button gets visual
         attention. */}
      <svg
        data-tour-ring
        width={viewportW}
        height={viewportH}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 201 }}
        fill="none"
        stroke={ringStroke}
        strokeWidth={2}
      >
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.left - padding}
            y={r.top - padding}
            width={r.width + padding * 2}
            height={r.height + padding * 2}
            rx={8}
          />
        ))}
      </svg>
      {/* 04.9.15.1-03 (MOBILE-10): swipe-step-only visual — animated hand,
         positioned inside the spotlight cutout. Sits above the mask (201) but
         below the bubble (202). Reduced motion falls back to a static,
         centered hand glyph. */}
      {isSwipeStep && (
        <div
          aria-hidden
          className="absolute overflow-hidden rounded-lg pointer-events-none"
          style={{
            top: swipeVisualRect.top,
            left: swipeVisualRect.left,
            width: swipeVisualRect.width,
            height: swipeVisualRect.height,
            zIndex: 201,
          }}
        >
          <style>{`
            @keyframes psalter-hand-swipe {
              0%   { transform: translate(calc(-50% + 46px), -50%); opacity: 0; }
              12%  { opacity: 1; }
              50%  { transform: translate(calc(-50% - 46px), -50%); opacity: 1; }
              88%  { opacity: 1; }
              100% { transform: translate(calc(-50% - 46px), -50%); opacity: 0; }
            }
          `}</style>
          {/* dotted swipe trail — light-on-dark for visibility against the
               spotlight cutout. */}
          <div
            className="absolute top-1/2 left-1/2 h-0.5 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full motion-reduce:hidden"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 6px, transparent 6px 12px)',
            }}
          />
          {/* animated hand glyph — static + centered when reduced motion is set */}
          <Hand
            className="absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-foreground/80 animate-[psalter-hand-swipe_1.8s_ease-in-out_infinite] motion-reduce:animate-none"
          />
        </div>
      )}
      {/* Tip bubble */}
      <div
        role="dialog"
        aria-live="polite"
        aria-label={steps.length > 1
          ? `Onboarding step ${currentStep + 1} of ${steps.length}`
          : 'Onboarding notice'}
        tabIndex={-1}
        className="absolute z-[202] bg-background border border-border rounded-lg shadow-lg p-4"
        style={{ ...bubbleStyle, width: 'min(320px, 90vw)' }}
      >
        {steps.length > 1 && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        )}
        <p className="text-sm font-normal mb-4">
          {typeof steps[currentStep].copy === 'string'
            ? steps[currentStep].copy
            : (<>
                {steps[currentStep].copy.pre}
                <span className="text-orange-500 font-semibold">
                  {steps[currentStep].copy.highlight}
                </span>
              </>)}
        </p>
        <div className="flex items-center justify-between gap-2">
          {steps.length > 1 && (
            <Button variant="ghost" size="sm" onClick={dismiss}>
              Skip tour
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
          >
            {isLast ? 'Done' : 'Next →'}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}

export default OnboardingTour