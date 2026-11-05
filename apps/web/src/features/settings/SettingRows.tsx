import type { ReactNode } from 'react'

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-3 font-display text-lg font-bold">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Text({ label, description }: { label: string; description?: string }) {
  return (
    <span className="min-w-0 flex-1">
      {label}
      {description && <span className="block text-sm text-ink-muted">{description}</span>}
    </span>
  )
}

export function CheckRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-brass"
      />
      <Text label={label} description={description} />
    </label>
  )
}

export function SelectRow<T extends string | number>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string
  description?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <label className="flex items-start gap-3">
      <Text label={label} description={description} />
      <select
        value={String(value)}
        onChange={(e) =>
          onChange(options.find((o) => String(o.value) === e.target.value)?.value ?? value)
        }
        className="shrink-0 rounded-md bg-peat-700 px-2 py-1"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
