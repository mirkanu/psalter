import { Suspense } from "react"
import type { Metadata } from "next"
import { fetchAllTunes } from "@/db/queries/tunes"
import { TuneTable } from "@/components/TuneTable"

export const metadata: Metadata = {
  title: "Tunes | CPRC Psalter",
  description: "Browse all tunes in the Scottish Psalter.",
}

export default async function TunesPage() {
  const allTunes = await fetchAllTunes()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Tunes
        </h1>
        <p className="text-muted-foreground text-base">
          {allTunes.length} tunes in the CPRC tune index, sorted by number of recommended psalms.
        </p>
      </div>
      <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded" />}>
        <TuneTable tunes={allTunes} />
      </Suspense>
    </div>
  )
}
