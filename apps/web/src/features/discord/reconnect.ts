/** Close codes on the stream socket; the 4000s come from the server's voice sessions. */
export const CLOSE = {
  stopped: 1000,
  refused: 1008,
  takenOver: 4000,
  noVoiceSession: 4001,
  botRemoved: 4002,
} as const

const DELAYS_MS = [1000, 2000, 4000, 8000, 15_000]
/** Long enough to ride out a redeploy or a Wi-Fi drop; after that the GM should know. */
export const GIVE_UP_AFTER_MS = 2 * 60_000

export type CloseOutcome =
  | { action: 'stop' }
  | { action: 'fail'; message: string | null }
  | { action: 'retry'; delayMs: number; rejoin: boolean }

/** What to do after the stream socket closes, given how many retries have already failed. */
export function afterClose(
  code: number,
  reason: string,
  attempt: number,
  elapsedMs: number,
): CloseOutcome {
  if (code === CLOSE.stopped) return { action: 'stop' }
  if (code === CLOSE.takenOver || code === CLOSE.refused || code === CLOSE.botRemoved)
    return { action: 'fail', message: reason || null }
  if (elapsedMs >= GIVE_UP_AFTER_MS)
    return { action: 'fail', message: 'Lost the connection to Discord.' }
  return {
    action: 'retry',
    delayMs: DELAYS_MS[Math.min(attempt, DELAYS_MS.length - 1)] ?? 0,
    // The server forgot the voice channel (restart, or the tab was gone too long): join it again first.
    rejoin: code === CLOSE.noVoiceSession,
  }
}
