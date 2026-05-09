'use client'
import { useMemo, useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PsalmNumberBox } from "./PsalmNumberBox"

export interface PsalmRow {
  id: number
  firstLine: string | null
  meter: string | null
  kjvExcerpt: string | null
}

interface PsalmListingGridProps {
  psalms: PsalmRow[]
}

function buildSnippet(text: string | null, query: string, maxLen = 80): string | null {
  if (!text || !query) return null
  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lower.indexOf(lowerQuery)
  if (idx === -1) return null
  const start = Math.max(0, idx - 20)
  const end = Math.min(text.length, start + maxLen)
  let excerpt = text.slice(start, end)
  if (start > 0) excerpt = '…' + excerpt
  if (end < text.length) excerpt = excerpt + '…'
  return excerpt
}

export function PsalmListingGrid({ psalms }: PsalmListingGridProps) {
  const [query, setQuery] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showFirstLine, setShowFirstLine] = useState(false)
  const [showMeter, setShowMeter] = useState(false)
  const [meterFilter, setMeterFilter] = useState('all')
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
      router.push(`/psalms/${selectedPsalm.id}`)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filteredPsalms.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    }
  }

  const hasExpanded = showFirstLine || showMeter || (trimmedQuery.length > 0 && !isNumeric)
  const gridCols = hasExpanded
    ? "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
    : "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(15,minmax(0,1fr))]"

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
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
              <span className="text-sm text-muted-foreground">Meter:</span>
              <Select
                value={meterFilter}
                onValueChange={(v) => setMeterFilter(v ?? 'all')}
              >
                <SelectTrigger className="w-40" aria-label="Filter by meter">
                  <SelectValue placeholder="All meters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All meters</SelectItem>
                  {meters.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Psalm grid */}
      {filteredPsalms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No psalms found</p>
          <p className="text-sm mt-1">Try a different keyword or clear the search.</p>
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-2`}>
          {filteredPsalms.map((psalm, idx) => (
            <PsalmNumberBox
              key={psalm.id}
              psalm={psalm}
              isTopResult={trimmedQuery.length > 0 && idx === clampedIndex}
              showFirstLine={showFirstLine}
              showMeter={showMeter}
              snippet={psalm.snippet ?? null}
              query={trimmedQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}
