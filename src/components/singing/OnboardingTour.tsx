'use client'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'

const TOUR_KEY = 'psalter_tour_v1'

interface Step {
  target: string // data-tour-target value
  copy: string
}

const STEPS: Step[] = [
  { target: 'prev-next', copy: 'Swipe through all 150 psalms' },
  { target: 'tune-name', copy: 'Tap to switch to a different tune' },
  { target: 'view-controls', copy: 'Choose how you want to read — notation, lyrics, or solfège' },
  { target: 'play-button', copy: 'Tap to hear the tune played' },
]

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function measure(target: string): Rect | null {
  if (typeof document === 'undefined') return null
  const el = document.querySelector(`[data-tour-target="${target}"]`) as HTMLElement | null
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
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
      {/* Background overlay (fade only respects reduced motion) */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-150 motion-reduce:transition-none" />
      {/* Spotlight cutout — box-shadow trick clips outside the rect */}
      <div
        data-tour-spotlight
        className="absolute rounded-lg pointer-events-none"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.60)',
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
