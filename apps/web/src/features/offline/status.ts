import type { OfflinePlan } from './files.ts'

export type IncompleteReason = 'failed' | 'space' | 'offline'

export type OfflineStatus =
  | { kind: 'downloading'; done: number; total: number }
  | { kind: 'ready'; bytes: number }
  | { kind: 'incomplete'; missing: number; reason: IncompleteReason }

/** Where each collection's download stands; `finished` says why a finished one is incomplete. */
export function offlineStatuses(
  plan: OfflinePlan,
  kept: ReadonlySet<string>,
  sizes: ReadonlyMap<string, number>,
  finished: IncompleteReason | null,
): Record<string, OfflineStatus> {
  return Object.fromEntries(
    [...plan].map(([id, files]): [string, OfflineStatus] => {
      const have = files.filter((f) => kept.has(f))
      const missing = files.length - have.length
      if (missing === 0)
        return [id, { kind: 'ready', bytes: have.reduce((sum, f) => sum + (sizes.get(f) ?? 0), 0) }]
      return [
        id,
        finished
          ? { kind: 'incomplete', missing, reason: finished }
          : { kind: 'downloading', done: have.length, total: files.length },
      ]
    }),
  )
}
