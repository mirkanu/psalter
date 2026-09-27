export const dynamic = 'force-dynamic'
import Link from "@/components/Link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { fetchDailyReading } from "@/db/queries/daily"

interface PageProps {
  params: Promise<{ day: string }>
}

export function generateStaticParams() {
  return Array.from({ length: 365 }, (_, i) => ({ day: String(i + 1) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { day } = await params
  return {
    title: `Day ${day} of 365 | CPRC Psalter`,
  }
}

export default async function DailyDayPage({ params }: PageProps) {
  const { day } = await params
  const dayNumber = Number(day)
  if (!Number.isFinite(dayNumber) || dayNumber < 1 || dayNumber > 365) notFound()
  const reading = await fetchDailyReading(dayNumber)
  if (!reading) notFound()

  const psalmId = reading.psalm?.id
  const psalmTitle = reading.psalm?.bibleTitle ?? (psalmId ? `Psalm ${psalmId}` : "")

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <Link href="/daily" className="text-sm text-muted-foreground hover:text-foreground active:bg-muted active:translate-y-px transition-all duration-75">
        ← Back to plan
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-4 mb-2">
        Day {dayNumber} of 365
      </h1>
      {psalmId ? (
        <p className="text-lg">
          <Link href={`/psalms/${psalmId}`} className="text-primary hover:underline font-medium active:bg-muted active:translate-y-px transition-all duration-75">
            Psalm {psalmId} — {psalmTitle}
          </Link>
        </p>
      ) : (
        <p className="text-muted-foreground">No psalm assigned for this day.</p>
      )}
    </div>
  )
}
