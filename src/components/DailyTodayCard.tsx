import Link from "@/components/Link"
import { buttonVariants } from "@/components/ui/button"
import { formatPsalmRef } from "@/lib/daily"
import { cn } from "@/lib/utils"
import type { DailyReadingWithPsalm } from "@/db/queries/daily"

interface DailyTodayCardProps {
  reading: DailyReadingWithPsalm | null
  todayDay: number
}

export function DailyTodayCard({ reading, todayDay }: DailyTodayCardProps) {
  if (!reading) {
    return (
      <div>
        <p className="text-muted-foreground">No psalm for today.</p>
      </div>
    )
  }

  const psalmId = reading.psalm?.id ?? reading.psalmId
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const ref = formatPsalmRef(
    psalmId ?? 0,
    reading.startingVerse,
    reading.endingVerse,
    true
  )
  const bibleTitle = reading.psalm?.bibleTitle ?? ""

  return (
    <div>
      <div className="flex items-center gap-2">
        <time className="text-sm text-muted-foreground">{dateLabel}</time>
        <span className="text-xs text-muted-foreground">Day {todayDay}</span>
      </div>
      <p className="text-2xl font-semibold leading-tight text-foreground mt-2">{ref}</p>
      {bibleTitle && (
        <p className="text-sm text-muted-foreground italic mt-1 truncate">{bibleTitle}</p>
      )}
      {psalmId && (
        <Link
          href={`/psalms/${psalmId}`}
          className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto mt-4")}
        >
          Sing psalm
        </Link>
      )}
    </div>
  )
}
