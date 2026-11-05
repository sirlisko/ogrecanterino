import { engine } from '../../audio/engine.ts'
import { usePlayer, type Volumes } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'

const CHANNELS: { key: keyof Volumes; label: string; color: string }[] = [
  { key: 'master', label: 'Master', color: 'var(--color-ink)' },
  { key: 'music', label: 'Music', color: 'var(--color-brass)' },
  { key: 'ambience', label: 'Ambience', color: 'var(--color-lichen)' },
  { key: 'effect', label: 'Effects', color: 'var(--color-arcane)' },
]

/** The mixer as four upright faders; same settings as the Mixer popover. */
export function TableMixer() {
  const volumes = usePlayer((s) => s.volumes)
  const monitor = usePlayer((s) => s.monitor)

  return (
    <section
      aria-label="Volume"
      className="flex flex-col gap-4 rounded-2xl bg-peat-800 p-4 ring-1 ring-peat-700"
    >
      <div className="grid grid-cols-4 gap-2">
        {CHANNELS.map(({ key, label, color }) => (
          <label key={key} className="flex flex-col items-center gap-2 text-[15px]">
            <span className="text-ink-muted tabular">{volumes[key]}</span>
            <Fader
              large
              vertical
              value={volumes[key]}
              label={`${label} volume`}
              color={color}
              onChange={(v) => engine.setVolume(key, v)}
            />
            <span style={{ color }}>{label}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        aria-pressed={!monitor}
        onClick={() => engine.setMonitor(!monitor)}
        className={`min-h-14 w-full rounded-xl px-5 text-lg ring-1 ${monitor ? 'text-ink-muted ring-peat-600 hover:text-ink' : 'bg-danger/15 font-medium text-danger ring-danger/40'}`}
      >
        {monitor ? 'Mute this device' : 'Unmute this device'}
      </button>
    </section>
  )
}
