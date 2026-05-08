'use client'
import { useMemo, useState } from "react"
import { PsalmCard, type PsalmCardProps } from "./PsalmCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PsalmGridProps {
  psalms: PsalmCardProps[]
}

export function PsalmGrid({ psalms }: PsalmGridProps) {
  const [selectedBook, setSelectedBook] = useState<string>("all")
  const [selectedMeter, setSelectedMeter] = useState<string>("all")

  const books = useMemo(() => {
    const unique = Array.from(new Set(psalms.map((p) => p.book).filter((b): b is string => Boolean(b))))
    return unique.sort()
  }, [psalms])

  const meters = useMemo(() => {
    const unique = Array.from(new Set(psalms.map((p) => p.meter).filter((m): m is string => Boolean(m))))
    return unique.sort()
  }, [psalms])

  const filtered = useMemo(
    () =>
      psalms.filter((p) => {
        const bookOk = selectedBook === "all" || p.book === selectedBook
        const meterOk = selectedMeter === "all" || p.meter === selectedMeter
        return bookOk && meterOk
      }),
    [psalms, selectedBook, selectedMeter]
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="book-filter" className="text-sm font-medium text-muted-foreground">
          Filter by book
        </label>
        <Select value={selectedBook} onValueChange={(v) => setSelectedBook(v ?? "all")}>
          <SelectTrigger id="book-filter" className="w-64">
            <SelectValue placeholder="All Books" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Books</SelectItem>
            {books.map((book) => (
              <SelectItem key={book} value={book}>
                {book}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label htmlFor="meter-filter" className="text-sm font-medium text-muted-foreground ml-2">
          Filter by meter
        </label>
        <Select value={selectedMeter} onValueChange={(v) => setSelectedMeter(v ?? "all")}>
          <SelectTrigger id="meter-filter" className="w-64">
            <SelectValue placeholder="All Meters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meters</SelectItem>
            {meters.map((meter) => (
              <SelectItem key={meter} value={meter}>
                {meter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((psalm) => (
          <PsalmCard key={psalm.id} {...psalm} />
        ))}
      </div>
    </div>
  )
}
