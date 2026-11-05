import { useState } from 'react'
import { useCollections } from '../../api/collections.ts'
import { setActiveCollection, useActiveCollection } from './activeCollection.ts'
import { CollectionDialog } from './CollectionDialog.tsx'

const tab = (active: boolean) =>
  `-mb-px border-b-[3px] pt-1.5 pb-2 text-left font-display text-xl font-bold transition-colors ${
    active ? 'border-brass text-ink' : 'border-transparent text-ink-muted hover:text-ink'
  }`

/** Collections are what you're running, not a filter, so they get tabs rather than chips. */
export function CollectionBar() {
  const collections = useCollections().data ?? []
  const active = useActiveCollection((s) => s.id)
  const [creating, setCreating] = useState(false)

  return (
    <nav
      aria-label="Collections"
      className="mt-5 flex flex-wrap items-end gap-x-7 gap-y-1 border-b border-peat-700"
    >
      <button
        type="button"
        aria-pressed={!active}
        onClick={() => setActiveCollection(null)}
        className={tab(!active)}
      >
        All scenes
      </button>
      {collections.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={active === c.id}
          onClick={() => setActiveCollection(c.id)}
          className={tab(active === c.id)}
        >
          {c.name}{' '}
          <span className="font-sans text-[15px] font-normal text-ink-muted lining-nums">
            {c.sceneIds.length}
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="ml-auto pb-2.5 text-[15px] text-ink-muted hover:text-ink"
      >
        New collection
      </button>
      {creating && <CollectionDialog onClose={() => setCreating(false)} />}
    </nav>
  )
}
