import Link from "next/link"
import type { Metadata } from "next"
import { fetchMessianicPsalms } from "@/db/queries/explore"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Messianic Psalms | Explore | CPRC Psalter",
  description: "Browse all messianic psalms in the Scottish Psalter.",
}

export default async function MessianicPage() {
  const psalms = await fetchMessianicPsalms()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/explore" className="hover:text-foreground">Explore</Link>
        <span>›</span>
        <span className="text-foreground">Messianic Psalms</span>
      </div>

      <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-2">
        Messianic Psalms
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
              key={p.psalmId}
              className="py-3 flex items-center gap-4 hover:bg-muted rounded transition-colors min-h-[44px]"
            >
              <span className="w-10 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                {p.psalmId}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/psalms/${p.psalmId}`}
                  className="text-base hover:text-primary transition-colors"
                >
                  {p.firstLine ?? `Psalm ${p.psalmId}`}
                </Link>
                {p.classification && (
                  <p className="text-xs text-muted-foreground mt-0.5">{p.classification}</p>
                )}
              </div>
              {p.meter && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {p.meter}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
