'use client'

import { useRouter } from 'next/navigation'
import Link from "@/components/Link"
import { PlayCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PrecentingSetRow {
  id: number
  date: string
  type: string
  psalmIds: number[]
}

interface Props {
  sets: PrecentingSetRow[]
}

function smartDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) {
    return target.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
  }
  return target.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function shortType(type: string): string {
  if (type === 'AM Service') return 'AM'
  if (type === 'PM Service') return 'PM'
  return type
}

export function PrecentingSetList({ sets }: Props) {
  const router = useRouter()

  if (sets.length === 0) {
    return (
      <div className="pt-12 text-center">
        <h2 className="text-xl font-semibold">No precenting sets yet</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first set to start building a service order.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date ↓</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Psalms</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sets.map((set) => (
          <TableRow
            key={set.id}
            onClick={() => router.push('/precent/' + set.id)}
            className="cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-transform duration-75"
          >
            <TableCell className="font-medium">{smartDate(set.date)}</TableCell>
            <TableCell className="text-muted-foreground">{shortType(set.type)}</TableCell>
            <TableCell className="text-muted-foreground text-sm whitespace-normal break-words">
              {set.psalmIds.length > 0 ? set.psalmIds.join(', ') : '—'}
            </TableCell>
            <TableCell className="text-right w-px">
              {set.psalmIds.length > 0 && (
                <Link
                  href={`/precent/${set.id}/sing/1`}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Start precenting"
                  className="inline-flex items-center justify-center p-1.5 rounded hover:bg-muted transition-colors active:bg-muted active:translate-y-px transition-all duration-75"
                >
                  <PlayCircle className="h-4 w-4 text-foreground" />
                </Link>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
