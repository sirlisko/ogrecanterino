import { useRef, useState } from 'react'
import { engine } from '../../audio/engine.ts'
import { flash } from '../../ui/flash.ts'
import { Popover } from '../../ui/Popover.tsx'
import { PadPicker } from './PadPicker.tsx'
import { PAD_SLOTS, usePadSlots } from './usePadSlots.ts'

export function PadsPopover() {
  const slots = usePadSlots()
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState<number | null>(null)
  const refs = useRef(new Map<number, HTMLButtonElement>())

  return (
    <Popover trigger="Pads" label="Quick pads" wide>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-display text-xl font-bold">Quick pads</h2>
        <span className="text-sm text-ink-muted">Shift + 1–9, in every scene</span>
        <button
          type="button"
          aria-pressed={editing}
          onClick={() => setEditing((e) => !e)}
          className="ml-auto text-sm text-ink-muted underline hover:text-ink"
        >
          {editing ? 'Done' : 'Edit pads'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PAD_SLOTS.map((slot) => {
          const pad = slots.at(slot)
          if (editing)
            return (
              <div
                key={slot}
                className="flex min-h-16 flex-col gap-1 rounded-lg bg-peat-900 p-1.5 ring-1 ring-peat-700"
              >
                {pad ? (
                  <>
                    <input
                      defaultValue={pad.label}
                      aria-label={`Name of pad ${slot}`}
                      onBlur={(e) => {
                        const label = e.target.value.trim()
                        if (label && label !== pad.label) slots.rename(pad, label)
                      }}
                      className="w-full rounded bg-peat-800 px-1.5 py-1 text-sm"
                    />
                    <div className="flex gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setPicking(slot)}
                        className="text-ink-muted hover:text-ink"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => slots.clear(slot)}
                        className="ml-auto text-ink-muted hover:text-danger"
                      >
                        Clear
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPicking(slot)}
                    className="flex-1 rounded text-sm text-ink-muted hover:bg-peat-800 hover:text-ink"
                  >
                    Assign {slot}
                  </button>
                )}
              </div>
            )
          return (
            <button
              key={slot}
              type="button"
              data-pad-slot={slot}
              ref={(el) => void (el ? refs.current.set(slot, el) : refs.current.delete(slot))}
              onClick={() => {
                if (!pad) return setPicking(slot)
                void engine.firePad(pad.soundId)
                flash(refs.current.get(slot) ?? null, 'var(--color-ink)')
              }}
              className={`relative flex min-h-16 items-end rounded-lg p-2.5 text-left text-sm ring-1 ring-peat-700 hover:bg-peat-700 ${pad ? 'bg-peat-900' : 'text-peat-400'}`}
            >
              <kbd className="absolute top-1.5 right-1.5 rounded border-b-2 border-peat-950 bg-peat-600 px-1 text-[11px] text-ink tabular">
                ⇧{slot}
              </kbd>
              <span className="pr-7 leading-tight">{pad?.label ?? 'Assign'}</span>
            </button>
          )
        })}
      </div>
      {picking !== null && (
        <PadPicker
          slot={picking}
          onPick={(soundId, label) => slots.assign(picking, soundId, label)}
          onClose={() => setPicking(null)}
        />
      )}
    </Popover>
  )
}
