import type { Scene } from '@ogre/shared'
import type { QueryClient } from '@tanstack/react-query'
import { create } from 'zustand'
import { api } from '../../api/client.ts'
import { keys } from '../../api/keys.ts'

const UNDO_MS = 8000

interface Pending {
  scene: Scene
  qc: QueryClient
}

/** A scene the GM deleted that is hidden but not yet gone, so the delete can be undone. */
export const usePendingDelete = create<{ pending: Pending | null }>(() => ({ pending: null }))

let timer: number | null = null

function take(): Pending | null {
  if (timer !== null) window.clearTimeout(timer)
  timer = null
  const { pending } = usePendingDelete.getState()
  usePendingDelete.setState({ pending: null })
  return pending
}

/** Hides the scene now and deletes it when the Undo window closes; a second delete sends the first. */
export function deleteWithUndo(qc: QueryClient, scene: Scene) {
  commitDelete()
  usePendingDelete.setState({ pending: { scene, qc } })
  timer = window.setTimeout(commitDelete, UNDO_MS)
}

export function undoDelete() {
  take()
}

export function commitDelete() {
  const pending = take()
  if (!pending) return
  const { scene, qc } = pending
  // Drop it from the list first, so it doesn't flash back while the request is in flight.
  qc.setQueryData<Scene[]>(keys.scenes, (list) => list?.filter((s) => s.id !== scene.id))
  void api(`/api/scenes/${scene.id}`, { method: 'DELETE' }).finally(() =>
    qc.invalidateQueries({ queryKey: keys.scenes, exact: true }),
  )
}

// Closing the tab inside the Undo window still deletes: the GM already said so.
window.addEventListener('pagehide', () => {
  const pending = take()
  if (pending) void fetch(`/api/scenes/${pending.scene.id}`, { method: 'DELETE', keepalive: true })
})
