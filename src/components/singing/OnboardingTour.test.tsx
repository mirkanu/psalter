// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import { OnboardingTour } from './OnboardingTour'
import type { ViewMode } from '@/components/notation/NotationRenderer'

// Phase 20-01 OnboardingTour renders the spotlight by measuring
// `[data-tour-target="..."]` elements in the document. The unit tests need
// at least one element per target so `measure()` returns a non-null rect
// and the overlay + bubble render (otherwise the tour returns null).
function withTourTargets(children: React.ReactNode) {
  return (
    <>
      <div data-tour-target="prev-next" style={{ position: 'absolute', top: 10, left: 10, width: 60, height: 30 }} />
      <div data-tour-target="psalm-label" style={{ position: 'absolute', top: 10, left: 80, width: 60, height: 30 }} />
      <div data-tour-target="tune-name" style={{ position: 'absolute', top: 10, left: 150, width: 60, height: 30 }} />
      <div data-tour-target="view-controls" style={{ position: 'absolute', top: 10, left: 220, width: 60, height: 30 }} />
      <div data-tour-target="play-button" style={{ position: 'absolute', top: 10, left: 290, width: 60, height: 30 }} />
      <main data-tour-target="scroll-area" style={{ position: 'absolute', top: 100, left: 10, width: 300, height: 200 }} />
      <div data-tour-target="bottom-bar" style={{ position: 'absolute', bottom: 0, left: 0, width: 400, height: 60 }} />
      {children}
    </>
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

function renderTour(
  overrides: Partial<React.ComponentProps<typeof OnboardingTour>> = {},
) {
  const defaultProps: React.ComponentProps<typeof OnboardingTour> = {
    totalStanzas: 1,
    viewMode: 'staff-split' as ViewMode,
  }
  return render(withTourTargets(<OnboardingTour {...defaultProps} {...overrides} />))
}

describe('OnboardingTour (Phase 20-01, D-15/D-16; Phase 21 D-02 drops firstVisitAccepted)', () => {
  it('Test 1: with all 3 keys unset, the initial tour fires (data-tour-initial marker)', async () => {
    renderTour({ viewMode: 'staff-split' })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const overlay = document.querySelector('[data-tour-initial]')
    expect(overlay).not.toBeNull()
  })

  it('Test 2: with psalter.tour.initialDone=true and audioStepDone unset and viewMode=staff, audio step fires', async () => {
    localStorage.setItem('psalter.tour.initialDone', 'true')
    renderTour({ viewMode: 'staff' })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const audioMarker = document.querySelector('[data-tour-audio-step]')
    expect(audioMarker).not.toBeNull()
  })

  it('Test 3: with audioStepDone=true and viewMode=staff and totalStanzas=2, swipe step fires', async () => {
    localStorage.setItem('psalter.tour.initialDone', 'true')
    localStorage.setItem('psalter.tour.audioStepDone', 'true')
    renderTour({ viewMode: 'staff', totalStanzas: 2 })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const swipeMarker = document.querySelector('[data-tour-swipe-step]')
    expect(swipeMarker).not.toBeNull()
  })

  it('Test 4: with psalter_tour_v3=done set on hydrate, the new psalter.tour.initialDone=true is written and the old key is removed', async () => {
    localStorage.setItem('psalter_tour_v3', 'done')
    renderTour()
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    expect(localStorage.getItem('psalter.tour.initialDone')).toBe('true')
    expect(localStorage.getItem('psalter_tour_v3')).toBeNull()
  })

  it('Test 5: dismiss writes the correct key for the active trigger (audio trigger → psalter.tour.audioStepDone)', async () => {
    localStorage.setItem('psalter.tour.initialDone', 'true')
    renderTour({ viewMode: 'staff' })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const doneBtn = screen.queryByRole('button', { name: /^Done$/ })
    expect(doneBtn).not.toBeNull()
    if (doneBtn) fireEvent.click(doneBtn)
    expect(localStorage.getItem('psalter.tour.audioStepDone')).toBe('true')
  })
})