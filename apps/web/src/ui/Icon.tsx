const PATHS = {
  play: 'M7 4.5v15l13-7.5z',
  pause: 'M6 4h4.5v16H6zM13.5 4H18v16h-4.5z',
  stop: 'M6 6h12v12H6z',
  previous: 'M5 5h2.5v14H5zM19 5v14L8.5 12z',
  next: 'M16.5 5H19v14h-2.5zM5 5v14l10.5-7z',
  close:
    'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z',
  more: 'M5 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  grip: 'M9 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
  star: 'm12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z',
  note: 'M9 18.5a3 3 0 1 1-2-2.8V5l12-2v12.5a3 3 0 1 1-2-2.8V6.4l-8 1.4z',
  shuffle:
    'M16 4l4 4-4 4V9h-1.6c-1 0-1.9.5-2.4 1.3l-4.6 7A4.8 4.8 0 0 1 3.4 19.5H2v-2h1.4c1 0 1.9-.5 2.4-1.3l4.6-7A4.8 4.8 0 0 1 14.4 7H16zM2 6.5h1.4c1.4 0 2.7.6 3.6 1.6L5.7 10a2.8 2.8 0 0 0-2.3-1.5H2zm14 6.5 4 4-4 4v-3h-1.6c-1.4 0-2.7-.6-3.6-1.6l1.3-1.9c.5.9 1.4 1.5 2.3 1.5H16z',
  repeat:
    'M17 2l4 4-4 4V7H7a2 2 0 0 0-2 2v2H3V9a4 4 0 0 1 4-4h10zM7 22l-4-4 4-4v3h10a2 2 0 0 0 2-2v-2h2v2a4 4 0 0 1-4 4H7z',
}

export type IconName = keyof typeof PATHS

/** Inline SVG so controls look the same on every platform (Unicode media glyphs don't). */
export function Icon({
  name,
  outline,
  className = 'h-4 w-4',
}: {
  name: IconName
  outline?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill={outline ? 'none' : 'currentColor'}
      stroke={outline ? 'currentColor' : 'none'}
      strokeWidth={outline ? 1.6 : undefined}
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
