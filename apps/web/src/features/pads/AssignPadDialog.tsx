import type { Sound } from '@ogre/shared'
import { Button } from '../../ui/Button.tsx'
import { Dialog } from '../../ui/Dialog.tsx'
import { PAD_SLOTS, usePadSlots } from './usePadSlots.ts'

/** The library's shortcut onto a pad. Laid out three by three, like the Shift + digit keys. */
export function AssignPadDialog({ sound, onClose }: { sound: Sound; onClose: () => void }) {
  const { at, assign } = usePadSlots()
  return (
    <Dialog title="Assign to pad" onClose={onClose}>
      <p className="mb-4 text-ink-muted">
        Choose a pad for {sound.title}. It replaces what's on it now.
      </p>
      <ul className="grid grid-cols-3 gap-1.5">
        {PAD_SLOTS.map((slot) => {
          const pad = at(slot)
          return (
            <li key={slot}>
              <button
                type="button"
                onClick={() => {
                  assign(slot, sound.id, sound.title)
                  onClose()
                }}
                className={`flex h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm ring-1 ring-peat-700 hover:bg-peat-700 ${pad ? 'bg-peat-900' : 'text-peat-400'}`}
              >
                <span className="text-ink-muted tabular">{slot}</span>
                <span className="min-w-0 flex-1 truncate">{pad?.label ?? 'Empty'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </Dialog>
  )
}
