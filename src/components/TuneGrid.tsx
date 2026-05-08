'use client'
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TuneRow {
  id: number
  name: string | null
  meter: string | null
  scoreJpgUrl: string | null
}

interface TuneGridProps {
  tunes: TuneRow[]
}

export function TuneGrid({ tunes }: TuneGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedMeter, setSelectedMeter] = useState<string>(
    searchParams.get('meter') ?? 'all'
  )

  const meters = useMemo(() => {
    const unique = Array.from(new Set(tunes.map((t) => t.meter).filter((m): m is string => Boolean(m))))
    return unique.sort()
  }, [tunes])

  const filteredTunes = useMemo(
    () => tunes.filter((t) => selectedMeter === 'all' || t.meter === selectedMeter),
    [tunes, selectedMeter]
  )

  function handleMeterChange(v: string) {
    setSelectedMeter(v)
    if (v === 'all') {
      router.replace('/tunes', { scroll: false })
    } else {
      router.replace(`/tunes?meter=${encodeURIComponent(v)}`, { scroll: false })
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
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
        {selectedMeter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => handleMeterChange('all')} className="text-sm gap-1">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTunes.map((tune) => (
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
