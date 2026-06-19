'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  users: { id: string; name: string }[]
  selfId: string
  selectedId: string
}

export function ViewingAsBar({ users, selfId, selectedId }: Props) {
  const router = useRouter()
  function onChange(id: string) {
    if (id === selfId) router.push('/precent')
    else router.push(`/precent?as=${encodeURIComponent(id)}`)
  }
  return (
    <div className="mb-4 flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Viewing as</span>
      <Select value={selectedId} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger className="w-56" aria-label="Viewing as precentor">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.id === selfId ? `${u.name} (you)` : u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
