import { formatBytes } from '../../ui/format.ts'
import type { OfflineStatus } from './status.ts'
import { keepOffline, useOffline } from './store.ts'
import { retryOffline } from './sync.ts'

const supported = 'caches' in window && 'serviceWorker' in navigator
const files = (n: number) => `${n} file${n === 1 ? '' : 's'}`

/** Keeps a collection's sounds on this device, so the session plays without a network. */
export function OfflineToggle({ collectionId }: { collectionId: string }) {
  const kept = useOffline((s) => s.ids.includes(collectionId))
  const status = useOffline((s) => s.status[collectionId])
  if (!supported) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <label className="flex min-h-11 items-center gap-2 whitespace-nowrap">
        <input
          type="checkbox"
          role="switch"
          checked={kept}
          onChange={(e) => keepOffline(collectionId, e.target.checked)}
          className="h-4 w-4 accent-brass"
        />
        Available offline
      </label>
      {kept && <StatusLine status={status} />}
    </div>
  )
}

function StatusLine({ status }: { status: OfflineStatus | undefined }) {
  const quiet = 'text-sm text-ink-muted'
  if (!status) return <span className={quiet}>Checking this device…</span>
  if (status.kind === 'downloading')
    return (
      <span className={`${quiet} tabular`}>
        Downloading {status.done} of {status.total}
      </span>
    )
  if (status.kind === 'ready')
    return <span className={quiet}>On this device, {formatBytes(status.bytes)}</span>
  if (status.reason === 'offline')
    return (
      <span className={quiet}>{files(status.missing)} still to download. Reconnect to finish.</span>
    )
  return (
    <span className="text-sm text-danger">
      {status.reason === 'space'
        ? 'Not enough space on this device.'
        : `${files(status.missing)} didn't download.`}{' '}
      <button type="button" onClick={retryOffline} className="underline hover:text-ink">
        Try again
      </button>
    </span>
  )
}
