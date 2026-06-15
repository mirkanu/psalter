'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
import type { PsalmRow } from '@/components/PsalmListingGrid'

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
  allPsalms: PsalmRow[]
  psalmMeterById: Record<number, string | null>
  recommendedTuneByPsalmId: Record<number, string | null>
  onTuneClick: (item: SetItemView) => void
  onPsalmClick: (item: SetItemView) => void
}

export function SetItemsSortableList({
  setId,
  items,
  allPsalms,
  psalmMeterById,
  recommendedTuneByPsalmId,
  onTuneClick,
  onPsalmClick,
}: SetItemsSortableListProps) {
  const router = useRouter()
  const [optimisticItems, setOptimisticItems] = useState<SetItemView[]>(items)
  const [, startTransition] = useTransition()
  const isDragging = useRef(false)
  const sensors = useSensors(useSensor(PointerSensor))

  // Sync optimistic state when server data refreshes (router.refresh() causes new props)
  // Skip sync while a drag is in progress to avoid flickering mid-gesture
  useEffect(() => {
    if (!isDragging.current) {
      setOptimisticItems(items)
    }
  }, [items])

  function handleDragEnd(event: DragEndEvent) {
    isDragging.current = false
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
    } else {
      router.refresh()
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => { isDragging.current = true }}
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
                allPsalms={allPsalms}
                psalmMeter={psalmMeterById[item.psalmId] ?? null}
                recommendedTune={recommendedTuneByPsalmId[item.psalmId] ?? null}
                onDelete={handleDelete}
                onTuneClick={onTuneClick}
                onPsalmClick={onPsalmClick}
              />
            ))}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  )
}
