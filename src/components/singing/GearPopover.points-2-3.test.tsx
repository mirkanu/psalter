// @vitest-environment jsdom
// Issue #59 — points 2 and 3.
//
// Point 2: The Notation / Layout sub-toggle buttons should use the original
// black/white 'selected' colour, NOT the new orange 'bg-primary'. The top-level
// Music Notes / Lyrics Only toggle stays orange.
//
// Point 3: When Lyrics Only is selected, the Notation and Layout sub-toggles
// must remain visible AND clickable. Tapping Staff / Solfege / Inline /
// Split-Leaf from Lyrics Only should call onViewModeChange with the
// appropriate Music Notes view (using the last-stored layout / notation
// family from localStorage as the default for the unset axis).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { GearPopover } from './GearPopover'
import type { ViewMode } from '@/components/notation/NotationRenderer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  try { localStorage.clear() } catch { /* ignore */ }
})

interface RenderOverrides {
  viewMode?: ViewMode
  staffAvailable?: boolean
  solfegeSplitAvailable?: boolean
  staffInlineApproved?: boolean
  hasActiveTune?: boolean
}

function renderGearPopover(overrides: RenderOverrides = {}) {
  const defaultProps: React.ComponentProps<typeof GearPopover> = {
    open: true,
    onOpenChange: vi.fn(),
    viewMode: overrides.viewMode ?? 'staff-split',
    onViewModeChange: vi.fn(),
    studyHref: '/study',
    onRestartTour: vi.fn(),
    showLyricsOption: true,
    staffAvailable: overrides.staffAvailable ?? true,
    solfegeInlineAvailable: false,
    solfegeSplitAvailable: overrides.solfegeSplitAvailable ?? true,
    staffInlineApproved: overrides.staffInlineApproved ?? true,
    hasActiveTune: overrides.hasActiveTune ?? true,
    onRequestTuneSelection: vi.fn(),
    originalScanAvailable: true,
    showOriginal: false,
    onShowOriginalChange: vi.fn(),
  }
  return render(<GearPopover {...defaultProps} />)
}

// --- Point 2: sub-toggles are black/white, main toggle stays orange ---

describe('GearPopover — issue #59 point 2 (sub-toggle colour)', () => {
  it('renders the Notation sub-toggle buttons with the black/white selected colour, not orange', () => {
    renderGearPopover()
    const staff = screen.getByRole('radio', { name: 'Staff' })
    expect(staff.className).toContain('bg-foreground')
    expect(staff.className).not.toContain('bg-primary')
    expect(staff.className).toContain('text-background')
  })

  it('renders the Layout sub-toggle buttons with the black/white selected colour, not orange', () => {
    renderGearPopover()
    const split = screen.getByRole('radio', { name: 'Split-Leaf' })
    expect(split.className).toContain('bg-foreground')
    expect(split.className).not.toContain('bg-primary')
    expect(split.className).toContain('text-background')
  })

  it('keeps the top-level Music Notes / Lyrics Only toggle ORANGE (bg-primary)', () => {
    renderGearPopover()
    const musicNotes = screen.getByRole('radio', { name: 'Music Notes' })
    expect(musicNotes.className).toContain('bg-primary')
  })

  it('keeps the top-level Lyrics Only toggle ORANGE when lyrics is active', () => {
    renderGearPopover({ viewMode: 'lyrics' })
    const lyricsOnly = screen.getByRole('radio', { name: 'Lyrics Only' })
    expect(lyricsOnly.className).toContain('bg-primary')
  })
})

// --- Point 3: sub-toggles visible and clickable from Lyrics Only ---

