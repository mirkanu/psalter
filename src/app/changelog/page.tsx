export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { fetchPublishedPosts } from '@/db/queries/changelog'
import { ChangelogPostCard } from '@/components/ChangelogPostCard'
import { ChangelogComposer } from '@/components/ChangelogComposer'
import { SubscribeForm } from '@/components/SubscribeForm'

export const metadata: Metadata = {
  title: 'Changelog | CPRC Psalter',
  description: 'What is new on the CPRC Psalter.',
}

export default async function ChangelogPage() {
  const posts = await fetchPublishedPosts()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-changelog-page>
      <h1 className="text-3xl md:text-4xl font-bold">Changelog</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Updates and improvements to the CPRC Psalter.
      </p>

      <ChangelogComposer />

      {posts.length === 0 ? (
        <div className="mt-8" data-changelog-empty>
          <h2 className="text-lg font-semibold">No updates yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Check back soon — published posts will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4" data-changelog-list>
          {posts.map((post) => (
            <ChangelogPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <SubscribeForm />
    </div>
  )
}
