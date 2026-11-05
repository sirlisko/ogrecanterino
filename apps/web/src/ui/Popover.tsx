import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

/** Panel anchored above its trigger (the transport bar lives at the bottom of the screen). */
export function Popover({
  trigger,
  label,
  children,
  wide,
  alert,
}: {
  trigger: ReactNode
  label: string
  children: ReactNode
  wide?: boolean
  /** Styles the trigger as a warning that needs the GM's attention. */
  alert?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (
        e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)
      ) {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close, true)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close, true)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`rounded-lg px-3 py-2 ring-1 ${
          alert
            ? 'bg-danger/15 font-medium text-danger ring-danger/40 hover:bg-danger/25'
            : `ring-peat-600 hover:text-ink ${open ? 'bg-peat-700 text-ink' : 'text-ink-muted'}`
        }`}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          className={`absolute right-0 bottom-full mb-3 ${wide ? 'w-[min(26rem,calc(100vw-2rem))]' : 'w-[min(20rem,calc(100vw-2rem))]'} rounded-xl bg-peat-800 p-4 shadow-2xl ring-1 ring-peat-600`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
