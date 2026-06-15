'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { SetItemRow } from '@/components/precent/SetItemRow'
import type { TuneRow } from '@/components/TuneGrid'

export interface SetItemView {
  id: number
  setId: number
  psalmId: number
  tuneId: number | null
  verseRange: string | null
  position: number
  psalm: { id: number; bibleTitle: string | null } | null
  tune: { id: number; name: string; meter: string | null } | null
}

interface SetItemsSortableListProps {
  setId: number
  items: SetItemView[]
  allTunes: TuneRow[]
  psalmMeterById: Record<number, string | null>
  onTuneClick: (item: SetItemView) => void
}

export function SetItemsSortableList({
  setId,
  items,
  psalmMeterById,
  onTuneClick,
}: SetItemsSortableListProps) {
  const [optimisticItems, setOptimisticItems] = useState<SetItemView[]>(items)
  const [, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = optimisticItems.findIndex((i) => i.id === active.id)
    const newIndex = optimisticItems.findIndex((i) => i.id === over.id)
    const reordered = arrayMove(optimisticItems, oldIndex, newIndex)
    setOptimisticItems(reordered)

    startTransition(async () => {
      const res = await fetch(`/api/precent/${setId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map((i) => i.id) }),
      })
      if (!res.ok) {
        setOptimisticItems(items)
        toast.error("Reorder didn't save. The list has been restored.")
      }
    })
  }

  async function handleDelete(itemId: number) {
    const prev = optimisticItems
    setOptimisticItems((cur) => cur.filter((i) => i.id !== itemId))
    const res = await fetch(`/api/precent/${setId}/items/${itemId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      setOptimisticItems(prev)
      toast.error("Couldn't remove the psalm. Try again.")
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={optimisticItems.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="w-8 pb-2" aria-label="Drag handle" />
              <th className="pb-2 w-6">#</th>
              <th className="pb-2">Psalm</th>
              <th className="pb-2 w-16">Verses</th>
              <th className="pb-2 w-20">Meter</th>
              <th className="pb-2">Tune</th>
              <th className="pb-2 w-20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {optimisticItems.map((item, index) => (
              <SetItemRow
                key={item.id}
                item={item}
                index={index}
                setId={setId}
                psalmMeter={psalmMeterById[item.psalmId] ?? null}
                onDelete={handleDelete}
                onTuneClick={onTuneClick}
              />
            ))}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  )
}
