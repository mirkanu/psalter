'use client'
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "@/components/Link"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface TuneRow {
  id: number
  name: string | null
  slug: string
  meter: string | null
  scoreJpgUrl: string | null
  moods: string[]
  recommendedPsalmIds: number[]
}

interface TuneGridProps {
  tunes: TuneRow[]
  initialMeter?: string
  onSelectTune?: (tune: TuneRow) => void
}

export function TuneGrid({ tunes, initialMeter, onSelectTune }: TuneGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedMeter, setSelectedMeter] = useState<string>(
    initialMeter ?? searchParams.get('meter') ?? 'all'
  )
  const [selectedMood, setSelectedMood] = useState<string>(
    searchParams.get('mood') ?? 'all'
  )

  const meters = useMemo(() => {
    const unique = Array.from(new Set(tunes.map((t) => t.meter).filter((m): m is string => Boolean(m))))
    return unique.sort()
  }, [tunes])

  const moods = useMemo(() => {
    const unique = Array.from(new Set(tunes.flatMap((t) => t.moods))).filter(Boolean)
    return unique.sort()
  }, [tunes])

  const filteredTunes = useMemo(
    () => tunes.filter((t) => {
      const meterMatch = selectedMeter === 'all' || t.meter === selectedMeter
      const moodMatch = selectedMood === 'all' || t.moods.includes(selectedMood)
      return meterMatch && moodMatch
    }),
    [tunes, selectedMeter, selectedMood]
  )

  function buildUrl(meter: string, mood: string) {
    const params = new URLSearchParams()
    if (meter !== 'all') params.set('meter', meter)
    if (mood !== 'all') params.set('mood', mood)
    const qs = params.toString()
    return qs ? `/tunes?${qs}` : '/tunes'
  }

  function handleMeterChange(v: string) {
    const val = v ?? 'all'
    setSelectedMeter(val)
    if (!onSelectTune) router.replace(buildUrl(val, selectedMood), { scroll: false })
  }

  function handleMoodChange(v: string) {
    const val = v ?? 'all'
    setSelectedMood(val)
    if (!onSelectTune) router.replace(buildUrl(selectedMeter, val), { scroll: false })
  }

  function handleClear() {
    setSelectedMeter('all')
    setSelectedMood('all')
    if (!onSelectTune) router.replace('/tunes', { scroll: false })
  }

  const hasActiveFilter = selectedMeter !== 'all' || selectedMood !== 'all'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 sticky top-14 z-20 bg-background py-3 -mx-4 px-4 mb-0">
        <Select value={selectedMeter} onValueChange={(v) => handleMeterChange(v ?? 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Meters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meters</SelectItem>
            {meters.map((meter) => (
              <SelectItem key={meter} value={meter}>{meter}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedMood} onValueChange={(v) => handleMoodChange(v ?? 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Moods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Moods</SelectItem>
            {moods.map((mood) => (
              <SelectItem key={mood} value={mood}>{mood}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-sm gap-1">
            <X className="h-3 w-3" />
            Clear Filters
          </Button>
        )}
      </div>

      {filteredTunes.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <p className="text-xl font-semibold">No tunes found</p>
          <p className="text-muted-foreground text-sm">No tunes match the current filters. Try a different meter or mood.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTunes.map((tune) => {
          const psalmDisplay = tune.recommendedPsalmIds.length > 6
            ? tune.recommendedPsalmIds.slice(0, 6).join(', ') + ` +${tune.recommendedPsalmIds.length - 6} more`
            : tune.recommendedPsalmIds.join(', ')

          const cardClasses = "block bg-card border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm group active:bg-muted active:scale-[0.98] transition-all duration-75"

          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {tune.name ?? `Tune ${tune.id}`}
                </h2>
                {tune.meter && (
                  <Badge variant="secondary" className="text-sm shrink-0">
                    {tune.meter}
                  </Badge>
                )}
              </div>
              {psalmDisplay && (
                <p className="text-sm text-muted-foreground mb-1.5">
                  <span className="font-medium">Psalms:</span> {psalmDisplay}
                </p>
              )}
              {tune.moods.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tune.moods.map((mood) => (
                    <Badge key={mood} variant="outline" className="text-sm">
                      {mood}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )

          return onSelectTune ? (
            <button
              key={tune.id}
              type="button"
              onClick={() => onSelectTune(tune)}
              className={cardClasses}
            >
              {cardContent}
            </button>
          ) : (
            <Link
              key={tune.id}
              href={`/tunes/${tune.slug}`}
              className={cardClasses}
            >
              {cardContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
