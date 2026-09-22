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

// 2026-09-05: The "Score: Digital | Original scan" sub-toggle is HIDDEN in the
// gear menu because Staff split-leaf now ALWAYS renders the scanned JPG
// (forceStaffJpgFallback in NotationRenderer.tsx). The JSX block and its
// showScoreSourceRow derivation are preserved (gated on `false &&`) for
// future re-activation — see [[project-staff-split-leaf-disabled]]. Tests
// below verify the row is currently NOT rendered in any configuration that
// previously would have shown it.
describe('GearPopover — Score: Digital / Original scan row (hidden 2026-09-05)', () => {
  it('is hidden in APPROVED Staff Split-Leaf even when a scan exists', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: true,
      originalScanAvailable: true,
    })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is hidden in INLINE Staff layout', () => {
    renderGearPopover({
      viewMode: 'staff',
      staffInlineApproved: true,
      originalScanAvailable: true,
    })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is hidden when originalScanAvailable is false', () => {
    renderGearPopover({ originalScanAvailable: false })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is hidden in Lyrics Only view mode', () => {
    renderGearPopover({ viewMode: 'lyrics', originalScanAvailable: true })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is hidden in Solfège Split-Leaf', () => {
    renderGearPopover({ viewMode: 'solfege-split', originalScanAvailable: true })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is hidden in unapproved Staff Split-Leaf', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: false,
      originalScanAvailable: true,
    })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('does not render the Digital or Original scan radio buttons', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: true,
      originalScanAvailable: true,
    })
    expect(screen.queryByRole('radio', { name: 'Digital' })).toBeNull()
    expect(screen.queryByRole('radio', { name: 'Original scan' })).toBeNull()
  })
})
