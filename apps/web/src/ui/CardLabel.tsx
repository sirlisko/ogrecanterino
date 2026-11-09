import { splitLabel } from './label.ts'

/** A card's name with any leading emoji in its own slot, so the words wrap and line up cleanly. */
export function CardLabel({ label, truncate }: { label: string; truncate?: boolean }) {
  const { emoji, text } = splitLabel(label)
  return (
    <span className="flex min-w-0 items-baseline gap-1.5">
      {emoji && (
        <span aria-hidden className="shrink-0">
          {emoji}
        </span>
      )}
      <span className={`min-w-0 ${truncate ? 'truncate' : ''}`}>{text}</span>
    </span>
  )
}
