import { useDiscordStatus } from '../../api/discord.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { CheckRow, SelectRow, SettingsSection } from './SettingRows.tsx'
import { changeSettings, useSettings } from './settings.ts'

const seconds = (values: number[], zero?: string) =>
  values.map((s) => ({ value: s, label: s === 0 && zero ? zero : `${s} s` }))

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const settings = useSettings()
  const discord = useDiscordStatus().data?.configured

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
        <SettingsSection title="Controls">
          <CheckRow
            label="Ask before replacing a live scene"
            description="While a scene plays, starting another from a scene card, list or setlist needs a second click."
            checked={settings.confirmStart}
            onChange={(confirmStart) => changeSettings({ confirmStart })}
          />
          <CheckRow
            label="Show keyboard shortcuts"
            description="Keys like 1 and ⇧1 on effects, quick pads and the setlist. Off at first on touch screens."
            checked={settings.keyHints}
            onChange={(keyHints) => changeSettings({ keyHints })}
          />
        </SettingsSection>
        {discord && (
          <SettingsSection title="Discord">
            <CheckRow
              label="Mute this device while sending to Discord"
              description="So you don't hear the scene twice when you listen in Discord. Your sound comes back when you stop sending."
              checked={settings.muteWhileStreaming}
              onChange={(muteWhileStreaming) => changeSettings({ muteWhileStreaming })}
            />
          </SettingsSection>
        )}
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
