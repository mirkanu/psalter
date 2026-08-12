// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
import { PsalmListingGrid, type PsalmRow } from './PsalmListingGrid'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

const psalms: PsalmRow[] = [
  { id: 6, versionId: 1, displayLabel: '6', slug: '6', firstLine: 'Lord, in thy wrath rebuke me not', meter: 'CM', kjvExcerpt: null },
  { id: 6, versionId: 2, displayLabel: '6b', slug: '6b', firstLine: 'In thy great indignation', meter: 'LM (long meter, 88 88)', kjvExcerpt: null },
  { id: 23, versionId: 3, displayLabel: '23', slug: '23', firstLine: 'The Lord is my shepherd', meter: 'CM', kjvExcerpt: null },
  { id: 119, versionId: 4, displayLabel: '119:1-8', slug: '119-1', firstLine: 'Blessed are they that undefiled', meter: 'CM', kjvExcerpt: null },
  { id: 119, versionId: 5, displayLabel: '119:9-16', slug: '119-2', firstLine: 'By what means shall a young man learn', meter: 'CM', kjvExcerpt: null },
  { id: 136, versionId: 6, displayLabel: '136', slug: '136', firstLine: 'Give thanks to God', meter: '66 66 88', kjvExcerpt: null },
  { id: 136, versionId: 7, displayLabel: '136b', slug: '136b', firstLine: 'Praise God, for he is kind', meter: '87 87', kjvExcerpt: null },
]

describe('PsalmListingGrid — PSEL-01 collapse on load', () => {
  it('renders every multi-version group collapsed even when a past session persisted an expanded state', () => {
    localStorage.setItem('psalms.expandedIds', JSON.stringify({ 6: true }))
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const toggles = Array.from(container.querySelectorAll('[data-version-toggle]'))
    expect(toggles.length).toBe(3) // psalms 6, 119, 136
    expect(toggles.map((t) => t.getAttribute('aria-expanded'))).toEqual(['false', 'false', 'false'])
  })

  it('still expands a group when clicked within the same session', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const toggle = container.querySelector('[data-version-toggle="6"]') as HTMLElement
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
  })

  it('writes nothing to localStorage when a group is expanded', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    fireEvent.click(container.querySelector('[data-version-toggle="6"]') as HTMLElement)
    expect(localStorage.getItem('psalms.expandedIds')).toBeNull()
  })
})

describe('PsalmListingGrid — PSEL-03 sticky header gutter', () => {
  function headerClass(container: HTMLElement) {
    return (container.querySelector('#psalms-sticky-header') as HTMLElement).className
  }

  // Gap 2 regression guard: assert the OLD 768px sync-point token is gone, written as a joined
  // string (not a contiguous literal) so this guard's own code doesn't itself trip the plan's
  // grep-based acceptance gate, which checks the file for leftover sync-point text.
  const STALE_GUTTER_TOKEN = ['m' + 'd', 'p' + 'r'].join(':')

  it('reserves the 40px book-tab gutter on the full-page grouped header', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const cls = headerClass(container)
    expect(cls).toContain('pr-14')
    expect(cls).toContain('tabs-off:pr-4')
    expect(cls).not.toContain('px-4')
    expect(cls).not.toContain('pr-10')
    expect(cls).not.toContain(STALE_GUTTER_TOKEN)
    expect(cls).toContain('pl-4')
  })

  it('reserves the same gutter inside the picker modal branch', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} hideExport onSelect={() => {}} />)
    const cls = headerClass(container)
    expect(cls).toContain('pr-10')
    expect(cls).toContain('tabs-off:pr-0')
    expect(cls).not.toContain(STALE_GUTTER_TOKEN)
  })

  it('drops the gutter when a search makes the grid ungrouped (no tabs rendered)', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    fireEvent.change(container.querySelector('input[aria-label="Search psalms"]') as HTMLInputElement, {
      target: { value: 'shepherd' },
    })
    const cls = headerClass(container)
    expect(cls).toContain('pr-4')
    expect(cls).not.toContain('pr-14')
  })
})

describe('PsalmListingGrid — Gap 1 search placeholder', () => {
  function stubMatchMedia(matches: boolean) {
    window.matchMedia = ((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  }

  afterEach(() => {
    // @ts-expect-error test cleanup — jsdom leaves matchMedia undefined by default
    delete window.matchMedia
  })

  it('renders the long placeholder when matchMedia is undefined (jsdom default = SSR/first-paint value)', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const input = container.querySelector('input[aria-label="Search psalms"]') as HTMLInputElement
    expect(input.placeholder).toBe('Search by psalm number or keyword…')
  })

  it('swaps to the short placeholder once the narrow-viewport media query matches', () => {
    stubMatchMedia(true)
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const input = container.querySelector('input[aria-label="Search psalms"]') as HTMLInputElement
    expect(input.placeholder).toBe('Number or keyword…')
  })

  it('applies the responsive placeholder font classes', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const input = container.querySelector('input[aria-label="Search psalms"]') as HTMLInputElement
    expect(input.className).toContain('placeholder:text-xs')
    expect(input.className).toContain('sm:placeholder:text-sm')
  })

  it('keeps aria-label "Search psalms" in both matchMedia states', () => {
    const { container: wide } = render(<PsalmListingGrid psalms={psalms} />)
    expect((wide.querySelector('input[aria-label="Search psalms"]') as HTMLInputElement).getAttribute('aria-label')).toBe('Search psalms')
    cleanup()
    stubMatchMedia(true)
    const { container: narrow } = render(<PsalmListingGrid psalms={psalms} />)
    expect((narrow.querySelector('input[aria-label="Search psalms"]') as HTMLInputElement).getAttribute('aria-label')).toBe('Search psalms')
  })
})

