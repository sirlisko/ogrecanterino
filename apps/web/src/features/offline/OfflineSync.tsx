import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { collectionsQuery } from '../../api/collections.ts'
import { padsQuery } from '../../api/me.ts'
import { scenesQuery } from '../../api/scenes.ts'
import { soundsQuery } from '../../api/sounds.ts'
import { offlinePlan } from './files.ts'
import { setKeptOffline, useOffline } from './store.ts'
import { syncOffline } from './sync.ts'
import { useOnline } from './useOnline.ts'

/** Autosave refetches the scenes after every edit; wait for a pause before checking the files. */
const SETTLE_MS = 1500

/** Keeps the kept collections' files on this device as their scenes change. Renders nothing. */
export function OfflineSync() {
  const ids = useOffline((s) => s.ids)
  const enabled = ids.length > 0
  const collections = useQuery({ ...collectionsQuery, enabled }).data
  const scenes = useQuery({ ...scenesQuery, enabled }).data
  const sounds = useQuery({ ...soundsQuery, enabled }).data
  const pads = useQuery({ ...padsQuery, enabled }).data
  const online = useOnline()

  useEffect(() => {
    if (!enabled) return syncOffline(new Map())
    // A partial library would look like files nobody needs and get them deleted.
    if (!collections || !scenes || !sounds || !pads) return
    const kept = collections.filter((c) => ids.includes(c.id))
    if (kept.length < ids.length) return setKeptOffline(kept.map((c) => c.id))
    const plan = offlinePlan(kept, scenes, sounds, pads)
    const timer = window.setTimeout(() => syncOffline(plan), SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [enabled, ids, collections, scenes, sounds, pads, online])

  return null
}
