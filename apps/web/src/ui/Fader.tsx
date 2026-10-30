import type { CSSProperties } from 'react'

export function Fader({
  value,
  onChange,
  label,
  color,
  className = '',
}: {
  value: number
  onChange: (v: number) => void
  label: string
  color?: string
  className?: string
}) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      aria-label={label}
      aria-valuetext={`${Math.round(value)}%`}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`fader ${className}`}
      style={{ '--fader-color': color } as CSSProperties}
    />
  )
}
