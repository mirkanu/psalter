'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Hand } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Task 5 (04.9.14-01): bumped v1 → v2 to re-trigger the tour for existing
// users when the scroll-hide explanation steps were added (those steps were
// since removed — see the SWIPE_STEPS comment below — but the version-bump
// precedent stands).
// 04.9.15.1-03: bumped v2 → v3 to re-trigger the tour again when the swipe
// step was added (same precedent as the v1→v2 bump). Not bumped again for
// the scroll-hide-steps removal (checkpoint round 5) — that's content being
// removed from an existing step set, not new functionality to gate.
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

// 04.9.15.1-03 (MOBILE-10): appended only when totalStanzas > 1. Reuses the
// existing 'scroll-area' target (the <main data-tour-target="scroll-area">
// already exists and is already measured today) — no new data-tour-target.
// (The scroll-hide explanation steps that previously also used 'scroll-area'
// / 'top-bar' were removed per checkpoint round 5 feedback — scroll-to-hide
// is discoverable naturally — so this is now the ONLY step using this
// target.)
const SWIPE_STEPS: Step[] = [
  {
    target: 'scroll-area',
    copy: 'Swipe left or right to move between stanza groups.',
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
  /** 04.9.15.1-03 (MOBILE-10): current stanza-set count. Used to gate the
   *  swipe tutorial step — only shown when there's more than one set to
   *  swipe between. Optional. */
  totalStanzas?: number | null
}

export function OnboardingTour({ totalStanzas }: Props = {}) {
  // SSR-safe: render nothing until mounted; assume seen=true to suppress
  // first-paint flash for returning visitors (hydration reads the real value).
  const [mounted, setMounted] = useState(false)
  const [tourSeen, setTourSeen] = useState(true)
  const [step, setStep] = useState(0)
  const [rects, setRects] = useState<Rect[] | null>(null)

  // 04.9.15.1-03: gate the swipe step to >1 stanza-set (nothing to swipe
  // between otherwise).
  const hasMultipleStanzas = totalStanzas != null && totalStanzas > 1
  const steps = useMemo<Step[]>(
    () => [...STEPS, ...(hasMultipleStanzas ? SWIPE_STEPS : [])],
    [hasMultipleStanzas],
  )

  // CR-01 fix: if `steps` shrinks (e.g. totalStanzas drops to 1 mid-tour,
  // dropping SWIPE_STEPS), clamp `step` so it never points past the end of
  // the new, shorter array. Without this, the measurement effect below reads
  // `steps[step]` as `undefined` and throws.
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

  // 04.9.15.1-03: identify the swipe step specifically (by target + copy —
  // 'scroll-area' is currently only used by SWIPE_STEPS, but matching on
  // copy too keeps this correct if another step ever reuses the target)
  // so only this one step gets the extra in-spotlight hand visual.
  const isSwipeStep =
    steps[currentStep]?.target === 'scroll-area' &&
    steps[currentStep]?.copy === SWIPE_STEPS[0].copy

  // Bubble placement is based on the union bbox so it never overlaps any spotlight.
  const bbox = unionBbox(rects)

  // Bubble below spotlight when target sits in top half; above otherwise.
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 375
  const placeBelow = bbox.top + bbox.height / 2 < viewportH / 2

  // Checkpoint round 2, issue 4: clamp the bubble's vertical position to the
  // visible viewport. 'scroll-area' (used by SWIPE_STEPS) is an unusually
  // large/tall spotlight target — the whole notation region — so
  // `placeBelow` can evaluate false with a `bbox.top` near/above the top
  // edge, pushing the un-clamped `top: bbox.top - padding - 8` (bubble's
  // BOTTOM edge, since it's paired with `translate(-50%, -100%)`) high
  // enough that most or all of the bubble rendered above the visible
  // viewport (matching the reported "copy clipped/invisible" symptom).
  // Clamp so the bubble's top AND bottom edges always stay within
  // [BUBBLE_MARGIN, viewportH - BUBBLE_MARGIN], using a conservative height
  // estimate — bubble content is short (one "Step N of M" line, 1-2 lines of
  // copy, one button row) and width is capped at min(320px, 90vw), so it
  // never realistically needs more than this. Applies to every step (not
  // just the swipe step) since any step could in principle target a
  // tall/near-edge element.
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
  // real rendered content instead of clean space. Clamp/intersect the
  // spotlight rect to the visible viewport before using it as the anchor for
  // the swipe-step-only visuals below — bubble placement above is
  // unaffected (bbox itself, and the spotlight mask cutout, stay exact).
  const swipeVisualTop = Math.max(bbox.top, 0)
  const swipeVisualLeft = Math.max(bbox.left, 0)
  const swipeVisualRect = {
    top: swipeVisualTop,
    left: swipeVisualLeft,
    width: Math.min(bbox.width, viewportW - swipeVisualLeft),
    height: Math.min(bbox.height, viewportH - swipeVisualTop),
  }

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
      {/* 04.9.15.1-03 (MOBILE-10): swipe-step-only visual — animated hand,
         positioned inside the spotlight cutout (Sketch 007 Variant C, minus
         the dot-preview clone per checkpoint round 2 feedback: the tour no
         longer references or previews the dot indicator at all — the real
         StanzaDotIndicator, mounted separately in SingingView, speaks for
         itself). Sits above the mask (201) but below the bubble (202).
         Reduced motion falls back to a static, centered hand glyph. */}
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
