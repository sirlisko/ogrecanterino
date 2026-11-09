import { engine } from '../../audio/engine.ts'
import { usePlayer, type Volumes } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'

const CHANNELS: { key: keyof Volumes; label: string; color: string }[] = [
  { key: 'master', label: 'Master', color: 'var(--color-ink)' },
  { key: 'music', label: 'Music', color: 'var(--color-brass)' },
  { key: 'ambience', label: 'Ambience', color: 'var(--color-lichen)' },
  { key: 'effect', label: 'Effects', color: 'var(--color-arcane)' },
]

/**
 * Same settings as the Mixer popover. Upright faders beside the pads when there's room; `compact`
 * is a row under the transport, so a portrait tablet can reach the volume without scrolling.
 */
export function TableMixer({ compact }: { compact?: boolean }) {
  const volumes = usePlayer((s) => s.volumes)
  const monitor = usePlayer((s) => s.monitor)

  return (
    <section
      aria-label="Volume"
      className={`flex flex-col rounded-2xl bg-peat-800 ring-1 ring-peat-700 ${compact ? 'gap-2 p-3' : 'gap-4 p-4'}`}
    >
      <div
        className={
          compact ? 'grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-4' : 'grid grid-cols-4 gap-2'
        }
      >
        {CHANNELS.map(({ key, label, color }) => (
          <label
            key={key}
            className={
              compact
                ? 'grid grid-cols-[1fr_auto] items-center gap-x-2 text-[15px]'
                : 'flex flex-col items-center gap-2 text-[15px]'
            }
          >
            {compact ? <span style={{ color }}>{label}</span> : null}
            <span className="text-ink-muted tabular">{volumes[key]}</span>
            <Fader
              large
              vertical={!compact}
              value={volumes[key]}
              label={`${label} volume`}
              color={color}
              className={compact ? 'col-span-2' : ''}
              onChange={(v) => engine.setVolume(key, v)}
            />
            {compact ? null : <span style={{ color }}>{label}</span>}
          </label>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={!monitor}
        onClick={() => engine.setMonitor(!monitor)}
        className={`${compact ? 'min-h-11' : 'min-h-14 text-lg'} w-full rounded-xl px-5 ring-1 ${monitor ? 'text-ink-muted ring-peat-600 hover:text-ink' : 'bg-danger/15 font-medium text-danger ring-danger/40'}`}
      >
        {monitor ? 'Mute this device' : 'Unmute this device'}
      </button>
    </section>
  )
}
