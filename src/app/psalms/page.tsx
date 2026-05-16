import { PsalmListingGrid } from "@/components/PsalmListingGrid"
import { fetchPsalmListRows } from "@/db/queries/psalms"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Psalms | CPRC Psalter",
  description: "Browse all 150 psalms of the Scottish Psalter.",
}

export default async function PsalmsPage() {
  const listRows = await fetchPsalmListRows()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-3">
          Psalms
        </h1>
        <p className="text-muted-foreground text-base">
          Browse all 150 psalms of the Scottish Psalter.
        </p>
      </div>
      <PsalmListingGrid psalms={listRows} />
    </div>
  )
}
