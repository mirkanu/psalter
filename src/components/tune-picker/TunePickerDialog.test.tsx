// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { TunePickerDialog } from './TunePickerDialog'
import type { AlternateTune } from '@/db/queries/tunes'

// Mock TuneTable so we don't pull in the real table (heavy: useLocalStorage, ResizeObserver, layout
// effects). The mock renders a placeholder per tune so we can simulate a click on the first one.
vi.mock('@/components/TuneTable', () => ({
  TuneTable: ({ tunes, onSelectTune }: { tunes: { id: number; name: string | null }[]; onSelectTune?: (t: { id: number; name: string | null }) => void }) => (
    <div data-testid="tune-table-mock">
      {tunes.map((t) => (
        <button key={t.id} type="button" data-testid={`table-row-${t.id}`} onClick={() => onSelectTune?.(t)}>
          {t.name}
        </button>
      ))}
    </div>
  ),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const baseTune: AlternateTune = {
  id: 1,
  name: 'Alpha',
  slug: 'alpha',
  meter: 'CM',
  scoreJpgUrl: null,
  solfegeJpgUrl: null,
  soundcloudUrl: null,
  youtubeUrl: null,
  abcNotation: null,
  abcSatb: null,
  doubleLength: false,
  meterVariant: [],
  solfegeOcrText: null,
  melismaPositions: null,
  phraseShapeOverride: null,
  staffPages: [],
  solfegePages: [],
  melismaStatus: null,
  weightedHistoricalFrequency: 0,
  historicalUsageCount: 0,
}

const backupTune: AlternateTune = { ...baseTune, id: 7, name: 'Bravo' }
const historicalTune: AlternateTune = { ...baseTune, id: 3, name: 'Charlie' }
const otherTune: AlternateTune = { ...baseTune, id: 2, name: 'Delta' }

describe('TunePickerDialog', () => {
  it('renders "Select a Tune" title by default (Mode B / study-tab)', () => {
    render(<TunePickerDialog open onClose={vi.fn()} tunes={[baseTune]} onSelect={vi.fn()} />)
    expect(screen.getByText('Select a Tune')).toBeTruthy()
  })

  it('renders "Select Tune" title when useTable=true (Mode A / precentor)', () => {
    render(
      <TunePickerDialog
        open
        onClose={vi.fn()}
        tunes={[baseTune]}
        onSelect={vi.fn()}
        useTable
      />,
    )
    expect(screen.getByText('Select Tune')).toBeTruthy()
  })

  it('renders the search input in Mode B and not in Mode A', () => {
    const tunes = [baseTune]
    const { rerender } = render(<TunePickerDialog open onClose={vi.fn()} tunes={tunes} onSelect={vi.fn()} />)
    expect(screen.queryByPlaceholderText('Search tunes…')).toBeTruthy()

    rerender(<TunePickerDialog open onClose={vi.fn()} tunes={tunes} onSelect={vi.fn()} useTable />)
    expect(screen.queryByPlaceholderText('Search tunes…')).toBeNull()
  })

  it('invokes onSelect with the chosen tune and onClose after click (Mode B)', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <TunePickerDialog
        open
        onClose={onClose}
        tunes={[baseTune]}
        onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByText('Alpha'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].id).toBe(1)
    expect(onSelect.mock.calls[0][0].name).toBe('Alpha')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('invokes onSelect with the chosen tune and onClose in Mode A (mocked TuneTable)', () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <TunePickerDialog
        open
        onClose={onClose}
        tunes={[baseTune]}
        onSelect={onSelect}
        useTable
      />,
    )
    fireEvent.click(screen.getByTestId('table-row-1'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].id).toBe(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('emits tier headings in Mode B when tuneTiers includes backupTuneIds', () => {
    const tuneTiers = { recommendedTuneIds: [], backupTuneIds: [7], historicalTuneIds: [3] }
    render(
      <TunePickerDialog
        open
        onClose={vi.fn()}
        tunes={[backupTune, historicalTune, otherTune]}
        tuneTiers={tuneTiers}
        onSelect={vi.fn()}
      />,
    )
    // DialogContent renders via a Portal into document.body, so query there rather than the local
    // render container.
    const headings = Array.from(document.body.querySelectorAll('[data-tune-tier-heading]'))
    expect(headings.length).toBe(3)
    expect(headings.map((h) => h.textContent)).toEqual([
      'Backup tune',
      'Historically sung for this psalm',
      'Other tunes in this meter',
    ])
  })

  it('filters the Mode B list by the search query', () => {
    render(
      <TunePickerDialog
        open
        onClose={vi.fn()}
        tunes={[baseTune, backupTune, historicalTune]}
        onSelect={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Search tunes…'), {
      target: { value: 'Bravo' },
    })
    expect(screen.queryByText('Alpha')).toBeNull()
    expect(screen.getByText('Bravo')).toBeTruthy()
  })

  it('renders the empty-state message in Mode B when no tunes match the filter', () => {
    render(
      <TunePickerDialog
        open
        onClose={vi.fn()}
        tunes={[baseTune]}
        onSelect={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText('Search tunes…'), {
      target: { value: 'nonexistent' },
    })
    expect(screen.getByText('No tunes found.')).toBeTruthy()
  })
})
