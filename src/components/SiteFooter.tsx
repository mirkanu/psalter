'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FeedbackModal } from '@/components/FeedbackModal'

export function SiteFooter() {
  const [open, setOpen] = useState<'about' | 'copyright' | 'feedback' | null>(null)

  return (
    <>
      <footer className="bg-muted border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen('about')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</button>
            <button onClick={() => setOpen('copyright')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Copyright</button>
            <button onClick={() => setOpen('feedback')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Feedback</button>
          </div>
          <a href="https://gsdlabs.dev" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Made by GSD Labs</a>
        </div>
      </footer>

      <Dialog open={open === 'about'} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>About this Psalter</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">The CPRC Psalter is a digital edition of the Scottish Metrical Psalter, prepared for the congregation and precentors of the Covenant Protestant Reformed Church. It provides lyric text, tune notation, and daily reading plans drawn from the 1650 Scottish Psalter.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'copyright'} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Copyright Notice</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Psalm texts are taken from the 1650 Scottish Psalter, which is in the public domain. Tune settings may carry their own copyright; please consult original sources before reproduction. Site design and code © CPRC / GSD Labs.</p>
        </DialogContent>
      </Dialog>

      <FeedbackModal open={open === 'feedback'} onClose={() => setOpen(null)} />
    </>
  )
}
