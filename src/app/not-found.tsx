import Link from "@/components/Link"
import { Music } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="mx-auto mb-6">
        <Music className="size-20 text-muted-foreground mx-auto" aria-hidden="true" />
      </div>
      <p className="text-6xl font-bold text-muted-foreground mb-4">404</p>
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        This page doesn&apos;t exist in the psalter.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/" className={buttonVariants({ variant: "default", size: "lg" })}>
          Go home
        </Link>
        <Link href="/psalms" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Browse psalms
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mt-12">
        If you followed a link, please let us know via the Feedback button.
      </p>
    </div>
  )
}
