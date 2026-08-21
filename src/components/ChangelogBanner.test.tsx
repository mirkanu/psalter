// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ChangelogBanner } from './ChangelogBanner'

afterEach(() => {
  cleanup()
})

describe('ChangelogBanner (quick task 260821-p2y)', () => {
  it('renders nothing when post is null', () => {
    const { container } = render(<ChangelogBanner post={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the post title, mentions "changelog", and links to /changelog exactly once', () => {
    const post = {
      id: 1,
      title: 'New tune list',
      body: 'x',
      createdAt: new Date('2026-08-02T10:00:00.000Z'),
    }
    const { container } = render(<ChangelogBanner post={post} />)
    expect(container.textContent).toContain('New tune list')
    expect(container.textContent?.toLowerCase()).toContain('changelog')
    const anchors = container.querySelectorAll('a')
    expect(anchors.length).toBe(1)
    expect(anchors[0].getAttribute('href')).toBe('/changelog')
  })

  it('has no bg-muted class anywhere (stays a light inline banner)', () => {
    const post = {
      id: 1,
      title: 'New tune list',
      body: 'x',
      createdAt: new Date('2026-08-02T10:00:00.000Z'),
    }
    const { container } = render(<ChangelogBanner post={post} />)
    expect(container.querySelector('.bg-muted')).toBeNull()
  })
})
