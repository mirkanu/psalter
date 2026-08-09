'use client'
import { useMemo, useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import Link from "next/link"
import { Search, X, ChevronDown, ChevronUp, Download, Music, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

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
}

type SortBy = 'psalms' | 'name' | 'meter' | 'rp' | 'prca' | 'recording'

function exportCsv(allTunes: TuneRow[]) {
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
    t.soundcloudUrl ?? '',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cprc-tunes.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function TuneTable({ tunes, onSelectTune, hideExport, initialMeter, hideMeterFilter, psalmId }: TuneTableProps) {
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
  // Track whether mobile defaults have been applied
  const [mobileInitDone, setMobileInitDone] = useLocalStorage('tunes.col.mobileInit', false)

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

  // On first visit on mobile, hide non-default columns
  useEffect(() => {
    if (!mobileInitDone && window.innerWidth < 768) {
      setColMood(false)
      setColRp(false)
      setColPrca(false)
      setColHymn(false)
      setColInPrca(false)
      setColRecording(false)
      setMobileInitDone(true)
    } else if (!mobileInitDone) {
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
    // In modal mode: float recommended tunes for this psalm to the top
    if (psalmId != null) {
      sorted.sort((a, b) => {
        const aRec = a.recommendedPsalmIds.includes(psalmId) ? 0 : 1
        const bRec = b.recommendedPsalmIds.includes(psalmId) ? 0 : 1
        return aRec - bRec
      })
    }
    return sorted
  }, [tunes, query, selectedMeter, selectedMood, onlyPrca, onlyFamous, sortBy, psalmId])

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
      <div className={onSelectTune ? "space-y-2" : "sticky top-14 z-20 bg-background py-2 -mx-4 px-4 space-y-2"}>
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Tune Name</th>
                {colMeter && (
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap w-12 max-w-[3rem]">Meter</th>
                )}
                {colPsalms && (
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Recommended Psalms</th>
                )}
                {colMood && (
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Mood</th>
                )}
                {colRp && (
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap"># 1979 RP</th>
                )}
                {colPrca && (
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap"># 1912 PRCA</th>
                )}
                {colHymn && (
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Famous Hymn</th>
                )}
                {colInPrca && (
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">In PRCA</th>
                )}
                {colRecording && !onSelectTune && (
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Recording</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((tune) => {
                const psalmDisplay = tune.recommendedPsalmIds.length > 8
                  ? tune.recommendedPsalmIds.slice(0, 8).join(', ') + ` +${tune.recommendedPsalmIds.length - 8}`
                  : tune.recommendedPsalmIds.join(', ')
                return (
                  <tr
                    key={tune.id}
                    className={`hover:bg-muted/30 transition-colors group${onSelectTune ? ' cursor-pointer hover:bg-muted/50' : ''}`}
                    onClick={onSelectTune ? () => onSelectTune(tune) : undefined}
                  >
                    <td className="px-3 py-2.5 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {psalmId != null && tune.recommendedPsalmIds.includes(psalmId) && (
                          <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Recommended for this psalm" />
                        )}
                        {onSelectTune ? (
                          <span className="group-hover:underline underline-offset-2">
                            {tune.name ?? `Tune ${tune.id}`}
                          </span>
                        ) : (
                          <Link
                            href={`/tunes/${tune.slug}`}
                            className="hover:text-primary transition-colors group-hover:underline underline-offset-2"
                          >
                            {tune.name ?? `Tune ${tune.id}`}
                          </Link>
                        )}
                      </span>
                    </td>
                    {colMeter && (
                      <td className="px-3 py-2.5 text-muted-foreground w-12 max-w-[3rem] overflow-hidden">
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
                      <td className="px-3 py-2.5">
                        {tune.recommendedPsalmIds.length > 0 ? (
                          <span className="text-muted-foreground font-mono text-xs">
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
                      <td className="px-3 py-2.5 text-center">
                        {tune.soundcloudUrl ? (
                          <a
                            href={tune.soundcloudUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Listen on SoundCloud"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Music className="h-4 w-4 text-primary mx-auto" />
                          </a>
                        ) : null}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
