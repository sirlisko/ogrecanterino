import type { Scene } from '@ogre/shared'
import { useEffect, useRef } from 'react'
import { useMe } from '../../api/me.ts'
import { useDeleteScene } from '../../api/scenes.ts'
import { isBlank, staleBlankScenes } from './blankScene.ts'

/** Deletes a freshly created scene if the editor is left without touching it. */
export function useDiscardIfBlank(scene: Scene | null, fresh: boolean) {
  const remove = useDeleteScene()
  const latest = useRef(scene)
  latest.current = scene
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      // Deferred so StrictMode's simulated unmount/remount doesn't count as leaving.
      window.setTimeout(() => {
        const s = latest.current
        if (mounted.current || !fresh || !s || !isBlank(s)) return
        if (window.location.pathname.startsWith(`/scenes/${s.id}`)) return
        remove.mutate(s.id)
      })
    }
  }, [])
}

const swept = new Set<string>()

/** Cleans up blank scenes the editor never got to discard (closed tab, reload, crash). */
export function useSweepBlankScenes(scenes: Scene[] | undefined) {
  const meId = useMe().data?.id
  const remove = useDeleteScene()
  const mutate = useRef(remove.mutate)
  mutate.current = remove.mutate

  useEffect(() => {
    if (!scenes || !meId) return
    for (const id of staleBlankScenes(scenes, meId, Date.now())) {
      if (swept.has(id)) continue
      swept.add(id)
      mutate.current(id)
    }
  }, [scenes, meId])
}
