import Link from "next/link"
import type { Metadata } from "next"
import { fetchAllTunes } from "@/db/queries/tunes"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Tunes | CPRC Psalter",
  description: "Browse all tunes in the Scottish Psalter.",
}

export default async function TunesPage() {
  const tunes = await fetchAllTunes()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-3">
          Tunes
        </h1>
        <p className="text-muted-foreground text-base">
          {tunes.length} tunes in the CPRC tune index, sorted alphabetically.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tunes.map((tune) => (
          <Link
            key={tune.id}
            href={`/tunes/${tune.id}`}
            className="block bg-card border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all duration-200 group active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {tune.name ?? `Tune ${tune.id}`}
              </h2>
              {tune.meter && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {tune.meter}
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
