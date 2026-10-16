// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import { OnboardingTour } from './OnboardingTour'
import type { ViewMode } from '@/components/notation/NotationRenderer'

// Phase 21 fqz polish: SWIPE_STEP copy branches by viewport (mobile vs
// desktop). jsdom doesn't define window.matchMedia by default, so we stub
// it in tests that exercise the swipe step (and reset between tests so
// stubs don't leak).
function stubMatchMedia(isDesktop: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: query === '(min-width: 768px)' ? isDesktop : false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// Phase 20-01 OnboardingTour renders the spotlight by measuring
// `[data-tour-target="..."]` elements in the document. The unit tests need
// at least one element per target so `measure()` returns a non-null rect
// and the overlay + bubble render (otherwise the tour returns null).
// Phase 21 (D-06): SWIPE_STEP now targets 'stanza-nav' (the prev/next
// stanza buttons in GlassBottomBar). The wrapper therefore includes TWO
// elements with the same target so `measure()` returns two rects and the
// unionBoundingRect renders two cutouts (matches production behaviour).
function withTourTargets(children: React.ReactNode) {
  return (
    <>
      <div data-tour-target="prev-next" style={{ position: 'absolute', top: 10, left: 10, width: 60, height: 30 }} />
      <div data-tour-target="psalm-label" style={{ position: 'absolute', top: 10, left: 80, width: 60, height: 30 }} />
      <div data-tour-target="tune-name" style={{ position: 'absolute', top: 10, left: 150, width: 60, height: 30 }} />
      <div data-tour-target="view-controls" style={{ position: 'absolute', top: 10, left: 220, width: 60, height: 30 }} />
      <div data-tour-target="play-button" style={{ position: 'absolute', top: 10, left: 290, width: 60, height: 30 }} />
      {/* D-06: two stanza-nav buttons (prev + next) — mirrors GlassBottomBar's
           data-stanza-prev/next buttons which both carry data-tour-target=
           'stanza-nav' so the SWIPE_STEP spotlight draws two cutouts. */}
      <button
        data-tour-target="stanza-nav"
        aria-label="Previous stanza page"
        style={{ position: 'absolute', top: 200, left: 10, width: 60, height: 40 }}
      />
      <button
        data-tour-target="stanza-nav"
        aria-label="Next stanza page"
        style={{ position: 'absolute', top: 200, left: 80, width: 60, height: 40 }}
      />
      <main data-tour-target="scroll-area" style={{ position: 'absolute', top: 100, left: 10, width: 300, height: 200 }} />
      <div data-tour-target="bottom-bar" style={{ position: 'absolute', bottom: 0, left: 0, width: 400, height: 60 }} />
      {children}
    </>
  )
}

beforeEach(() => {
  // Default to desktop for tests that don't explicitly opt into mobile —
  // most pre-existing assertions assume the desktop copy path.
  stubMatchMedia(true)
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  // @ts-expect-error test cleanup — jsdom leaves matchMedia undefined by default
  delete window.matchMedia
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

describe('OnboardingTour (Phase 20-01, D-15/D-16; Phase 21 D-02 drops firstVisitAccepted; D-04 copy + orange ring; D-06 stanza-nav; D-07 TourProvider show/dismiss wiring)', () => {
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

  // Phase 21 (D-06): SWIPE_STEP now targets 'stanza-nav' and uses the
  // user-provided copy "Tap < and > to navigate between stanzas". The
  // wrapper above adds two elements sharing that target so the measure
  // step finds both — unionBoundingRect then draws two cutouts (not
  // asserted visually here, but existence of the text confirms step 7
  // reaches the right branch).
  it('Test 6 (Phase 21 D-06): SWIPE_STEP targets stanza-nav and uses the new copy', async () => {
    localStorage.setItem('psalter.tour.initialDone', 'true')
    localStorage.setItem('psalter.tour.audioStepDone', 'true')
    renderTour({ viewMode: 'staff', totalStanzas: 2 })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const swipeMarker = document.querySelector('[data-tour-swipe-step]')
    expect(swipeMarker).not.toBeNull()
    expect(
      screen.getByText('Tap < and > to navigate between stanzas'),
    ).toBeTruthy()
  })

  // Phase 21 (D-04): the final step of the initial tour (step 4 of 4)
  // uses the user-provided copy verbatim. Round-tripped via a regex with
  // escapes so the regex syntax doesn't fight the literal parens. Test
  // advances via the "Next →" button — bubble copy swaps per step in the
  // same React render, so by step 4 the gear-step copy is what's visible.
  // Phase 21 fqz (item 6): the copy is now split into a `pre` + orange
  // `highlight` pair; assert both fragments are present.
  it('Test 7 (Phase 21 D-04 + fqz item 6): INITIAL_STEPS[3] (final gear step) has the new copy', async () => {
    renderTour({ viewMode: 'staff-split' })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const overlay = document.querySelector('[data-tour-initial]')
    expect(overlay).not.toBeNull()
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })
      const nextBtn = screen.queryByRole('button', { name: /Next →/ })
      if (!nextBtn) break
      fireEvent.click(nextBtn)
    }
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })
    // The pre fragment (sans "(new feature!)" highlight) lives in the <p>;
    // assert it's present.
    expect(
      screen.getByText(/Open settings to access the study guide or/),
    ).toBeTruthy()
    // The highlight lives in the orange <span>; Test 9 verifies the exact
    // textContent match.
    expect(
      document.querySelector('[role="dialog"] .text-orange-500'),
    ).not.toBeNull()
  })

  // Phase 21 (D-04): the spotlight ring's stroke becomes #f97316 on the
  // initial tour's last step. The SVG element is identified by the
  // data-tour-ring attribute (rendered on the svg root) and the stroke
  // attribute is set via the React `stroke` prop.
  it('Test 8 (Phase 21 D-04): final-step spotlight ring stroke is orange (#f97316)', async () => {
    renderTour({ viewMode: 'staff-split' })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    // Advance to step 4 (final step) by clicking "Next →" 3 times.
    for (let i = 0; i < 3; i++) {
      // Phase 21 (D-04): the per-step ring stroke recomputes inside the
      // current render — re-measure effect cycles after each setStep, which
      // means the SVG attribute updates synchronously in the same paint.
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })
      const nextBtn = screen.queryByRole('button', { name: /Next →/ })
      if (!nextBtn) break
      fireEvent.click(nextBtn)
    }
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })
    const ring = document.querySelector('svg[data-tour-ring]')
    expect(ring).not.toBeNull()
    expect(ring?.getAttribute('stroke')).toBe('#f97316')
  })

  // Phase 21 fqz (item 6): final step bubble copy renders the highlight
  // portion in a .text-orange-500 <span> so it pops against the rest of the
  // copy. The structured `{ pre, highlight }` form drives the bubble JSX
  // through its discriminated branch.
  it('Test 9 (Phase 21 fqz item 6): final-step bubble has the orange-highlighted "new feature" span', async () => {
    renderTour({ viewMode: 'staff-split' })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    // Advance to step 4 (final step).
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50))
      })
      const nextBtn = screen.queryByRole('button', { name: /Next →/ })
      if (!nextBtn) break
      fireEvent.click(nextBtn)
    }
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100))
    })
    const orangeSpan = document.querySelector('.text-orange-500')
    expect(orangeSpan).not.toBeNull()
    expect(orangeSpan?.textContent).toBe(
      '(new feature!) change views to Music Notes or Lyrics Only',
    )
  })

  // Phase 21 fqz (item 7): the audio-player tour step ALSO fires on first
  // entry to viewMode='lyrics' (not just Music Notes views). Same
  // `psalter.tour.audioStepDone` key — so once seen on either path, the user
  // is not re-shown the step on the other path.
  it('Test 10 (Phase 21 fqz item 7): audio-step fires on first viewMode=lyrics entry', async () => {
    localStorage.setItem('psalter.tour.initialDone', 'true')
    renderTour({ viewMode: 'lyrics' })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const audioMarker = document.querySelector('[data-tour-audio-step]')
    expect(audioMarker).not.toBeNull()
    expect(
      screen.getByText('Tap the play button to open the audio player.'),
    ).toBeTruthy()
  })

  // Phase 21 fqz polish: the swipe-step copy branches by viewport. On
  // mobile (min-width: 768px -> false), the original swipe wording is
  // restored; on desktop, the D-06 tap-prev-next wording is shown. The
  // beforeEach stub defaults to desktop, so this test re-stubs to mobile
  // to exercise the alternate branch.
  it('Test 11 (Phase 21 fqz polish): swipe-step copy is mobile swipe wording under 768px', async () => {
    stubMatchMedia(false)
    localStorage.setItem('psalter.tour.initialDone', 'true')
    localStorage.setItem('psalter.tour.audioStepDone', 'true')
    renderTour({ viewMode: 'staff', totalStanzas: 2 })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const swipeMarker = document.querySelector('[data-tour-swipe-step]')
    expect(swipeMarker).not.toBeNull()
    expect(
      screen.getByText(/Swipe left or right to move between stanza groups/),
    ).toBeTruthy()
    // The desktop copy must NOT be present on the mobile path.
    expect(
      screen.queryByText('Tap < and > to navigate between stanzas'),
    ).toBeNull()
  })
})