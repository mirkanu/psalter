// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { SetItemRow } from './SetItemRow'
import type { SetItemView } from './SetItemsSortableList'

const { mockRefresh } = vi.hoisted(() => ({ mockRefresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh, replace: vi.fn(), back: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function makeItem(overrides: Partial<SetItemView> = {}): SetItemView {
  return {
    id: 7,
    setId: 50,
    psalmId: 23,
    tuneId: 11,
    psalmVersionId: null,
    effectiveVersionId: null,
    verseRange: '1-6',
    position: 0,
    psalm: { id: 23, bibleTitle: 'The shepherd' },
    tune: { id: 11, name: 'Crimond', meter: 'CM' },
    ...overrides,
  }
}

function renderRow(item: SetItemView = makeItem()) {
  return render(
    <DndContext>
      <SortableContext items={[item.id]}>
        <table>
          <tbody>
            <SetItemRow
              item={item}
              index={0}
              setId={item.setId}
              allPsalms={[]}
              psalmMeter="CM"
              recommendedTune={null}
              onDelete={vi.fn()}
              onTuneClick={vi.fn()}
              onPsalmClick={vi.fn()}
            />
          </tbody>
        </table>
      </SortableContext>
    </DndContext>,
  )
}

function stubFetch(ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ ok }),
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('SetItemRow — verse range editor', () => {
  it('shows the current verse range as a tappable button', () => {
    renderRow()
    const button = screen.getByRole('button', { name: /edit verses for psalm 23/i })
    expect(button.textContent).toContain('1-6')
  })

  it('shows "All" when the psalm has no verse range', () => {
    renderRow(makeItem({ verseRange: null }))
    const button = screen.getByRole('button', { name: /edit verses for psalm 23/i })
    expect(button.textContent).toContain('All')
  })

  it('opens a modal pre-filled with the current range', async () => {
    renderRow()
    fireEvent.click(screen.getByRole('button', { name: /edit verses for psalm 23/i }))

    const input = (await screen.findByPlaceholderText('e.g. 1-6')) as HTMLInputElement
    expect(input.value).toBe('1-6')
    expect(screen.getByText('Edit verse range')).toBeTruthy()
  })

  it('opens with an empty field when there is no range set', async () => {
    renderRow(makeItem({ verseRange: null }))
    fireEvent.click(screen.getByRole('button', { name: /edit verses for psalm 23/i }))

    const input = (await screen.findByPlaceholderText('e.g. 1-6')) as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('saves an edited range and refreshes the list', async () => {
    const fetchMock = stubFetch()
    renderRow()
    fireEvent.click(screen.getByRole('button', { name: /edit verses for psalm 23/i }))

    const input = await screen.findByPlaceholderText('e.g. 1-6')
    fireEvent.change(input, { target: { value: '2-4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/precent/50/items/7')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({ verseRange: '2-4' })
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })

  it('clears the range when the field is emptied', async () => {
    const fetchMock = stubFetch()
    renderRow()
    fireEvent.click(screen.getByRole('button', { name: /edit verses for psalm 23/i }))

    const input = await screen.findByPlaceholderText('e.g. 1-6')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ verseRange: null })
  })

  it('rejects an over-long range instead of silently clearing it', async () => {
    const fetchMock = stubFetch()
    renderRow()
    fireEvent.click(screen.getByRole('button', { name: /edit verses for psalm 23/i }))

    const input = await screen.findByPlaceholderText('e.g. 1-6')
    fireEvent.change(input, { target: { value: '123456789012345678901' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the modal open and reports a failed save', async () => {
    stubFetch(false)
    renderRow()
    fireEvent.click(screen.getByRole('button', { name: /edit verses for psalm 23/i }))

    const input = await screen.findByPlaceholderText('e.g. 1-6')
    fireEvent.change(input, { target: { value: '3-5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Edit verse range')).toBeTruthy()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
