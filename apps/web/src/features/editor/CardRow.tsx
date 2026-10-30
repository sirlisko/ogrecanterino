import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card, SceneSection } from '@ogre/shared'
import { useSoundStatus } from '../../api/sounds.ts'
import { engine, previewLevel } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'
import { Icon } from '../../ui/Icon.tsx'

const SECONDS = (ms: number) => Math.round(ms / 1000)

interface Props {
  card: Card
  section: SceneSection
  color: string
  onChange: (patch: Partial<Card>) => void
  onRemove: () => void
}

export function CardRow({ card, section, color, onChange, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })
  const status = useSoundStatus()(card.soundId)
  const previewing = usePlayer((s) => !!card.soundId && s.previewId === card.soundId)
  const missing = status === 'missing'
  const interval = card.intervalMs ?? [30_000, 90_000]
  const times = card.times ?? [1, 1]

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg bg-peat-800 p-2 ring-1 ring-peat-700 ${isDragging ? 'relative z-10 shadow-xl ring-brass' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${card.label}`}
          className="cursor-grab touch-none px-1 text-peat-400 hover:text-ink"
        >
          <Icon name="grip" />
        </button>
        <input
          type="checkbox"
          checked={card.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          aria-label={`Enable ${card.label}`}
          style={{ accentColor: color }}
        />
        <input
          value={card.label}
          onChange={(e) => onChange({ label: e.target.value })}
          aria-label="Label"
          className="min-w-0 flex-1 rounded bg-transparent px-1.5 py-1 hover:bg-peat-900 focus:bg-peat-900"
        />
        {missing && <span className="text-sm text-danger">missing</span>}
        <Fader
          value={card.volume}
          label={`${card.label} volume`}
          color={color}
          className="max-w-24"
          onChange={(volume) => onChange({ volume })}
        />
        <button
          type="button"
          onClick={() =>
            card.soundId && engine.togglePreview(card.soundId, previewLevel(card, section))
          }
          disabled={status !== 'ready'}
          aria-label={previewing ? `Stop ${card.label}` : `Preview ${card.label}`}
          className="grid h-7 w-7 place-items-center rounded-full text-xs text-ink-muted hover:bg-peat-700 hover:text-ink disabled:opacity-40"
        >
          <Icon name={previewing ? 'stop' : 'play'} className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${card.label}`}
          className="grid h-7 w-7 place-items-center rounded-full text-peat-400 hover:bg-danger/15 hover:text-danger"
        >
          <Icon name="close" />
        </button>
      </div>
      {section === 'ambiences' && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-8 text-sm text-ink-muted">
          <select
            value={card.mode}
            onChange={(e) => {
              const mode = e.target.value as Card['mode']
              onChange(mode === 'interval' ? { mode, intervalMs: interval, times } : { mode })
            }}
            aria-label="Playback"
            className="rounded-md bg-peat-900 px-2 py-1 text-ink"
          >
            <option value="loop">Loop continuously</option>
            <option value="interval">Play at random intervals</option>
          </select>
          {card.mode === 'interval' && (
            <>
              <span className="flex items-center gap-1">
                every
                <NumberInput
                  label="Minimum seconds"
                  value={SECONDS(interval[0])}
                  onChange={(v) =>
                    onChange({ intervalMs: [v * 1000, Math.max(v * 1000, interval[1])] })
                  }
                />
                to
                <NumberInput
                  label="Maximum seconds"
                  value={SECONDS(interval[1])}
                  onChange={(v) =>
                    onChange({ intervalMs: [Math.min(interval[0], v * 1000), v * 1000] })
                  }
                />
                s
              </span>
              <span className="flex items-center gap-1">
                play
                <NumberInput
                  label="Minimum repeats"
                  value={times[0]}
                  min={1}
                  onChange={(v) => onChange({ times: [v, Math.max(v, times[1])] })}
                />
                to
                <NumberInput
                  label="Maximum repeats"
                  value={times[1]}
                  min={1}
                  onChange={(v) => onChange({ times: [Math.min(times[0], v), v] })}
                />
                times
              </span>
            </>
          )}
        </div>
      )}
    </li>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
      className="w-16 rounded-md bg-peat-900 px-2 py-1 text-ink tabular"
    />
  )
}
