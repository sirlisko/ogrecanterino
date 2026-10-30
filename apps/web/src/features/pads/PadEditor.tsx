import type { Pad } from '@ogre/shared'

export function PadEditor({
  slot,
  pad,
  onPick,
  onRename,
  onClear,
}: {
  slot: number
  pad: Pad | undefined
  onPick: () => void
  onRename: (label: string) => void
  onClear: () => void
}) {
  if (!pad)
    return (
      <button
        type="button"
        onClick={onPick}
        className="min-h-10 rounded-lg text-sm text-ink-muted ring-1 ring-peat-700 hover:bg-peat-800 hover:text-ink"
      >
        Assign {slot}
      </button>
    )

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-peat-900 p-1.5 ring-1 ring-peat-700">
      <input
        defaultValue={pad.label}
        aria-label={`Name of pad ${slot}`}
        onBlur={(e) => {
          const label = e.target.value.trim()
          if (label && label !== pad.label) onRename(label)
        }}
        className="w-full rounded bg-peat-800 px-1.5 py-1 text-sm"
      />
      <div className="flex gap-1 text-xs">
        <button type="button" onClick={onPick} className="text-ink-muted hover:text-ink">
          Change
        </button>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-ink-muted hover:text-danger"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
