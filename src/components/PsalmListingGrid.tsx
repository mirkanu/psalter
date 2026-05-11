'use client'
import { useMemo, useState, useRef, useEffect } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useRouter } from "next/navigation"
import { Search, X, ChevronDown, ChevronUp, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PsalmNumberBox } from "./PsalmNumberBox"
import { buildSnippet } from "@/lib/search-utils"

export interface PsalmRow {
  id: number
  displayLabel: string
  slug: string
  firstLine: string | null
  meter: string | null
  kjvExcerpt: string | null
  recommendedTune?: string | null
}

const BOOKS = [
  { num: 'I',   range: '1–41',   start: 1,   end: 41,  sectionId: 'book-1' },
  { num: 'II',  range: '42–72',  start: 42,  end: 72,  sectionId: 'book-2' },
  { num: 'III', range: '73–89',  start: 73,  end: 89,  sectionId: 'book-3' },
  { num: 'IV',  range: '90–106', start: 90,  end: 106, sectionId: 'book-4' },
  { num: 'V',   range: '107–150',start: 107, end: 150, sectionId: 'book-5' },
] as const

function exportCsv(psalms: PsalmRow[]) {
  const headers = ['Psalm #', 'First Line', 'Meter', 'Recommended Tune']
  const rows = psalms.map((p) => [
    String(p.id),
    p.firstLine ?? '',
    p.meter ?? '',
    p.recommendedTune ?? '',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cprc-psalms.csv'
  a.click()
  URL.revokeObjectURL(url)
}

interface PsalmListingGridProps {
  psalms: PsalmRow[]
}

export function PsalmListingGrid({ psalms }: PsalmListingGridProps) {
  const [query, setQuery] = useState('')
  const [advancedOpen, setAdvancedOpen] = useLocalStorage('psalms.advancedOpen', false)
  const [showFirstLine, setShowFirstLine] = useLocalStorage('psalms.showFirstLine', false)
  const [showMeter, setShowMeter] = useLocalStorage('psalms.showMeter', false)
  const [showRecommendedTune, setShowRecommendedTune] = useLocalStorage('psalms.showRecommendedTune', false)
  const [meterFilter, setMeterFilter] = useLocalStorage('psalms.meterFilter', 'all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => { inputRef.current?.focus() }, [])

  const trimmedQuery = query.trim()
  const isNumeric = /^\d+$/.test(trimmedQuery)

  useEffect(() => { setSelectedIndex(0) }, [trimmedQuery, meterFilter])

  const meters = useMemo(() => {
    const unique = Array.from(
      new Set(psalms.map((p) => p.meter).filter((m): m is string => Boolean(m)))
    )
    return unique.sort()
  }, [psalms])

  const filteredPsalms = useMemo(() => {
    const meterFiltered = meterFilter === 'all'
      ? psalms
      : psalms.filter((p) => p.meter === meterFilter)

    if (!trimmedQuery) {
      return meterFiltered.map((p) => ({ ...p, snippet: null as string | null }))
    }

    if (isNumeric) {
      const target = parseInt(trimmedQuery, 10)
      return [...meterFiltered]
        .sort((a, b) => Math.abs(a.id - target) - Math.abs(b.id - target))
        .map((p) => ({ ...p, snippet: null as string | null }))
    }

    const lowerQuery = trimmedQuery.toLowerCase()
    const withMatch = meterFiltered
      .map((p) => {
        const firstLineSnippet = buildSnippet(p.firstLine, trimmedQuery)
        const kjvSnippet = buildSnippet(p.kjvExcerpt, trimmedQuery)
        const snippet = firstLineSnippet ?? kjvSnippet
        const fl = p.firstLine?.toLowerCase() ?? ''
        const relevance = (!lowerQuery.includes(' ') && fl.split(/\s+/).includes(lowerQuery)) ? 0
          : fl.includes(lowerQuery) ? 1
          : 2
        return { ...p, snippet, relevance }
      })
      .filter((p) => p.snippet !== null)
      .sort((a, b) => a.relevance - b.relevance)

    return withMatch.map(({ relevance: _r, ...p }) => p)
  }, [psalms, trimmedQuery, isNumeric, meterFilter])

  const clampedIndex = Math.min(selectedIndex, Math.max(0, filteredPsalms.length - 1))
  const selectedPsalm = filteredPsalms[clampedIndex] ?? null

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && selectedPsalm) {
      router.push(`/psalms/${selectedPsalm.slug}`)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredPsalms.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    }
  }

  const hasAdvancedFilter = showFirstLine || showMeter || showRecommendedTune || meterFilter !== 'all'

  useEffect(() => {
    if (hasAdvancedFilter) setAdvancedOpen(true)
  }, [hasAdvancedFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function clearAdvanced() {
    setShowFirstLine(false)
    setShowMeter(false)
    setShowRecommendedTune(false)
    setMeterFilter('all')
    setAdvancedOpen(false)
  }

  const hasExpanded = showFirstLine || showMeter || showRecommendedTune || (trimmedQuery.length > 0 && !isNumeric)
  const gridCols = hasExpanded
    ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
    : "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(15,minmax(0,1fr))]"

  // Show book sections only when there's no active search or filter
  const isGrouped = !trimmedQuery && meterFilter === 'all'

  function renderGrid(rows: typeof filteredPsalms, shorten119 = false) {
    return (
      <div className={`grid ${gridCols} gap-2`}>
        {rows.map((psalm, idx) => {
          const label = shorten119 && psalm.id === 119
            ? psalm.displayLabel.replace(/^119:/, '')
            : psalm.displayLabel
          return (
            <PsalmNumberBox
              key={psalm.slug}
              psalm={{ ...psalm, displayLabel: label }}
              isTopResult={trimmedQuery.length > 0 && idx === clampedIndex}
              showFirstLine={showFirstLine}
              showMeter={showMeter}
              showRecommendedTune={showRecommendedTune}
              snippet={psalm.snippet ?? null}
              query={trimmedQuery}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div id="psalms-sticky-header" className="sticky top-14 z-20 bg-background py-2 -mx-4 px-4 space-y-2">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by psalm number or keyword…"
            aria-label="Search psalms"
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
            aria-controls="advanced-panel"
            className="text-sm font-normal active:scale-[0.98] px-0 hover:bg-transparent"
          >
            Advanced Filters
            {advancedOpen
              ? <ChevronUp className="h-4 w-4 ml-1" />
              : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>

          {advancedOpen && (
            <div
              id="advanced-panel"
              className="mt-2 bg-muted rounded-lg px-4 py-3 flex flex-wrap gap-6 items-center"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-first-line"
                  checked={showFirstLine}
                  onCheckedChange={(v) => setShowFirstLine(!!v)}
                />
                <label htmlFor="show-first-line" className="text-sm cursor-pointer">
                  Show first line
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-meter"
                  checked={showMeter}
                  onCheckedChange={(v) => setShowMeter(!!v)}
                />
                <label htmlFor="show-meter" className="text-sm cursor-pointer">
                  Show meter
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-recommended-tune"
                  checked={showRecommendedTune}
                  onCheckedChange={(v) => setShowRecommendedTune(!!v)}
                />
                <label htmlFor="show-recommended-tune" className="text-sm cursor-pointer">
                  Show recommended tune
                </label>
              </div>
              <Select
                value={meterFilter}
                onValueChange={(v) => setMeterFilter(v ?? 'all')}
              >
                <SelectTrigger className="w-40" aria-label="Filter by meter">
                  <span className="truncate">
                    {meterFilter === 'all' ? 'All Meters' : meterFilter}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meters</SelectItem>
                  {meters.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasAdvancedFilter && (
                <Button variant="ghost" size="sm" onClick={clearAdvanced} className="text-sm gap-1 ml-auto">
                  <X className="h-3 w-3" />
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results bar with download */}
      <div className={`flex items-center justify-between gap-2 ${isGrouped ? 'pr-10 md:pr-0' : ''}`}>
        <p className="text-sm text-muted-foreground">
          {filteredPsalms.length} {filteredPsalms.length === 1 ? 'versification' : 'versifications'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(psalms)}
          className="gap-1.5 text-sm"
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV
        </Button>
      </div>

      {/* Psalm grid / grouped sections */}
      {filteredPsalms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No psalms found</p>
          <p className="text-sm mt-1">Try a different keyword or clear the search.</p>
        </div>
      ) : isGrouped ? (
        <div className="relative pr-10 md:pr-0">
          {/* Vertical book tabs — mobile only, fixed right side */}
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-px md:hidden">
            {BOOKS.map((book) => (
              <button
                key={book.sectionId}
                onClick={() => {
                  const el = document.getElementById(book.sectionId)
                  if (!el) return
                  const header = document.getElementById('psalms-sticky-header')
                  const headerH = header ? header.offsetHeight : 80
                  const top = window.scrollY + el.getBoundingClientRect().top - 56 - headerH - 8
                  window.scrollTo({ top, behavior: 'smooth' })
                }}
                className="bg-background/95 border border-r-0 border-border rounded-l-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center overflow-hidden w-6 h-14"
              >
                <span className="text-[9px] font-mono whitespace-nowrap rotate-90 block">{book.range}</span>
              </button>
            ))}
          </div>

          {/* Book sections */}
          {BOOKS.map((book) => {
            const bookPsalms = filteredPsalms.filter((p) => p.id >= book.start && p.id <= book.end)
            if (bookPsalms.length === 0) return null
            const has119 = book.start <= 119 && 119 <= book.end
            const ps119 = has119 ? bookPsalms.filter((p) => p.id === 119) : []
            const pre119 = has119 ? bookPsalms.filter((p) => p.id < 119) : bookPsalms
            const post119 = has119 ? bookPsalms.filter((p) => p.id > 119) : []

            return (
              <div key={book.sectionId} id={book.sectionId} className="mb-2 scroll-mt-28">
                {/* Book header */}
                <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    Book {book.num}
                  </span>
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{book.range}</span>
                </div>

                {!has119 && renderGrid(bookPsalms)}

                {has119 && (
                  <>
                    {pre119.length > 0 && renderGrid(pre119)}

                    {/* Psalm 119 sub-section — vertical left bar with label */}
                    {ps119.length > 0 && (
                      <div className="flex gap-2 mt-4">
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <span className="text-sm font-semibold text-muted-foreground [writing-mode:vertical-rl] rotate-180 leading-none mb-1">
                            Psalm 119
                          </span>
                          <div className="flex-1 border-l border-dashed border-border" />
                        </div>
                        <div className={`flex-1 grid ${gridCols} gap-2`}>
                          {ps119.map((psalm) => (
                            <PsalmNumberBox
                              key={psalm.slug}
                              psalm={{ ...psalm, displayLabel: psalm.displayLabel.replace(/^119:/, '') }}
                              isTopResult={false}
                              showFirstLine={showFirstLine}
                              showMeter={showMeter}
                              showRecommendedTune={showRecommendedTune}
                              snippet={psalm.snippet ?? null}
                              query={trimmedQuery}
                              className="px-2 md:px-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {post119.length > 0 && (
                      <div className="mt-2">
                        {renderGrid(post119)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        renderGrid(filteredPsalms)
      )}
    </div>
  )
}
