import { DndContext } from '@dnd-kit/core'
import { emptySceneData, type Scene, type SceneData, sceneSections } from '@ogre/shared'
import { useEffect, useState } from 'react'
import { Link, useBlocker, useParams } from 'react-router'
import { useMe } from '../../api/me.ts'
import { useSaveScene, useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { Button } from '../../ui/Button.tsx'
import { cardForSound, insertCard, removeCard, updateCard } from './cards.ts'
import { LibraryPanel } from './LibraryPanel.tsx'
import { SceneDetailsForm } from './SceneDetailsForm.tsx'
import { SectionEditor } from './SectionEditor.tsx'
import { useSceneDnd } from './useSceneDnd.ts'

export function EditorPage() {
  const { id } = useParams()
  const query = useScene(id)
  const me = useMe().data
  const save = useSaveScene()
  const [draft, setDraft] = useState<Scene | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (query.data) setDraft(query.data)
  }, [query.data?.id])

  useBlocker(({ currentLocation, nextLocation }) => {
    if (!dirty || currentLocation.pathname === nextLocation.pathname) return false
    return !confirm('You have unsaved changes. Leave without saving?')
  })

  const setData = (data: SceneData) => {
    setDraft((d) => (d ? { ...d, data } : d))
    setDirty(true)
  }
  const dnd = useSceneDnd(draft?.data ?? emptySceneData(), setData)

  if (query.isPending) return <p className="text-ink-muted">Loading scene…</p>
  if (!draft)
    return <p className="text-ink-muted">This scene doesn't exist or isn't shared with you.</p>
  if (me && me.role !== 'admin' && draft.ownerId !== me.id) {
    return (
      <p className="text-ink-muted">
        Only {draft.ownerName} can edit this scene. Duplicate it from the scenes page to make your
        own version.
      </p>
    )
  }

  const onSave = async () => {
    const { name, tags, visibility, combatSceneId, data } = draft
    const saved = await save.mutateAsync({
      id: draft.id,
      input: { name, tags, visibility, combatSceneId, data },
    })
    engine.updateScene(saved)
    setDirty(false)
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold">Edit scene</h1>
        <div className="ml-auto flex items-center gap-2">
          {save.error && <span className="text-danger">{save.error.message}</span>}
          {dirty && !save.isPending && (
            <span className="text-sm text-ink-muted">Unsaved changes</span>
          )}
          <Link
            to={`/scenes/${draft.id}`}
            className="rounded-lg px-4 py-2 text-ink-muted ring-1 ring-peat-600 hover:text-ink"
          >
            Open player
          </Link>
          <Button variant="primary" onClick={onSave} disabled={!dirty || save.isPending}>
            {save.isPending ? 'Saving…' : 'Save scene'}
          </Button>
        </div>
      </div>

      <SceneDetailsForm
        scene={draft}
        onChange={(patch) => {
          setDraft((d) => (d ? { ...d, ...patch } : d))
          setDirty(true)
        }}
      />

      <DndContext sensors={dnd.sensors} onDragEnd={dnd.onDragEnd}>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            {sceneSections.map((section) => (
              <SectionEditor
                key={section}
                section={section}
                cards={draft.data[section]}
                onChange={(cid, patch) => setData(updateCard(draft.data, section, cid, patch))}
                onRemove={(cid) => setData(removeCard(draft.data, section, cid))}
              />
            ))}
          </div>
          <aside
            aria-label="Library"
            className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto"
          >
            <h2 className="mb-3 font-display text-2xl font-bold">Library</h2>
            <p className="mb-3 text-sm text-ink-muted">
              Drag sounds into a section, or use the +M, +A and +E buttons.
            </p>
            <LibraryPanel
              onAdd={(sound, section) =>
                setData(insertCard(draft.data, section, cardForSound(sound, section)))
              }
            />
          </aside>
        </div>
      </DndContext>
    </>
  )
}
