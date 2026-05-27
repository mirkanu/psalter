export const dynamic = 'force-dynamic'
import Link from "next/link"
import type { Metadata } from "next"
import {
  fetchTopicsWithCounts,
  fetchNavesTopicsWithCounts,
  fetchMessianicPsalms,
  fetchDistinctAuthors,
  fetchWhenYouTopics,
} from "@/db/queries/explore"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { NavesExpand } from "@/components/NavesExpand"

export const metadata: Metadata = {
  title: "Explore | CPRC Psalter",
  description: "Browse psalms by topic, theme, and category.",
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildDisambiguatedSlugMap(
  topics: Array<{ id: number; name: string }>
): Map<number, string> {
  const slugCount = new Map<string, number>()
  for (const t of topics) {
    const base = slugify(t.name)
    slugCount.set(base, (slugCount.get(base) ?? 0) + 1)
  }
  const result = new Map<number, string>()
  for (const t of topics) {
    const base = slugify(t.name)
    result.set(t.id, (slugCount.get(base) ?? 1) > 1 ? `${base}-${t.id}` : base)
  }
  return result
}

export default async function ExplorePage() {
  const [topics, navesTopics, messianicPsalms, authors, whenYouTopics] = await Promise.all([
    fetchTopicsWithCounts(),
    fetchNavesTopicsWithCounts(),
    fetchMessianicPsalms(),
    fetchDistinctAuthors(),
    fetchWhenYouTopics(),
  ])

  const topicsSlugMap = buildDisambiguatedSlugMap(
    topics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )

  const whenYouSlugMap = buildDisambiguatedSlugMap(
    whenYouTopics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )

  const navesSlugMap = buildDisambiguatedSlugMap(navesTopics)

  const navesTopicsWithSlugs = navesTopics.map((t) => ({
    ...t,
    slug: navesSlugMap.get(t.id) ?? slugify(t.name),
  }))

  const showAuthors = authors.length >= 2

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-8">
        <h1 className="font-sans text-3xl md:text-4xl font-semibold text-foreground mb-2">
          Explore
        </h1>
        <p className="text-muted-foreground text-base">
          Browse psalms by topic, theme, and category
        </p>
      </div>

      {/* When you... */}
      {whenYouTopics.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">When you...</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {whenYouTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/explore/topics/${whenYouSlugMap.get(topic.id) ?? slugify(topic.name ?? '')}`}
                className="inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
              >
                <span className="truncate">{topic.name}</span>
                <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                  {topic.count} psalms
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {whenYouTopics.length > 0 && <Separator className="my-8" />}

      {/* Topics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Topics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/explore/topics/${topicsSlugMap.get(topic.id) ?? slugify(topic.name ?? '')}`}
              className="inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
            >
              <span className="truncate">{topic.name}</span>
              <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                {topic.count} psalms
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      {/* Nave's Topics */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Nave&apos;s Topics</h2>
        <NavesExpand topics={navesTopicsWithSlugs} />
      </section>

      <Separator className="my-8" />

      {/* Messianic Psalms */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Messianic Psalms</h2>
        <Link
          href="/explore/messianic"
          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted hover:border-primary/30 transition-colors"
        >
          <span className="text-base font-medium">All Messianic Psalms</span>
          <Badge variant="secondary" className="ml-2 text-xs shrink-0">
            {messianicPsalms.length} psalms
          </Badge>
        </Link>
      </section>

      {showAuthors && (
        <>
          <Separator className="my-8" />

          {/* Authors */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Authors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {authors.map((author) => (
                <Link
                  key={author}
                  href={`/explore/authors/${encodeURIComponent(author)}`}
                  className="inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
                >
                  <span className="truncate">{author}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
