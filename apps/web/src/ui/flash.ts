const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Confirms a pad press visually; works for repeated presses without remounting. */
export function flash(el: Element | null, color = 'var(--color-arcane)') {
  if (!el || reducedMotion()) return
  el.animate(
    [
      {
        boxShadow: `0 0 0 0 color-mix(in oklab, ${color} 70%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 35%, var(--color-peat-800))`,
      },
      { boxShadow: '0 0 0 14px transparent' },
    ],
    { duration: 450, easing: 'ease-out' },
  )
}
