import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'quiet' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brass text-peat-950 hover:bg-[#e6ba5e] font-medium',
  quiet: 'bg-peat-800 text-ink ring-1 ring-peat-600 hover:bg-peat-700',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25',
}

export function Button({
  variant = 'quiet',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  )
}
