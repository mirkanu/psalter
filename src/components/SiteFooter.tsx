'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FeedbackModal } from '@/components/FeedbackModal'
import { DeployStatus } from '@/components/DeployStatus'
import { GithubMark } from '@/components/GithubMark'

export function SiteFooter() {
  const [open, setOpen] = useState<'about' | 'copyright' | 'feedback' | null>(null)

  return (
    <>
      {/* Quick task 260817-p17: below `md` (768px) the hamburger menu in
          SiteHeader already carries About/Copyright/Feedback/Changelog and
          the "Made by GSD Labs" credit, so a mobile footer would be a
          duplicate (and, with the credit moved there, an empty grey bar).
          `md` matches the `md:hidden` gate on the hamburger cluster so the
          two are exact complements at every width. */}
      <footer className="hidden md:block bg-muted border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen('about')} className="text-sm text-muted-foreground hover:text-foreground transition-colors active:bg-muted active:translate-y-px transition-all duration-75">About</button>
            <button onClick={() => setOpen('copyright')} className="text-sm text-muted-foreground hover:text-foreground transition-colors active:bg-muted active:translate-y-px transition-all duration-75">Copyright</button>
            <button onClick={() => setOpen('feedback')} className="text-sm text-muted-foreground hover:text-foreground transition-colors active:bg-muted active:translate-y-px transition-all duration-75">Feedback</button>
            <a href="/changelog" className="text-sm text-muted-foreground hover:text-foreground transition-colors active:bg-muted active:translate-y-px transition-all duration-75">Changelog</a>
            {/* Admin-only deploy-status indicator. Renders nothing for
                non-admin users (gated inside DeployStatus by useSession).
                Hovering shows the full commit sha + subject for traceability. */}
            <DeployStatus />
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/mirkanu/psalter"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              title="View source on GitHub"
              className="inline-flex items-center justify-center rounded-md size-7 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:translate-y-px"
            >
              <GithubMark className="size-4 mr-1" />
            </a>
            <a href="https://gsdlabs.dev" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors active:bg-muted active:translate-y-px transition-all duration-75">Made by GSD Labs</a>
          </div>
        </div>
      </footer>

      {open === 'about' && (
        <Dialog open onOpenChange={(v) => !v && setOpen(null)}>
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

      {open === 'copyright' && (
        <Dialog open onOpenChange={(v) => !v && setOpen(null)}>
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

      <FeedbackModal open={open === 'feedback'} onClose={() => setOpen(null)} />
    </>
  )
}
