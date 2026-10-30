import { engine } from '../../audio/engine.ts'
import { usePlayer, type Volumes } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'
import { Popover } from '../../ui/Popover.tsx'

const CHANNELS: { key: keyof Volumes; label: string; color: string }[] = [
  { key: 'master', label: 'Master', color: 'var(--color-ink)' },
  { key: 'music', label: 'Music', color: 'var(--color-brass)' },
  { key: 'ambience', label: 'Ambience', color: 'var(--color-lichen)' },
  { key: 'effect', label: 'Effects', color: 'var(--color-arcane)' },
]

const CROSSFADES = [0, 1, 3, 5, 8]

export function MixerPopover() {
  const volumes = usePlayer((s) => s.volumes)
  const monitor = usePlayer((s) => s.monitor)
  const crossfade = usePlayer((s) => s.crossfadeSeconds)

  return (
    <Popover trigger="Mixer" label="Mixer">
      <div className="flex flex-col gap-3">
        {CHANNELS.map(({ key, label, color }) => (
          <label
            key={key}
            className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-sm"
          >
            <span style={{ color }}>{label}</span>
            <Fader
              value={volumes[key]}
              label={`${label} volume`}
              color={color}
              onChange={(v) => engine.setVolume(key, v)}
            />
            <span className="text-right text-ink-muted tabular">{volumes[key]}</span>
          </label>
        ))}
        <label className="mt-1 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!monitor}
            onChange={(e) => engine.setMonitor(!e.target.checked)}
            className="accent-brass"
          />
          Mute this device (M)
        </label>
        <label className="flex items-center gap-2 text-sm">
          Scene crossfade
          <select
            value={crossfade}
            onChange={(e) => engine.setCrossfade(Number(e.target.value))}
            className="ml-auto rounded-md bg-peat-700 px-2 py-1"
          >
            {CROSSFADES.map((s) => (
              <option key={s} value={s}>
                {s === 0 ? 'Cut' : `${s} s`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Popover>
  )
}
