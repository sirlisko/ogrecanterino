import type { Scene } from '@ogre/shared'

export function matchesQuery(scene: Scene, query: string) {
  const q = query.trim().toLowerCase()
  return (
    !q ||
    scene.name.toLowerCase().includes(q) ||
    scene.tags.some((t) => t.toLowerCase().includes(q))
  )
}

export function SceneSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search scenes"
      aria-label="Search scenes"
      data-hotkey-search
      className="w-full rounded-lg bg-peat-800 px-3 py-2 ring-1 ring-peat-700 placeholder:text-peat-400 sm:w-64"
    />
  )
}
