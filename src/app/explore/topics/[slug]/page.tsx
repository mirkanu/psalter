export const dynamic = 'force-dynamic'
import { notFound } from "next/navigation"
import Link from "@/components/Link"
import type { Metadata } from "next"
import { fetchAllTopicsWithCounts, fetchPsalmsByTopic } from "@/db/queries/explore"
import { buildTopicSlugMap } from "@/lib/topic-slugs"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
  const topics = await fetchAllTopicsWithCounts()
  const slugMap = buildTopicSlugMap(
    topics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )
  return topics
    .filter((t) => t.name)
    .map((t) => ({ slug: slugMap.get(t.id) ?? '' }))
    .filter((p) => p.slug !== '')
  } catch { return [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const topics = await fetchAllTopicsWithCounts()
  const slugMap = buildTopicSlugMap(
    topics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )
  const topic = topics.find((t) => t.name && slugMap.get(t.id) === slug)
  return {
    title: topic ? `${topic.name} | Explore | CPRC Psalter` : "Topic | CPRC Psalter",
  }
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params
  const topics = await fetchAllTopicsWithCounts()
  const slugMap = buildTopicSlugMap(
    topics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )
  const topic = topics.find((t) => t.name && slugMap.get(t.id) === slug)
  if (!topic) notFound()

  const psalms = await fetchPsalmsByTopic(topic.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/explore" className="hover:text-foreground active:bg-muted active:translate-y-px transition-all duration-75">Explore</Link>
        <span>›</span>
        <span className="text-foreground">{topic.name}</span>
      </div>

      <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-2">
        {topic.name}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">{psalms.length} psalms</p>

      {psalms.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <h2 className="text-xl font-semibold">No psalms in this category</h2>
          <p className="text-muted-foreground">
            This topic has no psalms assigned in the current dataset.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {psalms.map((p) => (
            <div
              key={p.id}
              className="py-3 flex items-start gap-4 hover:bg-muted rounded transition-colors min-h-[44px]"
            >
              <span className="w-10 shrink-0 font-mono text-sm tabular-nums text-muted-foreground pt-0.5">
                {p.id}
              </span>
              <div className="flex-1 min-w-0">
                <Link href={`/psalms/${p.id}`} className="text-base hover:text-primary transition-colors block active:bg-muted active:translate-y-px transition-all duration-75">
                  {p.firstLine ?? `Psalm ${p.id}`}
                </Link>
                {p.meter && (
                  <span className="text-xs text-muted-foreground">{p.meter}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
