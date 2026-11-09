import type { Scene } from '@ogre/shared'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client.ts'
import { useSaveScene } from '../../api/scenes.ts'

const SAVE_DELAY_MS = 800

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'conflict'

/** The version of each scene this tab last loaded or saved; it outlives any one page. */
const versions = new Map<string, string>()

export const knownVersion = (id: string) => versions.get(id)
export const rememberVersion = (id: string, updatedAt: string) => versions.set(id, updatedAt)

/** Debounced saves of `latest`, one at a time, each saying which version it was based on. */
export function useSceneAutosave(latest: RefObject<Scene | null>) {
  const save = useSaveScene()
  const send = useRef(save.mutateAsync)
  send.current = save.mutateAsync
  const [queued, setQueued] = useState(false)
  const [conflict, setConflict] = useState(false)
  const timer = useRef<number | null>(null)
  const sending = useRef(false)
  const sendAgain = useRef(false)
  const blocked = useRef(false)
  const dirty = useRef(false)

  const block = useCallback((on: boolean) => {
    blocked.current = on
    setConflict(on)
  }, [])

  const flush = useCallback(
    (overwrite = false) => {
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = null
      setQueued(false)
      const s = latest.current
      if (!s || !s.name.trim() || (blocked.current && !overwrite)) return
      // A second save sent before the first returns would be based on a version already gone.
      if (sending.current) {
        sendAgain.current = true
        return
      }
      sending.current = true
      const { name, tags, visibility, combatSceneId, data } = s
      const expectedUpdatedAt = overwrite ? undefined : versions.get(s.id)
      const input = { name, tags, visibility, combatSceneId, data, expectedUpdatedAt }
      send
        .current({ id: s.id, input })
        .then(
          (saved) => {
            versions.set(saved.id, saved.updatedAt)
            block(false)
            if (timer.current === null && !sendAgain.current) dirty.current = false
          },
          (e) => {
            if (e instanceof ApiError && e.status === 409) block(true)
          },
        )
        .finally(() => {
          sending.current = false
          if (!sendAgain.current) return
          sendAgain.current = false
          flush()
        })
    },
    [latest, block],
  )

  useEffect(() => () => void (timer.current !== null && flush()), [flush])

  const changed = useCallback(
    (canSave: boolean) => {
      dirty.current = true
      if (!canSave) return
      if (timer.current !== null) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => flush(), SAVE_DELAY_MS)
      setQueued(true)
    },
    [flush],
  )

  /** Finishes with the current copy before it's replaced by another scene or a newer version. */
  const settle = useCallback(() => {
    if (timer.current !== null) flush()
    dirty.current = false
    block(false)
  }, [flush, block])

  const isDirty = useCallback(() => dirty.current, [])

  const status: SaveStatus = conflict
    ? 'conflict'
    : queued
      ? 'pending'
      : save.isPending
        ? 'saving'
        : save.isError
          ? 'error'
          : save.isSuccess
            ? 'saved'
            : 'idle'

  return { status, error: save.error, flush, changed, settle, isDirty }
}
