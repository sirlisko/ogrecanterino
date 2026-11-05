import { useRef } from 'react'
import { engine } from '../../audio/engine.ts'
import { flash } from '../../ui/flash.ts'
import { usePadSlots } from '../pads/usePadSlots.ts'

/** Only the pads that have a sound: empty slots are assigned from the transport bar, not here. */
export function TablePads() {
  const { pads } = usePadSlots()
  const refs = useRef(new Map<number, HTMLButtonElement>())
  if (!pads.length) return null

  return (
    <section aria-label="Quick pads">
      <h2 className="mb-3 font-display text-2xl font-bold">Quick pads</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {[...pads]
          .sort((a, b) => a.slot - b.slot)
          .map((pad) => (
            <button
              key={pad.slot}
              type="button"
              data-pad-slot={pad.slot}
              ref={(el) =>
                void (el ? refs.current.set(pad.slot, el) : refs.current.delete(pad.slot))
              }
              onClick={() => {
                void engine.firePad(pad.soundId)
                flash(refs.current.get(pad.slot) ?? null, 'var(--color-ink)')
              }}
              className="relative flex min-h-24 items-end rounded-xl bg-peat-800 p-3 text-left text-lg ring-1 ring-peat-700 hover:bg-peat-700"
            >
              <kbd className="absolute top-2 right-2 grid h-6 min-w-6 place-items-center rounded border-b-2 border-peat-950 bg-peat-600 px-1 font-sans text-xs text-ink tabular">
                ⇧{pad.slot}
              </kbd>
              <span className="pr-8 leading-tight">{pad.label}</span>
            </button>
          ))}
      </div>
    </section>
  )
}
