import { useDraggable } from '@dnd-kit/core'
import type { SceneSection, Sound } from '@ogre/shared'
import type { ReactNode } from 'react'
import { SoundBrowser } from '../library/SoundBrowser.tsx'
import { SECTION_META } from './SectionEditor.tsx'

export const SOUND_DRAG_PREFIX = 'sound:'

function DraggableSound({ sound, children }: { sound: Sound; children: ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `${SOUND_DRAG_PREFIX}${sound.id}`,
    data: { sound },
  })
  return (
    <div ref={setNodeRef} className={`flex items-center ${isDragging ? 'opacity-40' : ''}`}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${sound.title} into the scene`}
        className="cursor-grab touch-none px-1 text-peat-400 hover:text-ink"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function LibraryPanel({ onAdd }: { onAdd: (sound: Sound, section: SceneSection) => void }) {
  return (
    <SoundBrowser
      compact
      wrapRow={(sound, row) => <DraggableSound sound={sound}>{row}</DraggableSound>}
      actions={(sound) => (
        <div className="flex gap-0.5">
          {(['music', 'ambiences', 'effects'] as const).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => onAdd(sound, section)}
              aria-label={`Add ${sound.title} to ${SECTION_META[section].title}`}
              title={`Add to ${SECTION_META[section].title}`}
              className="h-7 rounded-md px-2 text-sm font-medium hover:bg-peat-700"
              style={{ color: SECTION_META[section].color }}
            >
              +{SECTION_META[section].title[0]}
            </button>
          ))}
        </div>
      )}
    />
  )
}
