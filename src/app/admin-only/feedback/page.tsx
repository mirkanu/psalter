export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { feedbackSubmissions } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function FeedbackPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') redirect('/login')

  const submissions = await db
    .select()
    .from(feedbackSubmissions)
    .orderBy(desc(feedbackSubmissions.createdAt))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Feedback Submissions</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Submitted</TableHead>
            <TableHead scope="col">Name</TableHead>
            <TableHead scope="col">Email</TableHead>
            <TableHead scope="col">Page URL</TableHead>
            <TableHead scope="col">Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">No feedback submissions yet.</TableCell>
            </TableRow>
          ) : submissions.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.createdAt.toLocaleString('en-GB')}</TableCell>
              <TableCell>{row.name ?? '—'}</TableCell>
              <TableCell>{row.email ?? '—'}</TableCell>
              <TableCell title={row.pageUrl ?? undefined}>{row.pageUrl ? row.pageUrl.slice(0, 40) : '—'}</TableCell>
              <TableCell>{row.message.slice(0, 120)}{row.message.length > 120 ? '…' : ''}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
