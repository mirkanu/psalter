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

  it('renders the formatted psalm reference as a link to /psalms/{id}', () => {
    const { container } = render(<TodayPsalmBadge reading={reading} />)
    expect(container.textContent).toContain('Psalm 92:9-15')
    const anchor = container.querySelector('a')
    expect(anchor).not.toBeNull()
    expect(anchor?.getAttribute('href')).toBe('/psalms/92')
  })

  it('matches the ExploreHighlights pill font size (text-xs) and border chrome', () => {
    const { container } = render(<TodayPsalmBadge reading={reading} />)
    const anchor = container.querySelector('a')
    expect(anchor?.className).toContain('text-xs')
    expect(anchor?.className).toContain('rounded-md')
    expect(anchor?.className).toContain('border')
  })
})
