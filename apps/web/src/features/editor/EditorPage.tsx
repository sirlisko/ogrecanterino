import { DndContext } from '@dnd-kit/core'
import { emptySceneData, type SceneData, sceneSections } from '@ogre/shared'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { useLiveScene } from '../player/useLiveScene.ts'
import { cardForSound, insertCard, removeCard, updateCard } from './cards.ts'
import { LibraryPanel } from './LibraryPanel.tsx'
import { SaveIndicator } from './SaveIndicator.tsx'
import { SceneDetailsForm } from './SceneDetailsForm.tsx'
import { SectionEditor } from './SectionEditor.tsx'
import { useSceneDnd } from './useSceneDnd.ts'

export function EditorPage() {
  const { id } = useParams()
  const live = useLiveScene(id)
  const draft = live.scene
  const dnd = useSceneDnd(draft?.data ?? emptySceneData(), (data) => live.updateData(() => data))
  const { flush } = live

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        flush()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flush])

  if (live.isPending) return <p className="text-ink-muted">Loading scene…</p>
  if (!draft)
    return <p className="text-ink-muted">This scene doesn't exist or isn't shared with you.</p>
  if (!live.canEdit) {
    return (
      <p className="text-ink-muted">
        Only {draft.ownerName} can edit this scene. Duplicate it from the scenes page to make your
        own version.
      </p>
    )
  }

  const setData = (fn: (d: SceneData) => SceneData) => live.updateData(fn)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold">Edit scene</h1>
        <div className="ml-auto flex items-center gap-2">
          <SaveIndicator
            status={draft.name.trim() ? live.saveStatus : 'unnamed'}
            error={live.saveError?.message}
          />
          <Link
            to={`/scenes/${draft.id}`}
            className="rounded-lg bg-brass px-4 py-2 font-medium text-peat-950 hover:bg-[#e6ba5e]"
          >
            Open player
          </Link>
        </div>
      </div>

      <SceneDetailsForm
        key={draft.id}
        scene={draft}
        onChange={(patch) => live.update((s) => ({ ...s, ...patch }))}
      />

      <DndContext sensors={dnd.sensors} onDragEnd={dnd.onDragEnd}>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            {sceneSections.map((section) => (
              <SectionEditor
                key={section}
                section={section}
                cards={draft.data[section]}
                onChange={(cid, patch) => setData((d) => updateCard(d, section, cid, patch))}
                onRemove={(cid) => setData((d) => removeCard(d, section, cid))}
              />
            ))}
          </div>
          <aside
            aria-label="Library"
            className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto"
          >
            <h2 className="mb-3 font-display text-2xl font-bold">Library</h2>
            <p className="mb-3 text-sm text-ink-muted">
              Drag sounds into a section, or add them with the buttons on each row.
            </p>
            <LibraryPanel
              onAdd={(sound, section) =>
                setData((d) => insertCard(d, section, cardForSound(sound, section)))
              }
            />
          </aside>
        </div>
      </DndContext>
    </>
  )
}
