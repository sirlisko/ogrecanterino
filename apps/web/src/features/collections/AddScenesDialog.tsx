import type { Collection } from '@ogre/shared'
import { useState } from 'react'
import { collectionInputOf, useSaveCollection } from '../../api/collections.ts'
import { useScenes } from '../../api/scenes.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog, fieldClass } from '../../ui/Dialog.tsx'
import { matchesQuery } from '../scenes/SceneSearch.tsx'

/** Picks scenes to append to a collection, numbered in the order they'll be played. */
export function AddScenesDialog({
  collection,
  onClose,
}: {
  collection: Collection
  onClose: () => void
}) {
  const scenes = useScenes().data ?? []
  const save = useSaveCollection()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const outside = scenes.filter((s) => !collection.sceneIds.includes(s.id))
  const shown = outside.filter((s) => matchesQuery(s, query))
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const add = async () => {
    await save.mutateAsync({
      id: collection.id,
      input: { ...collectionInputOf(collection), sceneIds: [...collection.sceneIds, ...picked] },
    })
    onClose()
  }

  return (
    <Dialog title={`Add scenes to ${collection.name}`} onClose={onClose} wide>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search scenes"
        aria-label="Search scenes"
        className={fieldClass}
      />
      <p className="mt-3 text-sm text-ink-muted">
        They go after the scenes already there, in the order you pick them.
      </p>
      {shown.length === 0 ? (
        <p className="mt-4 text-ink-muted">
          {outside.length === 0
            ? 'Every scene is already in this collection.'
            : 'No scenes match. Clear the search.'}
        </p>
      ) : (
        <ul className="mt-3 grid max-h-[50dvh] gap-2 overflow-y-auto p-0.5 sm:grid-cols-2">
          {shown.map((s) => {
            const order = picked.indexOf(s.id) + 1
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={order > 0}
                  onClick={() => toggle(s.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ring-1 ${order ? 'bg-brass/12 ring-brass/50' : 'bg-peat-900 ring-peat-700 hover:bg-peat-700'}`}
                >
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm lining-nums ${order ? 'bg-brass font-medium text-peat-950' : 'ring-1 ring-peat-600'}`}
                  >
                    {order || ''}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{s.name}</span>
                    <span className="block truncate text-sm text-ink-muted">
                      {s.tags.join(', ')}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {save.error && <p className="mt-3 text-danger">{save.error.message}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!picked.length || save.isPending} onClick={add}>
          {picked.length > 1 ? `Add ${picked.length} scenes` : 'Add scene'}
        </Button>
      </div>
    </Dialog>
  )
}
