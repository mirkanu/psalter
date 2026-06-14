export const dynamic = 'force-dynamic'
import Link from "next/link"
import type { Metadata } from "next"
import {
  fetchWhenYouTopics,
  fetchTopicsByType,
  fetchQuotedInNT,
  fetchMessianicByTopic,
  fetchNavesTopicsWithCounts,
  fetchPsalmsWithAuthorData,
  fetchHeidelbergCatechism,
  fetchMessianicPsalms,
} from "@/db/queries/explore"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { NavesExpand } from "@/components/NavesExpand"
import { ExploreAnchorNav } from "@/components/ExploreAnchorNav"
import { QuotedInNT } from "@/components/QuotedInNT"
import { MessianicByTopic } from "@/components/MessianicByTopic"
import { AuthorsTable } from "@/components/AuthorsTable"
import { HeidelbergCatechism } from "@/components/HeidelbergCatechism"
import { slugify, buildNavesSlugMap } from "@/lib/naves-slugs"

export const metadata: Metadata = {
  title: "Explore | CPRC Psalter",
  description: "Browse psalms by topic, theme, and category.",
}

// buildDisambiguatedSlugMap is an alias for buildNavesSlugMap — used for
// non-Nave's topic slugs (whenYou, mainTopics, mood, songType) which share
// the same disambiguation algorithm.
const buildDisambiguatedSlugMap = buildNavesSlugMap

export default async function ExplorePage() {
  const [
    whenYouTopics,
    mainTopics,
    moodTopics,
    songTypeTopics,
    quotedInNT,
    messianicByTopic,
    navesTopics,
    psalmsWithAuthors,
    catechism,
    messianicPsalms,
  ] = await Promise.all([
    fetchWhenYouTopics(),
    fetchTopicsByType('Main Topic'),
    fetchTopicsByType('Mood'),
    fetchTopicsByType('Song Type'),
    fetchQuotedInNT(),
    fetchMessianicByTopic(),
    fetchNavesTopicsWithCounts(),
    fetchPsalmsWithAuthorData(),
    fetchHeidelbergCatechism(),
    fetchMessianicPsalms(),
  ])

  const whenYouSlugMap = buildDisambiguatedSlugMap(
    whenYouTopics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )

  const mainTopicsSlugMap = buildDisambiguatedSlugMap(
    mainTopics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )

  const moodTopicsSlugMap = buildDisambiguatedSlugMap(
    moodTopics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )

  const songTypeSlugMap = buildDisambiguatedSlugMap(
    songTypeTopics.filter((t): t is typeof t & { name: string } => t.name !== null)
  )

  const navesSlugMap = buildDisambiguatedSlugMap(navesTopics)

  const navesTopicsWithSlugs = navesTopics.map((t) => ({
    ...t,
    slug: navesSlugMap.get(t.id) ?? slugify(t.name),
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-4">
        <h1 className="font-sans text-3xl md:text-4xl font-semibold text-foreground mb-2">
          Explore
        </h1>
        <p className="text-muted-foreground text-base">
          Browse psalms by topic, theme, and category
        </p>
      </div>

      <ExploreAnchorNav />

      <div className="mt-8">
        {/* Section 1: When you're feeling... */}
        <section id="when-you">
          <h2 className="text-xl font-semibold mb-4">When you&apos;re...</h2>
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

        <Separator className="my-8" />

        {/* Section 2: By Theme */}
        <section id="by-theme">
          <h2 className="text-xl font-semibold mb-4">By Theme</h2>

          {mainTopics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 mt-4">
                Main Topic
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {mainTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/explore/topics/${mainTopicsSlugMap.get(topic.id) ?? slugify(topic.name ?? '')}`}
                    className="inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
                  >
                    <span className="truncate">{topic.name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                      {topic.count} psalms
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {moodTopics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 mt-4">
                Mood
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {moodTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/explore/topics/${moodTopicsSlugMap.get(topic.id) ?? slugify(topic.name ?? '')}`}
                    className="inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
                  >
                    <span className="truncate">{topic.name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                      {topic.count} psalms
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {songTypeTopics.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 mt-4">
                Song Type
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {songTypeTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/explore/topics/${songTypeSlugMap.get(topic.id) ?? slugify(topic.name ?? '')}`}
                    className="inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
                  >
                    <span className="truncate">{topic.name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                      {topic.count} psalms
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <Separator className="my-8" />

        {/* Section 3: In the New Testament */}
        <section id="in-the-nt">
          <h2 className="text-xl font-semibold mb-4">In the New Testament</h2>

          <h3 className="text-base font-semibold mb-3">Quoted in the New Testament</h3>
          <QuotedInNT entries={quotedInNT} />

          <Separator className="my-4" />

          <h3 className="text-base font-semibold mb-3">Messianic by Topic</h3>
          <MessianicByTopic topics={messianicByTopic
            .filter((t): t is typeof t & { name: string } => t.name !== null)
            .map((t) => ({ ...t, slug: navesSlugMap.get(t.id) ?? slugify(t.name) }))} />

          <div className="mt-6">
            <Link
              href="/explore/messianic"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted hover:border-primary/30 transition-colors"
            >
              <span className="text-base font-medium">All Messianic Psalms</span>
              <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                {messianicPsalms.length} psalms
              </Badge>
            </Link>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 4: Other Topics (Nave's) */}
        <section id="other-topics">
          <h2 className="text-xl font-semibold mb-4">Other Topics</h2>
          <NavesExpand topics={navesTopicsWithSlugs} />
        </section>

        <Separator className="my-8" />

        {/* Section 5: Authors */}
        <section id="authors">
          <h2 className="text-xl font-semibold mb-4">Authors</h2>
          <AuthorsTable psalms={psalmsWithAuthors} />
        </section>

        <Separator className="my-8" />

        {/* Section 6: Heidelberg Catechism */}
        <section id="catechism">
          <h2 className="text-xl font-semibold mb-4">Heidelberg Catechism</h2>
          <p className="text-sm text-muted-foreground mb-4">
            97 references across 35 questions
          </p>
          <HeidelbergCatechism rows={catechism} />
        </section>
      </div>
    </div>
  )
}
