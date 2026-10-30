import { emptySceneData } from '@ogre/shared'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useCollections } from '../../api/collections.ts'
import { useSaveScene, useScenes } from '../../api/scenes.ts'
import { Button } from '../../ui/Button.tsx'
import { setActiveCollection, useActiveCollection } from '../collections/activeCollection.ts'
import { CollectionBar } from '../collections/CollectionBar.tsx'
import { CollectionScenes } from '../collections/CollectionScenes.tsx'
import { UNTITLED } from '../editor/useDiscardIfBlank.ts'
import { AllScenes } from './AllScenes.tsx'
import { ImportScenesButton } from './ImportScenesButton.tsx'

export function ScenesPage() {
  const scenes = useScenes()
  const collections = useCollections()
  const activeId = useActiveCollection((s) => s.id)
  const save = useSaveScene()
  const navigate = useNavigate()
  const collection = collections.data?.find((c) => c.id === activeId)

  useEffect(() => {
    // The remembered collection was deleted or unshared.
    if (activeId && collections.data && !collection) setActiveCollection(null)
  }, [activeId, collections.data, collection])

  const create = async () => {
    const scene = await save.mutateAsync({
      input: {
        name: UNTITLED,
        tags: [],
        visibility: 'private',
        combatSceneId: null,
        data: emptySceneData(),
      },
    })
    navigate(`/scenes/${scene.id}/edit`, { state: { fresh: true } })
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-4">
        <h1 className="font-display text-4xl font-bold">Scenes</h1>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <ImportScenesButton />
          <Button variant="primary" onClick={create} disabled={save.isPending}>
            New scene
          </Button>
        </div>
      </div>
      <CollectionBar />
      {scenes.isPending ? (
        <p className="mt-10 text-ink-muted">Loading scenes…</p>
      ) : collection ? (
        <CollectionScenes collection={collection} scenes={scenes.data ?? []} />
      ) : (
        <AllScenes scenes={scenes.data ?? []} />
      )}
    </>
  )
}
