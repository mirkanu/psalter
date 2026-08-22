// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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
    viewMode: 'staff' as ViewMode,
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

describe('GearPopover — Score: Digital / Original scan row (quick 260822-di9)', () => {
  it('shows the Score row with two radios when staff is rendering digitally and a scan exists', () => {
    renderGearPopover({ viewMode: 'staff', originalScanAvailable: true, showOriginal: false })
    const group = document.querySelector('[data-settings-sub="score-source"]')
    expect(group).toBeTruthy()
    const digital = screen.getByRole('radio', { name: 'Digital' })
    const original = screen.getByRole('radio', { name: 'Original scan' })
    expect(digital.getAttribute('aria-checked')).toBe('true')
    expect(original.getAttribute('aria-checked')).toBe('false')
  })

  it('clicking Original scan calls onShowOriginalChange(true) exactly once', () => {
    const onShowOriginalChange = vi.fn()
    renderGearPopover({ showOriginal: false, onShowOriginalChange })
    fireEvent.click(screen.getByRole('radio', { name: 'Original scan' }))
    expect(onShowOriginalChange).toHaveBeenCalledTimes(1)
    expect(onShowOriginalChange).toHaveBeenCalledWith(true)
  })

  it('clicking Digital while showOriginal is true calls onShowOriginalChange(false)', () => {
    const onShowOriginalChange = vi.fn()
    renderGearPopover({ showOriginal: true, onShowOriginalChange })
    fireEvent.click(screen.getByRole('radio', { name: 'Digital' }))
    expect(onShowOriginalChange).toHaveBeenCalledTimes(1)
    expect(onShowOriginalChange).toHaveBeenCalledWith(false)
  })

  it('is absent when originalScanAvailable is false', () => {
    renderGearPopover({ originalScanAvailable: false })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is absent in Lyrics Only view mode', () => {
    renderGearPopover({ viewMode: 'lyrics', originalScanAvailable: true })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is absent in Solfège Split-Leaf (the scan IS the render there)', () => {
    renderGearPopover({ viewMode: 'solfege-split', originalScanAvailable: true })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is absent in unapproved Staff Split-Leaf (scan already force-shown)', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: false,
      originalScanAvailable: true,
    })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeNull()
  })

  it('is present in APPROVED Staff Split-Leaf when a scan exists', () => {
    renderGearPopover({
      viewMode: 'staff-split',
      staffInlineApproved: true,
      originalScanAvailable: true,
    })
    expect(document.querySelector('[data-settings-sub="score-source"]')).toBeTruthy()
  })
})
