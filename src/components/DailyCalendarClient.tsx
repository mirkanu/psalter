'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatPsalmRef, calendarDateToDayOfYear } from "@/lib/daily"
import type { DailyReadingWithPsalm } from "@/db/queries/daily"

interface DailyCalendarClientProps {
  readings: DailyReadingWithPsalm[]  // all 365 rows
  todayDay: number                    // day-of-year 1-365 from server
}

function prevMonth(m: number, y: number) {
  return m === 0 ? { month: 11, year: y } : { month: m - 1, year: y }
}

function nextMonth(m: number, y: number) {
  return m === 11 ? { month: 0, year: y } : { month: m + 1, year: y }
}

const DAY_LABELS = [
  { abbr: "Mon", full: "Monday" },
  { abbr: "Tue", full: "Tuesday" },
  { abbr: "Wed", full: "Wednesday" },
  { abbr: "Thu", full: "Thursday" },
  { abbr: "Fri", full: "Friday" },
  { abbr: "Sat", full: "Saturday" },
  { abbr: "Sun", full: "Sunday" },
]

export function DailyCalendarClient({ readings, todayDay }: DailyCalendarClientProps) {
  const now = new Date()

  // Build lookup by day-of-year once
  const byDay = new Map<number, DailyReadingWithPsalm>(
    readings.map((r) => [r.dayNumber, r])
  )

  const [displayedMonth, setDisplayedMonth] = useState(() => now.getMonth())
  const [displayedYear] = useState(() => now.getFullYear())

  const handlePrevMonth = () => {
    const { month } = prevMonth(displayedMonth, displayedYear)
    setDisplayedMonth(month)
  }

  const handleNextMonth = () => {
    const { month } = nextMonth(displayedMonth, displayedYear)
    setDisplayedMonth(month)
  }

  const monthLabel = new Date(displayedYear, displayedMonth, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })

  const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate()
  // Monday-first leading offset: Sun=0 becomes 6, Mon=1 becomes 0, etc.
  const leadingEmpties = (new Date(displayedYear, displayedMonth, 1).getDay() + 6) % 7

  return (
    <section aria-label="Monthly reading calendar">
      {/* Month navigation row */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Previous month"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-foreground">{monthLabel}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Next month"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(({ abbr, full }) => (
          <div key={abbr} className="text-center">
            <abbr title={full} className="text-xs text-muted-foreground block no-underline">
              {abbr}
            </abbr>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-t border-l border-border">
        {/* Leading empty cells for Monday-first alignment */}
        {Array.from({ length: leadingEmpties }).map((_, i) => (
          <div
            key={`empty-start-${i}`}
            className="border-r border-b border-border min-h-[44px] md:min-h-[52px]"
          />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dayOfYear = calendarDateToDayOfYear(displayedYear, displayedMonth, day)
          const reading = byDay.get(dayOfYear)
          const isToday = dayOfYear === todayDay
          const psalmId = reading?.psalm?.id ?? reading?.psalmId
          const psalmRef = psalmId
            ? formatPsalmRef(psalmId, reading!.startingVerse, reading!.endingVerse, false)
            : ""

          const cellClass = `border-r border-b border-border min-h-[44px] md:min-h-[52px] p-1 flex flex-col transition-colors duration-100 active:bg-muted active:translate-y-px transition-all duration-75 ${
            isToday
              ? "bg-muted border-l-2 border-l-primary rounded-sm"
              : "hover:bg-muted/60"
          }`

          if (psalmId) {
            return (
              <Link
                key={day}
                href={`/psalms/${psalmId}`}
                aria-label={`Day ${dayOfYear}, ${monthLabel} ${day}: Psalm ${psalmRef}`}
                aria-current={isToday ? "date" : undefined}
                className={cellClass}
              >
                <span className="text-sm font-semibold text-foreground text-right leading-none">
                  {day}
                </span>
                <span className="text-xs text-muted-foreground text-right leading-tight mt-0.5">
                  {psalmRef}
                </span>
              </Link>
            )
          }

          // Day with no reading entry — render non-clickable cell
          return (
            <div
              key={day}
              className={cellClass}
            >
              <span className="text-sm font-semibold text-foreground text-right leading-none">
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
