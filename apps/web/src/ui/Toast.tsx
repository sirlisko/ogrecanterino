import type { ReactNode } from 'react'
import { Icon } from './Icon.tsx'

/** A message with one action and a dismiss button; the caller decides where it sits. */
export function Toast({
  children,
  action,
  onAction,
  onDismiss,
  className = '',
}: {
  children: ReactNode
  action: string
  onAction: () => void
  onDismiss: () => void
  className?: string
}) {
  return (
    <div
      role="status"
      className={`flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl bg-peat-700 py-2 pr-2 pl-4 shadow-2xl ring-1 ring-peat-600 ${className}`}
    >
      <span className="line-clamp-2 min-w-0">{children}</span>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 rounded-lg bg-brass px-3 py-1.5 font-medium text-peat-950"
      >
        {action}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted hover:text-ink"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}

/** Stacks toasts just above the transport bar, whatever its height (pads, wrapped rows on phones). */
export function ToastStack({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-full mb-3 flex flex-col items-center gap-2 px-4 *:pointer-events-auto">
      {children}
    </div>
  )
}
