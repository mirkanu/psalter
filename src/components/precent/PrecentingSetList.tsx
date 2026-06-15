'use client'

import { useRouter } from 'next/navigation'
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
  precentorName: string
}

interface Props {
  sets: PrecentingSetRow[]
}

function formatDate(dateStr: string): string {
  // date column returns 'YYYY-MM-DD' — parse as local date to avoid UTC-shift
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Precentor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sets.map((set) => (
          <TableRow
            key={set.id}
            onClick={() => router.push('/precent/' + set.id)}
            className="cursor-pointer hover:bg-muted/50 active:scale-[0.99] transition-transform duration-75"
          >
            <TableCell>{formatDate(set.date)}</TableCell>
            <TableCell>{set.type}</TableCell>
            <TableCell>{set.precentorName}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
