import type { Scene } from '@ogre/shared'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { collectionsQuery, useCollections } from '../../api/collections.ts'
import { scenesQuery, useScenes } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { useActiveCollection } from './activeCollection.ts'
import { adjacentScene } from './setlist.ts'

export function useActiveCollectionData() {
  const id = useActiveCollection((s) => s.id)
  return useCollections().data?.find((c) => c.id === id)
}

export function useSetlist() {
  const collection = useActiveCollectionData()
  const scenes = useScenes().data ?? []
  const playingId = usePlayer((s) => s.sceneId)
  const next = adjacentScene(collection, scenes, playingId, 1)
  useEffect(() => {
    if (next && playingId) engine.preloadScene(next)
  }, [next, playingId])
  return {
    collection,
    next,
    previous: adjacentScene(collection, scenes, playingId, -1),
  }
}

/** Same lookup as `useSetlist`, for hotkeys that run outside render. */
export async function loadSetlist(qc: QueryClient) {
  const [collections, scenes] = await Promise.all([
    qc.ensureQueryData(collectionsQuery),
    qc.ensureQueryData(scenesQuery),
  ])
  const id = useActiveCollection.getState().id
  return { collection: collections.find((c) => c.id === id), scenes }
}

/** Starts a scene, following it to its player page if the GM is on one. */
export function useGoToScene() {
  const navigate = useNavigate()
  return (scene: Scene) => {
    void engine.playScene(scene)
    // Read at call time: hotkey handlers hold on to this function across navigations.
    if (/^\/scenes\/[^/]+$/.test(window.location.pathname)) navigate(`/scenes/${scene.id}`)
  }
}
