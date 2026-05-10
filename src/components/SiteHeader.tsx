'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from 'lucide-react'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet'

const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/explore", label: "Explore" },
  { href: "/daily", label: "Daily Plan" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const linkClass = (href: string) =>
    isActive(href)
      ? 'text-foreground bg-muted text-sm font-medium px-3 py-2 rounded-md transition-colors'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium px-3 py-2 rounded-md transition-colors'

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://assets.softr-files.com/applications/408bc320-dc3f-4d12-8434-de0ccf926f90/assets/71a94206-c1da-47f1-af98-00f758d2f3a6.png"
              alt="CPRC Psalter"
              className="h-7 w-auto"
            />
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20 leading-none tracking-wide">
              beta
            </span>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger — hidden on desktop */}
          <Sheet>
            <SheetTrigger
              aria-label="Open navigation menu"
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="!w-56">
              <nav className="flex flex-col gap-1 pt-6" aria-label="Mobile primary">
                {navLinks.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={<Link href={link.href} className={linkClass(link.href)} />}
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
