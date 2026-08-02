import { db } from "@/db"
import { changelogPosts } from "@/db/schema"

/**
 * All changelog posts, newest first. There is no draft state in Phase 9 —
 * every row in changelog_posts is published, so createdAt is the publish date.
 */
export async function fetchPublishedPosts() {
  return db.query.changelogPosts.findMany({
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })
}

export type ChangelogPost = Awaited<ReturnType<typeof fetchPublishedPosts>>[number]
