import type { Card, Scene, SceneData, SceneSection } from '@ogre/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMe } from '../../api/me.ts'
import { useSaveScene, useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'

const SAVE_DELAY_MS = 800

/**
 * Local working copy of a scene. Tweaks apply to the audio immediately and, for scenes
 * you own, are saved in the background; for shared scenes they last until you leave.
 */
export function useLiveScene(id: string | undefined) {
  const query = useScene(id)
  const me = useMe().data
  const save = useSaveScene()
  const [scene, setScene] = useState<Scene | null>(null)
  const latest = useRef<Scene | null>(null)
  const timer = useRef<number | null>(null)
  const mutate = useRef(save.mutate)
  mutate.current = save.mutate

  const canEdit = !!scene && !!me && (me.role === 'admin' || scene.ownerId === me.id)

  useEffect(() => {
    if (!query.data) return
    // If this scene is already playing, keep the playing copy so unsaved tweaks survive navigation.
    const playing = usePlayer.getState().scene
    const initial = playing?.id === query.data.id ? playing : query.data
    latest.current = initial
    setScene(initial)
  }, [query.data?.id])

  const flush = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    const s = latest.current
    if (!s) return
    const { name, tags, visibility, combatSceneId, data } = s
    mutate.current({ id: s.id, input: { name, tags, visibility, combatSceneId, data } })
  }, [])

  useEffect(() => () => void (timer.current !== null && flush()), [flush])

  const updateData = useCallback(
    (fn: (d: SceneData) => SceneData) => {
      const current = latest.current
      if (!current) return
      const next = { ...current, data: fn(current.data) }
      latest.current = next
      setScene(next)
      engine.updateScene(next)
      if (!canEdit) return
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
    },
    [canEdit, flush],
  )

  const updateCard = useCallback(
    (section: SceneSection, cardId: string, patch: Partial<Card>) =>
      updateData((d) => ({
        ...d,
        [section]: d[section].map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
      })),
    [updateData],
  )

  return { scene, canEdit, isPending: query.isPending, error: query.error, updateData, updateCard }
}
