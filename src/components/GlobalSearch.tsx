'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, BookOpen, Music, Search } from 'lucide-react'

interface SearchResult {
  type: 'psalm' | 'tune'
  relevance: number
  id: number
  // Psalm fields
  slug?: string
  firstLine?: string | null
  snippet?: string | null
  isRecommended?: boolean
  // Tune fields
  name?: string | null
  meter?: string | null
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setSelectedIdx(0)
      } finally {
        setLoading(false)
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [query])

  function navigateTo(result: SearchResult) {
    if (result.type === 'psalm') {
      router.push(`/psalms/${result.slug}`)
    } else {
      router.push(`/tunes/${result.id}`)
    }
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      navigateTo(results[selectedIdx])
    }
  }

  if (!open) return null

  const hasResults = results.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl border border-border shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find psalms or tunes…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <p className="text-sm text-muted-foreground px-4 py-3">Searching…</p>
            )}
            {!loading && !hasResults && (
              <p className="text-sm text-muted-foreground px-4 py-3">No results found</p>
            )}
            {!loading && hasResults && results.map((result, i) => {
              const isSelected = i === selectedIdx
              if (result.type === 'psalm') {
                return (
                  <button
                    key={`psalm-${result.id}-${result.slug}`}
                    type="button"
                    onClick={() => navigateTo(result)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors ${isSelected ? 'bg-muted' : ''}`}
                  >
                    <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        Psalm {(result.slug ?? '').replace(/([0-9]+)([ab])/, '$1 ($2)')}
                      </span>
                      {result.firstLine && (
                        <span className="text-sm text-muted-foreground ml-2">{result.firstLine}</span>
                      )}
                      {result.snippet && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">{result.snippet}</p>
                      )}
                    </div>
                  </button>
                )
              } else {
                return (
                  <button
                    key={`tune-${result.id}`}
                    type="button"
                    onClick={() => navigateTo(result)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors ${isSelected ? 'bg-muted' : ''}`}
                  >
                    <Music className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{result.name}</span>
                    {result.meter && (
                      <span className="text-xs text-muted-foreground ml-auto">{result.meter}</span>
                    )}
                  </button>
                )
              }
            })}
          </div>
        )}

        {/* Footer hint */}
        {!query.trim() && (
          <div className="px-4 py-3 text-xs text-muted-foreground">
            Type a psalm number, keyword, or tune name
          </div>
        )}
      </div>
    </div>
  )
}
