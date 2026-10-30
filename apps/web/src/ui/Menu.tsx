import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Icon } from './Icon.tsx'

export function Menu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (open) items(menu.current)[0]?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (
        e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)
      ) {
        // Keep Escape from also reaching the global "fade out" hotkey.
        e.stopPropagation()
        setOpen(false)
        if (e instanceof KeyboardEvent) trigger.current?.focus()
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
    <div ref={ref} className="relative" onClick={() => setOpen(false)}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="grid h-9 w-9 place-items-center rounded-full bg-peat-950/70 text-lg text-ink hover:bg-peat-700"
      >
        <Icon name="more" className="h-5 w-5" />
      </button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          onKeyDown={onMenuKey}
          className="absolute right-0 z-40 mt-1 min-w-40 overflow-hidden rounded-lg bg-peat-700 py-1 shadow-xl ring-1 ring-peat-600"
        >
          {children}
        </div>
      )}
    </div>
  )
}

const items = (menu: HTMLElement | null) => [
  ...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
]

function onMenuKey(e: ReactKeyboardEvent<HTMLDivElement>) {
  const list = items(e.currentTarget)
  const i = list.indexOf(document.activeElement as HTMLElement)
  const target = {
    ArrowDown: list[(i + 1) % list.length],
    ArrowUp: list[(i - 1 + list.length) % list.length],
    Home: list[0],
    End: list[list.length - 1],
  }[e.key]
  if (!target) return
  e.preventDefault()
  target.focus()
}

export function MenuItem({
  children,
  onSelect,
  danger,
}: {
  children: ReactNode
  onSelect: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={`block w-full px-4 py-2 text-left hover:bg-peat-600 ${danger ? 'text-danger' : ''}`}
    >
      {children}
    </button>
  )
}
