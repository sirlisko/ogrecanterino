import { useOffline } from './store.ts'
import { useOnline } from './useOnline.ts'

/** Offline, flags scenes outside the kept collections, whose sounds probably won't load. */
export function NotOnDevice({ sceneId, className = '' }: { sceneId: string; className?: string }) {
  const online = useOnline()
  const kept = useOffline((s) => s.sceneIds.has(sceneId))
  if (online || kept) return null
  return <span className={`text-ink-muted ${className}`}>Not on this device</span>
}
