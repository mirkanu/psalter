export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { headers } from "next/headers"
import type { Metadata } from "next"
import { fetchAllTunes } from "@/db/queries/tunes"
import { TuneTable } from "@/components/TuneTable"

export const metadata: Metadata = {
  title: "Tunes | CPRC Psalter",
  description: "Browse all tunes in the Scottish Psalter.",
}

export default async function TunesPage() {
  const allTunes = await fetchAllTunes()
  // TLIST-03 / iOS Safari: detected server-side from the request's own User-Agent header so TuneTable
  // never needs a client-side detection toggle on this page — see the isIOS prop doc comment on TuneTable.
  const userAgent = (await headers()).get('user-agent') ?? ''
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-semibold text-foreground mb-3 relative inline-block after:content-[''] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-1 after:rounded-full after:bg-primary">
          Tunes
        </h1>
        <p className="text-muted-foreground text-base">
          {allTunes.length} tunes in the CPRC tune index, sorted by number of recommended psalms.
        </p>
      </div>
      <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded" />}>
        <TuneTable tunes={allTunes} isIOS={isIOS} />
      </Suspense>
    </div>
  )
}
