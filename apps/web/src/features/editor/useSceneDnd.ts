import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { SceneData, SceneSection, Sound } from '@ogre/shared'
import { cardForSound, insertCard, moveCard, sectionOfCard } from './cards.ts'
import { SOUND_DRAG_PREFIX } from './LibraryPanel.tsx'

const SECTION_PREFIX = 'section:'

/** Handles both dropping library sounds into a section and reordering cards within one. */
export function useSceneDnd(data: SceneData, setData: (d: SceneData) => void) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const targetOf = (overId: string): { section: SceneSection; index: number } | null => {
    if (overId.startsWith(SECTION_PREFIX)) {
      const section = overId.slice(SECTION_PREFIX.length) as SceneSection
      return { section, index: data[section].length }
    }
    const section = sectionOfCard(data, overId)
    return section ? { section, index: data[section].findIndex((c) => c.id === overId) } : null
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const target = targetOf(String(over.id))
    if (!target) return
    const activeId = String(active.id)
    if (activeId.startsWith(SOUND_DRAG_PREFIX)) {
      const sound = active.data.current?.sound as Sound | undefined
      if (sound)
        setData(insertCard(data, target.section, cardForSound(sound, target.section), target.index))
      return
    }
    const from = sectionOfCard(data, activeId)
    if (from !== target.section || activeId === over.id) return
    const fromIndex = data[from].findIndex((c) => c.id === activeId)
    setData(moveCard(data, from, fromIndex, Math.min(target.index, data[from].length - 1)))
  }

  return { sensors, onDragEnd }
}
