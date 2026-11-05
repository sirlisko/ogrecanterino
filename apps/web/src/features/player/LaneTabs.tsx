import type { SceneSection } from '@ogre/shared'

const TABS: { key: SceneSection; label: string; color: string }[] = [
  { key: 'music', label: 'Music', color: 'var(--color-brass)' },
  { key: 'ambiences', label: 'Ambience', color: 'var(--color-lichen)' },
  { key: 'effects', label: 'Effects', color: 'var(--color-arcane)' },
]

/**
 * Below `lg` the lanes would stack, putting effects (the most tapped) a long scroll down;
 * this switches between them instead. Hidden where all three fit side by side.
 * Sticks just under the app header (54.75 px tall), overlapping it slightly so nothing shows between.
 */
export function LaneTabs({
  value,
  onChange,
  counts,
}: {
  value: SceneSection
  onChange: (section: SceneSection) => void
  counts: Record<SceneSection, number>
}) {
  return (
    <div
      role="group"
      aria-label="Show section"
      className="sticky top-[54px] z-20 -mx-4 mb-4 flex gap-1 border-b border-peat-700 bg-peat-900/95 px-4 py-2 backdrop-blur lg:hidden"
    >
      {TABS.map(({ key, label, color }) => {
        const on = value === key
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className="flex-1 rounded-lg px-2 py-2 font-medium ring-1"
            style={{
              color: on ? 'var(--color-peat-950)' : color,
              backgroundColor: on ? color : 'transparent',
              ['--tw-ring-color' as string]: on ? color : 'var(--color-peat-700)',
            }}
          >
            {label} <span className="font-normal opacity-70">{counts[key]}</span>
          </button>
        )
      })}
    </div>
  )
}
