'use client'
import { useState, useEffect } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Search, Moon, Sun, MonitorSmartphone } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GlobalSearch } from '@/components/GlobalSearch'
import { FeedbackModal } from '@/components/FeedbackModal'
import { cn } from '@/lib/utils'
import { useChromeHidden } from '@/lib/chrome-hidden-store'

const navLinks = [
  { href: "/psalms", label: "Psalms" },
  { href: "/tunes", label: "Tunes" },
  { href: "/explore", label: "Explore" },
  { href: "/daily", label: "Daily Plan" },
  { href: "/precent", label: "Precent" },
  { href: "/changelog", label: "Changelog" },
]

// UAT v6 reversal: user explicitly wants the global SiteHeader visible on the
// singing view (overrides UI-SPEC §"Page anatomy"). PsalmTopBar sticks below
// it (offset adjusted in that component). Body height in SingingView subtracts
// SiteHeader height (~56px) accordingly. (TuneSubBar removed in 04.9.4-02.)

const THEME_CYCLE = ['light', 'dark', 'system'] as const

function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="size-8" />
  const current = theme === 'dark' || theme === 'system' ? theme : 'light'
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length]
  const label = current === 'system' ? 'Matching system theme' : current === 'dark' ? 'Dark mode' : 'Light mode'
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${label} — click for ${next}`}
      title={label}
      className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {current === 'system' ? (
        <MonitorSmartphone className="size-4" />
      ) : resolvedTheme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </button>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [footerOpen, setFooterOpen] = useState<'about' | 'copyright' | 'feedback' | null>(null)
  // Quick task 260712-kd1 (bug b fix): subscribed to the shared chrome-hidden
  // store, which only SingingView ever writes to. Defaults false (visible)
  // everywhere else, so this has zero effect on non-singing pages.
  const chromeHidden = useChromeHidden()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const linkClass = (href: string) =>
    isActive(href)
      ? 'text-foreground bg-muted text-sm font-medium px-3 py-2 rounded-md transition-colors'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium px-3 py-2 rounded-md transition-colors'

  return (
    <>
      <header
        data-scroll-hidden={chromeHidden ? '' : undefined}
        className={cn(
          'sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border pt-[env(safe-area-inset-top)]',
          'transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none',
          chromeHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
        )}
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://assets.softr-files.com/applications/408bc320-dc3f-4d12-8434-de0ccf926f90/assets/71a94206-c1da-47f1-af98-00f758d2f3a6.png"
                alt="CPRC Psalter"
                className="h-7 w-auto dark:[filter:invert(1)_hue-rotate(180deg)]"
              />
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20 leading-none tracking-wide">
                v2 beta
              </span>
            </Link>

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Search className="size-4" />
              </button>
              <ThemeToggle />
            </nav>

            {/* Mobile: search icon + dark mode + hamburger */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Search className="size-4" />
              </button>
              <ThemeToggle />
              <Sheet>
                <SheetTrigger
                  aria-label="Open navigation menu"
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Menu className="size-5" />
                </SheetTrigger>
                <SheetContent side="right" className="w-64 flex flex-col">
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
                  <div className="mt-auto pt-4 border-t border-border flex flex-col gap-1">
                    <SheetClose
                      render={<button onClick={() => setFooterOpen('about')} className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md text-left transition-colors w-full" />}
                    >
                      About
                    </SheetClose>
                    <SheetClose
                      render={<button onClick={() => setFooterOpen('copyright')} className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md text-left transition-colors w-full" />}
                    >
                      Copyright
                    </SheetClose>
                    <SheetClose
                      render={<button onClick={() => setFooterOpen('feedback')} className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md text-left transition-colors w-full" />}
                    >
                      Feedback
                    </SheetClose>
                    {/* 260717-mwv checkpoint round 2 (item B): the singing
                       view (/psalms/[id]) is a fixed-height layout with no
                       page-level scroll, so SiteFooter's "Made by GSD Labs"
                       credit (rendered below <main> in the root layout) is
                       never reachable there on mobile. Mirrored here in the
                       always-accessible hamburger menu, mobile-only (this
                       whole block already lives inside the md:hidden Sheet). */}
                    <a
                      href="https://gsdlabs.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md text-left transition-colors w-full"
                    >
                      Made by GSD Labs
                    </a>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>

      {footerOpen === 'about' && (
        <Dialog open onOpenChange={(v) => !v && setFooterOpen(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>About this Psalter</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>This small website provides practical resources for the psalm singing of the <a href="https://cprc.co.uk/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Covenant Protestant Reformed Church of Ballymena</a>, Northern Ireland. For more information on the theology behind singing the psalms, see the &ldquo;Psalm Singing&rdquo; section <a href="https://cprc.co.uk/resources-on-psalm-singing/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">here</a>.</p>
              <p>I&apos;m a member of the CPRC and will be adding more resources to this site over time.</p>
              <p>Feedback and suggestions welcome! You can submit it using the Feedback button below – or contact me directly if you know who I am 😉</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {footerOpen === 'copyright' && (
        <Dialog open onOpenChange={(v) => !v && setFooterOpen(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Copyright Notice</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Public Domain: King James Version, Scottish Psalter 1650, Haddington&apos;s Commentary, Nave&apos;s Topical Bible</p>
              <p className="font-medium text-foreground">Tunes:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Tunes: most are &gt;100 years old: public domain. Remainder are covered under Fair Use</li>
                <li>Images/scores of tunes: Copyright 1979 Reformed Presb. Church Ireland. Copyright expired in 2004 (25 years after publication under &ldquo;<a href="https://assets.publishing.service.gov.uk/media/5a801e5140f0b623026919f9/Copyright_Notice_Printed_Music.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Typographical Arrangement</a>&rdquo;).</li>
              </ol>
              <p>All other sources explicitly acknowledged</p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <FeedbackModal open={footerOpen === 'feedback'} onClose={() => setFooterOpen(null)} />
    </>
  )
}
