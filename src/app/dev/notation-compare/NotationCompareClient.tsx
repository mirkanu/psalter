'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useEffect, useCallback } from 'react'
import type { TuneRow } from './page'

const AbcPlayerPanel = dynamic(() => import('./AbcPlayerPanel'), { ssr: false })

// ── Cache helpers ─────────────────────────────────────────────────────────────

type OcrMode = 'staff' | 'solfege' | 'audiveris'

interface OcrResult {
  abc: string
  rawAbc?: string
  rawMxml?: string
  rawResponse?: string
  savedAt?: number
}

const cacheKey = (tuneId: number, mode: OcrMode) => `nc:${tuneId}:${mode}`

function loadCache(tuneId: number, mode: OcrMode): OcrResult | null {
  try {
    const raw = localStorage.getItem(cacheKey(tuneId, mode))
    return raw ? (JSON.parse(raw) as OcrResult) : null
  } catch { return null }
}

function saveCache(tuneId: number, mode: OcrMode, result: OcrResult) {
  try {
    localStorage.setItem(cacheKey(tuneId, mode), JSON.stringify({ ...result, savedAt: Date.now() }))
  } catch { /* storage full */ }
}

function clearCache(tuneId: number, mode: OcrMode) {
  try { localStorage.removeItem(cacheKey(tuneId, mode)) } catch { /* ignore */ }
}

function scanCachedTuneIds(): Set<number> {
  const ids = new Set<number>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('nc:')) {
        const id = parseInt(k.split(':')[1])
        if (!isNaN(id)) ids.add(id)
      }
    }
  } catch { /* SSR */ }
  return ids
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function toYouTubeEmbed(url: string | null): string | null {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

function toSoundCloudEmbed(url: string | null): string | null {
  if (!url || !url.startsWith('http') || !url.includes('soundcloud.com')) return null
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TuneImage({ name, type }: { name: string; type: 'staff' | 'solfege' }) {
  const slug = slugify(name)
  const src = `/tunes/${slug}-${type}-0.jpg`
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="border rounded p-6 text-center text-muted-foreground text-sm">
        No {type} image<br /><span className="text-xs opacity-50">{slug}</span>
      </div>
    )
  }
  return <img key={src} src={src} alt={name} onError={() => setFailed(true)} className="w-full border rounded bg-white" />
}

