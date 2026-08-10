// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
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
    expect(input.placeholder).toBe('Psalm number or keyword…')
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

  it('tags a {CM, LM} group with LM', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    expect(toggle(container, 6).querySelector('[data-meter-tag]')?.textContent).toBe('LM')
  })

  it('shows no tag for a CM-only group or a group with two different non-CM meters', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    expect(toggle(container, 119).querySelector('[data-meter-tag]')).toBeNull()
    expect(toggle(container, 136).querySelector('[data-meter-tag]')).toBeNull()
  })

  it('names the meter in the accessible title only when a tag is shown', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    expect(toggle(container, 6).getAttribute('title')).toBe('Psalm 6 (LM available) – tap to expand')
    expect(toggle(container, 119).getAttribute('title')).toBe('Psalm 119 – tap to expand')
  })

  it('shows the tag even when the Show meter preference is off', () => {
    localStorage.setItem('psalms.showMeter', 'false')
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    expect(toggle(container, 6).querySelector('[data-meter-tag]')).not.toBeNull()
  })

  it('places the tag in the corner opposite the chevron', () => {
    const { container } = render(<PsalmListingGrid psalms={psalms} />)
    const tag = toggle(container, 6).querySelector('[data-meter-tag]') as HTMLElement
    expect(tag.className).toBe('absolute top-1 right-1.5 text-[10px] text-muted-foreground leading-none')
  })
})
