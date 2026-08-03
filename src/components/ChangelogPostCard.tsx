import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChangelogPost } from '@/db/queries/changelog'

interface ChangelogPostCardProps {
  post: ChangelogPost
}

export function ChangelogPostCard({ post }: ChangelogPostCardProps) {
  return (
    <Card data-changelog-post>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{post.title}</CardTitle>
        <time
          className="text-sm text-muted-foreground"
          dateTime={post.createdAt.toISOString()}
        >
          {format(post.createdAt, 'd MMMM yyyy')}
        </time>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{post.body}</p>
      </CardContent>
    </Card>
  )
}
