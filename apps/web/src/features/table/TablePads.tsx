import { useRef } from 'react'
import { engine } from '../../audio/engine.ts'
import { flash } from '../../ui/flash.ts'
import { PAD_SLOTS, usePadSlots } from '../pads/usePadSlots.ts'

export function TablePads() {
  const slots = usePadSlots()
  const refs = useRef(new Map<number, HTMLButtonElement>())
  if (!slots.pads.length) return null

  return (
    <section aria-label="Quick pads">
      <h2 className="mb-3 font-display text-2xl font-bold">Quick pads</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {PAD_SLOTS.map((slot) => {
          const pad = slots.at(slot)
          return (
            <button
              key={slot}
              type="button"
              disabled={!pad}
              data-pad-slot={slot}
              ref={(el) => void (el ? refs.current.set(slot, el) : refs.current.delete(slot))}
              onClick={() => {
                if (!pad) return
                void engine.firePad(pad.soundId)
                flash(refs.current.get(slot) ?? null, 'var(--color-ink)')
              }}
              className="flex min-h-24 items-end rounded-xl bg-peat-800 p-3 text-left text-lg ring-1 ring-peat-700 hover:bg-peat-700 disabled:opacity-30"
            >
              {pad?.label ?? ''}
            </button>
          )
        })}
      </div>
    </section>
  )
}
