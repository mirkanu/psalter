'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo, useEffect, useCallback } from 'react'
import type { TuneRow } from './page'
import { solFaToAbc, solFaToAbcMultiVoice } from '@/lib/solfege-parser'
import { HYMNARY_FETCH_IDS } from '@/lib/hymnary-lookup'

const AbcPlayerPanel = dynamic(() => import('./AbcPlayerPanel'), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────

type OcrMode = 'staff' | 'solfege' | 'audiveris' | 'ocr-text' | 'hymnary'

interface OcrResult {
  abc: string
  rawAbc?: string
  rawMxml?: string
  rawResponse?: string
  hymnaryUrl?: string
  doh?: string
  time?: string
  soprano?: string
  savedAt?: number
}

type PanelKey = 'staffImage' | 'solfegeImage' | 'recording' | 'currentDb' | 'ocrText' | 'staffOcr' | 'solfegeOcr' | 'audiveris' | 'hymnary'

type VisiblePanels = Record<PanelKey, boolean>

const PANEL_LABELS: Record<PanelKey, string> = {
  staffImage:  'Staff image',
  solfegeImage: 'Solfège image',
  recording:   'Recording',
  currentDb:   'V1 current DB',
  ocrText:     'OCR text (editable)',
  staffOcr:    'Staff → ABC',
  solfegeOcr:  'Sol-fa → ABC (V3)',
  audiveris:   'Audiveris OMR',
  hymnary:     'Hymnary MusicXML',
}

const DEFAULT_PANELS: VisiblePanels = {
  staffImage: true, solfegeImage: true, recording: true, currentDb: true,
  ocrText: true, staffOcr: true, solfegeOcr: true, audiveris: true, hymnary: true,
}

const VISIBILITY_KEY = 'nc:visibility'

function loadVisibility(): VisiblePanels {
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY)
    return raw ? { ...DEFAULT_PANELS, ...JSON.parse(raw) } : { ...DEFAULT_PANELS }
  } catch { return { ...DEFAULT_PANELS } }
}

function saveVisibility(v: VisiblePanels) {
  try { localStorage.setItem(VISIBILITY_KEY, JSON.stringify(v)) } catch { /* ignore */ }
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

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

async function saveToDb(tuneId: number, mode: OcrMode, result: OcrResult) {
  try {
    await fetch('/api/dev/tune-ocr-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tuneId, mode, result }),
    })
  } catch { /* best-effort, don't block UI */ }
}

