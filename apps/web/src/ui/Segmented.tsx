import type { ReactNode } from 'react'

/** A small set of mutually exclusive choices shown side by side, like a radio group. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex rounded-[10px] bg-peat-800 p-[3px] ring-1 ring-peat-700 ${className}`}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-center gap-1.5 rounded-[7px] px-3 py-1 text-[15px] transition-colors ${on ? 'bg-peat-600 text-ink' : 'text-ink-muted hover:text-ink'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
