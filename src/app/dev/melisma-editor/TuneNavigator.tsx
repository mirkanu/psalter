'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import type { TuneOption } from './page'

interface Props {
  tunes: TuneOption[]
  currentTuneId: number | null
  onSelect: (id: number) => void
  onClose: () => void
}

type StatusFilter = 'any' | 'approved' | 'not_approved' | 'none'
type ErrorFilter = 'any' | 'yes' | 'no'
type ErrorKindFilter = 'any' | 'melisma' | 'meter' | 'both'

const STATUS_LABEL: Record<NonNullable<TuneOption['decisionStatus']>, string> = {
  approved: 'Approved',
  not_approved: 'Not Approved',
}

export function TuneNavigator({ tunes, currentTuneId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [meterFilter, setMeterFilter] = useState<string>('any')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('any')
  const [errorFilter, setErrorFilter] = useState<ErrorFilter>('any')
  const [errorKind, setErrorKind] = useState<ErrorKindFilter>('any')
  const currentRowRef = useRef<HTMLTableRowElement | null>(null)

  // Center the currently-selected row on mount. Runs once after first paint
  // so refs are attached. No-op if nothing is highlighted yet.
  useEffect(() => {
    const el = currentRowRef.current
    if (!el) return
    // 'center' lines up the row in the middle of the scroll container.
    el.scrollIntoView({ block: 'center', behavior: 'auto' })
    // Run once on mount only — filter changes shouldn't re-trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Unique meter list for the meter filter dropdown
  const meters = useMemo(() => {
    const set = new Set<string>()
    for (const t of tunes) if (t.meter) set.add(t.meter)
    return Array.from(set).sort()
  }, [tunes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tunes.filter(t => {
      if (q && !t.name.toLowerCase().includes(q)) return false
      if (meterFilter !== 'any' && t.meter !== meterFilter) return false
      if (statusFilter === 'approved' && t.decisionStatus !== 'approved') return false
      if (statusFilter === 'not_approved' && t.decisionStatus !== 'not_approved') return false
      if (statusFilter === 'none' && t.decisionStatus !== null) return false
      const hasAnyErr = t.melismaError || t.meterError
      if (errorFilter === 'yes' && !hasAnyErr) return false
      if (errorFilter === 'no' && hasAnyErr) return false
      if (errorKind === 'melisma' && !t.melismaError) return false
      if (errorKind === 'meter' && !t.meterError) return false
      if (errorKind === 'both' && !(t.melismaError && t.meterError)) return false
      return true
    })
  }, [tunes, query, meterFilter, statusFilter, errorFilter, errorKind])

  // Tally per filter for footer
  const tally = {
    total: tunes.length,
    shown: filtered.length,
    approved: tunes.filter(t => t.decisionStatus === 'approved').length,
    notApproved: tunes.filter(t => t.decisionStatus === 'not_approved').length,
    melismaErr: tunes.filter(t => t.melismaError).length,
    meterErr: tunes.filter(t => t.meterError).length,
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold mr-3">Browse tunes</h2>
          <input
            type="text"
            autoFocus
            placeholder="Search by name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-56"
          />
          <label className="text-xs text-gray-600 flex items-center gap-1">
            Meter
            <select
              value={meterFilter}
              onChange={e => setMeterFilter(e.target.value)}
              className="border rounded px-1.5 py-0.5 text-xs"
            >
              <option value="any">any</option>
              {meters.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600 flex items-center gap-1">
            Status
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="border rounded px-1.5 py-0.5 text-xs"
            >
              <option value="any">any</option>
              <option value="approved">Approved</option>
              <option value="not_approved">Not Approved</option>
              <option value="none">(no status)</option>
            </select>
          </label>
          <label className="text-xs text-gray-600 flex items-center gap-1">
            Any error
            <select
              value={errorFilter}
              onChange={e => setErrorFilter(e.target.value as ErrorFilter)}
              className="border rounded px-1.5 py-0.5 text-xs"
            >
              <option value="any">any</option>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label className="text-xs text-gray-600 flex items-center gap-1">
            Kind
            <select
              value={errorKind}
              onChange={e => setErrorKind(e.target.value as ErrorKindFilter)}
              className="border rounded px-1.5 py-0.5 text-xs"
            >
              <option value="any">any</option>
              <option value="melisma">melisma only</option>
              <option value="meter">meter only</option>
              <option value="both">both</option>
            </select>
          </label>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-900 px-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 border-b">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-2 font-medium">Tune</th>
                <th className="px-4 py-2 font-medium">Meter</th>
                <th className="px-4 py-2 font-medium">Psalm</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Last comment</th>
                <th className="px-4 py-2 font-medium" colSpan={2}>Syllable count error</th>
              </tr>
              <tr className="text-left text-gray-500 text-xs border-b">
                <th colSpan={5}></th>
                <th className="px-4 py-1 font-normal" title="Non-underlined notes ≠ syllables (top counts-match check)">melisma</th>
                <th className="px-4 py-1 font-normal" title="Stanza-1 syllables per line ≠ meter requirement">meter</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No tunes match these filters.</td></tr>
              ) : (
                filtered.map(t => {
                  const isCurrent = t.id === currentTuneId
                  return (
                    <tr
                      key={t.id}
                      ref={isCurrent ? currentRowRef : undefined}
                      onClick={() => { onSelect(t.id); onClose() }}
                      className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isCurrent ? 'bg-blue-50/60' : ''}`}
                    >
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {t.name}{isCurrent && <span className="ml-2 text-xs text-blue-700">(current)</span>}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{t.meter ?? '—'}</td>
                      <td className="px-4 py-2 text-gray-700">{t.psalmNumber ?? <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-2">
                        {t.decisionStatus === 'approved' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-900">Approved</span>
                        ) : t.decisionStatus === 'not_approved' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-900">Not Approved</span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700 max-w-md truncate" title={t.lastComment ?? ''}>
                        {t.lastComment ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2">
                        {t.melismaError ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-900">✗ melisma</span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-900">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {t.meterError ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-900">✗ meter</span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-900">✓</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2 border-t text-xs text-gray-600 flex items-center gap-4 flex-wrap">
          <span>{tally.shown} of {tally.total} tunes</span>
          <span>·</span>
          <span>Approved: {tally.approved}</span>
          <span>Not Approved: {tally.notApproved}</span>
          <span>Melisma errors: {tally.melismaErr}</span>
          <span>Meter errors: {tally.meterErr}</span>
        </div>
      </div>
    </div>
  )
}
