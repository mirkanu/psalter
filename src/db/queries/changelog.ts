import { eq } from "drizzle-orm"
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

/**
 * Edits an existing post's title/body in place. Does not touch createdAt (so the post
 * keeps its original position in the reverse-chronological list) and does not re-trigger
 * the subscriber broadcast — editing a typo shouldn't re-email everyone.
 */
export async function updateChangelogPost(id: number, values: { title: string; body: string }) {
  const [updated] = await db
    .update(changelogPosts)
    .set(values)
    .where(eq(changelogPosts.id, id))
    .returning()
  return updated ?? null
}
