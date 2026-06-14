'use client'

import { useState } from "react"
import Link from "next/link"
import { Palette, BookOpen, Library, Users, ScrollText } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { NavesExpand } from "@/components/NavesExpand"
import { QuotedInNT } from "@/components/QuotedInNT"
import { MessianicByTopic } from "@/components/MessianicByTopic"
import { AuthorsTable } from "@/components/AuthorsTable"
import { HeidelbergCatechism } from "@/components/HeidelbergCatechism"

interface TopicItem {
  id: number
  name: string | null
  count: number
  slug: string
}

interface NavesTopicItem {
  id: number
  name: string
  psalm_count: number
  slug: string
}

interface ExploreTabShellProps {
  whenYouTopics: TopicItem[]
  mainTopics: TopicItem[]
  moodTopics: TopicItem[]
  songTypeTopics: TopicItem[]
  quotedInNT: Array<{
    id: number
    sub_topic: string | null
    quotation: string | null
    verses: Array<{ verseId: number; psalmId: number; verseNumber: number | null }>
  }>
  messianicByTopic: Array<{ id: number; name: string; slug: string; messianic: string | null }>
  navesTopics: NavesTopicItem[]
  psalmsWithAuthors: Array<{ id: number; author: string | null; dateBC: number | null; occasion: string | null }>
  catechism: Array<{ question_number: number; url: string | null; verses: Array<{ psalmId: number; verseNumber: number | null }> }>
  messianicPsalmsCount: number
}

function TopicGrid({ topics }: { topics: TopicItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
      {topics.map(t => (
        <Link
          key={t.id}
          href={`/explore/topics/${t.slug}`}
          className="inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
        >
          <span className="truncate">{t.name}</span>
          <Badge variant="secondary" className="ml-2 text-xs shrink-0">{t.count} psalms</Badge>
        </Link>
      ))}
    </div>
  )
}

export function ExploreTabShell({
  whenYouTopics,
  mainTopics,
  moodTopics,
  songTypeTopics,
  quotedInNT,
  messianicByTopic,
  navesTopics,
  psalmsWithAuthors,
  catechism,
  messianicPsalmsCount,
}: ExploreTabShellProps) {
  const [tab, setTab] = useState("themes")
  const [subTab, setSubTab] = useState("main-topic")

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="sticky top-[64px] z-10 bg-background/95 backdrop-blur-sm border-b border-border h-10 overflow-x-auto flex whitespace-nowrap w-full rounded-none justify-start">
        <TabsTrigger value="themes" className="flex items-center">
          <Palette className="w-4 h-4 mr-1.5" />
          Themes
        </TabsTrigger>
        <TabsTrigger value="in-the-nt" className="flex items-center">
          <BookOpen className="w-4 h-4 mr-1.5" />
          In the NT
        </TabsTrigger>
        <TabsTrigger value="other-topics" className="flex items-center">
          <Library className="w-4 h-4 mr-1.5" />
          Other Topics
        </TabsTrigger>
        <TabsTrigger value="authors" className="flex items-center">
          <Users className="w-4 h-4 mr-1.5" />
          Authors
        </TabsTrigger>
        <TabsTrigger value="catechism" className="flex items-center">
          <ScrollText className="w-4 h-4 mr-1.5" />
          Catechism
        </TabsTrigger>
      </TabsList>

      <TabsContent value="themes">
        <Tabs value={subTab} onValueChange={setSubTab}>
          <TabsList className="mt-4">
            <TabsTrigger value="main-topic">Main Topic</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="song-type">Song Type</TabsTrigger>
            <TabsTrigger value="when-you">When you...</TabsTrigger>
          </TabsList>

          <TabsContent value="main-topic">
            <TopicGrid topics={mainTopics} />
          </TabsContent>

          <TabsContent value="mood">
            <TopicGrid topics={moodTopics} />
          </TabsContent>

          <TabsContent value="song-type">
            <TopicGrid topics={songTypeTopics} />
          </TabsContent>

          <TabsContent value="when-you">
            <TopicGrid topics={whenYouTopics} />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="in-the-nt">
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold mb-3">Quoted in the New Testament</h3>
            <QuotedInNT entries={quotedInNT} />
          </div>
          <Separator />
          <div>
            <h3 className="text-base font-semibold mb-3">Messianic by Topic</h3>
            <MessianicByTopic topics={messianicByTopic} />
          </div>
          <Link
            href="/explore/messianic"
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted hover:border-primary/30 transition-colors"
          >
            <span className="text-base font-medium">All Messianic Psalms</span>
            <Badge variant="secondary" className="ml-2 text-xs shrink-0">{messianicPsalmsCount} psalms</Badge>
          </Link>
        </div>
      </TabsContent>

      <TabsContent value="other-topics">
        <div className="mt-6">
          <NavesExpand topics={navesTopics} />
        </div>
      </TabsContent>

      <TabsContent value="authors">
        <div className="mt-6">
          <AuthorsTable psalms={psalmsWithAuthors} />
        </div>
      </TabsContent>

      <TabsContent value="catechism">
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-4">97 references across 35 questions</p>
          <HeidelbergCatechism rows={catechism} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
