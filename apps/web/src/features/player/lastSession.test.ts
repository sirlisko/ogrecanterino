import { describe, expect, it } from 'vitest'
import { parseLastSession } from './lastSession.ts'

describe('parseLastSession', () => {
  const now = Date.UTC(2026, 10, 5, 20)

  it('reads a recent session', () => {
    const raw = JSON.stringify({ sceneId: 's1', cardId: 'c1', at: 42.5, savedAt: now - 60_000 })
    expect(parseLastSession(raw, now)).toEqual({
      sceneId: 's1',
      cardId: 'c1',
      at: 42.5,
      savedAt: now - 60_000,
    })
  })

  it('ignores yesterday’s game', () => {
    const raw = JSON.stringify({ sceneId: 's1', cardId: null, at: 0, savedAt: now - 13 * 3600_000 })
    expect(parseLastSession(raw, now)).toBeNull()
  })

  it('survives missing or broken storage', () => {
    expect(parseLastSession(null, now)).toBeNull()
    expect(parseLastSession('{', now)).toBeNull()
    expect(parseLastSession(JSON.stringify({ cardId: 'c1' }), now)).toBeNull()
  })

  it('treats a bad track or position as the start of the scene', () => {
    const raw = JSON.stringify({ sceneId: 's1', cardId: 7, at: -3, savedAt: now })
    expect(parseLastSession(raw, now)).toMatchObject({ cardId: null, at: 0 })
  })
})