function MediaPanel({ tune }: { tune: TuneRow }) {
  const ytEmbed = toYouTubeEmbed(tune.youtubeUrl)
  const scEmbed = toSoundCloudEmbed(tune.soundcloudUrl)
  if (!ytEmbed && !scEmbed) return null
  return (
    <div className="mt-4 border-t pt-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Recording</div>
      <div className="flex flex-col gap-3">
        {ytEmbed && (
          <iframe src={ytEmbed} title={`${tune.name} YouTube`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen className="w-full rounded border" style={{ height: 220 }} />
        )}
        {scEmbed && (
          <iframe scrolling="no" frameBorder="no" allow="autoplay" src={scEmbed}
            title={`${tune.name} SoundCloud`} className="w-full rounded border" style={{ height: 166 }} />
        )}
      </div>
    </div>
  )
}

function AbcSection({ label, abc, tuneName, extras }: {
  label: string; abc: string; tuneName: string; extras?: React.ReactNode
}) {
  return (
    <div className="mt-4 border-t pt-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
      <AbcPlayerPanel abc={abc} title={tuneName} />
      {extras}
    </div>
  )
}

function OcrPanel({
  tuneId, tuneName, mode, label, timeWarning, onResultSaved,
}: {
  tuneId: number
  tuneName: string
  mode: OcrMode
  label: string
  timeWarning?: string
  onResultSaved?: (tuneId: number) => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<OcrResult | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState('')

  // Load from cache whenever tune or mode changes
  useEffect(() => {
    const cached = loadCache(tuneId, mode)
    if (cached) {
      setResult(cached)
      setState('done')
      setFromCache(true)
      setError('')
    } else {
      setState('idle')
      setResult(null)
      setFromCache(false)
      setError('')
    }
  }, [tuneId, mode])

  const run = async () => {
    setState('loading')
    setFromCache(false)
    setResult(null)
    setError('')
    try {
      const res = await fetch(`/api/dev/test-ocr?tuneId=${tuneId}&mode=${mode}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      saveCache(tuneId, mode, data)
      setResult(data)
      setState('done')
      setFromCache(false)
      onResultSaved?.(tuneId)
    } catch (e) {
      setError(String(e))
      setState('error')
    }
  }

  const handleClear = () => {
    clearCache(tuneId, mode)
    setState('idle')
    setResult(null)
    setFromCache(false)
    setError('')
  }

  const savedAt = result?.savedAt
    ? new Date(result.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>

        {fromCache && savedAt && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            cached {savedAt}
          </span>
        )}

        <button
          onClick={run}
          disabled={state === 'loading'}
          className="px-3 py-1 rounded border text-sm hover:bg-muted disabled:opacity-50"
        >
          {state === 'loading'
            ? `Running… (${timeWarning ?? '…'})`
            : fromCache ? 'Re-run' : `Run ${label}`}
        </button>

        {fromCache && (
          <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground underline">
            clear
          </button>
        )}

        {state === 'loading' && (
          <span className="text-xs text-muted-foreground animate-pulse">{timeWarning ?? 'processing…'}</span>
        )}
      </div>

      {state === 'error' && (
        <div className="text-sm text-red-600 bg-red-50 rounded p-2 whitespace-pre-wrap">{error}</div>
      )}

      {state === 'done' && result && (
        <div>
          <AbcPlayerPanel abc={result.abc} title={tuneName} />
          <div className="mt-2 flex flex-col gap-1">
            <details>
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">ABC (melody)</summary>
              <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48">{result.abc}</pre>
            </details>
            {result.rawAbc && result.rawAbc !== result.abc && (
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Raw ABC (all voices)</summary>
                <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48">{result.rawAbc}</pre>
              </details>
            )}
            {result.rawMxml && (
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">MusicXML</summary>
                <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48">{result.rawMxml}</pre>
              </details>
            )}
            {result.rawResponse && (
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Claude response</summary>
                <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48">{result.rawResponse}</pre>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function NotationCompareClient({ tunes }: { tunes: TuneRow[] }) {
  const [idx, setIdx] = useState(0)
  const [filter, setFilter] = useState('')
  const [cachedIds, setCachedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setCachedIds(scanCachedTuneIds())
  }, [])

  const handleResultSaved = useCallback((tuneId: number) => {
    setCachedIds(prev => new Set([...prev, tuneId]))
  }, [])

  const filtered = useMemo(() =>
    filter
      ? tunes.filter(t =>
          t.name.toLowerCase().includes(filter.toLowerCase()) ||
          (t.meter ?? '').toLowerCase().includes(filter.toLowerCase())
        )
      : tunes,
    [tunes, filter]
  )

  const tune = filtered[idx] ?? null

  return (
    <div className="min-h-screen bg-background text-foreground p-4 max-w-7xl mx-auto">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Notation Compare</h1>
        <span className="text-muted-foreground text-sm">{filtered.length} tunes</span>
        <input
          type="text"
          placeholder="Filter by name or meter…"
          value={filter}
          onChange={e => { setFilter(e.target.value); setIdx(0) }}
          className="border rounded px-2 py-1 text-sm bg-background w-48"
        />
        {cachedIds.size > 0 && (
          <span className="text-xs text-muted-foreground">
            {cachedIds.size} tune{cachedIds.size !== 1 ? 's' : ''} with cached results
          </span>
        )}
      </div>

      <div className="flex gap-4">
        {/* Tune list */}
        <div className="w-52 shrink-0 border rounded overflow-y-auto max-h-[80vh] text-sm">
          {filtered.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setIdx(i)}
              className={`w-full text-left px-2 py-1 border-b last:border-0 hover:bg-muted transition-colors ${
                i === idx ? 'bg-muted font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-1 min-w-0">
                {cachedIds.has(t.id) && (
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" title="Has cached results" />
                )}
                <span className="text-muted-foreground text-xs shrink-0">{t.meter ?? '—'}</span>
                <span className="truncate">{t.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Comparison panel */}
        {tune ? (
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="text-xl font-medium">{tune.name}</h2>
              <span className="text-muted-foreground text-sm">{tune.meter}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-muted">← Prev</button>
                <button onClick={() => setIdx(i => Math.min(filtered.length - 1, i + 1))} disabled={idx === filtered.length - 1}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-muted">Next →</button>
              </div>
            </div>

            {/* Source images */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Staff score</div>
                <TuneImage key={`${tune.id}-staff`} name={tune.name} type="staff" />
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Solfège</div>
                <TuneImage key={`${tune.id}-solfege`} name={tune.name} type="solfege" />
              </div>
            </div>

            {/* Recording */}
            <MediaPanel key={tune.id} tune={tune} />

            {/* Current DB */}
            <AbcSection
              key={`${tune.id}-db`}
              label="V1 — current DB"
              abc={tune.abcNotation}
              tuneName={tune.name}
              extras={
                <details className="mt-1">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Raw ABC</summary>
                  <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap">{tune.abcNotation}</pre>
                </details>
              }
            />

            {/* OCR panels */}
            <OcrPanel key={`${tune.id}-staff`} tuneId={tune.id} tuneName={tune.name}
              mode="staff" label="Staff → ABC (Claude vision)" timeWarning="~15s"
              onResultSaved={handleResultSaved} />

            <OcrPanel key={`${tune.id}-solfege`} tuneId={tune.id} tuneName={tune.name}
              mode="solfege" label="Sol-fa → ABC (V3 parser)" timeWarning="~15s"
              onResultSaved={handleResultSaved} />

            <OcrPanel key={`${tune.id}-audiveris`} tuneId={tune.id} tuneName={tune.name}
              mode="audiveris" label="Audiveris OMR → ABC" timeWarning="60–90s"
              onResultSaved={handleResultSaved} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No tunes match your filter.
          </div>
        )}
      </div>
    </div>
  )
}
