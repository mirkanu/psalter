export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import {
  fetchNavesTopicsWithCounts,
  fetchNavesSubTopics,
} from "@/db/queries/explore"
import { slugify, buildNavesSlugMap } from "@/lib/naves-slugs"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const topics = await fetchNavesTopicsWithCounts()
    const navesSlugMap = buildNavesSlugMap(topics)
    return topics.map((t) => ({ slug: navesSlugMap.get(t.id) ?? slugify(t.name) }))
  } catch { return [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const topics = await fetchNavesTopicsWithCounts()
  const navesSlugMap = buildNavesSlugMap(topics)
  const topic = topics.find((t) => navesSlugMap.get(t.id) === slug)
  return {
    title: topic
      ? `${topic.name} | Nave's Topics | CPRC Psalter`
      : "Nave's Topic | CPRC Psalter",
  }
}

export default async function NavesTopicPage({ params }: PageProps) {
  const { slug } = await params
  const topics = await fetchNavesTopicsWithCounts()
  const navesSlugMap = buildNavesSlugMap(topics)
  const topic = topics.find((t) => navesSlugMap.get(t.id) === slug)
  if (!topic) notFound()

  const entries = await fetchNavesSubTopics(topic.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/explore" className="hover:text-foreground">Explore</Link>
        <span>›</span>
        <span className="text-foreground">Nave&apos;s Topics</span>
      </div>

      <h1 className="font-sans text-3xl md:text-4xl font-semibold text-foreground mb-6">
        {topic.name}
      </h1>

      {entries.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <h2 className="text-xl font-semibold">No entries in this category</h2>
          <p className="text-muted-foreground">
            This topic has no entries assigned in the current dataset.
          </p>
        </div>
      ) : (
        <div>
          {entries.map((entry) => (
            <div key={entry.id} className="mb-4">
              <h2 className="text-xl font-semibold mb-2">{entry.sub_topic ?? 'General'}</h2>
              {entry.verses.map((v) => (
                <div key={`${v.psalmId}-${v.verseNumber}`} className="mb-1">
                  <Link href={`/psalms/${v.psalmId}`} className="text-sm font-semibold hover:text-primary">
                    Psalm {v.psalmId}{v.verseNumber != null ? `:${v.verseNumber}` : ''}
                  </Link>
                  {entry.quotation && (
                    <p className="text-sm text-muted-foreground italic ml-4">{entry.quotation}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
