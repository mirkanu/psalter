// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TodayPsalmBadge } from './TodayPsalmBadge'
import type { DailyReadingWithPsalm } from '@/db/queries/daily'

afterEach(() => {
  cleanup()
})

const reading = {
  psalmId: 92,
  startingVerse: 9,
  endingVerse: 15,
  psalm: { id: 92 },
} as unknown as DailyReadingWithPsalm

describe('TodayPsalmBadge (quick task 260821-p2y)', () => {
  it('renders nothing when reading is null', () => {
    const { container } = render(<TodayPsalmBadge reading={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the formatted psalm reference as a non-link badge', () => {
    const { container } = render(<TodayPsalmBadge reading={reading} />)
    expect(container.textContent).toContain('Psalm 92:9-15')
    expect(container.querySelector('a')).toBeNull()
  })

  it('matches the ExploreHighlights pill font size (text-xs)', () => {
    const { container } = render(<TodayPsalmBadge reading={reading} />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-xs')
  })
})
