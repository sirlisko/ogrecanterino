import { OFFLINE_API, OFFLINE_FILES } from '../src/features/offline/cacheNames.ts'
import { partial } from './range.ts'

declare const self: ServiceWorkerGlobalScope
/** The built app's files and a name for this build, filled in by the `serviceWorker.ts` plugin. */
declare const __APP_FILES__: string[]
declare const __BUILD__: string

const SHELL = `ogre-shell-${__BUILD__}`
const APP_FILES = new Set(__APP_FILES__)
const FONTS = 'ogre-fonts'
/** Long enough for a slow connection, short enough that a table with no network isn't kept waiting. */
const NETWORK_TIMEOUT_MS = 5000

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(__APP_FILES__)))
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const old = (await caches.keys()).filter((n) => n.startsWith('ogre-shell-') && n !== SHELL)
      await Promise.all(old.map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname))
      event.respondWith(cacheFirst(FONTS, request))
    return
  }
  const path = url.pathname
  // Discord state is live, so an old copy would claim a stream that isn't there.
  if (path.startsWith('/api/discord/') || path.startsWith('/auth/')) return
  if (/^\/(audio|banners)\//.test(path)) event.respondWith(fromDevice(request, path))
  else if (path.startsWith('/api/')) event.respondWith(apiRead(request))
  else if (request.mode === 'navigate') event.respondWith(page(request))
  else if (APP_FILES.has(path)) event.respondWith(cacheFirst(SHELL, request))
})

/** A downloaded copy if this device keeps one, otherwise the server. */
async function fromDevice(request: Request, path: string) {
  // `caches.match` with a name, unlike `caches.open`, doesn't create the cache when it's missing.
  const kept = await caches.match(path, { cacheName: OFFLINE_FILES })
  return kept ? partial(kept, request.headers.get('range')) : fetch(request)
}

/** Fresh from the server when it answers, the last answer when it doesn't. */
async function apiRead(request: Request) {
  if (!(await caches.has(OFFLINE_FILES))) return fetch(request)
  const last = await caches.match(request, { cacheName: OFFLINE_API })
  try {
    const res = await fetchWithin(request, !!last)
    if (res.ok) await caches.open(OFFLINE_API).then((c) => c.put(request, res.clone()))
    return res
  } catch (e) {
    if (last) return last
    throw e
  }
}

/** Pages always load the newest build when the server answers. */
async function page(request: Request) {
  const app = await caches.match('/index.html', { cacheName: SHELL })
  try {
    return await fetchWithin(request, !!app)
  } catch (e) {
    if (app) return app
    throw e
  }
}

async function cacheFirst(cacheName: string, request: Request) {
  // Fonts are stored from the page's CORS requests but asked for by a plain stylesheet link.
  const hit = await caches.match(request, { cacheName, ignoreVary: true })
  if (hit) return hit
  const res = await fetch(request)
  // Fonts come back opaque (status 0), which is still a usable copy.
  if (res.ok || res.type === 'opaque')
    await caches.open(cacheName).then((c) => c.put(request, res.clone()))
  return res
}

/** Only gives up early when there's a copy to fall back on. */
function fetchWithin(request: Request, hasFallback: boolean) {
  return hasFallback
    ? fetch(request, { signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS) })
    : fetch(request)
}
