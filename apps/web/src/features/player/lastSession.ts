/** A session older than this is yesterday's game, not one the GM just lost. */
const MAX_AGE_MS = 12 * 60 * 60_000

export interface LastSession {
  sceneId: string
  cardId: string | null
  /** Seconds into the track. */
  at: number
  savedAt: number
}

export function parseLastSession(raw: string | null, now: number): LastSession | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as Partial<LastSession>
    if (typeof v.sceneId !== 'string' || typeof v.savedAt !== 'number') return null
    if (now - v.savedAt > MAX_AGE_MS) return null
    return {
      sceneId: v.sceneId,
      cardId: typeof v.cardId === 'string' ? v.cardId : null,
      at: typeof v.at === 'number' && v.at > 0 ? v.at : 0,
      savedAt: v.savedAt,
    }
  } catch {
    return null
  }
}
