'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/components/notation/NotationRenderer'

// Task 5 (04.9.14-01): bumped v1 → v2 to re-trigger the tour for existing
// users now that it includes the new scroll-hide steps below.
// 04.9.15.1-03: bumped v2 → v3 to re-trigger the tour again now that it
// includes the new swipe step below (same precedent as the v1→v2 bump).
const TOUR_KEY = 'psalter_tour_v3'

interface Step {
  target: string // data-tour-target value
  copy: string
}

// 260517-ht8 #1a — re-insert "tap to change tune" as step 3; gear becomes step 4.
const STEPS: Step[] = [
  { target: 'prev-next', copy: 'Navigate to next/previous psalm' },
  { target: 'psalm-label', copy: 'Tap to quickly switch to any psalm' },
  { target: 'tune-name', copy: 'Tap to switch to a different tune' },
  { target: 'view-controls', copy: 'Open settings to change views (e.g. lyrics only) and access the study guide' },
]

// Task 5 (04.9.14-01): scroll-hide navigation steps — only shown when the
// user is in split-leaf mode on mobile (<768px), where the new hide-on-scroll
// top/bottom bars are most relevant. Deviation from the plan's literal
// 3-target list: 'scroll-up' has no dedicated DOM element to spotlight (it
// describes an action, not a UI control), so its step reuses the 'top-bar'
// target — the same bar the user just watched hide is the one that reappears.
const SCROLL_HIDE_STEPS: Step[] = [
  { target: 'top-bar', copy: 'Scroll down to hide the top navigation and see more of the tune' },
  { target: 'scroll-area', copy: 'Keep scrolling to hide the bottom controls too' },
  { target: 'top-bar', copy: 'Scroll back up anytime to bring the bars back' },
]

// 04.9.15.1-03 (MOBILE-10): appended only when totalStanzas > 1. Reuses the
// existing 'scroll-area' target (the <main data-tour-target="scroll-area">
// already exists and is already measured today) — no new data-tour-target.
const SWIPE_STEPS: Step[] = [
  {
    target: 'scroll-area',
    copy: 'Swipe left or right to move between stanza groups — the dots show where you are.',
  },
]

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

interface Props {
  /** Task 5 (04.9.14-01): current NotationRenderer view mode. Used to gate
   *  the scroll-hide steps to split-leaf mode. Optional for backward
   *  compatibility with any other caller that doesn't track view mode. */
  viewMode?: ViewMode
  /** 04.9.15.1-03 (MOBILE-10): current stanza-set count. Used to gate the
   *  swipe tutorial step — only shown when there's more than one set to
   *  swipe between. Optional, mirrors viewMode. */
  totalStanzas?: number | null
}

