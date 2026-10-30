import type { Sound } from '@ogre/shared'
import type { ReactNode } from 'react'
import { formatTime } from '../../ui/format.ts'
import { STRUCTURAL_TAGS } from './filters.ts'

const CATEGORY_COLOR = {
  music: 'var(--color-brass)',
  ambience: 'var(--color-lichen)',
  effect: 'var(--color-arcane)',
}

export function SoundRow({
  sound,
  previewing,
  onPreview,
  actions,
  dragHandle,
}: {
  sound: Sound
  previewing: boolean
  onPreview: () => void
  actions?: ReactNode
  dragHandle?: ReactNode
}) {
  const color = CATEGORY_COLOR[sound.category]
  const tags = sound.tags.filter((t) => !STRUCTURAL_TAGS.has(t))
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-peat-800">
      {dragHandle}
      <button
        type="button"
        onClick={onPreview}
        aria-label={previewing ? `Stop ${sound.title}` : `Preview ${sound.title}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ring-1 transition-colors"
        style={{
          color: previewing ? 'var(--color-peat-950)' : color,
          backgroundColor: previewing ? color : 'transparent',
          ['--tw-ring-color' as string]: color,
        }}
      >
        {previewing ? '■' : '▶'}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate">{sound.title}</p>
        <p className="truncate text-sm text-ink-muted">
          {sound.artist || 'Unknown artist'}
          {tags.length > 0 && <span className="text-peat-400">, {tags.join(', ')}</span>}
        </p>
      </div>
      <span className="hidden text-sm text-ink-muted tabular sm:block">
        {sound.durationMs ? formatTime(sound.durationMs / 1000) : ''}
      </span>
      {actions}
    </div>
  )
}
