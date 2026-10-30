import type { ReactNode } from 'react'

export function Lane({
  title,
  color,
  actions,
  children,
}: {
  title: string
  color: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-label={title} className="min-w-0">
      <div className="mb-3 flex items-center gap-2 border-b-2 pb-2" style={{ borderColor: color }}>
        <h2 className="font-display text-2xl font-bold" style={{ color }}>
          {title}
        </h2>
        <div className="ml-auto flex items-center gap-1">{actions}</div>
      </div>
      {children}
    </section>
  )
}

export function EmptyLane({ children }: { children: ReactNode }) {
  return <p className="py-4 text-ink-muted">{children}</p>
}

export function IconButton({
  label,
  onClick,
  children,
  active,
  disabled,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-full transition-colors disabled:opacity-40 ${
        active ? 'bg-ink text-peat-900' : 'text-ink-muted hover:bg-peat-700 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
