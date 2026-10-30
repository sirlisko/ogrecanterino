import { useState } from 'react'
import { useCollections } from '../../api/collections.ts'
import { Chip } from '../../ui/Chip.tsx'
import { setActiveCollection, useActiveCollection } from './activeCollection.ts'
import { CollectionDialog } from './CollectionDialog.tsx'

export function CollectionBar() {
  const collections = useCollections().data ?? []
  const active = useActiveCollection((s) => s.id)
  const [creating, setCreating] = useState(false)

  return (
    <nav aria-label="Collections" className="mt-5 flex flex-wrap items-center gap-1.5">
      <Chip active={!active} onClick={() => setActiveCollection(null)}>
        All scenes
      </Chip>
      {collections.map((c) => (
        <Chip key={c.id} active={active === c.id} onClick={() => setActiveCollection(c.id)}>
          {c.name}
        </Chip>
      ))}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="rounded-full px-3 py-1 text-sm text-ink-muted hover:text-ink"
      >
        + New collection
      </button>
      {creating && <CollectionDialog onClose={() => setCreating(false)} />}
    </nav>
  )
}
