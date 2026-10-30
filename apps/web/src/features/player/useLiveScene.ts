import type { Card, Scene, SceneData, SceneSection } from '@ogre/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMe } from '../../api/me.ts'
import { useSaveScene, useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'

const SAVE_DELAY_MS = 800

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/**
 * Local working copy of a scene. Changes apply to the audio immediately and, for scenes
 * you own, are saved in the background; for shared scenes they last until you leave.
 */
export function useLiveScene(id: string | undefined) {
  const query = useScene(id)
  const me = useMe().data
  const save = useSaveScene()
  const [scene, setScene] = useState<Scene | null>(null)
  const [queued, setQueued] = useState(false)
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

  // Server-side fields (the banner) change outside this hook; pick them up without losing edits.
  useEffect(() => {
    const bannerPath = query.data?.bannerPath
    if (bannerPath === undefined || !latest.current || latest.current.bannerPath === bannerPath)
      return
    latest.current = { ...latest.current, bannerPath }
    setScene(latest.current)
  }, [query.data?.bannerPath])

  const flush = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    setQueued(false)
    const s = latest.current
    if (!s || !s.name.trim()) return
    const { name, tags, visibility, combatSceneId, data } = s
    mutate.current({ id: s.id, input: { name, tags, visibility, combatSceneId, data } })
  }, [])

  useEffect(() => () => void (timer.current !== null && flush()), [flush])

  const update = useCallback(
    (fn: (s: Scene) => Scene) => {
      const current = latest.current
      if (!current) return
      const next = fn(current)
      latest.current = next
      setScene(next)
      engine.updateScene(next)
      if (!canEdit) return
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
      setQueued(true)
    },
    [canEdit, flush],
  )

  const updateData = useCallback(
    (fn: (d: SceneData) => SceneData) => update((s) => ({ ...s, data: fn(s.data) })),
    [update],
  )

  const updateCard = useCallback(
    (section: SceneSection, cardId: string, patch: Partial<Card>) =>
      updateData((d) => ({
        ...d,
        [section]: d[section].map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
      })),
    [updateData],
  )

  const status: SaveStatus = queued
    ? 'pending'
    : save.isPending
      ? 'saving'
      : save.isError
        ? 'error'
        : save.isSuccess
          ? 'saved'
          : 'idle'

  return {
    scene,
    canEdit,
    isPending: query.isPending,
    error: query.error,
    saveStatus: status,
    saveError: save.error,
    update,
    updateData,
    updateCard,
    flush,
  }
}
