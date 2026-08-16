// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { TieredTuneRowList, type TieredTuneRow, type TieredRowTune } from './TieredTuneRowList'

afterEach(() => {
  cleanup()
})

const tunes = [
  { id: 1, name: 'Alpha', weightedHistoricalFrequency: 0.01 },
  { id: 3, name: 'Zulu', weightedHistoricalFrequency: 0 },
  { id: 7, name: 'Mike', weightedHistoricalFrequency: 0 },
  { id: 9, name: 'Alpha2', weightedHistoricalFrequency: 0.5 },
  { id: 2, name: 'Bravo', weightedHistoricalFrequency: 0.3 },
]

const tuneTiers = { recommendedTuneIds: [], backupTuneIds: [7], historicalTuneIds: [3, 9] }

function renderRowButton<T extends TieredRowTune>(row: TieredTuneRow<T>) {
  return (
    <button key={row.tune.id} type="button">
      {row.tune.name}
    </button>
  )
}

describe('TieredTuneRowList', () => {
  it('emits exactly three headings in tier order', () => {
    const { container } = render(
      <TieredTuneRowList tunes={tunes} tuneTiers={tuneTiers} renderRow={renderRowButton} />,
    )
    const headings = Array.from(container.querySelectorAll('[data-tune-tier-heading]'))
    expect(headings.map((h) => h.textContent)).toEqual([
      'Backup tune',
      'Historically sung for this psalm',
      'Other tunes in this meter',
    ])
  })

  it('emits one heading per tier, not one per row', () => {
    const { container } = render(
      <TieredTuneRowList tunes={tunes} tuneTiers={tuneTiers} renderRow={renderRowButton} />,
    )
    const headings = container.querySelectorAll('[data-tune-tier-heading]')
    expect(headings.length).toBe(3)
  })

  it('emits Recommended → Backup → Historical → Other in that order when all four tiers are present', () => {
    const fourTierTiers = { recommendedTuneIds: [2], backupTuneIds: [7], historicalTuneIds: [3, 9] }
    const { container } = render(
      <TieredTuneRowList tunes={tunes} tuneTiers={fourTierTiers} renderRow={renderRowButton} />,
    )
    const headings = Array.from(container.querySelectorAll('[data-tune-tier-heading]'))
    expect(headings.map((h) => h.textContent)).toEqual([
      'Recommended',
      'Backup tune',
      'Historically sung for this psalm',
      'Other tunes in this meter',
    ])
  })

  it('a tune flagged both recommended and backup sorts into Recommended, not Backup', () => {
    const overlapTiers = { recommendedTuneIds: [7], backupTuneIds: [7], historicalTuneIds: [] }
    const renderRow = vi.fn(renderRowButton)
    render(<TieredTuneRowList tunes={tunes} tuneTiers={overlapTiers} renderRow={renderRow} />)
    const row = renderRow.mock.calls.find(([r]) => r.tune.id === 7)?.[0]
    expect(row?.tier).toBe('recommended')
  })

  it('rows render in sortTunesByTier order', () => {
    const renderRow = vi.fn(renderRowButton)
    render(<TieredTuneRowList tunes={tunes} tuneTiers={tuneTiers} renderRow={renderRow} />)
    const ids = renderRow.mock.calls.map(([row]) => row.tune.id)
    expect(ids).toEqual([7, 9, 3, 2, 1])
  })

  it("renderRow receives the caller's original object, not a copy", () => {
    const markedTunes = tunes.map((t) => ({ ...t, marker: 'keep-me' }))
    const renderRow = vi.fn(renderRowButton<(typeof markedTunes)[number]>)
    render(<TieredTuneRowList tunes={markedTunes} tuneTiers={tuneTiers} renderRow={renderRow} />)
    for (const [row] of renderRow.mock.calls) {
      expect(row.tune.marker).toBe('keep-me')
      const original = markedTunes.find((t) => t.id === row.tune.id)
      expect(row.tune).toBe(original)
    }
  })

  it('isCurrent is true only for currentTuneId', () => {
    const renderRow = vi.fn(renderRowButton)
    render(
      <TieredTuneRowList
        tunes={tunes}
        tuneTiers={tuneTiers}
        currentTuneId={3}
        renderRow={renderRow}
      />,
    )
    const currentCalls = renderRow.mock.calls.filter(([row]) => row.isCurrent === true)
    expect(currentCalls.length).toBe(1)
    expect(currentCalls[0][0].tune.id).toBe(3)
  })

  it("null tuneTiers renders every tune in the 'other' tier", () => {
    const renderRow = vi.fn(renderRowButton)
    const { container } = render(
      <TieredTuneRowList tunes={tunes} tuneTiers={null} renderRow={renderRow} />,
    )
    for (const [row] of renderRow.mock.calls) {
      expect(row.tier).toBe('other')
    }
    const headings = container.querySelectorAll('[data-tune-tier-heading]')
    expect(headings.length).toBe(1)
  })

  it('handles `name: string | null` without crashing', () => {
    const renderRow = vi.fn(renderRowButton)
    render(
      <TieredTuneRowList
        tunes={[{ id: 5, name: null }]}
        tuneTiers={tuneTiers}
        renderRow={renderRow}
      />,
    )
    expect(renderRow.mock.calls.length).toBe(1)
    expect(renderRow.mock.calls[0][0].tier).toBe('other')
  })

  it('tierLabels override replaces the default copy', () => {
    const { container } = render(
      <TieredTuneRowList
        tunes={tunes}
        tuneTiers={tuneTiers}
        tierLabels={{ other: 'Other tunes' }}
        renderRow={renderRowButton}
      />,
    )
    const headings = Array.from(container.querySelectorAll('[data-tune-tier-heading]'))
    expect(headings[2].textContent).toBe('Other tunes')
  })

  it('itemWrapper="fragment" emits no wrapper div', () => {
    const { container } = render(
      <table>
        <tbody>
          <TieredTuneRowList
            tunes={tunes}
            tuneTiers={tuneTiers}
            itemWrapper="fragment"
            renderRow={({ tune }) => <tr key={tune.id}><td>{tune.name}</td></tr>}
          />
        </tbody>
      </table>,
    )
    expect(container.querySelectorAll('div').length).toBe(0)
  })

  it('empty tunes array renders nothing', () => {
    const renderRow = vi.fn(renderRowButton)
    const { container } = render(
      <TieredTuneRowList tunes={[]} tuneTiers={tuneTiers} renderRow={renderRow} />,
    )
    expect(container.querySelectorAll('[data-tune-tier-heading]').length).toBe(0)
    expect(renderRow).not.toHaveBeenCalled()
  })
})
