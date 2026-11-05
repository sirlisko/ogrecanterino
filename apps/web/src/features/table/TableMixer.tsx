import { engine } from '../../audio/engine.ts'
import { usePlayer, type Volumes } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'

const CHANNELS: { key: keyof Volumes; label: string; color: string }[] = [
  { key: 'master', label: 'Master', color: 'var(--color-ink)' },
  { key: 'music', label: 'Music', color: 'var(--color-brass)' },
  { key: 'ambience', label: 'Ambience', color: 'var(--color-lichen)' },
  { key: 'effect', label: 'Effects', color: 'var(--color-arcane)' },
]

/** The mixer's volumes with touch-sized faders; same settings as the Mixer popover. */
export function TableMixer() {
  const volumes = usePlayer((s) => s.volumes)
  const monitor = usePlayer((s) => s.monitor)

  return (
    <section aria-label="Volume" className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="grid min-w-0 flex-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        {CHANNELS.map(({ key, label, color }) => (
          <label key={key} className="flex items-center gap-3 text-lg">
            <span className="w-24 shrink-0" style={{ color }}>
              {label}
            </span>
            <Fader
              large
              value={volumes[key]}
              label={`${label} volume`}
              color={color}
              onChange={(v) => engine.setVolume(key, v)}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={!monitor}
        onClick={() => engine.setMonitor(!monitor)}
        className={`h-16 rounded-xl px-5 text-lg ring-1 ${monitor ? 'text-ink-muted ring-peat-600 hover:text-ink' : 'bg-danger/15 font-medium text-danger ring-danger/40'}`}
      >
        {monitor ? 'Mute this device' : 'Unmute this device'}
      </button>
    </section>
  )
}
