'use client'
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { PsalmDetail } from "@/db/queries/psalms"

const TAB_VALUES = ["overview", "lyrics", "study", "messianic"] as const
type TabValue = typeof TAB_VALUES[number]

function isTabValue(v: string | null): v is TabValue {
  return v !== null && (TAB_VALUES as readonly string[]).includes(v)
}

export function PsalmTabs({ psalm }: { psalm: PsalmDetail }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const raw = searchParams.get("tab")
  const activeTab: TabValue = isTabValue(raw) ? raw : "overview"

  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const primaryVersion = psalm.psalmVersions[0]
  const additionalVersions = psalm.psalmVersions.slice(1)
  const primaryTunes = primaryVersion?.psalmVersionTunes ?? []

  // Aggregate Nave's topics across all verses (deduped by id)
  const navesTopicsMap = new Map<number, string>()
  for (const v of psalm.verses) {
    for (const link of v.verseNavesTopics) {
      if (link.navesTopic?.id != null && link.navesTopic.name) {
        navesTopicsMap.set(link.navesTopic.id, link.navesTopic.name)
      }
    }
  }
  const navesTopics = Array.from(navesTopicsMap.entries())

  // Aggregate doctrines (deduped)
  const doctrinesMap = new Map<number, string>()
  for (const v of psalm.verses) {
    for (const link of v.verseDoctrines) {
      if (link.doctrine?.id != null && link.doctrine.name) {
        doctrinesMap.set(link.doctrine.id, link.doctrine.name)
      }
    }
  }
  const doctrines = Array.from(doctrinesMap.entries())

  const messianic = psalm.messianicPsalms[0]

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
          <TabsTrigger value="study">Study</TabsTrigger>
          <TabsTrigger value="messianic">Messianic</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-6 space-y-6">
          {psalm.book && <Badge variant="secondary">{psalm.book}</Badge>}
          {psalm.haddingtonIntro && (
            <p className="text-base leading-relaxed text-muted-foreground italic">
              {psalm.haddingtonIntro}
            </p>
          )}
          <Separator />
          {psalm.verses.length > 0 ? (
            <div className="prose prose-stone max-w-none space-y-2">
              {psalm.verses.map((v) => (
                <p key={v.id} className="text-base leading-relaxed">
                  <span className="font-mono text-sm tabular-nums text-muted-foreground mr-2 align-top">
                    {v.verseNumber}
                  </span>
                  {v.kjvText ?? ""}
                </p>
              ))}
            </div>
          ) : psalm.kjvText ? (
            /* Fallback: per-verse KJV unavailable, render bulk text */
            <div className="prose prose-stone max-w-none whitespace-pre-line">
              {psalm.kjvText}
            </div>
          ) : (
            <p className="text-muted-foreground">KJV text unavailable.</p>
          )}
        </TabsContent>

        <TabsContent value="lyrics" className="pt-6 space-y-6">
          {primaryVersion ? (
            <>
              <div>
                {primaryVersion.versionLabel && (
                  <h2 className="text-xl font-semibold mb-3">{primaryVersion.versionLabel}</h2>
                )}
                {primaryVersion.meter && <Badge variant="outline">{primaryVersion.meter}</Badge>}
                {primaryVersion.lyrics && (
                  <div className="mt-4 whitespace-pre-line text-base leading-relaxed">
                    {primaryVersion.lyrics}
                  </div>
                )}
              </div>
              {additionalVersions.length > 0 && (
                <details className="border-t border-border pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Additional versions ({additionalVersions.length})
                  </summary>
                  <div className="mt-4 space-y-6">
                    {additionalVersions.map((v) => (
                      <div key={v.id}>
                        {v.versionLabel && <h3 className="font-semibold">{v.versionLabel}</h3>}
                        {v.meter && <Badge variant="outline" className="mt-1">{v.meter}</Badge>}
                        {v.lyrics && (
                          <div className="mt-2 whitespace-pre-line text-sm">{v.lyrics}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {primaryTunes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Tunes for this Psalm
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {primaryTunes.map((pvt) => (
                      <Link
                        key={pvt.tuneId}
                        href={`/tunes/${pvt.tuneId}`}
                        className="inline-flex items-center px-3 py-1 rounded-md border border-border bg-card hover:border-primary hover:text-primary transition-colors text-sm"
                      >
                        {pvt.tune?.name ?? `Tune ${pvt.tuneId}`}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No metrical version recorded for this psalm.</p>
          )}
        </TabsContent>

        <TabsContent value="study" className="pt-6 space-y-6">
          {psalm.sectionHeadings.length === 0 && navesTopics.length === 0 && doctrines.length === 0 ? (
            <div>
              <h3 className="font-semibold text-lg mb-1">No study notes recorded</h3>
              <p className="text-muted-foreground">Topics and cross-references for this psalm have not yet been added.</p>
            </div>
          ) : (
            <>
              {psalm.sectionHeadings.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Section headings</h3>
                  <ul className="space-y-2">
                    {psalm.sectionHeadings.map((s) => (
                      <li key={s.id} className="text-base">
                        <span className="font-mono text-sm text-muted-foreground mr-2">
                          v{s.verseStart}
                        </span>
                        {s.heading}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {navesTopics.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Nave&apos;s topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {navesTopics.map(([id, name]) => (
                      <Badge key={id} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </section>
              )}
              {doctrines.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Doctrinal cross-references</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {doctrines.map(([id, name]) => <li key={id}>{name}</li>)}
                  </ul>
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="messianic" className="pt-6 space-y-4">
          {messianic ? (
            <>
              {messianic.classification && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">Classification</h3>
                  <p className="text-base">{messianic.classification}</p>
                </div>
              )}
              {messianic.ntVerification && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">NT verification</h3>
                  <p className="text-base whitespace-pre-line">{messianic.ntVerification}</p>
                </div>
              )}
              {messianic.messianicVerses && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">Messianic verses</h3>
                  <p className="text-base whitespace-pre-line">{messianic.messianicVerses}</p>
                </div>
              )}
            </>
          ) : (
            <div>
              <h3 className="font-semibold text-lg mb-1">No Messianic notes recorded</h3>
              <p className="text-muted-foreground">This psalm has no messianic classification in the current dataset.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
