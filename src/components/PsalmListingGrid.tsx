'use client'
import React, { useMemo, useState, useRef, useEffect } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useMediaQuery } from "@/hooks/useMediaQuery"
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
  versionId: number | null
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

// Scrolls to a book section whether the grid is rendered on the full /psalms
// page (window scrolls) or inside a modal's own overflow-y-auto container
// (the window doesn't scroll there — the modal's inner div does).
function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return
  const header = document.getElementById('psalms-sticky-header')
  const headerH = header ? header.offsetHeight : 80

  let scrollParent: HTMLElement | null = el.parentElement
  while (scrollParent) {
    const overflowY = window.getComputedStyle(scrollParent).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') break
    scrollParent = scrollParent.parentElement
  }

  if (scrollParent) {
    const top = scrollParent.scrollTop + el.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top - headerH - 8
    scrollParent.scrollTo({ top, behavior: 'smooth' })
  } else {
    const top = window.scrollY + el.getBoundingClientRect().top - 56 - headerH - 8
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

function exportCsv(psalms: PsalmRow[]) {
  const headers = ['Psalm #', 'First Line', 'Meter', 'Recommended Tune']
  const rows = psalms.map((p) => [
    p.displayLabel,
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
  onSelect?: (psalm: PsalmRow) => void
  hideExport?: boolean
}

export function PsalmListingGrid({ psalms, onSelect, hideExport }: PsalmListingGridProps) {
  const [query, setQuery] = useState('')
  const [advancedOpen, setAdvancedOpen] = useLocalStorage('psalms.advancedOpen', false)
  const [showFirstLine, setShowFirstLine] = useLocalStorage('psalms.showFirstLine', false)
  const [showMeter, setShowMeter] = useLocalStorage('psalms.showMeter', false)
  const [showRecommendedTune, setShowRecommendedTune] = useLocalStorage('psalms.showRecommendedTune', false)
  const [meterFilter, setMeterFilter] = useLocalStorage('psalms.meterFilter', 'all')
  // PSEL-01: session-only, deliberately NOT useLocalStorage — every fresh mount (reload, re-navigation,
  // or a freshly opened PsalmPickerModal) must start with all multi-version groups collapsed.
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({})
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Gap 1 (12-VERIFICATION.md): a single-line input cannot wrap its placeholder, and the full hint is
  // wider than the usable text area on a narrow phone (~176px at a 320px viewport), so use shorter copy
  // below `sm`. useMediaQuery returns false during SSR and first paint, so the server always renders the
  // long string — no hydration mismatch, the short string swaps in on mount.
  const isNarrowViewport = useMediaQuery('(max-width: 639px)')
  const searchPlaceholder = isNarrowViewport
    ? 'Number or keyword…'
    : 'Search by psalm number or keyword…'

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      inputRef.current?.focus()
    }
  }, [])

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
      if (onSelect) { onSelect(selectedPsalm); return }
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

  const hasExpanded = showFirstLine || showRecommendedTune || (trimmedQuery.length > 0 && !isNumeric)
  // Gap 4a: "Show meter" alone used to jump straight to the 7rem column set, which on a 390px phone left
  // only 2 columns of ~155px each holding one small number. A meter-only box needs a middle size, not the
  // full first-line/snippet width. All three classes are written out in full so Tailwind JIT emits them.
  const gridCols = hasExpanded
    ? "grid-cols-[repeat(auto-fill,minmax(7rem,1fr))]"
    : showMeter
      ? "grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]"
      : "grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]"

  // Show book sections only when there's no active search or filter
  const isGrouped = !trimmedQuery && meterFilter === 'all'

  // PSEL-03: the fixed Book I–V tabs (w-6, fixed right-0, tabs-off:hidden) only exist in the grouped view,
  // where the results bar and grid wrapper both reserve the same 40px gutter whenever the tabs are shown.
  // The sticky header must land on the same content-right edge. The full-page branch already bleeds with
  // `-mx-4 pl-4`, so it needs 16px + 40px = pr-14, reverting to pr-4 (its original padding) at `tabs-off:`
  // — i.e. once the viewport is both wide (>=768px) AND tall (>=600px) and the tabs are hidden (Gap 2,
  // D-GAP2 option-a: a landscape phone is wide but short, so it keeps its tabs and its gutter).
  const stickyRightPad = hideExport
    ? (isGrouped ? 'pr-10 tabs-off:pr-0' : '')
    : (isGrouped ? 'pr-14 tabs-off:pr-4' : 'pr-4')

  function renderGrid(rows: typeof filteredPsalms) {
    return (
      <div className={`grid ${gridCols} gap-2`}>
        {rows.map((psalm, idx) => (
          <PsalmNumberBox
            key={psalm.slug}
            psalm={psalm}
            isTopResult={trimmedQuery.length > 0 && idx === clampedIndex}
            showFirstLine={showFirstLine}
            showMeter={showMeter}
            showRecommendedTune={showRecommendedTune}
            snippet={psalm.snippet ?? null}
            query={trimmedQuery}
            onClick={onSelect ? () => onSelect(psalm) : undefined}
          />
        ))}
      </div>
    )
  }

  // Grouped book view: collapses multi-variant psalms (119 stanzas, 50a/50b, etc.)
  // into a single toggle box; expanded panel uses col-span-full to stay in-grid flow.
  function renderBookGrid(bookPsalms: typeof filteredPsalms) {
    const groups: { id: number; entries: typeof filteredPsalms }[] = []
    for (const psalm of bookPsalms) {
      const last = groups[groups.length - 1]
      if (last && last.id === psalm.id) {
        last.entries.push(psalm)
      } else {
        groups.push({ id: psalm.id, entries: [psalm] })
      }
    }

    const items: React.ReactNode[] = []
    for (const { id, entries } of groups) {
      if (entries.length === 1) {
        items.push(
          <PsalmNumberBox
            key={entries[0].slug}
            psalm={entries[0]}
            isTopResult={false}
            showFirstLine={showFirstLine}
            showMeter={showMeter}
            showRecommendedTune={showRecommendedTune}
            snippet={entries[0].snippet ?? null}
            query={trimmedQuery}
            onClick={onSelect ? () => onSelect(entries[0]) : undefined}
          />
        )
      } else {
        const isExpanded = !!expandedIds[id]
        const toggle = () => setExpandedIds(isExpanded ? { [id]: false } : { [id]: true })
        items.push(
          <button
            key={`toggle-${id}`}
            data-version-toggle={id}
            onClick={toggle}
            className={[
              "rounded-lg hover:border-primary transition-colors duration-200 active:bg-muted active:scale-[0.98] transition-transform duration-75",
              "flex items-center justify-center relative min-w-[44px] h-12 md:h-14",
              isExpanded ? "bg-primary/5 border-primary border-2" : "bg-card border border-border",
            ].join(' ')}
            aria-expanded={isExpanded}
            title={`Psalm ${id} – tap to expand`}
          >
            <span className="text-xs font-semibold font-mono tabular-nums text-foreground leading-tight text-center">
              {id}
            </span>
            {isExpanded
              ? <ChevronUp className="absolute bottom-1 right-1 h-2.5 w-2.5 text-muted-foreground" />
              : <ChevronDown className="absolute bottom-1 right-1 h-2.5 w-2.5 text-muted-foreground" />}
          </button>
        )
        if (isExpanded) {
          const is119 = id === 119
          items.push(
            <div key={`panel-${id}`} data-expanded-panel={id} className="col-span-full mt-1 mb-1 rounded-xl border border-border bg-muted/40 px-3 pt-2.5 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                {is119 ? 'Psalm 119, verses:' : `Psalm ${id}`}
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
                {entries.map((psalm) => (
                  <PsalmNumberBox
                    key={psalm.slug}
                    psalm={{ ...psalm, displayLabel: is119 ? psalm.displayLabel.replace(/^119:/, '') : psalm.displayLabel }}
                    isTopResult={false}
                    showFirstLine={showFirstLine}
                    // Gap 3: an expanded group always shows each version's meter — that is the whole point of
                    // opening it — regardless of the Advanced Filters "Show meter" preference.
                    showMeter={true}
                    showRecommendedTune={showRecommendedTune}
                    snippet={psalm.snippet ?? null}
                    query={trimmedQuery}
                    onClick={onSelect ? () => onSelect(psalm) : undefined}
                  />
                ))}
              </div>
              {!is119 && entries.some(p => p.displayLabel.endsWith('*')) && (
                <p className="text-[10px] text-muted-foreground mt-2">* recommended</p>
              )}
            </div>
          )
        }
      }
    }

    return <div className={`grid ${gridCols} gap-2`}>{items}</div>
  }

  return (
    <div className="space-y-4">
      <div
        id="psalms-sticky-header"
        className={[
          hideExport
            ? "sticky top-0 z-20 bg-background pb-2 space-y-2"
            : "sticky top-14 z-20 bg-background py-2 -mx-4 pl-4 space-y-2",
          stickyRightPad,
        ].filter(Boolean).join(' ')}
      >
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-label="Search psalms"
            className="pl-9 pr-9 w-full placeholder:text-xs sm:placeholder:text-sm"
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
            className="text-sm font-normal px-0 hover:bg-transparent"
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
      <div className={`flex items-center justify-between gap-2 ${isGrouped ? 'pr-10 tabs-off:pr-0' : ''}`}>
        <p className="text-sm text-muted-foreground">
          {filteredPsalms.length} {filteredPsalms.length === 1 ? 'versification' : 'versifications'}
        </p>
        {!hideExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(psalms)}
            className="gap-1.5 text-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </Button>
        )}
      </div>

      {/* Psalm grid / grouped sections */}
      {filteredPsalms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No psalms found</p>
          <p className="text-sm mt-1">Try a different keyword or clear the search.</p>
        </div>
      ) : isGrouped ? (
        <div className="relative pr-10 tabs-off:pr-0">
          {/* Vertical book tabs — fixed right side (of the page, or of the enclosing modal); hidden only
              once the viewport is both wide and tall (see `tabs-off` custom-variant in globals.css). */}
          <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-px tabs-off:hidden">
            {BOOKS.map((book) => (
              <button
                key={book.sectionId}
                onClick={() => scrollToSection(book.sectionId)}
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
            return (
              <div key={book.sectionId} id={book.sectionId} className="mb-2 scroll-mt-28">
                <div className="flex items-center gap-3 mb-3 mt-6 first:mt-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    Book {book.num}
                  </span>
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{book.range}</span>
                </div>
                {renderBookGrid(bookPsalms)}
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
