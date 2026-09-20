export const dynamic = 'force-dynamic'
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
import { ExploreTabShell } from "@/components/ExploreTabShell"
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

  // Convert Map results to plain slug-enriched arrays (Maps are not serializable
  // across the server/client boundary)
  const whenYouTopicsWithSlugs = whenYouTopics.map(t => ({
    ...t,
    slug: whenYouSlugMap.get(t.id) ?? slugify(t.name ?? ''),
  }))

  const mainTopicsWithSlugs = mainTopics.map(t => ({
    ...t,
    slug: mainTopicsSlugMap.get(t.id) ?? slugify(t.name ?? ''),
  }))

  const moodTopicsWithSlugs = moodTopics.map(t => ({
    ...t,
    slug: moodTopicsSlugMap.get(t.id) ?? slugify(t.name ?? ''),
  }))

  const songTypeTopicsWithSlugs = songTypeTopics.map(t => ({
    ...t,
    slug: songTypeSlugMap.get(t.id) ?? slugify(t.name ?? ''),
  }))

  const navesTopicsWithSlugs = navesTopics.map(t => ({
    ...t,
    slug: navesSlugMap.get(t.id) ?? slugify(t.name),
  }))

  const messianicByTopicWithSlugs = messianicByTopic
    .filter((t): t is typeof t & { name: string } => t.name !== null)
    .map(t => ({ ...t, slug: navesSlugMap.get(t.id) ?? slugify(t.name) }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-4">
        <h1 className="font-sans text-3xl md:text-4xl font-semibold text-foreground mb-2 relative inline-block after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-1 after:rounded-full after:bg-primary">
          Explore
        </h1>
        <p className="text-muted-foreground text-base">
          Browse psalms by topic, theme, and category
        </p>
      </div>

      <ExploreTabShell
        whenYouTopics={whenYouTopicsWithSlugs}
        mainTopics={mainTopicsWithSlugs}
        moodTopics={moodTopicsWithSlugs}
        songTypeTopics={songTypeTopicsWithSlugs}
        quotedInNT={quotedInNT}
        messianicByTopic={messianicByTopicWithSlugs}
        navesTopics={navesTopicsWithSlugs}
        psalmsWithAuthors={psalmsWithAuthors}
        catechism={catechism}
        messianicPsalmsCount={messianicPsalms.length}
      />
    </div>
  )
}
