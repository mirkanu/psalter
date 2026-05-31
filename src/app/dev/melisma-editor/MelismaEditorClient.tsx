'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useCallback, useEffect } from 'react'
import type { TuneOption } from './page'
import { extractSopranoTokens } from '@/lib/abc-soprano-tokens'
import { abcNoteToSolfege, extractDohFromAbc } from '@/lib/abc-note-to-solfege'
import { buildEmbeddedWline } from '@/lib/build-embedded-wline'

const AbcRenderer = dynamic(() => import('./AbcRenderer'), { ssr: false })

interface Props {
  tunes: TuneOption[]
}

type PreviewSize = 'sm' | 'md' | 'lg'
// staffwidth multiplier — bigger value = wider staffwidth = smaller-looking notes;
// smaller = narrower staffwidth = bigger notes (more wraps).
const PREVIEW_STAFF_MULT: Record<PreviewSize, number> = { sm: 1.4, md: 1.0, lg: 0.65 }

export function MelismaEditorClient({ tunes }: Props) {
  const [tuneId, setTuneId] = useState<number | null>(tunes[0]?.id ?? null)
  const [filter, setFilter] = useState('')
  const [underlined, setUnderlined] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [previewSize, setPreviewSize] = useState<PreviewSize>('md')

  // Editable ABC body — null means "use the DB original".
  const [editedAbc, setEditedAbc] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const filteredTunes = useMemo(
    () =>
      tunes.filter(t =>
        filter.trim() === '' ? true : t.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [tunes, filter],
  )

  const tune = useMemo(() => tunes.find(t => t.id === tuneId) ?? null, [tunes, tuneId])
  const effectiveAbc = editedAbc ?? tune?.abcNotation ?? ''

  // Re-extract tokens / doh whenever the working ABC changes (DB switch or edit).
  const tokens = useMemo(
    () => (effectiveAbc ? extractSopranoTokens(effectiveAbc) : []),
    [effectiveAbc],
  )
  const doh = useMemo(
    () => (effectiveAbc ? extractDohFromAbc(effectiveAbc) : 'C'),
    [effectiveAbc],
  )

  // If the token count changes (user added/removed notes), drop any underline
  // flags beyond the new count so we don't carry stale state.
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

  // Reset all per-tune state when switching tunes.
  const onTuneChange = useCallback((id: number) => {
    setTuneId(id)
    setUnderlined({})
    setEditedAbc(null)
    setShowEditor(false)
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

  const built = useMemo(() => {
    if (!tune || tokens.length === 0) return null
    const tokenStrs = tokens.map(t => t.token)
    const underlinedFlags = tokens.map(t => Boolean(underlined[t.globalIdx]))
    return buildEmbeddedWline({
      tokens: tokenStrs,
      underlined: underlinedFlags,
      syllables: tune.stanza1Syllables,
      existingAbc: effectiveAbc,
    })
  }, [tune, tokens, underlined, effectiveAbc])

  const underlineCount = useMemo(
    () => tokens.filter(t => underlined[t.globalIdx]).length,
    [tokens, underlined],
  )

  const nonUnderlinedCount = tokens.length - underlineCount
  const syllableCount = tune?.stanza1Syllables.length ?? 0
  const countMatch = nonUnderlinedCount === syllableCount

  const saveDisabledReason =
    !built
      ? 'No tune loaded'
      : !countMatch
        ? `non-underlined count (${nonUnderlinedCount}) ≠ syllables (${syllableCount}) — mark more or fewer underlines`
        : !built.passesValidation
          ? 'buildEmbeddedWline reports validation failure — see warnings'
          : null

  const onSave = useCallback(async () => {
    if (!tune || !built) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/dev/melisma-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tuneId: tune.id, abcNotation: built.abc }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'unknown error')
      setSaveMsg(`✓ Saved "${json.tune?.name ?? tune.name}" to production DB. Open the psalm preview below + reload to sing-test.`)
    } catch (err) {
      setSaveMsg(`✗ Save failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }, [tune, built])

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
              ABC edited
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
          {saving ? 'Saving…' : '💾 Save to DB'}
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
            Click a note below for every underlined note in the print. Underlines mark melisma
            continuations (syllable sustained across multiple notes).
          </p>
        </div>

        {/* Right: editor */}
        <div className="col-span-7 space-y-4">
          <div className="bg-white border border-gray-300 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium">Note grid (click to toggle underline)</h2>
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setShowEditor(s => !s)}
                  className={`px-2 py-0.5 rounded border ${
                    showEditor
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Edit the ABC body (fix wrong notes, durations, accidentals, etc.)"
                >
                  ✎ Edit ABC
                </button>
                {editedAbc !== null && (
                  <button
                    onClick={resetEdits}
                    className="px-2 py-0.5 rounded border bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    title="Discard edits and revert to the DB version"
                  >
                    ↶ Revert
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {phrases.map(p => (
                <div key={p.phraseIdx} className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 w-16 shrink-0">phrase {p.phraseIdx + 1}</span>
                  <div className="flex flex-wrap gap-1">
                    {p.tokens.map(tok => {
                      const isUnderlined = Boolean(underlined[tok.globalIdx])
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
                          {abcNoteToSolfege(tok.token, doh)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {showEditor && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    Edit the ABC body. Live preview + note grid update on every keystroke.
                    Underlines reset if you change the note count.
                  </span>
                </div>
                <textarea
                  value={effectiveAbc}
                  onChange={e => {
                    setEditedAbc(e.target.value)
                    setSaveMsg(null)
                  }}
                  className="w-full h-64 text-xs font-mono border border-gray-300 rounded p-2"
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
