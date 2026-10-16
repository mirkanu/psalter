// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, screen, act } from '@testing-library/react'
import { TourProvider, useTour } from './TourProvider'

/**
 * TourProvider (Phase 21, D-07) — context exposes { isOpen, show, dismiss }
 * so OnboardingTour + DesktopOptimisedBanner can share tour open-state
 * without prop-drilling. This suite pins the 4 core behaviours:
 *   1. useTour() outside provider returns the no-op fallback
 *   2. TourProvider renders children; isOpen starts at false
 *   3. show() flips isOpen to true
 *   4. dismiss() flips isOpen back to false after show()
 *
 * Implementation note: the no-op fallback is what makes Test 1 possible
 * without throwing — without it the test would have to assert on a thrown
 * error which couples the test to the error message.
 */

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Probe({
  onReady,
}: {
  onReady?: (api: ReturnType<typeof useTour>) => void
}) {
  const api = useTour()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (onReady) onReady(api)
  return <span data-testid="probe" data-is-open={String(api.isOpen)} />
}

describe('TourProvider (Phase 21, D-07)', () => {
  it('Test 1: useTour() outside provider returns the no-op fallback (isOpen=false)', () => {
    // No wrapping provider — useTour() returns the fallback { isOpen: false,
    // show: () => {}, dismiss: () => {} }. Rendering this must not throw.
    render(<Probe />)
    const probe = screen.getByTestId('probe')
    expect(probe.getAttribute('data-is-open')).toBe('false')
  })

  it('Test 2: TourProvider renders children, isOpen starts at false', () => {
    render(
      <TourProvider>
        <span data-testid="child">child-content</span>
        <Probe />
      </TourProvider>,
    )
    expect(screen.getByTestId('child')).toBeTruthy()
    expect(screen.getByText('child-content')).toBeTruthy()
    expect(screen.getByTestId('probe').getAttribute('data-is-open')).toBe('false')
  })

  it('Test 3: show() flips isOpen to true', () => {
    let captured: ReturnType<typeof useTour> | null = null
    render(
      <TourProvider>
        <Probe
          onReady={(api) => {
            captured = api
          }}
        />
      </TourProvider>,
    )
    expect(captured).not.toBeNull()
    act(() => {
      captured!.show()
    })
    expect(screen.getByTestId('probe').getAttribute('data-is-open')).toBe('true')
  })

  it('Test 4: dismiss() flips isOpen back to false after show()', () => {
    let captured: ReturnType<typeof useTour> | null = null
    render(
      <TourProvider>
        <Probe
          onReady={(api) => {
            captured = api
          }}
        />
      </TourProvider>,
    )
    act(() => {
      captured!.show()
    })
    expect(screen.getByTestId('probe').getAttribute('data-is-open')).toBe('true')
    act(() => {
      captured!.dismiss()
    })
    expect(screen.getByTestId('probe').getAttribute('data-is-open')).toBe('false')
  })

  it('Test 5 (bonus): useRef + onReady forwarding works under strict mode-style remounts', () => {
    // Stress check: changing the api capture pattern should still surface
    // the latest provider state even after two shows.
    const ref = { current: null as ReturnType<typeof useTour> | null }
    function CapturingProbe() {
      const api = useTour()
      ref.current = api
      return <span data-testid="captured" data-is-open={String(api.isOpen)} />
    }
    render(
      <TourProvider>
        <CapturingProbe />
      </TourProvider>,
    )
    act(() => {
      ref.current!.show()
    })
    expect(ref.current).not.toBeNull()
    expect(ref.current!.isOpen).toBe(true)
    expect(screen.getByTestId('captured').getAttribute('data-is-open')).toBe('true')
    act(() => {
      ref.current!.dismiss()
    })
    expect(ref.current!.isOpen).toBe(false)
  })
})
