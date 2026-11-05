import type { ReactNode } from 'react'

/** Shows or hides a row of filters; outlined brighter while one of them is applied. */
export function FoldButton({
  open,
  active,
  onToggle,
  children,
}: {
  open: boolean
  active: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className={`max-w-64 truncate rounded-lg px-3 py-1.5 text-[15px] ring-1 ${active ? 'text-ink ring-ink-muted' : 'text-ink-muted ring-peat-700 hover:text-ink'}`}
    >
      {children}
    </button>
  )
}
