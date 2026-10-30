import { useRef } from 'react'
import { Link } from 'react-router'
import { usePads } from '../../api/me.ts'
import { engine } from '../../audio/engine.ts'
import { flash } from '../../ui/flash.ts'

export const PAD_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export function PadsStrip() {
  const pads = usePads().data ?? []
  const refs = useRef(new Map<number, HTMLButtonElement>())

  return (
    <section aria-label="Quick pads" className="mt-10">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="font-display text-2xl font-bold">Quick pads</h2>
        <p className="text-sm text-ink-muted">
          Available in every scene. Assign sounds from the{' '}
          <Link to="/library" className="underline hover:text-ink">
            library
          </Link>
          .
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {PAD_SLOTS.map((slot) => {
          const pad = pads.find((p) => p.slot === slot)
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
              className="relative flex min-h-16 items-end rounded-lg bg-peat-800 p-2.5 text-left text-sm ring-1 ring-peat-700 hover:bg-peat-700 disabled:text-peat-400 disabled:hover:bg-peat-800"
            >
              <kbd className="absolute top-1.5 right-1.5 rounded border-b-2 border-peat-950 bg-peat-600 px-1 text-[11px] text-ink tabular">
                ⇧{slot}
              </kbd>
              <span className="pr-7 leading-tight">{pad?.label ?? 'Empty'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
