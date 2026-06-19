import Link from 'next/link'

export default function AdminOnlyPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground text-sm">This page is only available to admins.</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    </div>
  )
}
