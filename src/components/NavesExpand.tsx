'use client'

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface NavesTopic {
  id: number
  name: string
  psalm_count: number
  slug: string
}

interface NavesExpandProps {
  topics: NavesTopic[]
}

export function NavesExpand({ topics }: NavesExpandProps) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = query
    ? topics.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
    : topics

  const visible = query ? filtered : (expanded ? filtered : filtered.slice(0, 24))
  const hasMore = !query && topics.length > 24

  return (
    <div>
      <input
        type="search"
        placeholder="Search topics..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full mb-3 px-3 py-2 rounded-md border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {visible.map((topic) => (
          <Link
            key={topic.id}
            href={`/explore/naves/${topic.slug}`}
            className="block px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors"
          >
            <Badge variant="secondary" className="float-right ml-2 mt-0.5 text-xs shrink-0">
              {topic.psalm_count} psalms
            </Badge>
            <span className="leading-snug">{topic.name}</span>
          </Link>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 text-sm text-primary hover:underline underline-offset-4"
        >
          {expanded ? "Show fewer" : `View all ${topics.length} topics`}
        </button>
      )}
    </div>
  )
}
