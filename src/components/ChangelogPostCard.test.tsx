// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ChangelogPostCard } from './ChangelogPostCard'
import type { ChangelogPost } from '@/db/queries/changelog'

const POST: ChangelogPost = {
  id: 1,
  title: 'New tune list',
  body: 'Line one\nLine two',
  createdAt: new Date('2026-08-02T10:00:00.000Z'),
}

describe('ChangelogPostCard', () => {
  it('renders the post title text', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    expect(container.textContent).toContain('New tune list')
  })

  it('renders a <time> element with ISO dateTime and d MMMM yyyy text', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    const time = container.querySelector('time')
    expect(time).not.toBeNull()
    expect(time?.getAttribute('dateTime')).toBe(POST.createdAt.toISOString())
    expect(time?.textContent).toBe('2 August 2026')
  })

  it('renders the body with a whitespace-pre-wrap class so line breaks survive', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    const body = container.querySelector('.whitespace-pre-wrap')
    expect(body).not.toBeNull()
    expect(body?.textContent).toBe('Line one\nLine two')
  })

  it('does not carry the border-l-primary accent stripe', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    const card = container.querySelector('[data-changelog-post]')
    expect(card?.className ?? '').not.toContain('border-l-primary')
  })
})
