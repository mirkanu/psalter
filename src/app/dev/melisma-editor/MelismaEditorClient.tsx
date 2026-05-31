'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useCallback } from 'react'
import type { TuneOption } from './page'
import { extractSopranoTokens } from '@/lib/abc-soprano-tokens'
import { buildEmbeddedWline } from '@/lib/build-embedded-wline'

const AbcRenderer = dynamic(() => import('./AbcRenderer'), { ssr: false })

interface Props {
  tunes: TuneOption[]
}

export function MelismaEditorClient({ tunes }: Props) {
  const [tuneId, setTuneId] = useState<number | null>(tunes[0]?.id ?? null)
  const [filter, setFilter] = useState('')
  const [underlined, setUnderlined] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const filteredTunes = useMemo(
    () =>
      tunes.filter(t =>
        filter.trim() === '' ? true : t.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [tunes, filter],
  )

  const tune = useMemo(() => tunes.find(t => t.id === tuneId) ?? null, [tunes, tuneId])

  const tokens = useMemo(
    () => (tune ? extractSopranoTokens(tune.abcNotation) : []),
    [tune],
  )

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

  // Reset underline state when switching tunes
  const onTuneChange = useCallback((id: number) => {
    setTuneId(id)
    setUnderlined({})
    setSaveMsg(null)
  }, [])

  const toggle = useCallback((globalIdx: number) => {
    setUnderlined(u => ({ ...u, [globalIdx]: !u[globalIdx] }))
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
      existingAbc: tune.abcNotation,
    })
  }, [tune, tokens, underlined])

  const underlineCount = useMemo(
    () => tokens.filter(t => underlined[t.globalIdx]).length,
    [tokens, underlined],
  )

  const nonUnderlinedCount = tokens.length - underlineCount
  const syllableCount = tune?.stanza1Syllables.length ?? 0
  const countMatch = nonUnderlinedCount === syllableCount

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
      setSaveMsg(`✓ Saved "${json.tune?.name ?? tune.name}". Reload the lyrics preview to verify.`)
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
          notes={tokens.length} · underlined={underlineCount} · syllables={syllableCount}
          {tokens.length > 0 && (
            <span className={`ml-2 font-medium ${countMatch ? 'text-green-700' : 'text-red-700'}`}>
              {countMatch ? '✓ counts match' : `✗ non-underlined ${nonUnderlinedCount} ≠ syllables ${syllableCount}`}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <button
          onClick={onSave}
          disabled={saving || !built || !countMatch || !built.passesValidation}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          title={
            !countMatch
              ? 'Counts must match before saving'
              : !built?.passesValidation
                ? 'Validation failing — see warnings below'
                : 'Save to production DB'
          }
        >
          {saving ? 'Saving…' : 'Save to DB'}
        </button>
      </div>

      {saveMsg && (
        <div className={`px-6 py-2 text-sm ${saveMsg.startsWith('✓') ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 p-4">
        {/* Left: solfège JPG */}
        <div className="col-span-5">
          <h2 className="text-sm font-medium mb-2">Solfège source</h2>
          {tune.solfegeJpgUrl ? (
            <img
              src={tune.solfegeJpgUrl}
              alt={`Solfège for ${tune.name}`}
              className="w-full border border-gray-300 rounded shadow-sm bg-white"
            />
          ) : (
            <div className="border border-gray-300 rounded p-4 text-gray-500 text-sm">No solfège JPG for this tune.</div>
          )}
          <p className="text-xs text-gray-600 mt-2">
            Click a note below for every underlined note in the print. Underlines mark melisma
            continuations (syllable sustained across multiple notes).
          </p>
        </div>

        {/* Right: editor */}
        <div className="col-span-7 space-y-4">
          <div className="bg-white border border-gray-300 rounded p-3">
            <h2 className="text-sm font-medium mb-2">Note grid (click to toggle underline)</h2>
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
                          title={`Note ${tok.globalIdx + 1} of ${tokens.length}`}
                        >
                          {tok.token}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded p-3">
            <h2 className="text-sm font-medium mb-2">Live preview (with lyrics)</h2>
            {built ? (
              <>
                <AbcRenderer abc={built.abc} />
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
            <summary className="text-sm font-medium cursor-pointer">Generated ABC</summary>
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
