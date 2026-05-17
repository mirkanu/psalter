'use client'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

const TOUR_KEY = 'psalter_tour_v1'

interface Step {
  target: string // data-tour-target value
  copy: string
}

// 260517-cm0 #2C/2D/2E/2F — three steps, focusing on what's not visually obvious.
const STEPS: Step[] = [
  { target: 'prev-next', copy: 'Navigate to next/previous psalm' },
  { target: 'psalm-label', copy: 'Tap to quickly switch to any psalm' },
  { target: 'view-controls', copy: 'Open settings to change views (e.g. lyrics only) and access the study guide' },
]

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function measure(target: string): Rect | null {
  if (typeof document === 'undefined') return null
  const els = Array.from(
    document.querySelectorAll(`[data-tour-target="${target}"]`),
  ) as HTMLElement[]
  if (els.length === 0) return null
  // 260517-cm0 #2C — when multiple elements share a target (e.g. prev/next
  // arrows both tagged prev-next), the spotlight covers the union bbox so
  // both are highlighted in a single step.
  let minTop = Infinity
  let minLeft = Infinity
  let maxRight = -Infinity
  let maxBottom = -Infinity
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.top < minTop) minTop = r.top
    if (r.left < minLeft) minLeft = r.left
    if (r.right > maxRight) maxRight = r.right
    if (r.bottom > maxBottom) maxBottom = r.bottom
  }
  return {
    top: minTop,
    left: minLeft,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
  }
}

export function OnboardingTour() {
  // SSR-safe: render nothing until mounted; assume seen=true to suppress
  // first-paint flash for returning visitors (hydration reads the real value).
  const [mounted, setMounted] = useState(false)
  const [tourSeen, setTourSeen] = useState(true)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

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
      const r = measure(STEPS[step].target)
      if (!r) {
        // Target missing — dismiss gracefully (mitigates T-04.9.4.04-03 DoS).
        dismiss()
        return
      }
      setRect(r)
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

  if (!mounted || tourSeen || !rect) return null

  const isLast = step === STEPS.length - 1
  const padding = 8

  // Bubble below spotlight when target sits in top half; above otherwise.
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
  const placeBelow = rect.top + rect.height / 2 < viewportH / 2
  const bubbleStyle: React.CSSProperties = placeBelow
    ? { top: rect.top + rect.height + padding + 8, left: '50%', transform: 'translateX(-50%)' }
    : { top: rect.top - padding - 8, left: '50%', transform: 'translate(-50%, -100%)' }

  const overlay = (
    <div data-onboarding-tour className="fixed inset-0 z-[200] pointer-events-auto">
      {/* 260517-cm0 #2A/#2B — spotlight cutout is the SOLE dimming layer.
         The earlier full-overlay bg-black/60 layer is removed so the spotlight
         area is identical to its un-toured state (#2B). Backdrop alpha reduced
         to 0.30 (#2A — was 0.60). */}
      <div
        data-tour-spotlight
        className="absolute rounded-lg pointer-events-none"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.30)',
          zIndex: 201,
        }}
      />
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
