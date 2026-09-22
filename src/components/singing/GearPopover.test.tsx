// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { GearPopover } from './GearPopover'
import type { ViewMode } from '@/components/notation/NotationRenderer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

afterEach(() => {
  cleanup()
})

function renderGearPopover(overrides: Partial<React.ComponentProps<typeof GearPopover>> = {}) {
  const defaultProps: React.ComponentProps<typeof GearPopover> = {
    open: true,
    onOpenChange: vi.fn(),
    viewMode: 'staff-split' as ViewMode,
    onViewModeChange: vi.fn(),
    studyHref: '/study',
    onRestartTour: vi.fn(),
    showLyricsOption: true,
    staffAvailable: true,
    solfegeInlineAvailable: false,
    solfegeSplitAvailable: true,
    staffInlineApproved: true,
    hasActiveTune: true,
    onRequestTuneSelection: vi.fn(),
    originalScanAvailable: true,
    showOriginal: false,
    onShowOriginalChange: vi.fn(),
  }
  return render(<GearPopover {...defaultProps} {...overrides} />)
}

// Issue #59 (260916-kk1): re-activate the "Score: Digital | Original scan"
// sub-toggle. The row renders ONLY when Staff inline is available — i.e.
// staff notation exists AND the tune is precentor-approved. Using the
// `inlineLayoutDisabled` helper keeps a single source of truth between
// the Digital button's clickability and the Inline Staff layout button.
describe('GearPopover — Score: Digital / Original scan row (#59)', () => {
  it('is VISIBLE in APPROVED Staff Split-Leaf when a scan exists, with Digital enabled', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: true,
      originalScanAvailable: true,
    })
    const row = document.querySelector('[data-settings-sub="score-source"]')
    expect(row).not.toBeNull()
    const digital = screen.getByRole('radio', { name: 'Digital' })
    expect(digital.getAttribute('aria-disabled')).toBeNull()
    expect(digital.getAttribute('aria-checked')).toBe('true')
  })

  it('is HIDDEN in INLINE Staff layout', () => {
    renderGearPopover({
      viewMode: 'staff',
      staffInlineApproved: true,
      originalScanAvailable: true,
    })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is HIDDEN when originalScanAvailable is false', () => {
    renderGearPopover({ originalScanAvailable: false })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is HIDDEN in Lyrics Only view mode', () => {
    renderGearPopover({ viewMode: 'lyrics', originalScanAvailable: true })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is HIDDEN in Solfège Split-Leaf', () => {
    renderGearPopover({ viewMode: 'solfege-split', originalScanAvailable: true })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is HIDDEN in unapproved Staff Split-Leaf (scan is already force-shown)', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: false,
      originalScanAvailable: true,
    })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('DISABLES Digital in approved Staff Split-Leaf when staff notation is unavailable', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: true,
      originalScanAvailable: true,
      staffAvailable: false,
    })
    const row = document.querySelector('[data-settings-sub="score-source"]')
    expect(row).not.toBeNull()
    const digital = screen.getByRole('radio', { name: 'Digital' })
    expect(digital.getAttribute('aria-disabled')).toBe('true')
  })
})
