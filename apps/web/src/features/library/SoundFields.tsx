import type { SoundCategory } from '@ogre/shared'
import { useId } from 'react'
import { fieldClass } from '../../ui/Dialog.tsx'

export interface SoundMeta {
  title: string
  artist: string
  tags: string
  category: SoundCategory
}

export const parseTagList = (tags: string) =>
  tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

export function SoundFields({
  value,
  onChange,
}: {
  value: SoundMeta
  onChange: (patch: Partial<SoundMeta>) => void
}) {
  const group = useId()
  return (
    <>
      <label className="flex flex-col gap-1">
        Title
        <input
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          required
          className={fieldClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Artist or source
        <input
          value={value.artist}
          onChange={(e) => onChange({ artist: e.target.value })}
          placeholder="Needed for the credits page"
          className={fieldClass}
        />
      </label>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1">Type</legend>
        <div className="flex gap-4">
          {(['music', 'ambience', 'effect'] as const).map((c) => (
            <label key={c} className="flex items-center gap-2">
              <input
                type="radio"
                name={group}
                checked={value.category === c}
                onChange={() => onChange({ category: c })}
                className="accent-brass"
              />
              {{ music: 'Music', ambience: 'Ambience', effect: 'Effect' }[c]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1">
        Tags
        <input
          value={value.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
          placeholder="Tavern, Calm, Night"
          className={fieldClass}
        />
      </label>
    </>
  )
}
