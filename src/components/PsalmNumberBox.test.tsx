// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PsalmNumberBox } from './PsalmNumberBox'

const basePsalm = {
  id: 6,
  displayLabel: '6',
  slug: '6',
  firstLine: 'Lord, in thy wrath rebuke me not',
  meter: 'CM' as string | null,
}

describe('PsalmNumberBox — Gap 4b meter rendering', () => {
  it('renders no meter when showMeter is false', () => {
    const { container } = render(
      <PsalmNumberBox
        psalm={{ ...basePsalm, meter: 'LM (long meter, 88 88)' }}
        isTopResult={false}
        showFirstLine={false}
        showMeter={false}
        snippet={null}
        query=""
      />
    )
    expect(container.querySelector('[data-meter]')).toBeNull()
    expect((container.querySelector('[data-psalm-box]') as HTMLElement).className).toContain('h-12')
  })

  it('abbreviates the meter it renders', () => {
    const { container } = render(
      <PsalmNumberBox
        psalm={{ ...basePsalm, meter: 'LM (long meter, 88 88)' }}
        isTopResult={false}
        showFirstLine={false}
        showMeter={true}
        snippet={null}
        query=""
      />
    )
    const meterSpan = container.querySelector('[data-meter]') as HTMLElement
    expect(meterSpan.textContent).toBe('LM')
    expect(container.innerHTML).not.toContain('LM (long meter, 88 88)')
  })

  it('never positions the meter absolutely', () => {
    const { container } = render(
      <PsalmNumberBox
        psalm={{ ...basePsalm, meter: 'LM (long meter, 88 88)' }}
        isTopResult={false}
        showFirstLine={false}
        showMeter={true}
        snippet={null}
        query=""
      />
    )
    const meterSpan = container.querySelector('[data-meter]') as HTMLElement
    expect(meterSpan.className).not.toContain('absolute')
    expect(meterSpan.className).not.toContain('top-1')
  })

  it('a meter alone makes the box content-bearing', () => {
    const { container } = render(
      <PsalmNumberBox
        psalm={{ ...basePsalm, firstLine: null, meter: 'LM (long meter, 88 88)' }}
        isTopResult={false}
        showFirstLine={false}
        showMeter={true}
        snippet={null}
        query=""
      />
    )
    const box = container.querySelector('[data-psalm-box]') as HTMLElement
    expect(box.className).toContain('flex flex-col')
    expect(box.className).toContain('min-h-[44px]')
    expect(box.className).not.toContain('h-12')
  })

  it('keeps HM and long numeric patterns intact', () => {
    const { container: hmContainer } = render(
      <PsalmNumberBox
        psalm={{ ...basePsalm, meter: '66 66 88' }}
        isTopResult={false}
        showFirstLine={false}
        showMeter={true}
        snippet={null}
        query=""
      />
    )
    const hmSpan = hmContainer.querySelector('[data-meter]') as HTMLElement
    expect(hmSpan.textContent).toBe('HM')

    const { container: numericContainer } = render(
      <PsalmNumberBox
        psalm={{ ...basePsalm, meter: '10 10 10 10 10' }}
        isTopResult={false}
        showFirstLine={false}
        showMeter={true}
        snippet={null}
        query=""
      />
    )
    const numericSpan = numericContainer.querySelector('[data-meter]') as HTMLElement
    expect(numericSpan.textContent).toBe('10 10 10 10 10')
    expect(numericSpan.className).not.toContain('truncate')
    expect(numericSpan.className).not.toContain('text-ellipsis')
  })
})
