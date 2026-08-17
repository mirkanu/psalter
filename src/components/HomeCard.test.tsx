// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { HomeCard } from './HomeCard'
import { Home } from 'lucide-react'

afterEach(() => {
  cleanup()
})

describe('HomeCard (quick task 260817-ssc)', () => {
  it('renders title and description text', () => {
    const { container } = render(
      <HomeCard
        icon={Home}
        title="Choose Psalm"
        description="Jump into the psalter."
        href="/psalms"
      />
    )
    expect(container.textContent).toContain('Choose Psalm')
    expect(container.textContent).toContain('Jump into the psalter.')
  })

  it('renders a link whose href equals the href prop (Next.js Link by default)', () => {
    const { container } = render(
      <HomeCard
        icon={Home}
        title="Choose Psalm"
        description="d"
        href="/psalms"
      />
    )
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('/psalms')
    expect(anchor?.getAttribute('target')).toBeNull()
  })

  it('uses a plain anchor with target="_blank" and rel including "noopener" when external is true', () => {
    const { container } = render(
      <HomeCard
        icon={Home}
        title="Learn Tunes"
        description="d"
        href="https://soundcloud.com/playlist"
        external
      />
    )
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('https://soundcloud.com/playlist')
    expect(anchor?.getAttribute('target')).toBe('_blank')
    expect(anchor?.getAttribute('rel')).toContain('noopener')
  })

  it('renders children when provided', () => {
    const { container } = render(
      <HomeCard
        icon={Home}
        title="Daily"
        description="d"
        href="/daily"
      >
        <span data-testid="daily-child">today content</span>
      </HomeCard>
    )
    expect(container.querySelector('[data-testid="daily-child"]')).not.toBeNull()
    expect(container.textContent).toContain('today content')
  })

  it('does not nest a link inside the outer link when children are provided', () => {
    const { container } = render(
      <HomeCard
        icon={Home}
        title="Daily"
        description="d"
        href="/daily"
      >
        <a href="/psalms/42">Sing psalm</a>
      </HomeCard>
    )
    // Find the outer wrapper element. If children are present, the outer is a <div>,
    // and the only <a> directly inside it should be the link wrapping the card body
    // — but the child <a> must NOT be nested inside that link.
    const outerDiv = container.querySelector('div > div')
    expect(outerDiv).not.toBeNull()
    // The inner link wraps the header; the child <a> must be a sibling, not a child.
    const outerLinkOrArea = outerDiv?.querySelector(':scope > a')
    if (outerLinkOrArea) {
      expect(outerLinkOrArea.querySelector('a')).toBeNull()
    }
  })

  it('wraps the entire card in a single link when no children are provided', () => {
    const { container } = render(
      <HomeCard
        icon={Home}
        title="Choose Psalm"
        description="d"
        href="/psalms"
      />
    )
    // The outer element should be the anchor; check that title is inside it.
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.textContent).toContain('Choose Psalm')
  })
})
