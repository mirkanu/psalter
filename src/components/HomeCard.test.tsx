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

  it('renders children inside the same Card as the title (regression guard for the stretch bug)', () => {
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
    const card = container.querySelector('[data-slot="card"]')
    expect(card).not.toBeNull()
    expect(card?.textContent).toContain('Daily')
    expect(card?.querySelector('[data-testid="daily-child"]')).not.toBeNull()
  })

  it('renders exactly one Card element when children are provided', () => {
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
    expect(container.querySelectorAll('[data-slot="card"]').length).toBe(1)
  })

  it('does not nest an anchor inside another anchor when children contain their own link', () => {
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
    expect(container.querySelectorAll('a a').length).toBe(0)
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
