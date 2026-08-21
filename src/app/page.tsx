export const dynamic = 'force-dynamic'
import { Home, Library, CalendarDays, Music2, Church } from "lucide-react"
import { fetchAllDailyReadings } from "@/db/queries/daily"
import { fetchPublishedPosts } from "@/db/queries/changelog"
import { getDayOfYear } from "@/lib/daily"
import { DailyTodayCard } from "@/components/DailyTodayCard"
import { HomeCard } from "@/components/HomeCard"
import { ChangelogBanner } from "@/components/ChangelogBanner"
import { ExploreHighlights } from "@/components/ExploreHighlights"

export default async function HomePage() {
  const [readings, posts] = await Promise.all([
    fetchAllDailyReadings(),
    fetchPublishedPosts(),
  ])
  const todayDay = getDayOfYear()
  const todayReading = readings.find((r) => r.dayNumber === todayDay) ?? null
  const latestPost = posts[0] ?? null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section>
        <div className="text-center mb-6">
          <ChangelogBanner post={latestPost} />
        </div>
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Helping CPRC Saints Sing the Psalms!
          </h1>
          <p className="text-muted-foreground mt-3">
            Providing practical resources to encourage &amp; promote corporate
            and private singing of the Scottish Psalter in the Covenant
            Protestant Reformed Church, Ballymena.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HomeCard
            icon={Home}
            title="Choose Psalm"
            href="/psalms"
            description="Now you can sing the psalms more easily at home! Show lyrics and a suggested tune with embedded music for easy singing. Also includes study helps."
          />
          <HomeCard
            icon={Library}
            title="Explore"
            href="/explore"
            description="The psalms categorised in different ways. Are you struggling or thankful or joyful? Find a suitable psalm by mood, theme or topic."
          >
            <ExploreHighlights />
          </HomeCard>
          <HomeCard
            icon={CalendarDays}
            title="Daily"
            href="/daily"
            description="The Psalter divided into 365 days. Sing through the whole Psalter in one year!"
          >
            {todayReading && (
              <DailyTodayCard reading={todayReading} todayDay={todayDay} />
            )}
          </HomeCard>
          <HomeCard
            icon={Music2}
            title="Learn Tunes"
            href="https://soundcloud.com/manuel-kuhs/sets/cprc-psalm-tunes"
            external
            description="Listen to a playlist containing almost all the tunes sung in the CPRC."
          />
        </div>
      </section>

      <section className="mt-16">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Tools for Precenters
          </h2>
          <p className="text-muted-foreground mt-3">
            Tools to help precent psalms in public worship
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HomeCard
            icon={Music2}
            title="Tunes Database"
            href="/tunes"
            description="For precenters or if you like to explore different tunes. Complete list of tunes used by the CPRC (with some additions), categorised in various ways."
          />
          <HomeCard
            icon={Church}
            title="Precenting Tool"
            href="/precent"
            description="Select psalms for a worship service and select custom tunes for each psalm. Display scores for all selected psalm and tune combinations."
          />
        </div>
      </section>
    </div>
  )
}
