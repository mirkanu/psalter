'use client'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface TourContextValue {
  isOpen: boolean
  show: () => void
  dismiss: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

/**
 * D-07: exposes { isOpen, show, dismiss } to OnboardingTour +
 * DesktopOptimisedBanner so the banner can hide while the tour is open
 * without prop-drilling. Mounted inside `<Providers>` in src/app/layout.tsx
 * so it wraps every host that calls `useTour()` (OnboardingTourClient via
 * SingingView, plus DesktopOptimisedBanner mounted directly in layout).
 */
export function TourProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const show = useCallback(() => setIsOpen(true), [])
  const dismiss = useCallback(() => setIsOpen(false), [])
  const value = useMemo<TourContextValue>(
    () => ({ isOpen, show, dismiss }),
    [isOpen, show, dismiss],
  )
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext)
  if (!ctx) {
    // Defensive: if a consumer is rendered outside the provider, return a
    // no-op shape so the page doesn't crash. Default isOpen=false means
    // consumers that gate on isOpen (e.g. DesktopOptimisedBanner) behave as
    // if the tour is closed — the page works, the banner-hide just doesn't
    // apply in this misconfigured surface.
    return { isOpen: false, show: () => {}, dismiss: () => {} }
  }
  return ctx
}

export default TourProvider
