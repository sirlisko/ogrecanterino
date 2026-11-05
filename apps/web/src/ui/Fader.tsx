import type { CSSProperties } from 'react'

export function Fader({
  value,
  onChange,
  label,
  color,
  className = '',
  large,
  vertical,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  color?: string
  className?: string
  /** Touch-sized track and thumb. */
  large?: boolean
  vertical?: boolean
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
      className={`fader ${large ? 'fader-lg' : ''} ${vertical ? 'fader-vertical' : ''} ${className}`}
      style={{ '--fader-color': color } as CSSProperties}
    />
  )
}
