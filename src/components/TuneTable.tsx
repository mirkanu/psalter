'use client'
import { Fragment, useMemo, useState, useRef, useEffect, useLayoutEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import Link from "next/link"
import { Search, X, ChevronDown, ChevronUp, Download, Music, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { TuneRowInlinePlayer, hasAnyTuneMedia } from "@/components/tunes/TuneRowInlinePlayer"
import { TieredTuneRowList } from "@/components/tune-picker/TieredTuneRowList"
import type { PsalmVersionTuneTiers } from "@/db/queries/tunes"

export interface TuneRow {
  id: number
  name: string | null
  slug: string
  meter: string | null
  scoreJpgUrl: string | null
  inPrcaPsalter: boolean
  hasFamousHymn: boolean
  famousHymn: string | null
  numberIn1979RpPsalter: number | null
  numInPrcaPsalter: number | null
  moods: string[]
  recommendedPsalmIds: number[]
  soundcloudUrl: string | null
  solfegeJpgUrl: string | null
  youtubeUrl: string | null
  abcNotation: string | null
  abcSatb: string | null
  phraseShapeOverride: number[] | null
  doubleLength: boolean
  solfegeOcrText: string | null
  /** Global tie-breaker inside the 'other' tier (src/lib/tune-tiers.ts TierableTune). */
  weightedHistoricalFrequency: number
  /** Filesystem-derived score images (src/lib/tune-jpg-urls.ts). DB columns are NULL for all tunes. */
  staffPages: string[]
  solfegePages: string[]
}

interface TuneTableProps {
  tunes: TuneRow[]
  onSelectTune?: (tune: TuneRow) => void
  hideExport?: boolean
  initialMeter?: string | null  // pre-filter to psalm's meter in modal mode
  hideMeterFilter?: boolean     // hide the meter filter select (modal mode with locked meter)
  psalmId?: number              // highlight recommended tunes for this psalm
  /**
   * TSEL-01/D-13: when supplied (precentor picker only), rows are grouped Backup → Historical → Other via
   * the shared TieredTuneRowList. Absent on the standalone /tunes page, which stays untiered (D-07).
   */
  tuneTiers?: PsalmVersionTuneTiers | null
  /**
   * TLIST-03 / iOS Safari: server-detected (from the request's User-Agent header) rather than client-
   * detected. Client-side detection (navigator.userAgent read in an effect) still starts `false` on the
   * very first render even with useLayoutEffect, which is itself a JS-driven post-mount class toggle —
   * exactly the pattern that's proven unreliable on iOS Safari for this bug (sticky offset, then the
   * overflow-x-auto toggle, both got stuck at their wrong first-paint value until an unrelated forced
   * repaint). Passing this down as a prop bakes the correct value into the FIRST server-rendered HTML, so
   * there is no client-side toggle for iOS detection itself. Falls back to client-side detection when
   * omitted (e.g. modal contexts nested under client components with no request-header access).
   */
  isIOS?: boolean
}

/** Tiering only makes sense when there is at least one backup or historical tune to separate out. */
export function shouldTierRows(tuneTiers?: PsalmVersionTuneTiers | null): boolean {
  if (!tuneTiers) return false
  return tuneTiers.backupTuneIds.length + tuneTiers.historicalTuneIds.length > 0
}

type SortBy = 'psalms' | 'name' | 'meter' | 'rp' | 'prca' | 'recording'

export function buildTuneCsv(allTunes: TuneRow[]): string {
  const headers = ['Tune Name', 'Meter', 'Recommended Psalms', 'Psalm Count', 'Mood', '# 1979 RP Psalter', '# 1912 PRCA Psalter', 'Famous Hymn', 'In PRCA Psalter', 'SoundCloud']
  const rows = allTunes.map((t) => [
    t.name ?? '',
    t.meter ?? '',
    t.recommendedPsalmIds.join(', '),
    String(t.recommendedPsalmIds.length),
    t.moods.join(', '),
    t.numberIn1979RpPsalter != null ? String(t.numberIn1979RpPsalter) : '',
    t.numInPrcaPsalter != null ? String(t.numInPrcaPsalter) : '',
    t.famousHymn ?? '',
    t.inPrcaPsalter ? 'Yes' : 'No',
    // D-11: the RAW SoundCloud destination URL. The TLIST-04 inline player derives its embed URL at
    // render time and never writes back to this field.
    t.soundcloudUrl ?? '',
  ])
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

function exportCsv(allTunes: TuneRow[]) {
  const blob = new Blob([buildTuneCsv(allTunes)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cprc-tunes.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * TLIST-02 / D-09: the default mobile column set is Tune Name, Meter, Recommended Psalms, Recording.
 * Everything else is opt-in via "Advanced Filters & Columns". Recording is deliberately ABSENT from this
 * list — before Phase 11 the mobile-init effect hid it, which was the exact opposite of TLIST-02.
 */
export const MOBILE_HIDDEN_COLUMN_KEYS = ['mood', 'rp', 'prca', 'hymn', 'inPrca'] as const

/** TLIST-02: fewer psalm numbers before truncating on narrow viewports (UI-SPEC Patterns 2). */
export function truncatePsalmIds(ids: number[], limit: number): string {
  if (ids.length <= limit) return ids.join(', ')
  return ids.slice(0, limit).join(', ') + ` +${ids.length - limit}`
}
export const PSALM_IDS_LIMIT_DESKTOP = 8
export const PSALM_IDS_LIMIT_MOBILE = 3

export function TuneTable({ tunes, onSelectTune, hideExport, initialMeter, hideMeterFilter, psalmId, tuneTiers, isIOS: isIOSProp }: TuneTableProps) {
  const tiered = shouldTierRows(tuneTiers)
  const router = useRouter()
  const [query, setQuery] = useState('')
  // In modal mode, always start collapsed and don't persist to localStorage
  const [savedAdvancedOpen, setSavedAdvancedOpen] = useLocalStorage('tunes.advancedOpen', false)
  const [localAdvancedOpen, setLocalAdvancedOpen] = useState(false)
  const advancedOpen = onSelectTune ? localAdvancedOpen : savedAdvancedOpen
  const setAdvancedOpen = onSelectTune ? setLocalAdvancedOpen : setSavedAdvancedOpen
  // When initialMeter is provided (modal mode), use local state to avoid polluting localStorage
  const [savedMeter, setSavedMeter] = useLocalStorage('tunes.selectedMeter', 'all')
  const [localMeter, setLocalMeter] = useState(initialMeter ?? 'all')
  const selectedMeter = initialMeter !== undefined ? localMeter : savedMeter
  const setSelectedMeter = initialMeter !== undefined ? setLocalMeter : setSavedMeter
  // Reset local meter when initialMeter changes (new psalm selected in modal)
  useEffect(() => {
    if (initialMeter !== undefined) setLocalMeter(initialMeter ?? 'all')
  }, [initialMeter])
  const [selectedMood, setSelectedMood] = useLocalStorage('tunes.selectedMood', 'all')
  const [onlyPrca, setOnlyPrca] = useLocalStorage('tunes.onlyPrca', false)
  const [onlyFamous, setOnlyFamous] = useLocalStorage('tunes.onlyFamous', false)
  const [sortBy, setSortBy] = useLocalStorage<SortBy>('tunes.sortBy', 'psalms')

  // Column visibility — desktop defaults true for all
  const [colMeter, setColMeter] = useLocalStorage('tunes.col.meter', true)
  const [colPsalms, setColPsalms] = useLocalStorage('tunes.col.psalms', true)
  const [colMood, setColMood] = useLocalStorage('tunes.col.mood', true)
  const [colRp, setColRp] = useLocalStorage('tunes.col.rp', true)
  const [colPrca, setColPrca] = useLocalStorage('tunes.col.prca', true)
  const [colHymn, setColHymn] = useLocalStorage('tunes.col.hymn', true)
  const [colInPrca, setColInPrca] = useLocalStorage('tunes.col.inPrca', true)
  const [colRecording, setColRecording] = useLocalStorage('tunes.col.recording', true)
  // Track whether mobile defaults have been applied.
  // v2: bumped in Phase 11 so the corrected TLIST-02 defaults (Recording ON) re-apply once for users whose
  // browser already ran the v1 effect, which hid Recording.
  // Value intentionally unused — see the mobileInit effect below for why the persisted flag is
  // read directly from localStorage instead of trusting this hook's (possibly stale-on-mount) state.
  const [, setMobileInitDone] = useLocalStorage('tunes.col.mobileInit.v2', false)
  const isNarrow = useMediaQuery('(max-width: 767px)')

  // TLIST-03: measure the sticky search+filter bar's live height so the <thead> can pin directly below it.
  // useLayoutEffect (not useEffect): iOS Safari has a known bug where a `position: sticky` element whose
  // offset is corrected via a LATER state update (i.e. painted once with a wrong default, then re-painted
  // with the measured value) can get stuck at the stale first-paint offset indefinitely — it only
  // recomputes on an unrelated forced repaint (e.g. switching tabs and back). useLayoutEffect measures and
  // corrects the offset synchronously before the browser's first paint, so the wrong value is never shown.
  //
  // The ResizeObserver alone isn't enough on iOS: it's an async browser callback, and expanding "Advanced
  // Filters & Columns" (which grows the filter bar and needs the thead offset to grow with it) reproduced
  // the exact same stale-offset symptom on a real iPhone — the header rendered stuck at the OLD (shorter)
  // offset, overlapping into the table body, and the observer's callback never visibly corrected it. Unlike
  // an external resize, THIS particular trigger is a React state change we already own (`advancedOpen`), so
  // it's added to the dependency array to force a synchronous re-measure — before the next paint — on the
  // one trigger most likely to change this height. The observer stays as a supplementary safety net for
  // other causes (viewport rotation, font-load reflow, etc).
  const filterBarRef = useRef<HTMLDivElement>(null)
  const [filterBarHeight, setFilterBarHeight] = useState(0)
  useLayoutEffect(() => {
    const el = filterBarRef.current
    if (!el) return
    const report = () => setFilterBarHeight(el.offsetHeight)
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [advancedOpen])

  // TLIST-03: measure SiteHeader's live rendered height rather than hardcoding it. SiteHeader adds
  // `pt-[env(safe-area-inset-top)]` on top of its own h-14 (56px) content, so on a notched/Dynamic-Island
  // iPhone its real height is 56px + the device's safe-area inset — a hardcoded 56 undershoots there,
  // which was pushing the sticky <thead> too high (visually overlapping/misplacing it relative to rows).
  // useLayoutEffect for the same reason as filterBarHeight above (avoids the Safari stuck-sticky bug).
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(56)
  useLayoutEffect(() => {
    const el = document.querySelector<HTMLElement>('[data-site-header]')
    if (!el) return
    const report = () => setSiteHeaderHeight(el.offsetHeight)
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // TLIST-04 accordion: at most one expanded row at a time. This bounds live abcjs instances to one per page,
  // consistent with this project's single-synth-instance discipline (STATE.md AbcPlayer/AbcAudioControls notes).
  const [expandedTuneId, setExpandedTuneId] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Only auto-focus on desktop — avoids keyboard popup on mobile when modal opens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      inputRef.current?.focus()
    }
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && filtered.length > 0) {
      if (onSelectTune) {
        onSelectTune(filtered[0])
      } else {
        router.push(`/tunes/${filtered[0].slug}`)
      }
    }
  }

  // On first visit on mobile, apply the corrected TLIST-02 defaults.
  // Reads the persisted flag directly from localStorage rather than trusting the `mobileInitDone`
  // React state value: useLocalStorage initializes state to its default and only resolves the
  // persisted value in its OWN effect after mount. That effect and this one share the SAME render's
  // closures, so `mobileInitDone` here can still read as the stale `false` default even when the
  // real persisted flag is `true` — incorrectly re-treating a returning mobile visitor as first-time
  // and re-narrowing columns (or, depending on batching order, leaving them un-narrowed) on every load.
  //
  // useLayoutEffect (not useEffect): confirmed live on a real iPhone 13 Pro (390px — matches this app's
  // own tested viewport width, ruling out a genuine width-budget shortfall) that the default 4-column set
  // only fits correctly AFTER switching tabs and back — the exact same forced-repaint signature as the
  // sticky-header bug, just triggered here by table-layout:fixed's column widths being computed once
  // against the FIRST-PAINT column set (all 9, since narrowing to 4 previously happened in a post-paint
  // useEffect) and not properly recomputing when 5 columns are later removed from the DOM. Narrowing
  // BEFORE the browser's first paint means the table is laid out against the correct 4-column set from
  // the very first frame — there is no later column-count DOM mutation for table-layout:fixed to (fail to)
  // react to.
  useLayoutEffect(() => {
    let alreadyInitialized = false
    try {
      alreadyInitialized = localStorage.getItem('tunes.col.mobileInit.v2') === 'true'
    } catch { /* ignore */ }
    if (!alreadyInitialized && window.innerWidth < 768) {
      // Default mobile column set (D-09): Tune Name (always on), Meter, Recommended Psalms, Recording.
      setColMeter(true)
      setColPsalms(true)
      setColRecording(true)
      setColMood(false)
      setColRp(false)
      setColPrca(false)
      setColHymn(false)
      setColInPrca(false)
      setMobileInitDone(true)
    } else if (!alreadyInitialized) {
      setMobileInitDone(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const meters = useMemo(() => {
    const s = new Set(tunes.map((t) => t.meter).filter((m): m is string => Boolean(m)))
    return [...s].sort()
  }, [tunes])

  const moods = useMemo(() => {
    const s = new Set(tunes.flatMap((t) => t.moods))
    return [...s].sort()
  }, [tunes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const isNum = /^\d+$/.test(q)
    const base = tunes.filter((t) => {
      if (selectedMeter !== 'all' && t.meter !== selectedMeter) return false
      if (selectedMood !== 'all' && !t.moods.includes(selectedMood)) return false
      if (onlyPrca && !t.inPrcaPsalter) return false
      if (onlyFamous && !t.hasFamousHymn) return false
      if (!q) return true
      if (isNum) {
        const n = parseInt(q, 10)
        return (
          (t.numberIn1979RpPsalter != null && String(t.numberIn1979RpPsalter).includes(q)) ||
          (t.numInPrcaPsalter != null && String(t.numInPrcaPsalter).includes(q)) ||
          t.recommendedPsalmIds.includes(n)
        )
      }
      return (t.name ?? '').toLowerCase().includes(q) ||
        (t.famousHymn ?? '').toLowerCase().includes(q)
    })

    const sorted = [...base].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name ?? '').localeCompare(b.name ?? '')
        case 'meter':
          return (a.meter ?? '').localeCompare(b.meter ?? '')
        case 'rp':
          return (a.numberIn1979RpPsalter ?? 9999) - (b.numberIn1979RpPsalter ?? 9999)
        case 'prca':
          return (a.numInPrcaPsalter ?? 9999) - (b.numInPrcaPsalter ?? 9999)
        case 'recording':
          if (!!a.soundcloudUrl === !!b.soundcloudUrl) return (a.name ?? '').localeCompare(b.name ?? '')
          return a.soundcloudUrl ? -1 : 1
        case 'psalms':
        default:
          return b.recommendedPsalmIds.length - a.recommendedPsalmIds.length || (a.name ?? '').localeCompare(b.name ?? '')
      }
    })
    // In modal mode: float recommended tunes for this psalm to the top.
    // When tier data is available the Backup → Historical → Other order takes precedence (D-13); the Star
    // icon still marks recommended tunes, it just no longer reorders them.
    if (psalmId != null && !tiered) {
      sorted.sort((a, b) => {
        const aRec = a.recommendedPsalmIds.includes(psalmId) ? 0 : 1
        const bRec = b.recommendedPsalmIds.includes(psalmId) ? 0 : 1
        return aRec - bRec
      })
    }
    return sorted
  }, [tunes, query, selectedMeter, selectedMood, onlyPrca, onlyFamous, sortBy, psalmId, tiered])

  // TLIST-03: sticky <thead> offset — siteHeaderHeight is SiteHeader's live measured height (56px on
  // desktop/no-notch; 56px + env(safe-area-inset-top) on a notched/Dynamic-Island phone). In modal mode
  // (TunePickerModal) the DialogContent body is itself the scroll container and the filter bar is not
  // sticky, so the header pins at the container's own top edge.
  const theadTop = onSelectTune ? 0 : siteHeaderHeight + filterBarHeight

  // TLIST-03 / iOS Safari: the real root cause behind a whole cascade of iOS-only bugs here (sticky offset,
  // the overflow-x-auto toggle, mobile column-narrowing, and a table-width regression) turned out to be
  // table-layout: fixed's column-width computation getting cached once and never correctly recomputed
  // after a later change on WebKit. iOS now uses table-layout: auto (see below), which has no such cache
  // to go stale, and sticky-on-<th> + border-separate works reliably there — CONFIRMED on a real iPhone —
  // as long as the table's column STRUCTURE never changes after mount. Toggling a column on/off via
  // "Advanced Filters & Columns" (a perfectly normal, synchronously-batched React update — there is no
  // extra async gap left to fix here) still visibly breaks the stuck position on a real device: the header
  // renders correctly for a moment, then drops down into the table body. This points to a genuine,
  // narrower WebKit limitation — sticky-on-<th> specifically mishandling a column-COUNT change on an
  // already-stuck header — that no amount of effect-timing tuning can route around, since the underlying
  // React update is already synchronous. Rather than keep chasing this, sticky is scoped to the DEFAULT
  // (unmodified) column set on iOS, which is confirmed solid: it turns off the moment the user enables any
  // column beyond TLIST-02's Meter/Psalms/Recording defaults, at which point the header just scrolls away
  // normally — the same graceful degradation already used for the horizontal-scroll fallback in that case.
  const [isIOSDetected, setIsIOSDetected] = useState(isIOSProp ?? false)
  useLayoutEffect(() => {
    if (isIOSProp !== undefined) return // server already told us — skip client re-detection entirely
    setIsIOSDetected(/iPad|iPhone|iPod/.test(navigator.userAgent))
  }, [isIOSProp])
  const isIOS = isIOSProp ?? isIOSDetected
  const hasNonDefaultColumns = colMood || colRp || colPrca || colHymn || colInPrca
  const iosStickyBroken = isIOS && hasNonDefaultColumns
  const stickyTh = iosStickyBroken ? '' : 'sticky z-10'
  const stickyThStyle = iosStickyBroken ? undefined : { top: theadTop }

  // TLIST-03: only create a horizontal scroll container when the table genuinely overflows. An
  // `overflow-x: auto` ancestor is a scroll container on both axes, which would make `position: sticky`
  // resolve against a scrollport that never scrolls vertically — inert. So the wrapper only becomes
  // scrollable when the user opts extra columns back on and the table no longer fits.
  // useLayoutEffect (not useEffect): same reasoning as the filterBarHeight/siteHeaderHeight measurements
  // above — iOS Safari can paint the first (wrong, needsHScroll=false) frame and then fail to properly
  // repaint after the corrected class is applied, leaving columns visibly spilling horizontally until an
  // unrelated forced repaint (switching tabs and back) — reported live on a real iPhone even after the
  // sticky-header fix removed the <thead>/<th> sticky positioning entirely, confirming this is the same
  // underlying "stale paint, not stale layout" WebKit bug class, not specific to position: sticky itself.
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [needsHScroll, setNeedsHScroll] = useState(false)
  useLayoutEffect(() => {
    const wrap = tableWrapRef.current
    const table = tableRef.current
    if (!wrap || !table) return
    // Tolerance wider than a plain rounding guard: table-layout:fixed + border-collapse:collapse tables
    // can report a few px of scrollWidth "phantom" overflow (sub-pixel/border accumulation across many
    // rows) even when every individual cell's own scrollWidth matches its clientWidth exactly — i.e. no
    // visible content actually overflows. Without this, the default 4-column mobile set could spuriously
    // trip the horizontal-scroll fallback (TLIST-02) despite fitting.
    const measure = () => setNeedsHScroll(table.scrollWidth > wrap.clientWidth + 8)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    ro.observe(table)
    return () => ro.disconnect()
  }, [colMeter, colPsalms, colMood, colRp, colPrca, colHymn, colInPrca, colRecording, filtered.length])

  const hasFilter = query || selectedMeter !== 'all' || selectedMood !== 'all' || onlyPrca || onlyFamous
  const hasAdvancedFilter = selectedMeter !== 'all' || selectedMood !== 'all' || onlyPrca || onlyFamous

  // In modal mode, don't auto-open the filter panel even when meter is pre-filtered
  useEffect(() => {
    if (hasAdvancedFilter && !onSelectTune) setAdvancedOpen(true)
  }, [hasAdvancedFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function clearAdvanced() {
    setSelectedMeter('all')
    setSelectedMood('all')
    setOnlyPrca(false)
    setOnlyFamous(false)
    setAdvancedOpen(false)
    // Column visibility is intentionally NOT reset here — it's a separate preference
  }

  const visibleColumnCount =
    1 +
    (colMeter ? 1 : 0) + (colPsalms ? 1 : 0) + (colMood ? 1 : 0) + (colRp ? 1 : 0) +
    (colPrca ? 1 : 0) + (colHymn ? 1 : 0) + (colInPrca ? 1 : 0) +
    (colRecording && !onSelectTune ? 1 : 0)

  function renderTuneRow(tune: TuneRow) {
    const psalmDisplay = truncatePsalmIds(
      tune.recommendedPsalmIds,
      isNarrow ? PSALM_IDS_LIMIT_MOBILE : PSALM_IDS_LIMIT_DESKTOP,
    )
    return (
      <Fragment key={tune.id}>
      <tr
        className={`hover:bg-muted/30 transition-colors group${onSelectTune ? ' cursor-pointer hover:bg-muted/50' : ''}`}
        onClick={onSelectTune ? () => onSelectTune(tune) : undefined}
      >
        <td className="px-3 py-2.5 font-medium overflow-hidden">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            {psalmId != null && tune.recommendedPsalmIds.includes(psalmId) && (
              <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Recommended for this psalm" />
            )}
            {onSelectTune ? (
              <span className="group-hover:underline underline-offset-2 line-clamp-2 min-w-0">
                {tune.name ?? `Tune ${tune.id}`}
              </span>
            ) : (
              <Link
                href={`/tunes/${tune.slug}`}
                className="hover:text-primary transition-colors group-hover:underline underline-offset-2 line-clamp-2 min-w-0"
              >
                {tune.name ?? `Tune ${tune.id}`}
              </Link>
            )}
          </span>
        </td>
        {colMeter && (
          <td className="px-3 py-2.5 text-muted-foreground w-14 overflow-hidden">
            {tune.meter ? (
              <Popover>
                <PopoverTrigger asChild>
                  <span className="cursor-pointer text-xs underline decoration-dotted whitespace-nowrap">
                    {tune.meter.split(' ')[0]}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 text-xs" side="top">
                  {tune.meter}
                </PopoverContent>
              </Popover>
            ) : '—'}
          </td>
        )}
        {colPsalms && (
          <td className="px-3 py-2.5 w-[27%] overflow-hidden">
            {tune.recommendedPsalmIds.length > 0 ? (
              <span className="text-muted-foreground font-mono text-xs break-words">
                <span className="text-foreground font-semibold mr-1.5">{tune.recommendedPsalmIds.length}</span>
                {psalmDisplay}
              </span>
            ) : <span className="text-muted-foreground">—</span>}
          </td>
        )}
        {colMood && (
          <td className="px-3 py-2.5">
            {tune.moods.length > 0 ? (
              <span className="text-muted-foreground text-xs">{tune.moods.join(', ')}</span>
            ) : <span className="text-muted-foreground">—</span>}
          </td>
        )}
        {colRp && (
          <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
            {tune.numberIn1979RpPsalter ?? '—'}
          </td>
        )}
        {colPrca && (
          <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
            {tune.numInPrcaPsalter ?? '—'}
          </td>
        )}
        {colHymn && (
          <td className="px-3 py-2.5 text-muted-foreground text-xs">
            {tune.famousHymn ?? '—'}
          </td>
        )}
        {colInPrca && (
          <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
            {tune.inPrcaPsalter ? 'Yes' : '—'}
          </td>
        )}
        {colRecording && !onSelectTune && (
          <td className="px-2 py-2.5 text-center overflow-hidden w-20">
            {hasAnyTuneMedia(tune) ? (
              <button
                type="button"
                aria-expanded={expandedTuneId === tune.id}
                aria-controls={`tune-player-${tune.id}`}
                aria-label={
                  expandedTuneId === tune.id
                    ? `Hide recording and ABC player for ${tune.name ?? `Tune ${tune.id}`}`
                    : `Play recording or ABC audio for ${tune.name ?? `Tune ${tune.id}`}`
                }
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedTuneId((cur) => (cur === tune.id ? null : tune.id))
                }}
                className={`inline-flex items-center justify-center h-11 w-11 md:h-8 md:w-8 rounded-md transition-colors ${
                  expandedTuneId === tune.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-primary hover:bg-muted'
                }`}
              >
                <Music className="h-4 w-4" />
              </button>
            ) : null}
          </td>
        )}
      </tr>
      {expandedTuneId === tune.id && (
        <tr id={`tune-player-${tune.id}`} className="bg-muted/50">
          <td colSpan={visibleColumnCount} className="px-4 py-3 animate-in fade-in slide-in-from-top-1">
            <TuneRowInlinePlayer tune={tune} />
          </td>
        </tr>
      )}
      </Fragment>
    )
  }

  return (
    <div className="space-y-4">
      {/* SoundCloud hero box — hidden in modal/picker mode */}
      {!onSelectTune && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <Music className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Listen to all the tune recordings to learn them — </span>
            <a
              href="https://soundcloud.com/manuel-kuhs/sets/cprc-psalm-tunes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              complete CPRC playlist on SoundCloud
            </a>
          </div>
        </div>
      )}

      {/* Search + filters — sticky in page context, plain in modal */}
      <div ref={filterBarRef} className={onSelectTune ? "space-y-2" : "sticky top-14 z-20 bg-background py-2 -mx-4 px-4 space-y-2"}>
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type here to search by tune name or Psalter number (RP or PRCA)"
          aria-label="Search tunes"
          className="pl-9 pr-9 w-full"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters toggle */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          aria-expanded={advancedOpen}
          aria-controls="tunes-advanced-panel"
          className="text-sm font-normal active:scale-[0.98] px-0 hover:bg-transparent"
        >
          Advanced Filters &amp; Columns
          {advancedOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>

        {advancedOpen && (
          <div
            id="tunes-advanced-panel"
            className="mt-2 bg-muted rounded-lg px-4 py-3 space-y-4"
          >
            {/* Filters row */}
            <div className="flex flex-wrap gap-6 items-center">
              {!hideMeterFilter && (
                <Select value={selectedMeter} onValueChange={(v) => setSelectedMeter(v ?? 'all')}>
                  <SelectTrigger className="w-44" aria-label="Filter by meter">
                    <span className="truncate">
                      {selectedMeter === 'all' ? 'All Meters' : selectedMeter}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Meters</SelectItem>
                    {meters.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <Select value={selectedMood} onValueChange={(v) => setSelectedMood(v ?? 'all')}>
                <SelectTrigger className="w-44" aria-label="Filter by mood">
                  <span className="truncate">
                    {selectedMood === 'all' ? 'All Moods' : selectedMood}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  {moods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="only-prca"
                  checked={onlyPrca}
                  onCheckedChange={(v) => setOnlyPrca(!!v)}
                />
                <label htmlFor="only-prca" className="text-sm cursor-pointer">
                  In 1912 PRCA Psalter
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="only-famous"
                  checked={onlyFamous}
                  onCheckedChange={(v) => setOnlyFamous(!!v)}
                />
                <label htmlFor="only-famous" className="text-sm cursor-pointer">
                  Well-Known Hymn
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</label>
                <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortBy) ?? 'psalms')}>
                  <SelectTrigger className="w-48" aria-label="Sort by">
                    <span className="truncate">
                      {sortBy === 'psalms' ? 'Recommended Psalms' :
                       sortBy === 'name' ? 'Tune Name' :
                       sortBy === 'meter' ? 'Meter' :
                       sortBy === 'rp' ? 'RP# (1979)' :
                       sortBy === 'prca' ? 'PRCA#' :
                       'Recording'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psalms">Recommended Psalms</SelectItem>
                    <SelectItem value="name">Tune Name</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                    <SelectItem value="rp">RP# (1979)</SelectItem>
                    <SelectItem value="prca">PRCA#</SelectItem>
                    <SelectItem value="recording">Recording</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasAdvancedFilter && (
                <Button variant="ghost" size="sm" onClick={clearAdvanced} className="text-sm gap-1 ml-auto">
                  <X className="h-3 w-3" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Column visibility */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Columns</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-meter"
                    checked={colMeter}
                    onCheckedChange={(v) => setColMeter(!!v)}
                  />
                  <label htmlFor="col-meter" className="text-sm cursor-pointer">Meter</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-psalms"
                    checked={colPsalms}
                    onCheckedChange={(v) => setColPsalms(!!v)}
                  />
                  <label htmlFor="col-psalms" className="text-sm cursor-pointer">Recommended Psalms</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-mood"
                    checked={colMood}
                    onCheckedChange={(v) => setColMood(!!v)}
                  />
                  <label htmlFor="col-mood" className="text-sm cursor-pointer">Mood</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-rp"
                    checked={colRp}
                    onCheckedChange={(v) => setColRp(!!v)}
                  />
                  <label htmlFor="col-rp" className="text-sm cursor-pointer">RP# (1979)</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-prca"
                    checked={colPrca}
                    onCheckedChange={(v) => setColPrca(!!v)}
                  />
                  <label htmlFor="col-prca" className="text-sm cursor-pointer">PRCA#</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-hymn"
                    checked={colHymn}
                    onCheckedChange={(v) => setColHymn(!!v)}
                  />
                  <label htmlFor="col-hymn" className="text-sm cursor-pointer">Famous Hymn</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-inPrca"
                    checked={colInPrca}
                    onCheckedChange={(v) => setColInPrca(!!v)}
                  />
                  <label htmlFor="col-inPrca" className="text-sm cursor-pointer">In PRCA</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="col-recording"
                    checked={colRecording}
                    onCheckedChange={(v) => setColRecording(!!v)}
                  />
                  <label htmlFor="col-recording" className="text-sm cursor-pointer">Recording</label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'tune' : 'tunes'}
          {hasFilter && ` (filtered from ${tunes.length})`}
        </p>
        {!hideExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(tunes)}
            className="gap-1.5 text-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No tunes found</p>
          <p className="text-sm mt-1">Try different search terms or filters.</p>
        </div>
      ) : (
        <div
          ref={tableWrapRef}
          // Back to the JS-computed needsHScroll toggle on all platforms, including iOS. An earlier fix
          // forced overflow-x-auto unconditionally on iOS to sidestep a stale-paint bug — but an always-on
          // scroll-container ancestor makes position: sticky inert (sticky resolves against the nearest
          // scrolling ancestor, and that ancestor never scrolls vertically), which broke the sticky header
          // this same effort is trying to re-enable. The stale-paint bug this was working around turned out
          // to be table-layout:fixed's cached column-width computation (now dropped on iOS, see below), not
          // something specific to this toggle — so needsHScroll (already useLayoutEffect-based) should be
          // safe to rely on again.
          className={`rounded-lg border border-border${needsHScroll ? ' overflow-x-auto' : ''}`}
        >
          {/* table-layout: fixed is dropped on iOS only. Across several reported iOS regressions (sticky
              offset, the overflow-x-auto toggle, mobile column-narrowing), the common thread was
              table-layout:fixed's column widths being computed ONCE and not correctly recomputed after a
              later change (DOM mutation, class toggle, possibly a next/font web-font swap reflow) until an
              unrelated external repaint (switching tabs) forced WebKit to redo it. table-layout: auto has
              no such cached computation to go stale, at the cost of column widths being hints rather than
              a hard guarantee — overflow-x-auto (unconditional on iOS) is the safety net.
              border-separate + border-spacing-0 (overriding Tailwind preflight's default border-collapse)
              stays unconditional on ALL platforms including iOS: it's the documented cross-browser fix for
              Safari's sticky-<th> + border-collapse painting/position bug (w3c/csswg-drafts#3136), and
              — now that it's paired with table-layout:auto instead of :fixed — should no longer trigger
              the separate width-containment regression border-separate caused under :fixed. */}
          <table ref={tableRef} className={`w-full text-sm border-separate border-spacing-0${isIOS ? '' : ' table-fixed'}`}>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-xs [&>th]:bg-muted [&>th]:border-r [&>th]:border-border/60 [&>th:last-child]:border-r-0">
                {/* No explicit width: table-fixed gives this column whatever space remains after the
                    other (explicitly-sized) columns — max-width on a <td> is NOT reliably honoured by
                    the browser's auto table layout algorithm, so an explicit width budget on every other
                    column is what actually keeps the default mobile set (Name/Meter/Psalms/Recording)
                    inside the viewport without horizontal scroll (TLIST-02). */}
                <th className={`text-left px-3 py-2.5 font-medium text-muted-foreground ${stickyTh}`} style={stickyThStyle}>Tune Name</th>
                {colMeter && (
                  <th className={`text-left px-3 py-2.5 font-medium text-muted-foreground w-14 ${stickyTh}`} style={stickyThStyle}>Meter</th>
                )}
                {colPsalms && (
                  <th className={`text-left px-3 py-2.5 font-medium text-muted-foreground w-[27%] ${stickyTh}`} style={stickyThStyle}>Psalms</th>
                )}
                {colMood && (
                  <th className={`text-left px-3 py-2.5 font-medium text-muted-foreground w-24 ${stickyTh}`} style={stickyThStyle}>Mood</th>
                )}
                {colRp && (
                  <th className={`text-right px-3 py-2.5 font-medium text-muted-foreground w-[4.5rem] ${stickyTh}`} style={stickyThStyle}># 1979 RP</th>
                )}
                {colPrca && (
                  <th className={`text-right px-3 py-2.5 font-medium text-muted-foreground w-[4.5rem] ${stickyTh}`} style={stickyThStyle}># 1912 PRCA</th>
                )}
                {colHymn && (
                  <th className={`text-left px-3 py-2.5 font-medium text-muted-foreground w-36 ${stickyTh}`} style={stickyThStyle}>Famous Hymn</th>
                )}
                {colInPrca && (
                  <th className={`text-center px-3 py-2.5 font-medium text-muted-foreground w-16 ${stickyTh}`} style={stickyThStyle}>In PRCA</th>
                )}
                {colRecording && !onSelectTune && (
                  <th className={`text-center px-2 py-2.5 font-medium text-muted-foreground w-20 ${stickyTh}`} style={stickyThStyle}>Recording</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tiered ? (
                <TieredTuneRowList
                  tunes={filtered}
                  tuneTiers={tuneTiers}
                  itemWrapper="fragment"
                  renderHeading={({ tier, label }) => (
                    <tr className="bg-muted/30">
                      <td
                        colSpan={visibleColumnCount}
                        data-tune-tier-heading={tier}
                        className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {label}
                      </td>
                    </tr>
                  )}
                  renderRow={({ tune }) => renderTuneRow(tune)}
                />
              ) : (
                filtered.map((tune) => renderTuneRow(tune))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
