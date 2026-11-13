import { OFFLINE_FILES } from './cacheNames.ts'
import type { OfflinePlan } from './files.ts'
import { offlineStatuses, type IncompleteReason } from './status.ts'
import { setKeptOffline, setOfflineStatus } from './store.ts'

const PARALLEL = 3

/** Bytes per downloaded file, read once from its headers. */
const sizes = new Map<string, number>()
let running: AbortController | null = null
let lastPlan: OfflinePlan = new Map()

const sizeOf = (res: Response | undefined) => Number(res?.headers.get('content-length')) || 0
const isQuota = (e: unknown) => e instanceof DOMException && e.name === 'QuotaExceededError'

/** Brings this device's downloads in line with `plan`, replacing any sync still running. */
export function syncOffline(plan: OfflinePlan) {
  lastPlan = plan
  running?.abort()
  const run = new AbortController()
  running = run
  sync(plan, run.signal).catch(() => {
    if (!run.signal.aborted) setOfflineStatus(offlineStatuses(plan, new Set(), sizes, 'failed'))
  })
}

export const retryOffline = () => syncOffline(lastPlan)

/** Drops every download and the list of kept collections, so the next person to log in starts clean. */
export async function forgetOffline() {
  running?.abort()
  lastPlan = new Map()
  sizes.clear()
  setKeptOffline([])
  setOfflineStatus({})
  await caches.delete(OFFLINE_FILES)
}

async function sync(plan: OfflinePlan, signal: AbortSignal) {
  if (!plan.size) {
    setOfflineStatus({})
    await caches.delete(OFFLINE_FILES)
    return
  }
  const cache = await caches.open(OFFLINE_FILES)
  const kept = new Set((await cache.keys()).map((r) => new URL(r.url).pathname))
  const needed = new Set([...plan.values()].flat())
  for (const file of kept) {
    if (needed.has(file)) continue
    kept.delete(file)
    await cache.delete(file)
  }
  for (const file of kept) if (!sizes.has(file)) sizes.set(file, sizeOf(await cache.match(file)))

  let problem: IncompleteReason | null = null
  const report = (finished: boolean) => {
    if (!signal.aborted)
      setOfflineStatus(offlineStatuses(plan, kept, sizes, finished ? (problem ?? 'failed') : null))
  }
  const queue = [...needed].filter((f) => !kept.has(f))
  report(false)
  if (queue.length && !navigator.onLine) problem = 'offline'

  const worker = async () => {
    while (!problem && !signal.aborted) {
      const file = queue.shift()
      if (!file) return
      try {
        const res = await fetch(file, { signal })
        if (!res.ok) throw new Error(`${res.status} for ${file}`)
        const size = sizeOf(res)
        await cache.put(file, res)
        sizes.set(file, size)
        kept.add(file)
      } catch (e) {
        if (isQuota(e)) problem = 'space'
        else if (!navigator.onLine) problem = 'offline'
      }
      report(false)
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker))
  report(true)
}
