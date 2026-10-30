import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { SoundBrowser } from '../library/SoundBrowser.tsx'

export function PadPicker({
  slot,
  onPick,
  onClose,
}: {
  slot: number
  onPick: (soundId: string, label: string) => void
  onClose: () => void
}) {
  return (
    <Dialog title={`Choose a sound for pad ${slot}`} onClose={onClose} wide>
      <div className="max-h-[60dvh] overflow-y-auto">
        <SoundBrowser
          compact
          actions={(sound) => (
            <Button
              className="px-3 py-1 text-sm"
              onClick={() => {
                onPick(sound.id, sound.title)
                onClose()
              }}
            >
              Choose
            </Button>
          )}
        />
      </div>
      <div className="mt-4 text-right">
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </Dialog>
  )
}
