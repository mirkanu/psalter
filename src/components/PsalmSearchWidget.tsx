'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PsalmSearchWidget() {
  const router = useRouter()
  const [value, setValue] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(value)
    if (Number.isFinite(n) && n >= 1 && n <= 150) {
      router.push(`/psalms/${n}`)
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 max-w-sm">
      <label htmlFor="psalm-number" className="sr-only">Psalm number</label>
      <input
        id="psalm-number"
        type="number"
        inputMode="numeric"
        min={1}
        max={150}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Psalm number (1–150)"
        className="flex-1 h-10 px-3 rounded-md border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button type="submit" size="icon" aria-label="Find Psalm">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  )
}
