'use client'

import { useState, useEffect } from "react"

const SECTIONS = [
  { id: 'when-you', label: "When you..." },
  { id: 'by-theme', label: "By Theme" },
  { id: 'in-the-nt', label: "In the NT" },
  { id: 'other-topics', label: "Other Topics" },
  { id: 'authors', label: "Authors" },
  { id: 'catechism', label: "Catechism" },
]

export function ExploreAnchorNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-10% 0px -85% 0px' }
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="sticky top-[64px] z-10 bg-background/95 backdrop-blur-sm border-b border-border h-10 overflow-x-auto flex whitespace-nowrap">
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`text-sm px-3 py-2 transition-colors ${
            activeId === id
              ? 'text-foreground font-semibold border-b-2 border-primary -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
