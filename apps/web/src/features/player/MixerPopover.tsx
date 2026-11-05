import { engine } from '../../audio/engine.ts'
import { usePlayer, type Volumes } from '../../audio/store.ts'
import { Fader } from '../../ui/Fader.tsx'
import { Popover } from '../../ui/Popover.tsx'
import { LevelMeter } from './LevelMeter.tsx'

const CHANNELS: { key: keyof Volumes; label: string; color: string }[] = [
  { key: 'master', label: 'Master', color: 'var(--color-ink)' },
  { key: 'music', label: 'Music', color: 'var(--color-brass)' },
  { key: 'ambience', label: 'Ambience', color: 'var(--color-lichen)' },
  { key: 'effect', label: 'Effects', color: 'var(--color-arcane)' },
]

export function MixerPopover() {
  const volumes = usePlayer((s) => s.volumes)
  const monitor = usePlayer((s) => s.monitor)

  return (
    <Popover trigger="Mixer" label="Mixer">
      <div className="flex flex-col gap-3">
        {CHANNELS.map(({ key, label, color }) => (
          <label
            key={key}
            className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-sm"
          >
            <span style={{ color }}>{label}</span>
            <span className="flex flex-col gap-1">
              <Fader
                value={volumes[key]}
                label={`${label} volume`}
                color={color}
                onChange={(v) => engine.setVolume(key, v)}
              />
              <LevelMeter channel={key} color={color} />
            </span>
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
      </div>
    </Popover>
  )
}
