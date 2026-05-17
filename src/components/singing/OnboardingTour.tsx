'use client'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

const TOUR_KEY = 'psalter_tour_v1'

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

export function OnboardingTour() {
  // SSR-safe: render nothing until mounted; assume seen=true to suppress
  // first-paint flash for returning visitors (hydration reads the real value).
  const [mounted, setMounted] = useState(false)
  const [tourSeen, setTourSeen] = useState(true)
  const [step, setStep] = useState(0)
  const [rects, setRects] = useState<Rect[] | null>(null)

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
      const rs = measure(STEPS[step].target)
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

  const isLast = step === STEPS.length - 1
  const padding = 8

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
      {/* Tip bubble */}
      <div
        role="dialog"
        aria-live="polite"
        aria-label={`Onboarding step ${step + 1} of ${STEPS.length}`}
        tabIndex={-1}
        className="absolute z-[202] bg-background border border-border rounded-lg shadow-lg p-4"
        style={{ ...bubbleStyle, width: 'min(320px, 90vw)' }}
      >
        <p className="text-xs text-muted-foreground text-center mb-2">
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="text-sm font-normal mb-4">{STEPS[step].copy}</p>
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
