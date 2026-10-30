import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Collection, CollectionInput, Scene } from '@ogre/shared'
import { type FormEvent, useState } from 'react'
import { useDeleteCollection, useSaveCollection } from '../../api/collections.ts'
import { useScenes } from '../../api/scenes.ts'
import { Button } from '../../ui/Button.tsx'
import { Dialog, fieldClass } from '../../ui/Dialog.tsx'
import { setActiveCollection } from './activeCollection.ts'

const EMPTY: CollectionInput = {
  name: '',
  visibility: 'private',
  combatSceneId: null,
  sceneIds: [],
}

export function CollectionDialog({
  collection,
  onClose,
}: {
  collection?: Collection
  onClose: () => void
}) {
  const scenes = useScenes().data ?? []
  const save = useSaveCollection()
  const remove = useDeleteCollection()
  const [draft, setDraft] = useState<CollectionInput>(collection ?? EMPTY)
  const byId = new Map(scenes.map((s) => [s.id, s]))
  const set = (patch: Partial<CollectionInput>) => setDraft((d) => ({ ...d, ...patch }))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const ids = draft.sceneIds
    set({ sceneIds: arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))) })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const saved = await save.mutateAsync({ id: collection?.id, input: draft })
    setActiveCollection(saved.id)
    onClose()
  }

  const onDelete = async () => {
    if (!collection || !confirm(`Delete the collection "${collection.name}"? Its scenes stay.`))
      return
    await remove.mutateAsync(collection.id)
    setActiveCollection(null)
    onClose()
  }

  return (
    <Dialog title={collection ? 'Edit collection' : 'New collection'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Name
          <input
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            required
            placeholder="Curse of Strahd, One-shots…"
            className={fieldClass}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            Who can use it
            <select
              value={draft.visibility}
              onChange={(e) => set({ visibility: e.target.value as Collection['visibility'] })}
              className={fieldClass}
            >
              <option value="private">Only me</option>
              <option value="group">Everyone in the group</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Combat music
            <select
              value={draft.combatSceneId ?? ''}
              onChange={(e) => set({ combatSceneId: e.target.value || null })}
              className={fieldClass}
            >
              <option value="">None</option>
              {scenes
                .filter((s) => s.data.music.length > 0)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="-mt-2 text-sm text-peat-400">
          Used by scenes in this collection that don't set their own combat music.
        </p>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1">Scenes, in play order</legend>
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={draft.sceneIds} strategy={verticalListSortingStrategy}>
              <ol className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                {draft.sceneIds.length === 0 && (
                  <li className="py-2 text-ink-muted">No scenes yet. Add one below.</li>
                )}
                {draft.sceneIds.map((id, i) => (
                  <SceneItem
                    key={id}
                    id={id}
                    index={i}
                    scene={byId.get(id)}
                    onRemove={() => set({ sceneIds: draft.sceneIds.filter((s) => s !== id) })}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          <select
            value=""
            aria-label="Add a scene"
            onChange={(e) => set({ sceneIds: [...draft.sceneIds, e.target.value] })}
            className={fieldClass}
          >
            <option value="" disabled>
              Add a scene…
            </option>
            {scenes
              .filter((s) => !draft.sceneIds.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </fieldset>

        {save.error && <p className="text-danger">{save.error.message}</p>}
        <div className="mt-2 flex items-center gap-2">
          {collection && (
            <Button variant="danger" onClick={onDelete} disabled={remove.isPending}>
              Delete
            </Button>
          )}
          <Button className="ml-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {collection ? 'Save collection' : 'Create collection'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function SceneItem({
  id,
  index,
  scene,
  onRemove,
}: {
  id: string
  index: number
  scene: Scene | undefined
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const name = scene?.name ?? 'Unavailable scene'
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg bg-peat-900 px-2 py-1.5 ring-1 ${isDragging ? 'relative z-10 ring-brass' : 'ring-peat-700'}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${name}`}
        className="cursor-grab touch-none px-1 text-peat-400 hover:text-ink"
      >
        ⠿
      </button>
      <span className="w-6 text-right text-ink-muted tabular">{index + 1}</span>
      <span className={`min-w-0 flex-1 truncate ${scene ? '' : 'text-peat-400 italic'}`}>
        {name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="grid h-7 w-7 place-items-center rounded-full text-peat-400 hover:bg-danger/15 hover:text-danger"
      >
        ✕
      </button>
    </li>
  )
}
