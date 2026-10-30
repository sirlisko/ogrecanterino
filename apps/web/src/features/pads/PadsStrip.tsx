import { useRef, useState } from 'react'
import { engine } from '../../audio/engine.ts'
import { flash } from '../../ui/flash.ts'
import { PadEditor } from './PadEditor.tsx'
import { PadPicker } from './PadPicker.tsx'
import { PAD_SLOTS, usePadSlots } from './usePadSlots.ts'

export function PadsStrip() {
  const slots = usePadSlots()
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState<number | null>(null)
  const refs = useRef(new Map<number, HTMLButtonElement>())

  return (
    <section aria-label="Quick pads" className="border-b border-peat-800">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2">
        {/* Padding keeps focus rings inside the horizontal scroller. */}
        <div className="-m-1 grid flex-1 auto-cols-[minmax(7rem,1fr)] grid-flow-col gap-1.5 overflow-x-auto p-1">
          {PAD_SLOTS.map((slot) => {
            const pad = slots.at(slot)
            if (editing)
              return (
                <PadEditor
                  key={slot}
                  slot={slot}
                  pad={pad}
                  onPick={() => setPicking(slot)}
                  onRename={(label) => pad && slots.rename(pad, label)}
                  onClear={() => slots.clear(slot)}
                />
              )
            return (
              <button
                key={slot}
                type="button"
                data-pad-slot={slot}
                title={pad ? `${pad.label} (Shift + ${slot})` : `Assign pad ${slot}`}
                ref={(el) => void (el ? refs.current.set(slot, el) : refs.current.delete(slot))}
                onClick={() => {
                  if (!pad) return setPicking(slot)
                  void engine.firePad(pad.soundId)
                  flash(refs.current.get(slot) ?? null, 'var(--color-ink)')
                }}
                className={`flex h-10 items-center gap-2 rounded-lg px-2.5 text-left text-sm ring-1 ring-peat-700 hover:bg-peat-700 ${pad ? 'bg-peat-900' : 'text-peat-400'}`}
              >
                <span className="min-w-0 flex-1 truncate">{pad?.label ?? 'Assign'}</span>
                <kbd className="rounded border-b-2 border-peat-950 bg-peat-600 px-1 text-[11px] text-ink tabular">
                  ⇧{slot}
                </kbd>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          aria-pressed={editing}
          onClick={() => setEditing((e) => !e)}
          className="shrink-0 text-sm text-ink-muted underline hover:text-ink"
        >
          {editing ? 'Done' : 'Edit pads'}
        </button>
      </div>
      {picking !== null && (
        <PadPicker
          slot={picking}
          onPick={(soundId, label) => slots.assign(picking, soundId, label)}
          onClose={() => setPicking(null)}
        />
      )}
    </section>
  )
}
