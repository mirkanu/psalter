// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { PsalmRow } from '@/components/PsalmListingGrid'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock, refresh: vi.fn() }) }))

vi.mock('@/components/PsalmPickerModalClient', () => ({
  PsalmPickerModalClient: (props: {
    open: boolean
    psalms: PsalmRow[]
    onSelect?: (psalm: PsalmRow) => void
  }) => {
    if (!props.open) return null
    return (
      <div data-testid="mock-psalm-picker">
        {props.psalms.map((p) => (
          <button key={p.id} onClick={() => props.onSelect?.(p)}>
            {p.displayLabel}
          </button>
        ))}
      </div>
    )
  },
}))

import { PsalmNav } from './PsalmNav'

const samplePsalms: PsalmRow[] = [
  {
    id: 45,
    versionId: 1,
    displayLabel: '45',
    slug: '45',
    firstLine: null,
    meter: null,
    kjvExcerpt: null,
  },
]

beforeEach(() => {
  pushMock.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('PsalmNav', () => {
  it('defaults to /psalms/{slug} (no suffix) for both prev and next hrefs', () => {
    render(<PsalmNav prev="22" next="24" />)
    for (const link of screen.getAllByRole('link', { name: /Previous psalm/ })) {
      expect(link.getAttribute('href')).toBe('/psalms/22')
    }
    for (const link of screen.getAllByRole('link', { name: /Next psalm/ })) {
      expect(link.getAttribute('href')).toBe('/psalms/24')
    }
  })

  it('applies suffix to BOTH mobile and desktop prev/next hrefs', () => {
    const { container } = render(<PsalmNav prev="22" next="24" suffix="/study" />)
    const prevLinks = container.querySelectorAll('a[rel="prev"]')
    const nextLinks = container.querySelectorAll('a[rel="next"]')
    expect(prevLinks.length).toBe(2)
    expect(nextLinks.length).toBe(2)
    prevLinks.forEach((link) => expect(link.getAttribute('href')).toBe('/psalms/22/study'))
    nextLinks.forEach((link) => expect(link.getAttribute('href')).toBe('/psalms/24/study'))
  })

  it('ArrowLeft pushes to the suffixed prev destination', () => {
    render(<PsalmNav prev="22" next="24" suffix="/study" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(pushMock).toHaveBeenCalledWith('/psalms/22/study')
  })

  it('ArrowRight pushes to the suffixed next destination', () => {
    render(<PsalmNav prev="22" next="24" suffix="/study" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(pushMock).toHaveBeenCalledWith('/psalms/24/study')
  })

  it('keyboard handler no-ops when a modifier key is held', () => {
    render(<PsalmNav prev="22" next="24" suffix="/study" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft', metaKey: true })
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('renders no prev link and does not push when prev is null', () => {
    const { container } = render(<PsalmNav prev={null} next="24" suffix="/study" />)
    expect(container.querySelectorAll('a[rel="prev"]').length).toBe(0)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('with no psalms prop, the list control is the legacy Link to /psalms (no dialog)', () => {
    render(<PsalmNav prev="22" next="24" suffix="/study" />)
    const listLink = screen.getByRole('link', { name: 'All psalms' })
    expect(listLink.getAttribute('href')).toBe('/psalms')
    expect(screen.queryByTestId('mock-psalm-picker')).toBeNull()
  })

  it('with psalms provided, the list control is a button that opens the picker dialog', () => {
    render(<PsalmNav prev="22" next="24" suffix="/study" psalms={samplePsalms} />)
    expect(screen.queryByRole('link', { name: 'All psalms' })).toBeNull()
    const listButton = screen.getByRole('button', { name: 'All psalms' })
    expect(screen.queryByTestId('mock-psalm-picker')).toBeNull()
    fireEvent.click(listButton)
    expect(screen.getByTestId('mock-psalm-picker')).toBeTruthy()
  })

  it('selecting a psalm with suffix="/study" pushes /psalms/{slug}/study', () => {
    render(<PsalmNav prev="22" next="24" suffix="/study" psalms={samplePsalms} />)
    fireEvent.click(screen.getByRole('button', { name: 'All psalms' }))
    fireEvent.click(screen.getByText('45'))
    expect(pushMock).toHaveBeenCalledWith('/psalms/45/study')
  })

  it('selecting a psalm with no suffix pushes /psalms/{slug}', () => {
    render(<PsalmNav prev="22" next="24" psalms={samplePsalms} />)
    fireEvent.click(screen.getByRole('button', { name: 'All psalms' }))
    fireEvent.click(screen.getByText('45'))
    expect(pushMock).toHaveBeenCalledWith('/psalms/45')
  })
})
