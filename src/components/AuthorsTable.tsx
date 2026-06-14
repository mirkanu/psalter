'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronUp } from "lucide-react"

interface PsalmWithAuthorData {
  id: number
  author: string | null
  dateBC: number | null
  occasion: string | null
}

const AUTHORS = [
  'Asaph',
  'David',
  'Ethan the Ezrahite',
  'Heman the Ezrahite',
  'Moses',
  'Solomon',
  'Sons of Korah',
  'Unknown',
]

const AUTHOR_COLORS: Record<string, string> = {
  'David': 'bg-blue-100 text-blue-800',
  'Asaph': 'bg-purple-100 text-purple-800',
  'Sons of Korah': 'bg-green-100 text-green-800',
  'Moses': 'bg-amber-100 text-amber-800',
  'Solomon': 'bg-yellow-100 text-yellow-800',
  'Ethan the Ezrahite': 'bg-rose-100 text-rose-800',
  'Heman the Ezrahite': 'bg-orange-100 text-orange-800',
  'Unknown': 'bg-muted text-muted-foreground',
}

export function AuthorsTable({ psalms }: { psalms: PsalmWithAuthorData[] }) {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const router = useRouter()

  const filtered = selectedAuthor
    ? psalms.filter((p) => (p.author ?? 'Unknown') === selectedAuthor)
    : psalms

  const sorted = [...filtered].sort((a, b) => {
    if (a.dateBC === null) return 1
    if (b.dateBC === null) return -1
    return b.dateBC - a.dateBC  // larger BC number = earlier in history = sort first
  })

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        Sorted from earliest date; some data is conjecture. Source: blueletterbible.org
      </p>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {AUTHORS.map((author) => (
          <button
            key={author}
            onClick={() => setSelectedAuthor(selectedAuthor === author ? null : author)}
            className={selectedAuthor === author
              ? "bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm whitespace-nowrap shrink-0"
              : "border border-border rounded-full px-3 py-1 text-sm bg-background hover:bg-muted whitespace-nowrap shrink-0"
            }
          >
            {author}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-20 text-right px-3 py-2 font-semibold">Psalm</th>
              <th className="w-40 px-3 py-2 font-semibold">Author</th>
              <th className="w-24 px-3 py-2 font-semibold">
                <span className="inline-flex items-center gap-1">
                  Date B.C. <ChevronUp className="h-3 w-3 text-muted-foreground" aria-label="sorted ascending" />
                </span>
              </th>
              <th className="px-3 py-2 font-semibold">Occasion</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.id}
                onClick={() => router.push(`/psalms/${p.id}`)}
                className="cursor-pointer hover:bg-muted transition-colors border-b border-border last:border-0"
              >
                <td className="w-20 text-right px-3 py-2 font-mono text-sm">{p.id}</td>
                <td className="w-40 px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${AUTHOR_COLORS[p.author ?? 'Unknown'] ?? 'bg-muted text-muted-foreground'}`}>
                    {p.author ?? 'Unknown'}
                  </span>
                </td>
                <td className="w-24 px-3 py-2 text-muted-foreground">
                  {p.dateBC != null ? `~${p.dateBC} B.C.` : 'Unknown'}
                </td>
                <td
                  className="px-3 py-2 text-muted-foreground truncate max-w-[300px]"
                  title={p.occasion ?? ''}
                >
                  {p.occasion ? p.occasion.slice(0, 60) + (p.occasion.length > 60 ? '…' : '') : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
