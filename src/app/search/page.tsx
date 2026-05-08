import { Search } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchSearchResults } from "@/db/queries/search"

export const metadata: Metadata = {
  title: "Search | CPRC Psalter",
  description: "Search the Scottish Psalter by keyword across metrical lyrics and KJV text.",
}

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = Array.isArray(q) ? q[0] : (q ?? "")

  const results = query ? await fetchSearchResults(query) : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-3">
          Search
        </h1>
      </div>

      {/* Search form — GET-based so URL is shareable and bookmarkable */}
      <form method="GET" action="/search" className="flex gap-2 mb-8">
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search psalms…"
          aria-label="Search psalms"
          className="flex-1"
        />
        <Button type="submit" className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </form>

      {/* State A — No query */}
      {query === "" && (
        <div className="flex flex-col items-center py-16 text-center gap-4">
          <Search className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Search the Scottish Psalter</h2>
          <p className="text-muted-foreground">Enter a word or phrase to find matching psalms.</p>
        </div>
      )}

      {/* State B — Results exist */}
      {query !== "" && results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} results for &ldquo;{query}&rdquo;
          </p>
          <div className="divide-y divide-border">
            {results.map((r) => (
              <div key={r.id} className="py-4 flex items-start gap-4 hover:bg-muted rounded transition-colors">
                <span className="w-10 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                  {r.id}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/psalms/${r.id}`}
                    className="text-base font-semibold hover:text-primary transition-colors"
                  >
                    {r.firstLine ?? `Psalm ${r.id}`}
                  </Link>
                  <p
                    data-snippet
                    className="text-sm text-muted-foreground line-clamp-2 mt-1"
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                </div>
                {r.meter && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {r.meter}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* State C — Zero results */}
      {query !== "" && results.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <h2 className="text-xl font-semibold">No psalms found</h2>
          <p className="text-muted-foreground">
            No results for &ldquo;{query}&rdquo;. Try different words, or browse psalms by topic.
          </p>
          <Link href="/explore" className="text-primary underline-offset-4 hover:underline text-sm">
            Browse topics
          </Link>
        </div>
      )}
    </div>
  )
}