describe('GearPopover — issue #59 point 3 (sub-toggles from Lyrics Only)', () => {
  it('still renders the Notation sub-toggle when viewMode is lyrics', () => {
    renderGearPopover({ viewMode: 'lyrics' })
    expect(screen.getByRole('radio', { name: 'Staff' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Solfege' })).toBeTruthy()
  })

  it('still renders the Layout sub-toggle when viewMode is lyrics', () => {
    renderGearPopover({ viewMode: 'lyrics' })
    expect(screen.getByRole('radio', { name: 'Inline' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Split-Leaf' })).toBeTruthy()
  })

  it('clicking Staff from Lyrics Only switches to staff (with default-split layout)', () => {
    try { localStorage.setItem('psalter-score-mode-last-music', 'staff-split') } catch {}
    const onViewModeChange = vi.fn()
    const props: React.ComponentProps<typeof GearPopover> = {
      open: true,
      onOpenChange: vi.fn(),
      viewMode: 'lyrics',
      onViewModeChange,
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
    render(<GearPopover {...props} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Staff' }))
    expect(onViewModeChange).toHaveBeenCalledTimes(1)
    expect(onViewModeChange).toHaveBeenCalledWith('staff-split')
  })

  it('clicking Solfege from Lyrics Only switches to solfege-split (with default-split layout)', () => {
    try { localStorage.setItem('psalter-score-mode-last-music', 'staff-split') } catch {}
    const onViewModeChange = vi.fn()
    const props: React.ComponentProps<typeof GearPopover> = {
      open: true,
      onOpenChange: vi.fn(),
      viewMode: 'lyrics',
      onViewModeChange,
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
    render(<GearPopover {...props} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Solfege' }))
    expect(onViewModeChange).toHaveBeenCalledTimes(1)
    expect(onViewModeChange).toHaveBeenCalledWith('solfege-split')
  })

  it('clicking Staff from Lyrics Only when last layout was Inline switches to staff (inline)', () => {
    try { localStorage.setItem('psalter-score-mode-last-music', 'staff') } catch {}
    const onViewModeChange = vi.fn()
    const props: React.ComponentProps<typeof GearPopover> = {
      open: true,
      onOpenChange: vi.fn(),
      viewMode: 'lyrics',
      onViewModeChange,
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
    render(<GearPopover {...props} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Staff' }))
    expect(onViewModeChange).toHaveBeenCalledWith('staff')
  })

  it('clicking Split-Leaf from Lyrics Only switches to staff-split (using last notation = staff)', () => {
    try { localStorage.setItem('psalter-score-mode-last-music', 'staff') } catch {}
    try { localStorage.setItem('psalter-score-mode', 'staff') } catch {}
    const onViewModeChange = vi.fn()
    const props: React.ComponentProps<typeof GearPopover> = {
      open: true,
      onOpenChange: vi.fn(),
      viewMode: 'lyrics',
      onViewModeChange,
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
    render(<GearPopover {...props} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Split-Leaf' }))
    expect(onViewModeChange).toHaveBeenCalledTimes(1)
    expect(onViewModeChange).toHaveBeenCalledWith('staff-split')
  })

  it('clicking Inline from Lyrics Only switches to staff (approved)', () => {
    try { localStorage.setItem('psalter-score-mode-last-music', 'staff') } catch {}
    try { localStorage.setItem('psalter-score-mode', 'staff') } catch {}
    const onViewModeChange = vi.fn()
    const props: React.ComponentProps<typeof GearPopover> = {
      open: true,
      onOpenChange: vi.fn(),
      viewMode: 'lyrics',
      onViewModeChange,
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
    render(<GearPopover {...props} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Inline' }))
    expect(onViewModeChange).toHaveBeenCalledTimes(1)
    expect(onViewModeChange).toHaveBeenCalledWith('staff')
  })

  it('clicking Staff from Lyrics Only honours staffAvailable=false by NOT calling onViewModeChange', () => {
    const onViewModeChange = vi.fn()
    const props: React.ComponentProps<typeof GearPopover> = {
      open: true,
      onOpenChange: vi.fn(),
      viewMode: 'lyrics',
      onViewModeChange,
      studyHref: '/study',
      onRestartTour: vi.fn(),
      showLyricsOption: true,
      staffAvailable: false,
      solfegeInlineAvailable: false,
      solfegeSplitAvailable: true,
      staffInlineApproved: true,
      hasActiveTune: true,
      onRequestTuneSelection: vi.fn(),
      originalScanAvailable: true,
      showOriginal: false,
      onShowOriginalChange: vi.fn(),
    }
    render(<GearPopover {...props} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Staff' }))
    expect(onViewModeChange).not.toHaveBeenCalled()
  })
})

describe('GearPopover — Inline button gating from Lyrics Only (regression for ps105 false-disable)', () => {
  // Regression: while Lyrics Only was active, the Inline layout button was
  // fully greyed-out and warned "not available for this tune" even when the
  // tune DID have approved inline staff (e.g. Ps 105). The disabled gate was
  // reading the live viewMode (which is 'lyrics' in this case), not the
  // effective notation family the sub-toggle handler would use. The disabled
  // state must follow the effective (remembered) notation, not the live one.

  beforeEach(() => {
    localStorage.clear()
  })

  it('Inline is NOT disabled in Lyrics Only when last notation=staff and staffInlineApproved=true', () => {
    localStorage.setItem('psalter-score-mode-last-music', 'staff')
    localStorage.setItem('psalter-score-mode', 'staff')
    renderGearPopover({ viewMode: 'lyrics', staffInlineApproved: true })
    const inline = screen.getByRole('radio', { name: 'Inline' })
    expect(inline.getAttribute('aria-disabled')).not.toBe('true')
    expect(inline.className).not.toContain('cursor-not-allowed')
  })

  it('Inline IS disabled in Lyrics Only when last notation=staff and staffInlineApproved=false', () => {
    localStorage.setItem('psalter-score-mode-last-music', 'staff')
    localStorage.setItem('psalter-score-mode', 'staff')
    renderGearPopover({ viewMode: 'lyrics', staffInlineApproved: false })
    const inline = screen.getByRole('radio', { name: 'Inline' })
    expect(inline.getAttribute('aria-disabled')).toBe('true')
    expect(inline.className).toContain('cursor-not-allowed')
    expect(inline.getAttribute('title')).toMatch(/approved/i)
  })

  it('Inline IS disabled in Lyrics Only when last notation=solfege and solfegeInlineAvailable=false', () => {
    localStorage.setItem('psalter-score-mode-last-music', 'solfege')
    localStorage.setItem('psalter-score-mode', 'solfege')
    renderGearPopover({
      viewMode: 'lyrics',
      staffInlineApproved: false,
      solfegeInlineAvailable: false,
    })
    const inline = screen.getByRole('radio', { name: 'Inline' })
    expect(inline.getAttribute('aria-disabled')).toBe('true')
    expect(inline.getAttribute('title')).toMatch(/coming soon/i)
  })

  it('clicking disabled Inline from Lyrics Only (staff not approved) does NOT change viewMode', () => {
    localStorage.setItem('psalter-score-mode-last-music', 'staff')
    localStorage.setItem('psalter-score-mode', 'staff')
    const onViewModeChange = vi.fn()
    renderGearPopover({
      viewMode: 'lyrics',
      staffInlineApproved: false,
      onViewModeChange,
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Inline' }))
    expect(onViewModeChange).not.toHaveBeenCalled()
  })
})

describe('Music Notes tab panel association (WAI-ARIA tabs pattern)', () => {
  it('Music Notes button has id + aria-controls pointing at the Notation/Layout panel', () => {
    renderGearPopover({ viewMode: 'music' })
    const tab = screen.getByRole('radio', { name: 'Music Notes' })
    expect(tab.getAttribute('id')).toBe('settings-tab-music-notes')
    expect(tab.getAttribute('aria-controls')).toBe('settings-panel-music-notes')
  })

  it('Lyrics Only button has its own id (not yet a panel — nothing to control)', () => {
    renderGearPopover({ viewMode: 'lyrics' })
    const tab = screen.getByRole('radio', { name: 'Lyrics Only' })
    expect(tab.getAttribute('id')).toBe('settings-tab-lyrics-only')
    expect(tab.getAttribute('aria-controls')).toBeNull()
  })

  it('Notation + Layout rows sit inside a region labelled by Music Notes', () => {
    renderGearPopover({ viewMode: 'music' })
    const panel = document.getElementById('settings-panel-music-notes')
    expect(panel).not.toBeNull()
    expect(panel!.tagName).toBe('DIV')
    expect(panel!.getAttribute('role')).toBe('region')
    expect(panel!.getAttribute('aria-labelledby')).toBe('settings-tab-music-notes')
    expect(panel!.querySelector('[data-settings-sub="notation"]')).not.toBeNull()
    expect(panel!.querySelector('[data-settings-sub="layout"]')).not.toBeNull()
  })
})