async function loadFromDb(tuneId: number, mode: OcrMode): Promise<OcrResult | null> {
  try {
    const res = await fetch(`/api/dev/tune-ocr-result?tuneId=${tuneId}&mode=${mode}`)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

function scanCachedResults(): Map<number, Set<OcrMode>> {
  const map = new Map<number, Set<OcrMode>>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('nc:') && k !== VISIBILITY_KEY) {
        const parts = k.split(':')
        if (parts.length === 3) {
          const id = parseInt(parts[1])
          const mode = parts[2] as OcrMode
          if (!isNaN(id)) {
            if (!map.has(id)) map.set(id, new Set())
            map.get(id)!.add(mode)
          }
        }
      }
    }
  } catch { /* SSR */ }
  return map
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
  tuneId, tuneName, mode, label, timeWarning, preloadAbc, onResultSaved,
}: {
  tuneId: number
  tuneName: string
  mode: OcrMode
  label: string
  timeWarning?: string
  preloadAbc?: string | null
  onResultSaved?: (tuneId: number, mode: OcrMode) => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<OcrResult | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [fromDb, setFromDb] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const cached = loadCache(tuneId, mode)
    if (cached) {
      setResult(cached)
      setState('done')
      setFromCache(true)
      setFromDb(false)
      setError('')
    } else if (preloadAbc) {
      setResult({ abc: preloadAbc })
      setState('done')
      setFromCache(false)
      setFromDb(true)
      setError('')
    } else {
      // Try DB as fallback
      setState('loading')
      loadFromDb(tuneId, mode).then(dbResult => {
        if (dbResult) {
          saveCache(tuneId, mode, dbResult)  // warm the localStorage cache
          setResult(dbResult)
          setState('done')
          setFromCache(false)
          setFromDb(true)
        } else {
          setState('idle')
          setResult(null)
          setFromCache(false)
          setFromDb(false)
        }
      })
      setError('')
    }
  }, [tuneId, mode, preloadAbc])

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
      saveToDb(tuneId, mode, data)  // fire and forget
      setResult(data)
      setState('done')
      setFromCache(false)
      onResultSaved?.(tuneId, mode)
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
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">cached {savedAt}</span>
        )}
        {fromDb && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">from DB import</span>
        )}
        <button onClick={run} disabled={state === 'loading'}
          className="px-3 py-1 rounded border text-sm hover:bg-muted disabled:opacity-50">
          {state === 'loading' ? `Running… (${timeWarning ?? '…'})` : (fromCache || fromDb) ? 'Re-fetch' : `Run ${label}`}
        </button>
        {fromCache && (
          <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground underline">clear</button>
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
            {result.hymnaryUrl && (
              <div className="text-xs text-muted-foreground">
                Source: <a href={result.hymnaryUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{result.hymnaryUrl}</a>
              </div>
            )}
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

interface OcrTextResult {
  doh: string
  time: string
  soprano: string
  alto: string
  tenor: string
  bass: string
  lah?: string
  mode?: string
  rawResponse?: string
  savedAt?: number
}

const VOICE_LABELS = ['Soprano', 'Alto', 'Tenor', 'Bass'] as const
type VoiceName = 'soprano' | 'alto' | 'tenor' | 'bass'

function OcrTextPanel({
  tuneId, tuneName, onResultSaved,
}: {
  tuneId: number
  tuneName: string
  onResultSaved?: (tuneId: number, mode: OcrMode) => void
}) {
  const mode: OcrMode = 'ocr-text'
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState('')
  const [doh, setDoh] = useState('C')
  const [time, setTime] = useState('C')
  const [lah, setLah] = useState('')
  const [keyMode, setKeyMode] = useState('')
  const [voices, setVoices] = useState<Record<VoiceName, string>>({ soprano: '', alto: '', tenor: '', bass: '' })
  const [convertedAbc, setConvertedAbc] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [voiceView, setVoiceView] = useState<'satb' | 'soprano'>('satb')

  const resetState = () => {
    setDoh('C'); setTime('C'); setLah(''); setKeyMode('')
    setVoices({ soprano: '', alto: '', tenor: '', bass: '' })
    setConvertedAbc(null); setWarnings([]); setError(''); setVoiceView('satb')
  }

  useEffect(() => {
    const cached = loadCache(tuneId, mode) as (OcrTextResult & { savedAt?: number }) | null
    if (cached) {
      setDoh(cached.doh ?? 'C')
      setTime(cached.time ?? 'C')
      setLah(cached.lah ?? '')
      setKeyMode(cached.mode ?? '')
      setVoices({
        soprano: cached.soprano ?? '',
        alto:    cached.alto    ?? '',
        tenor:   cached.tenor   ?? '',
        bass:    cached.bass    ?? '',
      })
      setState('done')
      setFromCache(true)
    } else {
      loadFromDb(tuneId, mode).then(dbResult => {
        if (dbResult) {
          const r = dbResult as unknown as OcrTextResult & { savedAt?: number }
          saveCache(tuneId, mode, dbResult)
          setDoh(r.doh ?? 'C')
          setTime(r.time ?? 'C')
          setLah(r.lah ?? '')
          setKeyMode(r.mode ?? '')
          setVoices({ soprano: r.soprano ?? '', alto: r.alto ?? '', tenor: r.tenor ?? '', bass: r.bass ?? '' })
          setState('done')
          setFromCache(false)
        } else {
          setState('idle')
          resetState()
        }
        setFromCache(false)
      })
    }
    setConvertedAbc(null)
    setWarnings([])
    setError('')
  }, [tuneId])

  const run = async () => {
    setState('loading')
    setFromCache(false)
    setConvertedAbc(null)
    setWarnings([])
    setError('')
    try {
      const res = await fetch(`/api/dev/test-ocr?tuneId=${tuneId}&mode=ocr-text`)
      const data = await res.json() as OcrTextResult
      if (!res.ok) throw new Error((data as unknown as { error: string }).error ?? 'Request failed')
      setDoh(data.doh ?? 'C')
      setTime(data.time ?? 'C')
      setLah(data.lah ?? '')
      setKeyMode(data.mode ?? '')
      setVoices({
        soprano: data.soprano ?? '',
        alto:    data.alto    ?? '',
        tenor:   data.tenor   ?? '',
        bass:    data.bass    ?? '',
      })
      saveCache(tuneId, mode, data as unknown as OcrResult)
      saveToDb(tuneId, mode, data as unknown as OcrResult)  // fire and forget
      setState('done')
      setFromCache(false)
      onResultSaved?.(tuneId, mode)
    } catch (e) {
      setError(String(e))
      setState('error')
    }
  }

  const handleClear = () => {
    clearCache(tuneId, mode)
    setState('idle')
    resetState()
    setFromCache(false)
  }

  const convert = () => {
    const { abc, warnings: w } = solFaToAbcMultiVoice(voices, doh, time, tuneName, lah || undefined, keyMode || undefined)
    setConvertedAbc(abc)
    setWarnings(w)
    setVoiceView('satb')
  }

  const displayAbc = (() => {
    if (!convertedAbc) return null
    if (voiceView === 'soprano') {
      return solFaToAbc(voices.soprano, doh, time, tuneName, lah || undefined, keyMode || undefined).abc
    }
    return convertedAbc
  })()

  const savedAt = (() => {
    try {
      const raw = localStorage.getItem(cacheKey(tuneId, mode))
      const d = raw ? (JSON.parse(raw) as { savedAt?: number }) : null
      return d?.savedAt
        ? new Date(d.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : null
    } catch { return null }
  })()

  const hasAnyVoice = Object.values(voices).some(v => v.length > 0)

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">OCR text (editable)</span>
        {fromCache && savedAt && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">cached {savedAt}</span>
        )}
        <button onClick={run} disabled={state === 'loading'}
          className="px-3 py-1 rounded border text-sm hover:bg-muted disabled:opacity-50">
          {state === 'loading' ? 'Running… (~20s)' : fromCache ? 'Re-run OCR' : 'Run OCR text'}
        </button>
        {fromCache && (
          <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground underline">clear</button>
        )}
      </div>

      {state === 'error' && (
        <div className="text-sm text-red-600 bg-red-50 rounded p-2 whitespace-pre-wrap">{error}</div>
      )}

      {(state === 'done' || hasAnyVoice) && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-xs text-muted-foreground">DOH =</label>
            <input value={doh} onChange={e => { setDoh(e.target.value); setConvertedAbc(null) }}
              className="border rounded px-2 py-0.5 text-sm w-16 bg-background" />
            <label className="text-xs text-muted-foreground">TIME =</label>
            <input value={time} onChange={e => { setTime(e.target.value); setConvertedAbc(null) }}
              className="border rounded px-2 py-0.5 text-sm w-16 bg-background" />
            {lah && <>
              <label className="text-xs text-muted-foreground">LAH =</label>
              <input value={lah} onChange={e => { setLah(e.target.value); setConvertedAbc(null) }}
                className="border rounded px-2 py-0.5 text-sm w-16 bg-background" />
            </>}
          </div>
          {(['soprano', 'alto', 'tenor', 'bass'] as VoiceName[]).map((v, i) => (
            <div key={v}>
              <div className="text-xs text-muted-foreground mb-0.5">{VOICE_LABELS[i]}</div>
              <textarea
                value={voices[v]}
                onChange={e => { setVoices(prev => ({ ...prev, [v]: e.target.value })); setConvertedAbc(null) }}
                rows={2}
                spellCheck={false}
                placeholder={`:d | d :r | m :— | — ||`}
                className="w-full border rounded px-2 py-1.5 text-sm font-mono bg-background resize-y"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={convert} className="self-start px-3 py-1 rounded border text-sm hover:bg-muted">
              Convert SATB → ABC →
            </button>
            {convertedAbc && (
              <div className="flex rounded border overflow-hidden text-sm">
                <button
                  onClick={() => setVoiceView('satb')}
                  className={`px-2.5 py-1 ${voiceView === 'satb' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                >Full SATB</button>
                <button
                  onClick={() => setVoiceView('soprano')}
                  className={`px-2.5 py-1 border-l ${voiceView === 'soprano' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
                >Soprano only</button>
              </div>
            )}
          </div>
          {warnings.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 rounded p-2">
              {warnings.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          )}
          {displayAbc && (
            <div>
              <AbcPlayerPanel abc={displayAbc} title={tuneName} />
              <details className="mt-1">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">ABC output</summary>
                <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-48">{displayAbc}</pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tune feedback panel ───────────────────────────────────────────────────────

function TuneFeedbackPanel({ tuneId }: { tuneId: number }) {
  const [selectedVersion, setSelectedVersion] = useState<string>('none')
  const [comment, setComment] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/dev/tune-feedback?tuneId=${tuneId}`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          setSelectedVersion(data.selectedVersion ?? 'none')
          setComment(data.comment ?? '')
          setSavedAt(data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null)
        } else {
          setSelectedVersion('none')
          setComment('')
          setSavedAt(null)
        }
        setSaveState('idle')
      })
      .catch(() => {})
  }, [tuneId])

  const save = async () => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/dev/tune-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tuneId, selectedVersion, comment }),
      })
      if (!res.ok) throw new Error('Failed')
      setSaveState('saved')
      setSavedAt(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  const VERSION_OPTIONS = [
    { value: 'none', label: 'None (no good version yet)' },
    { value: 'hymnary', label: 'Hymnary MusicXML' },
    { value: 'staff', label: 'Staff OCR (Claude Vision)' },
    { value: 'solfege', label: 'Sol-fa OCR (Claude Vision)' },
    { value: 'ocr-text', label: 'OCR Text (Claude Vision)' },
    { value: 'audiveris', label: 'Audiveris OMR' },
  ]

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Feedback</span>
        {savedAt && (
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">saved {savedAt}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-muted-foreground shrink-0">Best ABC version:</label>
          <select
            value={selectedVersion}
            onChange={e => setSelectedVersion(e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            {VERSION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          placeholder="Notes on quality, issues, or what to fix..."
          className="w-full border rounded px-2 py-1.5 text-sm bg-background resize-y"
        />
        <button
          onClick={save}
          disabled={saveState === 'saving'}
          className="self-start px-3 py-1 rounded border text-sm hover:bg-muted disabled:opacity-50"
        >
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Error — retry' : 'Save feedback'}
        </button>
      </div>
    </div>
  )
}

// ── Visibility settings dropdown ──────────────────────────────────────────────

function VisibilityMenu({ visible, onChange }: {
  visible: VisiblePanels
  onChange: (v: VisiblePanels) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="px-3 py-1 rounded border text-sm hover:bg-muted">
        Panels ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-background border rounded shadow-lg p-3 min-w-48 flex flex-col gap-1.5">
          {(Object.keys(PANEL_LABELS) as PanelKey[]).map(key => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground">
              <input type="checkbox" checked={visible[key]}
                onChange={e => onChange({ ...visible, [key]: e.target.checked })}
                className="rounded" />
              {PANEL_LABELS[key]}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const MODE_FILTER_OPTIONS: { mode: OcrMode; label: string }[] = [
  { mode: 'hymnary',   label: 'Hymnary' },
  { mode: 'ocr-text',  label: 'OCR text' },
  { mode: 'staff',     label: 'Staff OCR' },
  { mode: 'solfege',   label: 'Sol-fa OCR' },
  { mode: 'audiveris', label: 'Audiveris' },
]

export function NotationCompareClient({ tunes }: { tunes: TuneRow[] }) {
  const [idx, setIdx] = useState(0)
  const [filter, setFilter] = useState('')
  const [hymnaryOnly, setHymnaryOnly] = useState(false)
  const [modeFilter, setModeFilter] = useState<Set<OcrMode>>(new Set())
  const [cachedByMode, setCachedByMode] = useState<Map<number, Set<OcrMode>>>(new Map())
  const [visible, setVisible] = useState<VisiblePanels>({ ...DEFAULT_PANELS })

  useEffect(() => {
    setCachedByMode(scanCachedResults())
    setVisible(loadVisibility())
  }, [])

  const handleVisibilityChange = useCallback((v: VisiblePanels) => {
    setVisible(v)
    saveVisibility(v)
  }, [])

  const handleResultSaved = useCallback((tuneId: number, mode: OcrMode) => {
    setCachedByMode(prev => {
      const next = new Map(prev)
      if (!next.has(tuneId)) next.set(tuneId, new Set())
      next.get(tuneId)!.add(mode)
      return next
    })
  }, [])

  const toggleModeFilter = (mode: OcrMode) => {
    setModeFilter(prev => {
      const next = new Set(prev)
      if (next.has(mode)) next.delete(mode)
      else next.add(mode)
      return next
    })
    setIdx(0)
  }

  const filtered = useMemo(() => {
    let result = tunes
    if (filter) {
      result = result.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        (t.meter ?? '').toLowerCase().includes(filter.toLowerCase())
      )
    }
    if (hymnaryOnly) {
      result = result.filter(t => t.name in HYMNARY_FETCH_IDS)
    }
    if (modeFilter.size > 0) {
      result = result.filter(t => {
        const cached = cachedByMode.get(t.id)
        if (!cached) return false
        return [...modeFilter].some(m => cached.has(m))
      })
    }
    return result
  }, [tunes, filter, hymnaryOnly, modeFilter, cachedByMode])

  const tune = filtered[idx] ?? null

  const totalCached = cachedByMode.size

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
        <button
          onClick={() => { setHymnaryOnly(o => !o); setIdx(0) }}
          className={`px-2 py-0.5 rounded text-xs border transition-colors ${hymnaryOnly ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted'}`}>
          Hymnary only ({Object.keys(HYMNARY_FETCH_IDS).length})
        </button>

        {/* Mode filter chips */}
        <div className="flex gap-1 flex-wrap">
          {MODE_FILTER_OPTIONS.map(({ mode, label }) => {
            const count = [...cachedByMode.values()].filter(s => s.has(mode)).length
            if (count === 0) return null
            const active = modeFilter.has(mode)
            return (
              <button key={mode} onClick={() => toggleModeFilter(mode)}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${active ? 'bg-foreground text-background border-foreground' : 'hover:bg-muted'}`}>
                {label} ({count})
              </button>
            )
          })}
          {modeFilter.size > 0 && (
            <button onClick={() => { setModeFilter(new Set()); setIdx(0) }}
              className="px-2 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground underline">
              clear filter
            </button>
          )}
        </div>
        {totalCached > 0 && modeFilter.size === 0 && (
          <span className="text-xs text-muted-foreground">{totalCached} tune{totalCached !== 1 ? 's' : ''} with results</span>
        )}
        <div className="ml-auto">
          <VisibilityMenu visible={visible} onChange={handleVisibilityChange} />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Tune list */}
        <div className="w-52 shrink-0 border rounded overflow-y-auto max-h-[80vh] text-sm">
          {filtered.map((t, i) => {
            const modes = cachedByMode.get(t.id)
            return (
              <button key={t.id} onClick={() => setIdx(i)}
                className={`w-full text-left px-2 py-1 border-b last:border-0 hover:bg-muted transition-colors ${i === idx ? 'bg-muted font-medium' : ''}`}>
                <div className="flex items-center gap-1 min-w-0">
                  {modes && modes.size > 0 && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" title={[...modes].join(', ')} />
                  )}
                  <span className="text-muted-foreground text-xs shrink-0">{t.meter ?? '—'}</span>
                  <span className="truncate">{t.name}</span>
                </div>
              </button>
            )
          })}
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
            {(visible.staffImage || visible.solfegeImage) && (
              <div className="grid grid-cols-2 gap-4">
                {visible.staffImage && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Staff score</div>
                    <TuneImage key={`${tune.id}-staff`} name={tune.name} type="staff" />
                  </div>
                )}
                {visible.solfegeImage && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Solfège</div>
                    <TuneImage key={`${tune.id}-solfege`} name={tune.name} type="solfege" />
                  </div>
                )}
              </div>
            )}

            {/* Recording */}
            {visible.recording && <MediaPanel key={tune.id} tune={tune} />}

            {/* Current DB */}
            {visible.currentDb && (
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
            )}

            {/* OCR text */}
            {visible.ocrText && (
              <OcrTextPanel key={`${tune.id}-ocr-text`} tuneId={tune.id} tuneName={tune.name}
                onResultSaved={handleResultSaved} />
            )}

            {/* Hymnary MusicXML */}
            {visible.hymnary && (
              <OcrPanel key={`${tune.id}-hymnary`} tuneId={tune.id} tuneName={tune.name}
                mode="hymnary" label="Hymnary MusicXML → ABC" timeWarning="~5s"
                preloadAbc={tune.hymnaryAbc}
                onResultSaved={handleResultSaved} />
            )}

            {/* Staff OCR */}
            {visible.staffOcr && (
              <OcrPanel key={`${tune.id}-staff`} tuneId={tune.id} tuneName={tune.name}
                mode="staff" label="Staff → ABC (Claude vision)" timeWarning="~15s"
                onResultSaved={handleResultSaved} />
            )}

            {/* Sol-fa OCR */}
            {visible.solfegeOcr && (
              <OcrPanel key={`${tune.id}-solfege`} tuneId={tune.id} tuneName={tune.name}
                mode="solfege" label="Sol-fa → ABC (V3 parser)" timeWarning="~15s"
                onResultSaved={handleResultSaved} />
            )}

            {/* Audiveris */}
            {visible.audiveris && (
              <OcrPanel key={`${tune.id}-audiveris`} tuneId={tune.id} tuneName={tune.name}
                mode="audiveris" label="Audiveris OMR → ABC" timeWarning="60–90s"
                onResultSaved={handleResultSaved} />
            )}

            {/* Feedback */}
            <TuneFeedbackPanel key={`${tune.id}-feedback`} tuneId={tune.id} />
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
