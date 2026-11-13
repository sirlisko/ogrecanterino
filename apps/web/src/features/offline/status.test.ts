import { describe, expect, it } from 'vitest'
import { offlineStatuses } from './status.ts'

const plan = new Map([
  ['done', ['/a', '/b']],
  ['partial', ['/a', '/c', '/d']],
])
const sizes = new Map([
  ['/a', 100],
  ['/b', 50],
])

describe('offlineStatuses', () => {
  it('counts progress while downloading', () => {
    expect(offlineStatuses(plan, new Set(['/a', '/b']), sizes, null)).toEqual({
      done: { kind: 'ready', bytes: 150 },
      partial: { kind: 'downloading', done: 1, total: 3 },
    })
  })

  it('says why a finished download is incomplete', () => {
    expect(offlineStatuses(plan, new Set(['/a']), sizes, 'space').partial).toEqual({
      kind: 'incomplete',
      missing: 2,
      reason: 'space',
    })
  })

  it('treats a collection with nothing to download as ready', () => {
    expect(offlineStatuses(new Map([['empty', []]]), new Set(), sizes, null).empty).toEqual({
      kind: 'ready',
      bytes: 0,
    })
  })
})