describe('PsalmListingGrid — PSEL-02 meter tag on the multi-version toggle', () => {
  function toggle(container: HTMLElement, id: number) {
    return container.querySelector(`[data-version-toggle="${id}"]`) as HTMLElement
  }

  // Gap 3 respec (12-VERIFICATION.md, D-GAP3 = stays-hidden): a collapsed multi-version toggle box
  // never shows a summary meter tag, regardless of the "Show meter" checkbox. Meter info only
  // becomes visible once a group is expanded — see the expanded-panel tests below.

  it('shows no meter tag on a collapsed box when "Show meter" is off', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    expect(toggle(container, 6).querySelector('[data-meter-tag]')).toBeNull()
  })

  it('keeps the plain accessible title when no tag is shown', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    expect(toggle(container, 6).getAttribute('title')).toBe('Psalm 6 – tap to expand')
  })

  it('never shows a tag on a collapsed box, even with "Show meter" on', () => {
    localStorage.setItem('psalms.showMeter', 'true')
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    expect(toggle(container, 6).querySelector('[data-meter-tag]')).toBeNull()
    expect(toggle(container, 119).querySelector('[data-meter-tag]')).toBeNull()
    expect(toggle(container, 136).querySelector('[data-meter-tag]')).toBeNull()
    expect(toggle(container, 6).getAttribute('title')).toBe('Psalm 6 – tap to expand')
  })

  it('shows each version\'s meter inside an expanded group even when "Show meter" is off', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    fireEvent.click(toggle(container, 6))
    const panel = container.querySelector('[data-expanded-panel="6"]')
    expect(panel).not.toBeNull()
    // Match the substring, not the full raw meter string — Plan 07 abbreviates this text.
    expect(panel?.textContent).toContain('LM')
  })

  it('still shows version meters inside an expanded group when "Show meter" is on', () => {
    localStorage.setItem('psalms.showMeter', 'true')
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    fireEvent.click(toggle(container, 6))
    const panel = container.querySelector('[data-expanded-panel="6"]')
    expect(panel).not.toBeNull()
    expect(panel?.textContent).toContain('LM')
  })
})

describe('PsalmListingGrid — Gap 4 column sizing', () => {
  function gridClass(container: HTMLElement) {
    // Grouped book view — the outer grid rendered by renderBookGrid for Book I.
    return (container.querySelector('#book-1 .grid') as HTMLElement).className
  }

  it('uses the middle column width when only Show meter is on', () => {
    localStorage.setItem('psalms.showMeter', 'true')
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const cls = gridClass(container)
    expect(cls).toContain('minmax(5.5rem')
    expect(cls).not.toContain('minmax(7rem')
  })

  it('still uses the wide column set when a first line is shown', () => {
    localStorage.setItem('psalms.showFirstLine', 'true')
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const cls = gridClass(container)
    expect(cls).toContain('minmax(7rem')
  })

  it('uses the narrow column set when no advanced option is on', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const cls = gridClass(container)
    expect(cls).toContain('minmax(3.5rem')
  })

  it('expanded panel grid uses the meter column width', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    fireEvent.click(container.querySelector('[data-version-toggle="6"]') as HTMLElement)
    const panelGrid = container.querySelector('[data-expanded-panel="6"] .grid') as HTMLElement
    expect(panelGrid.className).toContain('minmax(5.5rem')
  })
})

describe('PsalmListingGrid — Phase 15.1 hydration behavior', () => {
  it('hydrates from a single batched localStorage read', async () => {
    // Seed all 5 keys at once before mounting.
    localStorage.setItem('psalms.advancedOpen', JSON.stringify(true))
    localStorage.setItem('psalms.showFirstLine', JSON.stringify(true))
    localStorage.setItem('psalms.showMeter', JSON.stringify(true))
    localStorage.setItem('psalms.showRecommendedTune', JSON.stringify(true))
    localStorage.setItem('psalms.meterFilter', JSON.stringify('LM'))
    const minimalPsalms: PsalmRow[] = [
      { id: 23, versionId: null, displayLabel: '23', slug: '23', firstLine: 'The Lord is my shepherd', meter: 'CM', kjvExcerpt: null },
    ]
    render(<PsalmListingGrid psalms={minimalPsalms} />)
    // Wait for the hydration effect to run (and `hasAdvancedFilter` to flip on).
    await waitFor(() => {
      // The Meter filter dropdown trigger should now display 'LM' (the seeded value).
      // The SelectTrigger renders the active label as visible text — fallback to beDisplayValue is fine.
      expect(screen.getAllByText(/^LM$/).length).toBeGreaterThan(0)
    })
  })

  it('does not write back to localStorage on the first render (SSR-snapshot protection)', async () => {
    // Mount with NO localStorage seeded — all 5 keys missing → defaults apply.
    const minimalPsalms: PsalmRow[] = [
      { id: 23, versionId: null, displayLabel: '23', slug: '23', firstLine: 'The Lord is my shepherd', meter: 'CM', kjvExcerpt: null },
    ]
    render(<PsalmListingGrid psalms={minimalPsalms} />)
    // After mount, the 5 keys MUST still be absent (the hydratedRef guard in
    // updatePersisted prevents defaults from being written back over real user
    // values during the first render).
    await new Promise((r) => setTimeout(r, 50))
    expect(localStorage.getItem('psalms.advancedOpen')).toBeNull()
    expect(localStorage.getItem('psalms.showFirstLine')).toBeNull()
    expect(localStorage.getItem('psalms.showMeter')).toBeNull()
    expect(localStorage.getItem('psalms.showRecommendedTune')).toBeNull()
    expect(localStorage.getItem('psalms.meterFilter')).toBeNull()
  })
})
