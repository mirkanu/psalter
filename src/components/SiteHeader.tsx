'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/search", label: "Search" },
  { href: "/explore", label: "Explore" },
  { href: "/daily", label: "Daily Plan" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="font-semibold text-foreground text-base hover:text-primary transition-colors"
          >
            CPRC Psalter
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(link.href)
                  ? 'text-foreground bg-muted text-sm font-medium px-3 py-2 rounded-md transition-colors'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium px-3 py-2 rounded-md transition-colors'
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
