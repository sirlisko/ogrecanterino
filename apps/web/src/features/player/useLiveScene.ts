import type { Card, Scene, SceneData, SceneSection } from '@ogre/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMe } from '../../api/me.ts'
import { useScene } from '../../api/scenes.ts'
import { engine } from '../../audio/engine.ts'
import { usePlayer } from '../../audio/store.ts'
import { knownVersion, rememberVersion, useSceneAutosave } from './useSceneAutosave.ts'

/**
 * Local working copy of a scene. Changes apply to the audio immediately and, for scenes
 * you own, are saved in the background; for shared scenes they last until you leave.
 */
export function useLiveScene(id: string | undefined) {
  const query = useScene(id)
  const me = useMe().data
  const [scene, setScene] = useState<Scene | null>(null)
  const latest = useRef<Scene | null>(null)
  const autosave = useSceneAutosave(latest)
  const { flush, changed, settle, isDirty } = autosave

  const canEdit = !!scene && !!me && (me.role === 'admin' || scene.ownerId === me.id)

  const replace = useCallback((next: Scene) => {
    latest.current = next
    setScene(next)
  }, [])

  useEffect(() => {
    if (!query.data) return
    settle()
    // If this scene is already playing, keep the playing copy so unsaved tweaks survive navigation.
    const playing = usePlayer.getState().scene
    if (playing?.id === query.data.id) {
      if (!knownVersion(playing.id)) rememberVersion(playing.id, playing.updatedAt)
      replace(playing)
    } else {
      rememberVersion(query.data.id, query.data.updatedAt)
      replace(query.data)
    }
  }, [query.data?.id])

  // A cached copy opened untouched takes the newer version when the refetch lands, rather than
  // conflicting with it on the first save. Not the playing scene: only the GM changes what's heard.
  useEffect(() => {
    const fresh = query.data
    if (!fresh || latest.current?.id !== fresh.id || isDirty()) return
    if (usePlayer.getState().sceneId === fresh.id || knownVersion(fresh.id) === fresh.updatedAt)
      return
    rememberVersion(fresh.id, fresh.updatedAt)
    replace(fresh)
  }, [query.data?.updatedAt])

  // Server-side fields (the banner) change outside this hook; pick them up without losing edits.
  useEffect(() => {
    const bannerPath = query.data?.bannerPath
    if (bannerPath === undefined || !latest.current || latest.current.bannerPath === bannerPath)
      return
    replace({ ...latest.current, bannerPath })
  }, [query.data?.bannerPath])

  const update = useCallback(
    (fn: (s: Scene) => Scene) => {
      const current = latest.current
      if (!current) return
      const next = fn(current)
      replace(next)
      engine.updateScene(next)
      changed(canEdit)
    },
    [canEdit, changed, replace],
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

  const loadNewer = async () => {
    const { data } = await query.refetch()
    if (!data) return
    settle()
    rememberVersion(data.id, data.updatedAt)
    replace(data)
    engine.updateScene(data)
  }

  return {
    scene,
    canEdit,
    isPending: query.isPending,
    error: query.error,
    saveStatus: autosave.status,
    saveError: autosave.error,
    update,
    updateData,
    updateCard,
    flush,
    keepMine: () => flush(true),
    loadNewer,
  }
}
