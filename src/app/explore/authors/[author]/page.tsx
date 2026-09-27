export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation"
import Link from "@/components/Link"
import type { Metadata } from "next"
import { fetchDistinctAuthors, fetchPsalmsByAuthor } from "@/db/queries/explore"
import { Badge } from "@/components/ui/badge"

interface PageProps {
  params: Promise<{ author: string }>
}

export async function generateStaticParams() {
  try {
    const authors = await fetchDistinctAuthors()
    return authors.map((a) => ({ author: encodeURIComponent(a) }))
  } catch { return [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { author } = await params
  const decodedAuthor = decodeURIComponent(author)
  return {
    title: `${decodedAuthor} | Authors | CPRC Psalter`,
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { author } = await params
  let decodedAuthor: string
  try {
    decodedAuthor = decodeURIComponent(author)
  } catch {
    notFound()
    return
  }

  const psalms = await fetchPsalmsByAuthor(decodedAuthor)
  if (psalms.length === 0) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/explore" className="hover:text-foreground active:bg-muted active:translate-y-px transition-all duration-75">Explore</Link>
        <span>›</span>
        <span className="text-foreground">{decodedAuthor}</span>
      </div>

      <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-2">
        {decodedAuthor}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{psalms.length} psalms</p>

      <div className="divide-y divide-border">
        {psalms.map((p) => (
          <div
            key={p.id}
            className="py-3 flex items-center gap-4 hover:bg-muted rounded transition-colors min-h-[44px]"
          >
            <span className="w-10 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
              {p.id}
            </span>
            <Link
              href={`/psalms/${p.id}`}
              className="flex-1 text-base hover:text-primary transition-colors active:bg-muted active:translate-y-px transition-all duration-75"
            >
              {p.firstLine ?? `Psalm ${p.id}`}
            </Link>
            {p.meter && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {p.meter}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
