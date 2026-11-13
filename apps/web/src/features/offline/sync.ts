import { OFFLINE_API, OFFLINE_FILES } from './cacheNames.ts'
import type { OfflinePlan, OfflineRead } from './files.ts'
import { keepFonts } from './fonts.ts'
import { offlineStatuses, type IncompleteReason } from './status.ts'
import { setKeptOffline, setOfflineStatus } from './store.ts'

const PARALLEL = 3

/** Bytes per downloaded file, read once from its headers. */
const sizes = new Map<string, number>()
/** The version of each API read last stored, so unchanged ones aren't asked for again. */
const stored = new Map<string, string>()
let running: AbortController | null = null
let lastPlan: OfflinePlan = new Map()
let lastReads: OfflineRead[] = []

const sizeOf = (res: Response | undefined) => Number(res?.headers.get('content-length')) || 0
const isQuota = (e: unknown) => e instanceof DOMException && e.name === 'QuotaExceededError'

/** Brings this device's downloads in line with `plan`, replacing any sync still running. */
export function syncOffline(plan: OfflinePlan, reads: OfflineRead[] = []) {
  lastPlan = plan
  lastReads = reads
  running?.abort()
  const run = new AbortController()
  running = run
  sync(plan, reads, run.signal).catch(() => {
    if (!run.signal.aborted) setOfflineStatus(offlineStatuses(plan, new Set(), sizes, 'failed'))
  })
}

export const retryOffline = () => syncOffline(lastPlan, lastReads)

/** Drops every download and the list of kept collections, so the next person to log in starts clean. */
export async function forgetOffline() {
  running?.abort()
  lastPlan = new Map()
  lastReads = []
  setKeptOffline([])
  await clear()
}

async function clear() {
  sizes.clear()
  stored.clear()
  setOfflineStatus({})
  await Promise.all([caches.delete(OFFLINE_FILES), caches.delete(OFFLINE_API)])
}

async function sync(plan: OfflinePlan, reads: OfflineRead[], signal: AbortSignal) {
  if (!plan.size) return clear()
  const cache = await caches.open(OFFLINE_FILES)
  const kept = new Set((await cache.keys()).map((r) => new URL(r.url).pathname))
  const needed = new Set([...plan.values()].flat())
  for (const file of kept) {
    if (needed.has(file)) continue
    kept.delete(file)
    await cache.delete(file)
  }
  for (const file of kept) if (!sizes.has(file)) sizes.set(file, sizeOf(await cache.match(file)))
  // The service worker stores these as they pass, now that the files cache exists.
  if (navigator.onLine)
    await Promise.all([...reads.map((read) => store(read, signal)), keepFonts(signal)])

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

async function store({ url, version }: OfflineRead, signal: AbortSignal) {
  if (stored.get(url) === version) return
  try {
    if ((await fetch(url, { signal })).ok) stored.set(url, version)
  } catch {
    // tried again on the next sync
  }
}
