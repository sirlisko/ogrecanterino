import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { changeSettings, useSettings } from './settings.ts'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const lightsFollowSound = useSettings((s) => s.lightsFollowSound)

  return (
    <Dialog title="Settings" onClose={onClose}>
      <p className="text-sm text-ink-muted">These apply to this device only.</p>
      <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={lightsFollowSound}
          onChange={(e) => changeSettings({ lightsFollowSound: e.target.checked })}
          className="mt-1 accent-brass"
        />
        <span>
          Lights follow the sound
          <span className="block text-sm text-ink-muted">
            While a scene plays, its picture and the edge of the transport bar flicker with the
            music and flash on effects. When off, they stay steadily lit.
          </span>
        </span>
      </label>
      <div className="mt-6 text-right">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  )
}
