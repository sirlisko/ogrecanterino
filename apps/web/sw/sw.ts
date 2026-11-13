import { OFFLINE_FILES } from '../src/features/offline/cacheNames.ts'
import { partial } from './range.ts'

declare const self: ServiceWorkerGlobalScope

self.addEventListener('install', () => void self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (/^\/(audio|banners)\//.test(url.pathname))
    event.respondWith(fromDevice(request, url.pathname))
})

/** A downloaded copy if this device keeps one, otherwise the server. */
async function fromDevice(request: Request, path: string) {
  // `caches.match` with a name, unlike `caches.open`, doesn't create the cache when it's missing.
  const kept = await caches.match(path, { cacheName: OFFLINE_FILES })
  return kept ? partial(kept, request.headers.get('range')) : fetch(request)
}