export function OnboardingTour({ viewMode, totalStanzas }: Props = {}) {
  // SSR-safe: render nothing until mounted; assume seen=true to suppress
  // first-paint flash for returning visitors (hydration reads the real value).
  const [mounted, setMounted] = useState(false)
  const [tourSeen, setTourSeen] = useState(true)
  const [step, setStep] = useState(0)
  const [rects, setRects] = useState<Rect[] | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Task 5: gate scroll-hide steps to split-leaf mode on mobile.
  const isSplitLeafMobile =
    isMobile && (viewMode === 'staff-split' || viewMode === 'solfege-split')
  // 04.9.15.1-03: gate the swipe step to >1 stanza-set (nothing to swipe
  // between otherwise).
  const hasMultipleStanzas = totalStanzas != null && totalStanzas > 1
  const steps = useMemo<Step[]>(
    () => [
      ...STEPS,
      ...(isSplitLeafMobile ? SCROLL_HIDE_STEPS : []),
      ...(hasMultipleStanzas ? SWIPE_STEPS : []),
    ],
    [isSplitLeafMobile, hasMultipleStanzas],
  )

  // CR-01 fix: if `steps` shrinks (e.g. a resize/rotation crosses the 768px
  // breakpoint mid-tour, dropping SCROLL_HIDE_STEPS), clamp `step` so it never
  // points past the end of the new, shorter array. Without this, the
  // measurement effect below reads `steps[step]` as `undefined` and throws.
  useEffect(() => {
    setStep((s) => Math.min(s, steps.length - 1))
  }, [steps.length])

  // Hydrate from localStorage AFTER mount
  useEffect(() => {
    let seen = true
    try {
      seen = localStorage.getItem(TOUR_KEY) === 'done'
    } catch {
      /* ignore — treat as not-yet-seen so first-time experience still runs */
      seen = false
    }
    setTourSeen(seen)
    setMounted(true)
  }, [])

  const dismiss = useCallback(() => {
    setTourSeen(true)
    try {
      localStorage.setItem(TOUR_KEY, 'done')
    } catch {
      /* ignore — non-persistent dismissal still hides for this session */
    }
  }, [])

  // Measure target on step change / resize / orientation
  useEffect(() => {
    if (!mounted || tourSeen) return
    const update = () => {
      // CR-01 fix: clamp defensively in case this effect fires (e.g. via the
      // resize listener) in the same tick `steps` shrank but before the
      // clamping effect above has committed its `setStep` — never trust
      // `step` to be in-bounds for the CURRENT `steps` array.
      const safeStep = Math.min(step, steps.length - 1)
      const rs = measure(steps[safeStep].target)
      if (!rs || rs.length === 0) {
        // Target missing — dismiss gracefully (mitigates T-04.9.4.04-03 DoS).
        dismiss()
        return
      }
      setRects(rs)
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [mounted, tourSeen, step, dismiss])

  // Escape dismisses at any step
  useEffect(() => {
    if (!mounted || tourSeen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, tourSeen, dismiss])

  if (!mounted || tourSeen || !rects || rects.length === 0) return null

  // CR-01 fix: clamp for render too — `steps` can shrink (breakpoint cross)
  // in the same render pass before the clamping effect commits.
  const currentStep = Math.min(step, steps.length - 1)
  const isLast = currentStep === steps.length - 1
  const padding = 8

  // 04.9.15.1-03: identify the swipe step specifically (by target + copy,
  // since SWIPE_STEPS reuses the 'scroll-area' target already used by
  // SCROLL_HIDE_STEPS) so only this one step gets the extra in-spotlight
  // hand + dot-preview visuals.
  const isSwipeStep =
    steps[currentStep]?.target === 'scroll-area' &&
    steps[currentStep]?.copy === SWIPE_STEPS[0].copy

  // Bubble placement is based on the union bbox so it never overlaps any spotlight.
  const bbox = unionBbox(rects)

  // Bubble below spotlight when target sits in top half; above otherwise.
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 375
  const placeBelow = bbox.top + bbox.height / 2 < viewportH / 2
  const bubbleStyle: React.CSSProperties = placeBelow
    ? { top: bbox.top + bbox.height + padding + 8, left: '50%', transform: 'translateX(-50%)' }
    : { top: bbox.top - padding - 8, left: '50%', transform: 'translate(-50%, -100%)' }

  const overlay = (
    <div data-onboarding-tour className="fixed inset-0 z-[200] pointer-events-auto">
      {/* 260517-ht8 #1b — SVG-mask spotlight supports MULTIPLE simultaneous cutouts
         so e.g. the back and forward arrows are individually highlighted (instead
         of one wide region covering the whole top bar). Backdrop alpha = 0.30. */}
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
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.30)" mask="url(#tour-mask)" />
      </svg>
      {/* 04.9.15.1-03 (MOBILE-10): swipe-step-only visuals — animated hand +
         live dot-indicator preview, positioned inside the spotlight cutout
         (Sketch 007 Variant C). Sits above the mask (201) but below the
         bubble (202). Reduced motion falls back to a static, centered hand
         glyph and non-pulsing dots. */}
      {isSwipeStep && (
        <div
          aria-hidden
          className="absolute overflow-hidden rounded-lg pointer-events-none"
          style={{ top: bbox.top, left: bbox.left, width: bbox.width, height: bbox.height, zIndex: 201 }}
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
          {/* dotted swipe trail */}
          <div
            className="absolute top-1/2 left-1/2 h-0.5 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full motion-reduce:hidden"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(120,120,120,0.5) 0 6px, transparent 6px 12px)',
            }}
          />
          {/* animated hand glyph — static + centered when reduced motion is set */}
          <Hand
            className="absolute top-1/2 left-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-foreground/80 animate-[psalter-hand-swipe_1.8s_ease-in-out_infinite] motion-reduce:animate-none"
          />
          {/* live preview of the page-dot indicator — clones StanzaDotIndicator's
             dot visuals (real component is fixed bottom-right and can't be
             relocated into the spotlight) */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full border border-border bg-background/85 backdrop-blur-sm px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-[psalter-dot-pulse_1.8s_ease-in-out_infinite] motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          </div>
        </div>
      )}
      {/* Tip bubble */}
      <div
        role="dialog"
        aria-live="polite"
        aria-label={`Onboarding step ${currentStep + 1} of ${steps.length}`}
        tabIndex={-1}
        className="absolute z-[202] bg-background border border-border rounded-lg shadow-lg p-4"
        style={{ ...bubbleStyle, width: 'min(320px, 90vw)' }}
      >
        <p className="text-xs text-muted-foreground text-center mb-2">
          Step {currentStep + 1} of {steps.length}
        </p>
        <p className="text-sm font-normal mb-4">{steps[currentStep].copy}</p>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Skip tour
          </Button>
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
