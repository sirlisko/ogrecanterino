import type { ReactNode } from 'react'

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm transition-colors ${
        active
          ? 'bg-ink text-peat-900'
          : 'bg-peat-800 text-ink-muted ring-1 ring-peat-700 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
