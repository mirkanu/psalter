// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ExploreHighlights } from './ExploreHighlights'

afterEach(() => {
  cleanup()
})

describe('ExploreHighlights (quick task 260821-p2y)', () => {
  it('renders exactly 4 anchors', () => {
    const { container } = render(<ExploreHighlights />)
    expect(container.querySelectorAll('a').length).toBe(4)
  })

  it('renders the exact four highlight hrefs', () => {
    const { container } = render(<ExploreHighlights />)
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    )
    expect(new Set(hrefs)).toEqual(
      new Set([
        '/explore?tab=themes&sub=mood',
        '/explore?tab=themes&sub=main-topic',
        '/explore?tab=other-topics',
        '/explore/messianic',
      ])
    )
  })

  it('contains the four highlight labels', () => {
    const { container } = render(<ExploreHighlights />)
    expect(container.textContent).toContain('Mood')
    expect(container.textContent).toContain('Topic')
    expect(container.textContent).toContain("Nave's")
    expect(container.textContent).toContain('Messianic')
  })
})
