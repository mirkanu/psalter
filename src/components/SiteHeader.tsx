import Link from "next/link"

const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/daily", label: "Daily Plan" },
]

export function SiteHeader() {
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
                className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm font-medium px-3 py-2 rounded-md"
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
