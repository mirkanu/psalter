import Link from "next/link"

interface MessianicTopic {
  id: number
  name: string
  messianic: string | null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function MessianicByTopic({ topics }: { topics: MessianicTopic[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        Messianic
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {topics.map((t) => (
          <Link
            key={t.id}
            href={`/explore/naves/${slugify(t.name)}`}
            className="inline-flex items-center px-3 py-2 rounded-md border border-border text-sm hover:bg-muted hover:border-primary/30 transition-colors min-h-[44px]"
          >
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
