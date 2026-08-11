'use client'
import { useEffect, useState } from "react"
import Link from "next/link"
import { getDayOfYear } from "@/lib/daily"

interface ReadingProp {
  dayNumber: number
  psalmId: number | null
  psalm: { id: number; bibleTitle: string | null } | null
}

export function TodayCard({ readings }: { readings: ReadingProp[] }) {
  const [today, setToday] = useState<number | null>(null)

  useEffect(() => {
    setToday(getDayOfYear())
  }, [])

  // Render a neutral skeleton until the client knows today's date.
  // Avoids a hydration mismatch from server rendering day 1's data
  // when the actual day differs.
  if (today === null) {
    return <div className="bg-card border border-border rounded-2xl p-6 animate-pulse h-40" />
  }

  const reading = readings.find((r) => r.dayNumber === today)
  if (!reading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-muted-foreground">Daily plan unavailable.</p>
      </div>
    )
  }

  const psalmId = reading.psalm?.id ?? reading.psalmId
  const psalmTitle = reading.psalm?.bibleTitle ?? (psalmId ? `Psalm ${psalmId}` : "")

  return (
    <div className="bg-card border border-border rounded-2xl p-6 border-l-4 border-l-primary">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Today's Reading
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        Day {reading.dayNumber} of 365{psalmId ? ` — Psalm ${psalmId}` : ""}
      </p>
      {psalmId && (
        <>
          <h2 className="text-2xl font-semibold mb-4">{psalmTitle}</h2>
          <Link
            href={`/psalms/${psalmId}`}
            className="inline-flex items-center text-primary hover:underline font-medium active:bg-muted active:translate-y-px transition-all duration-75"
          >
            Read Psalm {psalmId} →
          </Link>
        </>
      )}
    </div>
  )
}
