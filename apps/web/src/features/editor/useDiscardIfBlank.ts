import { type Scene, sceneSections } from '@ogre/shared'
import { useEffect, useRef } from 'react'
import { useDeleteScene } from '../../api/scenes.ts'

export const UNTITLED = 'Untitled scene'

const isBlank = (s: Scene) =>
  s.name === UNTITLED &&
  s.tags.length === 0 &&
  !s.bannerPath &&
  sceneSections.every((section) => s.data[section].length === 0)

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
