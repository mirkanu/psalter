'use client'
import { useMemo, useState, useRef, useEffect } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import Link from "next/link"
import { Search, X, ChevronDown, ChevronUp, Download, Music } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

export interface TuneRow {
  id: number
  name: string | null
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
}

interface TuneTableProps {
  tunes: TuneRow[]
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

export function TuneTable({ tunes }: TuneTableProps) {
  const [query, setQuery] = useState('')
  const [advancedOpen, setAdvancedOpen] = useLocalStorage('tunes.advancedOpen', false)
  const [selectedMeter, setSelectedMeter] = useLocalStorage('tunes.selectedMeter', 'all')
  const [selectedMood, setSelectedMood] = useLocalStorage('tunes.selectedMood', 'all')
  const [onlyPrca, setOnlyPrca] = useLocalStorage('tunes.onlyPrca', false)
  const [onlyFamous, setOnlyFamous] = useLocalStorage('tunes.onlyFamous', false)
  const [showRecording, setShowRecording] = useLocalStorage('tunes.showRecording', false)
  const [sortBy, setSortBy] = useLocalStorage<SortBy>('tunes.sortBy', 'psalms')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

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

    return [...base].sort((a, b) => {
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
          // tunes with recording first
          if (!!a.soundcloudUrl === !!b.soundcloudUrl) return (a.name ?? '').localeCompare(b.name ?? '')
          return a.soundcloudUrl ? -1 : 1
        case 'psalms':
        default:
          return b.recommendedPsalmIds.length - a.recommendedPsalmIds.length || (a.name ?? '').localeCompare(b.name ?? '')
      }
    })
  }, [tunes, query, selectedMeter, selectedMood, onlyPrca, onlyFamous, sortBy])

  const hasFilter = query || selectedMeter !== 'all' || selectedMood !== 'all' || onlyPrca || onlyFamous
  const hasAdvancedFilter = selectedMeter !== 'all' || selectedMood !== 'all' || onlyPrca || onlyFamous

  useEffect(() => {
    if (hasAdvancedFilter) setAdvancedOpen(true)
  }, [hasAdvancedFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function clearAdvanced() {
    setSelectedMeter('all')
    setSelectedMood('all')
    setOnlyPrca(false)
    setOnlyFamous(false)
    setAdvancedOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* SoundCloud hero box */}
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

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          Advanced Filters
          {advancedOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>

        {advancedOpen && (
          <div
            id="tunes-advanced-panel"
            className="mt-2 bg-muted rounded-lg px-4 py-3 flex flex-wrap gap-6 items-center"
          >
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
              <Checkbox
                id="show-recording"
                checked={showRecording}
                onCheckedChange={(v) => setShowRecording(!!v)}
              />
              <label htmlFor="show-recording" className="text-sm cursor-pointer">
                Show Recording column
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
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'tune' : 'tunes'}
          {hasFilter && ` (filtered from ${tunes.length})`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(tunes)}
          className="gap-1.5 text-sm"
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV
        </Button>
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
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Meter</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Recommended Psalms</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Mood</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap"># 1979 RP</th>
                <th className="text-right px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap"># 1912 PRCA</th>
                <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Famous Hymn</th>
                {showRecording && (
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
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-3 py-2.5 font-medium">
                      <Link
                        href={`/tunes/${tune.id}`}
                        className="hover:text-primary transition-colors group-hover:underline underline-offset-2"
                      >
                        {tune.name ?? `Tune ${tune.id}`}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                      {tune.meter ? (
                        <Badge variant="secondary" className="text-xs font-normal">{tune.meter}</Badge>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {tune.recommendedPsalmIds.length > 0 ? (
                        <span className="text-muted-foreground font-mono text-xs">
                          <span className="text-foreground font-semibold mr-1.5">{tune.recommendedPsalmIds.length}</span>
                          {psalmDisplay}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {tune.moods.length > 0 ? (
                        <span className="text-muted-foreground text-xs">{tune.moods.join(', ')}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
                      {tune.numberIn1979RpPsalter ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
                      {tune.numInPrcaPsalter ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {tune.famousHymn ?? '—'}
                    </td>
                    {showRecording && (
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
