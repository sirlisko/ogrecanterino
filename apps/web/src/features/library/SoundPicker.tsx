import type { Sound, SoundCategory } from '@ogre/shared'
import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { SoundBrowser } from './SoundBrowser.tsx'

/** Library browser in a dialog that hands back one chosen sound. */
export function SoundPicker({
  title,
  category,
  onPick,
  onClose,
}: {
  title: string
  category?: SoundCategory
  onPick: (sound: Sound) => void
  onClose: () => void
}) {
  return (
    <Dialog title={title} onClose={onClose} wide>
      <div className="-m-1 max-h-[60dvh] overflow-y-auto p-1">
        <SoundBrowser
          compact
          initialCategory={category}
          actions={(sound) => (
            <Button
              className="px-3 py-1 text-sm"
              onClick={() => {
                onPick(sound)
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
