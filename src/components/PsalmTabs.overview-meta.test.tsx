// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { OverviewContent } from './PsalmTabs'
import type { PsalmDetail } from '@/db/queries/psalms'

afterEach(() => {
  cleanup()
})

function makePsalm(
  overrides: Partial<{
    book: string | null
    author: string | null
    occasion: string | null
    nkjvTitle: string | null
  }> = {},
): PsalmDetail {
  return {
    id: 122,
    book: 'Book V (107-150)',
    author: 'David',
    occasion: null,
    nkjvTitle: null,
    sectionHeadings: [],
    psalmTopics: [],
    ...overrides,
  } as unknown as PsalmDetail
}

function renderOverview(psalm: PsalmDetail) {
  return render(
    <OverviewContent
      psalm={psalm}
      primaryTune={null}
      primaryVersion={null}
      topicSlugMap={{}}
    />,
  )
}

describe('OverviewContent Suggested Title (NKJV) row', () => {
  it('renders the label and value when nkjvTitle is populated', () => {
    const psalm = makePsalm({ nkjvTitle: 'The Joy of Going to the House of the Lord' })
    renderOverview(psalm)
    expect(screen.getByText('Suggested Title (NKJV):')).toBeTruthy()
    expect(screen.getByText('The Joy of Going to the House of the Lord')).toBeTruthy()
  })

  it('omits the row when nkjvTitle is null', () => {
    const psalm = makePsalm({ nkjvTitle: null })
    renderOverview(psalm)
    expect(screen.queryByText('Suggested Title (NKJV):')).toBeNull()
  })

  it('appears after the Book row in DOM order', () => {
    const psalm = makePsalm({ nkjvTitle: 'Some Title', book: 'Book V (107-150)' })
    const { container } = renderOverview(psalm)
    const text = container.textContent ?? ''
    expect(text.indexOf('Book:')).toBeGreaterThanOrEqual(0)
    expect(text.indexOf('Suggested Title (NKJV):')).toBeGreaterThan(text.indexOf('Book:'))
  })
})

describe('OverviewContent Occasion row', () => {
  it('renders the label and value when occasion is populated', () => {
    const psalm = makePsalm({ occasion: "Inserted toward the end of David's life (1Ch 28:21)" })
    renderOverview(psalm)
    expect(screen.getByText('Occasion:')).toBeTruthy()
    expect(
      screen.getByText("Inserted toward the end of David's life (1Ch 28:21)"),
    ).toBeTruthy()
  })

  it('omits the row when occasion is null', () => {
    const psalm = makePsalm({ occasion: null })
    renderOverview(psalm)
    expect(screen.queryByText('Occasion:')).toBeNull()
  })

  it('omits the row when occasion is an empty string', () => {
    const psalm = makePsalm({ occasion: '' })
    renderOverview(psalm)
    expect(screen.queryByText('Occasion:')).toBeNull()
  })

  it('appears after the Author row in DOM order', () => {
    const psalm = makePsalm({ occasion: 'Some occasion', author: 'David' })
    const { container } = renderOverview(psalm)
    const text = container.textContent ?? ''
    expect(text.indexOf('Author:')).toBeGreaterThanOrEqual(0)
    expect(text.indexOf('Occasion:')).toBeGreaterThan(text.indexOf('Author:'))
  })
})
