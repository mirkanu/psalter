// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock, refresh: vi.fn() }) }))

import { PsalmNav } from './PsalmNav'

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
})
