'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useCallback, useEffect } from 'react'
import type { TuneOption } from './page'
import { extractSopranoTokensWithPos, replaceTokenAt } from '@/lib/abc-soprano-tokens'
import {
  abcNoteToSolfege,
  extractDohFromAbc,
  solfegeToAbcNote,
  parseSolfegeToken,
} from '@/lib/abc-note-to-solfege'
import { buildEmbeddedWline } from '@/lib/build-embedded-wline'

const AbcRenderer = dynamic(() => import('./AbcRenderer'), { ssr: false })

interface Props {
  tunes: TuneOption[]
}

type PreviewSize = 'sm' | 'md' | 'lg'
const PREVIEW_STAFF_MULT: Record<PreviewSize, number> = { sm: 1.4, md: 1.0, lg: 0.65 }

export function MelismaEditorClient({ tunes }: Props) {
  const [tuneId, setTuneId] = useState<number | null>(tunes[0]?.id ?? null)
  const [filter, setFilter] = useState('')
  const [underlined, setUnderlined] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [previewSize, setPreviewSize] = useState<PreviewSize>('md')

  // Working ABC body — edited per-cell (solfège mode) or via raw textarea.
  // null means "use the DB original verbatim".
  const [editedAbc, setEditedAbc] = useState<string | null>(null)
  // Edit mode for the note grid: 'underline' (default click toggles melisma)
  // vs 'solfege' (cells become editable solfège inputs).
  const [gridMode, setGridMode] = useState<'underline' | 'solfege'>('underline')
  // Editable stanza-1 syllables. Needed for 8.6.8.6.6 etc.
  const [editedSyllables, setEditedSyllables] = useState<string | null>(null)
  const [showSyllableEditor, setShowSyllableEditor] = useState(false)

  const filteredTunes = useMemo(
    () =>
      tunes.filter(t =>
        filter.trim() === '' ? true : t.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [tunes, filter],
  )

  const tune = useMemo(() => tunes.find(t => t.id === tuneId) ?? null, [tunes, tuneId])
  const effectiveAbc = editedAbc ?? tune?.abcNotation ?? ''

  // Position-tracked tokens. Re-extracted on every ABC change.
  const tokens = useMemo(
    () => (effectiveAbc ? extractSopranoTokensWithPos(effectiveAbc) : []),
    [effectiveAbc],
  )
  const doh = useMemo(
    () => (effectiveAbc ? extractDohFromAbc(effectiveAbc) : 'C'),
    [effectiveAbc],
  )

  // If the token count changes, drop stale underline flags beyond the new count.
  useEffect(() => {
    setUnderlined(prev => {
      const filtered: Record<number, boolean> = {}
      for (const k of Object.keys(prev)) {
        const idx = Number(k)
        if (idx < tokens.length) filtered[idx] = prev[idx]
      }
      return filtered
    })
  }, [tokens.length])

  const phrases = useMemo(() => {
    const out: Array<{ phraseIdx: number; tokens: typeof tokens }> = []
    for (const tok of tokens) {
      let bucket = out.find(p => p.phraseIdx === tok.phraseIdx)
      if (!bucket) {
        bucket = { phraseIdx: tok.phraseIdx, tokens: [] }
        out.push(bucket)
      }
      bucket.tokens.push(tok)
    }
    return out
  }, [tokens])

  const onTuneChange = useCallback((id: number) => {
    setTuneId(id)
    setUnderlined({})
    setEditedAbc(null)
    setGridMode('underline')
    setEditedSyllables(null)
    setShowSyllableEditor(false)
    setSaveMsg(null)
  }, [])

  const toggle = useCallback((globalIdx: number) => {
    setUnderlined(u => ({ ...u, [globalIdx]: !u[globalIdx] }))
    setSaveMsg(null)
  }, [])

  const resetEdits = useCallback(() => {
    setEditedAbc(null)
    setSaveMsg(null)
  }, [])

  const resetSyllableEdits = useCallback(() => {
    setEditedSyllables(null)
    setSaveMsg(null)
  }, [])

  // Per-cell solfège edit commit. Replaces the token in the working ABC body
  // and updates editedAbc so the preview/grid re-renders.
  const commitSolfegeEdit = useCallback(
    (globalIdx: number, newSolfege: string) => {
      const tok = tokens[globalIdx]
      if (!tok) return
      const trimmed = newSolfege.trim()
      const oldSolfege = abcNoteToSolfege(tok.token, doh)
      if (trimmed === '' || trimmed === oldSolfege) return // no-op
      if (!parseSolfegeToken(trimmed)) return // reject garbage silently
      const newAbcToken = solfegeToAbcNote(trimmed, doh, tok.token)
      if (newAbcToken === tok.token) return
      const baseAbc = editedAbc ?? tune?.abcNotation ?? ''
      const newBody = replaceTokenAt(baseAbc, tok.absStart, tok.absEnd, newAbcToken)
      setEditedAbc(newBody)
      setSaveMsg(null)
    },
    [tokens, doh, editedAbc, tune],
  )

  // Effective syllable list: edited value (if present) else DB original.
  const effectiveSyllables = useMemo(() => {
    if (editedSyllables !== null) {
      return editedSyllables.split(/\s+/).filter(Boolean)
    }
    return tune?.stanza1Syllables ?? []
  }, [editedSyllables, tune])

  const built = useMemo(() => {
    if (!tune || tokens.length === 0) return null
    const tokenStrs = tokens.map(t => t.token)
    const underlinedFlags = tokens.map(t => Boolean(underlined[t.globalIdx]))
    return buildEmbeddedWline({
      tokens: tokenStrs,
      underlined: underlinedFlags,
      syllables: effectiveSyllables,
      existingAbc: effectiveAbc,
    })
  }, [tune, tokens, underlined, effectiveAbc, effectiveSyllables])

  const underlineCount = useMemo(
    () => tokens.filter(t => underlined[t.globalIdx]).length,
    [tokens, underlined],
  )

  const nonUnderlinedCount = tokens.length - underlineCount
  const syllableCount = effectiveSyllables.length
  const countMatch = nonUnderlinedCount === syllableCount

  // Save mode logic (see commit msg: melisma workflow OR ABC-only edits).
  const isMelismaWorkflow = underlineCount > 0
  const hasAbcEdits = editedAbc !== null
  const willSaveMode: 'melisma' | 'abc-only' | null = isMelismaWorkflow
    ? 'melisma'
    : hasAbcEdits
      ? 'abc-only'
      : null

  const saveDisabledReason =
    !tune
      ? 'No tune loaded'
      : willSaveMode === 'melisma'
        ? !built
          ? 'No tune loaded'
          : !countMatch
            ? `non-underlined count (${nonUnderlinedCount}) ≠ syllables (${syllableCount}) — mark more or fewer underlines, or clear all to save only ABC edits`
            : !built.passesValidation
              ? 'buildEmbeddedWline reports validation failure — see warnings'
              : null
        : willSaveMode === 'abc-only'
          ? null
          : 'Nothing to save: mark underlines, OR edit notes via the solfège grid / raw ABC. (Syllable edits alone don’t persist — they only affect w-line generation.)'

  const onSave = useCallback(async () => {
    if (!tune || !willSaveMode) return
    const abcToSave =
      willSaveMode === 'melisma' && built ? built.abc : effectiveAbc
    if (!abcToSave) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/dev/melisma-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tuneId: tune.id, abcNotation: abcToSave }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'unknown error')
      const modeLabel = willSaveMode === 'melisma' ? 'with w-line' : '(ABC only)'
      setSaveMsg(`✓ Saved "${json.tune?.name ?? tune.name}" to production DB ${modeLabel}. Open the psalm preview below + reload to sing-test.`)
    } catch (err) {
      setSaveMsg(`✗ Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }, [tune, built, willSaveMode, effectiveAbc])

  if (!tune) return <div className="p-8 text-gray-700">No tunes with ABC notation in the DB.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold">Melisma Editor</h1>
        <input
          type="text"
          placeholder="Filter tunes…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-48"
        />
        <select
          value={tuneId ?? ''}
          onChange={e => onTuneChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm min-w-[14rem]"
        >
          {filteredTunes.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} {t.meter ? `(${t.meter})` : ''}
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-600">
          doh={doh} · notes={tokens.length} · underlined={underlineCount} · syllables={syllableCount}
          {tokens.length > 0 && (
            <span className={`ml-2 font-medium ${countMatch ? 'text-green-700' : 'text-red-700'}`}>
              {countMatch ? '✓ counts match' : '✗ counts don’t match'}
            </span>
          )}
          {editedAbc !== null && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-900 rounded">
              notes edited
            </span>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={onSave}
          disabled={saving || !!saveDisabledReason}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
          title={saveDisabledReason ?? 'Save to production DB'}
        >
          {saving
            ? 'Saving…'
            : willSaveMode === 'abc-only'
              ? '💾 Save note edits (no melisma)'
              : '💾 Save to DB'}
        </button>
      </div>

      {saveDisabledReason && (
        <div className="px-6 py-1.5 text-xs text-gray-600 bg-gray-100 border-b border-gray-200">
          Save disabled — {saveDisabledReason}
        </div>
      )}

      {saveMsg && (
        <div className={`px-6 py-2 text-sm ${saveMsg.startsWith('✓') ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 p-4">
        {/* Left: solfège JPG(s) */}
        <div className="col-span-5">
          <h2 className="text-sm font-medium mb-2">
            Solfège source {tune.solfegeJpgUrls.length > 1 && <span className="text-xs text-gray-500">({tune.solfegeJpgUrls.length} pages)</span>}
          </h2>
          {tune.solfegeJpgUrls.length > 0 ? (
            <div className="space-y-2">
              {tune.solfegeJpgUrls.map(url => (
                <img
                  key={url}
                  src={url}
                  alt={`Solfège for ${tune.name}`}
                  className="w-full border border-gray-300 rounded shadow-sm bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="border border-gray-300 rounded p-4 text-gray-500 text-sm">
              No solfège JPG found at <code>public/tunes/{tune.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-solfege-*.jpg</code>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-2">
            <strong>Underline mode:</strong> click any note to toggle melisma (amber).
            <br />
            <strong>Solfège mode:</strong> each cell becomes editable — type the correct
            syllable (e.g. <code>m</code>, <code>fe</code>, <code>s&apos;</code>, <code>d_1</code>)
            and press Enter or Tab to commit. Rhythm/duration is preserved.
          </p>
        </div>

        {/* Right: editor */}
        <div className="col-span-7 space-y-4">
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h2 className="text-sm font-medium">
                Note grid
                <span className="text-xs text-gray-500 ml-2 font-normal">
                  ({gridMode === 'underline' ? 'click to toggle melisma' : 'edit solfège in cells'})
                </span>
              </h2>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500 mr-1">mode:</span>
                <button
                  onClick={() => setGridMode('underline')}
                  className={`px-2 py-0.5 rounded border ${
                    gridMode === 'underline'
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Underlines
                </button>
                <button
                  onClick={() => setGridMode('solfege')}
                  className={`px-2 py-0.5 rounded border ${
                    gridMode === 'solfege'
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Edit notes by typing solfège syllables. Rhythm preserved from the existing ABC."
                >
                  ✎ Edit solfège
                </button>
                {editedAbc !== null && (
                  <button
                    onClick={resetEdits}
                    className="px-2 py-0.5 rounded border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    title="Discard all note edits and revert to the DB version"
                  >
                    ↶ Revert notes
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {phrases.map(p => (
                <div key={p.phraseIdx} className="flex items-start gap-1">
                  <span className="text-xs text-gray-500 w-16 shrink-0 pt-1.5">phrase {p.phraseIdx + 1}</span>
                  <div className="flex flex-wrap gap-1">
                    {p.tokens.map(tok => {
                      const isUnderlined = Boolean(underlined[tok.globalIdx])
                      const solfegeStr = abcNoteToSolfege(tok.token, doh)
                      if (gridMode === 'solfege') {
                        return (
                          <SolfegeCell
                            key={`${tok.globalIdx}-${tok.absStart}`}
                            initialValue={solfegeStr}
                            highlighted={isUnderlined}
                            originalToken={tok.token}
                            onCommit={v => commitSolfegeEdit(tok.globalIdx, v)}
                            title={`Note ${tok.globalIdx + 1} of ${tokens.length} — ABC: ${tok.token}`}
                          />
                        )
                      }
                      return (
                        <button
                          key={tok.globalIdx}
                          onClick={() => toggle(tok.globalIdx)}
                          className={`px-2 py-1 text-xs font-mono rounded border min-w-[2.5rem] ${
                            isUnderlined
                              ? 'bg-amber-200 border-amber-500 text-amber-900 underline decoration-2 underline-offset-2'
                              : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'
                          }`}
                          title={`Note ${tok.globalIdx + 1} of ${tokens.length} — ABC: ${tok.token}`}
                        >
                          {solfegeStr}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Syllable editor */}
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium">
                Stanza-1 syllables{' '}
                <span className="text-xs text-gray-500 font-normal">
                  ({effectiveSyllables.length})
                </span>
                {editedSyllables !== null && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-900 rounded font-normal">
                    edited
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setShowSyllableEditor(s => !s)}
                  className={`px-2 py-0.5 rounded border ${
                    showSyllableEditor
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ✎ Edit lyrics
                </button>
                {editedSyllables !== null && (
                  <button
                    onClick={resetSyllableEdits}
                    className="px-2 py-0.5 rounded border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ↶ Revert
                  </button>
                )}
              </div>
            </div>
            {!showSyllableEditor ? (
              <div className="text-xs font-mono text-gray-700 break-words">
                {effectiveSyllables.length === 0 ? (
                  <span className="text-gray-400">(no syllables resolved from DB — open editor to enter them manually)</span>
                ) : (
                  effectiveSyllables.join(' ')
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-600 flex-1">
                    Space-separated syllables for the embedded w-line. For repeated-line
                    meters (e.g. 8.6.8.6.6), duplicate the relevant words manually.
                  </span>
                  {tune.stanza1Syllables.length > 0 && (
                    <button
                      onClick={() => {
                        const base = (editedSyllables ?? tune.stanza1Syllables.join(' ')).trim()
                        const list = base.split(/\s+/).filter(Boolean)
                        const lastN = list.slice(Math.max(0, list.length - 6))
                        setEditedSyllables(base + ' ' + lastN.join(' '))
                        setSaveMsg(null)
                      }}
                      className="px-2 py-0.5 text-xs rounded border bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shrink-0"
                      title="Append the last 6 syllables (handy for 8.6.8.6.6)"
                    >
                      + repeat last 6
                    </button>
                  )}
                </div>
                <textarea
                  value={editedSyllables ?? tune.stanza1Syllables.join(' ')}
                  onChange={e => {
                    setEditedSyllables(e.target.value)
                    setSaveMsg(null)
                  }}
                  className="w-full h-24 text-xs font-mono border border-gray-300 rounded p-2"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium">Live preview (with lyrics)</h2>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500 mr-1">size:</span>
                {(['sm', 'md', 'lg'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setPreviewSize(s)}
                    className={`px-2 py-0.5 rounded border ${
                      previewSize === s
                        ? 'bg-blue-100 border-blue-400 text-blue-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label={s === 'sm' ? 'small' : s === 'md' ? 'medium' : 'large'}
                  >
                    {s === 'sm' ? 'A−' : s === 'md' ? 'A' : 'A+'}
                  </button>
                ))}
              </div>
            </div>
            {built ? (
              <>
                <AbcRenderer abc={built.abc} staffWidthMultiplier={PREVIEW_STAFF_MULT[previewSize]} />
                {built.warnings.length > 0 && (
                  <div className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded p-2 max-h-32 overflow-auto">
                    <strong>Warnings:</strong>
                    <ul className="list-disc ml-5">
                      {built.warnings.slice(0, 8).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                      {built.warnings.length > 8 && <li>… and {built.warnings.length - 8} more</li>}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500 text-sm">No preview available.</div>
            )}
          </div>

          <details className="bg-white border border-gray-300 rounded p-3">
            <summary className="text-sm font-medium cursor-pointer">Generated ABC (what will be saved)</summary>
            <pre className="text-xs mt-2 overflow-auto whitespace-pre-wrap">{built?.abc ?? ''}</pre>
          </details>

          <details className="bg-white border border-gray-300 rounded p-3">
            <summary className="text-sm font-medium cursor-pointer text-gray-700">
              Advanced: edit raw ABC (for changes outside notes — bar lines, durations, accidentals)
            </summary>
            <textarea
              value={effectiveAbc}
              onChange={e => {
                setEditedAbc(e.target.value)
                setSaveMsg(null)
              }}
              className="mt-2 w-full h-64 text-xs font-mono border border-gray-300 rounded p-2"
              spellCheck={false}
            />
          </details>

          {tune.psalmNumber && (
            <details className="bg-white border border-gray-300 rounded p-3">
              <summary className="text-sm font-medium cursor-pointer">
                Psalm {tune.psalmNumber} on production (reload after save to sing-test)
              </summary>
              <iframe
                src={`https://psalter.gsdlabs.dev/psalms/${tune.psalmNumber}`}
                className="w-full h-[600px] border border-gray-200 mt-2 rounded"
                title={`Psalm ${tune.psalmNumber} preview`}
              />
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Per-cell solfège input (used when grid mode is 'solfege') ───────────────

interface SolfegeCellProps {
  initialValue: string
  highlighted: boolean
  originalToken: string
  onCommit: (value: string) => void
  title?: string
}

function SolfegeCell({ initialValue, highlighted, originalToken, onCommit, title }: SolfegeCellProps) {
  const [value, setValue] = useState(initialValue)

  // If the upstream solfège changes (e.g. tune switch, revert, neighbour edit
  // changed an accidental that affects this cell's reading), sync local state.
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <input
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          (e.target as HTMLInputElement).blur()
        } else if (e.key === 'Escape') {
          setValue(initialValue)
          ;(e.target as HTMLInputElement).blur()
        }
      }}
      className={`w-12 px-1 py-1 text-xs font-mono text-center rounded border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
        highlighted
          ? 'bg-amber-100 border-amber-400 text-amber-900'
          : 'bg-white border-gray-300 text-gray-800'
      }`}
      title={`${title ?? ''} · type a solfège syllable (m, fe, s', d_1)`}
      spellCheck={false}
    />
  )
}
