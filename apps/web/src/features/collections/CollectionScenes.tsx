import type { Collection, Scene } from '@ogre/shared'
import { useState } from 'react'
import { useMe } from '../../api/me.ts'
import { Button } from '../../ui/Button.tsx'
import { SceneGrid } from '../scenes/SceneGrid.tsx'
import { matchesQuery, SceneSearch } from '../scenes/SceneSearch.tsx'
import { CollectionDialog } from './CollectionDialog.tsx'

export function CollectionScenes({
  collection,
  scenes,
}: {
  collection: Collection
  scenes: Scene[]
}) {
  const me = useMe().data
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const ordered = collection.sceneIds.flatMap((id) => byId.get(id) ?? [])
  const unavailable = collection.sceneIds.length - ordered.length
  const visible = ordered.filter((s) => matchesQuery(s, query))
  const mine = collection.ownerId === me?.id
  const canEdit = mine || me?.role === 'admin'

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold">{collection.name}</h2>
          <p className="text-sm text-ink-muted">
            {collection.visibility === 'private'
              ? 'Only you'
              : mine
                ? 'Shared with the group'
                : `Shared by ${collection.ownerName}`}
            {unavailable > 0 &&
              `. ${unavailable} scene${unavailable === 1 ? ' is' : 's are'} no longer shared with you.`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SceneSearch value={query} onChange={setQuery} />
          {canEdit && <Button onClick={() => setEditing(true)}>Edit collection</Button>}
        </div>
      </div>
      {ordered.length === 0 ? (
        <p className="mt-10 max-w-prose text-ink-muted">
          No scenes in this collection yet. Add them with Edit collection, or from a scene's ⋯ menu.
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-ink-muted">No scenes match. Clear the search.</p>
      ) : (
        <SceneGrid scenes={visible} numbered={!query} />
      )}
      {editing && <CollectionDialog collection={collection} onClose={() => setEditing(false)} />}
    </>
  )
}
