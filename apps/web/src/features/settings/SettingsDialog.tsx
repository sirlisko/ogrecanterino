import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { CheckRow, SelectRow, SettingsSection } from './SettingRows.tsx'
import { changeSettings, useSettings } from './settings.ts'

const seconds = (values: number[], zero?: string) =>
  values.map((s) => ({ value: s, label: s === 0 && zero ? zero : `${s} s` }))

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const settings = useSettings()

  return (
    <Dialog title="Settings" onClose={onClose}>
      <p className="-mt-2 text-sm text-ink-muted">These apply to this device only.</p>
      <div className="mt-5 flex flex-col gap-6">
        <SettingsSection title="Playback">
          <SelectRow
            label="Scene crossfade"
            description="How long one scene's sound takes to blend into the next."
            value={settings.crossfadeSeconds}
            options={seconds([0, 1, 3, 5, 8], 'Cut')}
            onChange={(crossfadeSeconds) => changeSettings({ crossfadeSeconds })}
          />
          <SelectRow
            label="Fade out"
            description="How long Fade out (Esc) takes to bring everything to silence."
            value={settings.fadeOutSeconds}
            options={seconds([0.5, 1.5, 3, 5])}
            onChange={(fadeOutSeconds) => changeSettings({ fadeOutSeconds })}
          />
          <SelectRow
            label="Hold to talk lowers the music"
            description="While you hold D or Hold to talk, and under effects set to lower the music."
            value={settings.duckGain}
            options={[
              { value: 0.5, label: 'A little' },
              { value: 0.3, label: 'By half' },
              { value: 0.1, label: 'Almost off' },
            ]}
            onChange={(duckGain) => changeSettings({ duckGain })}
          />
        </SettingsSection>
        <SettingsSection title="Display">
          <CheckRow
            label="Lights follow the sound"
            description="While a scene plays, its picture and the edge of the transport bar flicker with the music and flash on effects. When off, they stay steadily lit."
            checked={settings.lightsFollowSound}
            onChange={(lightsFollowSound) => changeSettings({ lightsFollowSound })}
          />
        </SettingsSection>
      </div>
      <div className="mt-6 text-right">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  )
}
