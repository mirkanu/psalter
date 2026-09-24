import Link from "@/components/Link"

export default function AdminOnlyPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground text-sm">This page is only available to admins.</p>
        <Link href="/" className="text-sm text-primary hover:underline active:bg-muted active:translate-y-px transition-all duration-75">
          Go home
        </Link>
      </div>
    </div>
  )
}
