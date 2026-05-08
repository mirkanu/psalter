import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import { fetchPsalmDetail, fetchPsalmIds } from "@/db/queries/psalms"
import { PsalmTabs } from "@/components/PsalmTabs"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const ids = await fetchPsalmIds()
  return ids.map((id) => ({ id: String(id) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const psalm = await fetchPsalmDetail(Number(id))
  return {
    title: psalm?.bibleTitle
      ? `${psalm.bibleTitle} | CPRC Psalter`
      : `Psalm ${id} | CPRC Psalter`,
  }
}

export default async function PsalmPage({ params }: PageProps) {
  const { id } = await params
  const psalmId = Number(id)
  if (!Number.isFinite(psalmId) || psalmId < 1 || psalmId > 150) notFound()
  const psalm = await fetchPsalmDetail(psalmId)
  if (!psalm) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          Psalm {psalm.id}
        </span>
      </div>
      <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
        {psalm.bibleTitle ?? `Psalm ${psalm.id}`}
      </h1>
      <Suspense fallback={<div className="h-12 bg-muted animate-pulse rounded mt-6" />}>
        <PsalmTabs psalm={psalm} />
      </Suspense>
    </div>
  )
}
