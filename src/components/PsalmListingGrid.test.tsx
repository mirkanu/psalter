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
