import { useEffect, useRef } from 'react'
import { HOTKEY_HELP } from './keymap.ts'

export function HotkeyHelp({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl bg-peat-800 p-6 text-ink ring-1 ring-peat-600 backdrop:bg-peat-950/70"
    >
      <h2 className="font-display text-2xl font-bold">Keyboard shortcuts</h2>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        {HOTKEY_HELP.map(([k, d]) => (
          <div key={k} className="contents">
            <dt>
              <kbd className="rounded border-b-2 border-peat-950 bg-peat-600 px-1.5 py-0.5 text-sm whitespace-nowrap">
                {k}
              </kbd>
            </dt>
            <dd className="text-ink-muted">{d}</dd>
          </div>
        ))}
      </dl>
      <form method="dialog" className="mt-6 text-right">
        <button className="rounded-lg px-4 py-2 ring-1 ring-peat-600 hover:bg-peat-700">
          Close
        </button>
      </form>
    </dialog>
  )
}
