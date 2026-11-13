import type { Collection, Scene } from '@ogre/shared'
import { useState } from 'react'
import { useMe } from '../../api/me.ts'
import { usePlayer } from '../../audio/store.ts'
import { Button } from '../../ui/Button.tsx'
import { OfflineToggle } from '../offline/OfflineToggle.tsx'
import { matchesQuery, SceneSearch } from '../scenes/SceneSearch.tsx'
import { AddScenesDialog } from './AddScenesDialog.tsx'
import { CollectionDialog } from './CollectionDialog.tsx'
import { useSessionPlays } from './sessionPlays.ts'
import { stepStatus } from './setlist.ts'
import { SetlistStep } from './SetlistStep.tsx'
import { useSetlist } from './useSetlist.ts'

/** Shorter setlists fit on one screen, where a search box is only in the way. */
const SEARCH_FROM_SCENES = 8

export function CollectionScenes({
  collection,
  scenes,
}: {
  collection: Collection
  scenes: Scene[]
}) {
  const me = useMe().data
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const ordered = collection.sceneIds.flatMap((id) => byId.get(id) ?? [])
  const unavailable = collection.sceneIds.length - ordered.length
  const mine = collection.ownerId === me?.id
  const canEdit = mine || me?.role === 'admin'
  const liveId = usePlayer((s) => s.sceneId)
  const nextId = useSetlist().next?.id ?? null
  const played = new Set(useSessionPlays((s) => s.ids))
  const combat = collection.combatSceneId ? byId.get(collection.combatSceneId) : undefined
  const searchable = ordered.length >= SEARCH_FROM_SCENES
  // Numbered by their place in the collection, so searching doesn't renumber them.
  const steps = ordered
    .map((scene, i) => ({ scene, position: i + 1 }))
    .filter(({ scene }) => !searchable || matchesQuery(scene, query))

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 text-ink-muted">
          {collection.visibility === 'private'
            ? 'Private collection'
            : mine
              ? 'Shared with the group'
              : `Shared by ${collection.ownerName}`}
          .{combat && ` Combat music for these scenes: ${combat.name}.`}
          {unavailable > 0 &&
            ` ${unavailable} scene${unavailable === 1 ? ' is' : 's are'} no longer shared with you.`}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <OfflineToggle collectionId={collection.id} />
          {searchable && <SceneSearch value={query} onChange={setQuery} />}
          {canEdit && (
            <Button className="whitespace-nowrap" onClick={() => setEditing(true)}>
              Edit collection
            </Button>
          )}
        </div>
      </div>
      {ordered.length === 0 ? (
        <div className="mt-10 flex max-w-prose flex-col items-start gap-4">
          <p className="text-ink-muted">
            No scenes in this collection yet.
            {canEdit && " Add them here, or from any scene's actions menu."}
          </p>
          {canEdit && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              Add scenes
            </Button>
          )}
        </div>
      ) : steps.length === 0 ? (
        <p className="mt-10 text-ink-muted">No scenes match. Clear the search.</p>
      ) : (
        <>
          <ol className="mt-5 max-w-5xl">
            {steps.map(({ scene, position }, i) => (
              <SetlistStep
                key={scene.id}
                scene={scene}
                position={position}
                status={stepStatus(scene.id, { liveId, nextId, played })}
                first={i === 0}
                last={i === steps.length - 1}
              />
            ))}
          </ol>
          {canEdit && (
            <Button className="mt-4 ml-[3.75rem]" onClick={() => setAdding(true)}>
              Add scenes
            </Button>
          )}
        </>
      )}
      {editing && <CollectionDialog collection={collection} onClose={() => setEditing(false)} />}
      {adding && <AddScenesDialog collection={collection} onClose={() => setAdding(false)} />}
    </>
  )
}
