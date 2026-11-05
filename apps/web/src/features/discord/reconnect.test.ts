import { describe, expect, it } from 'vitest'
import { afterClose, CLOSE, GIVE_UP_AFTER_MS } from './reconnect.ts'

describe('afterClose', () => {
  it('stops quietly when the GM stopped the stream', () => {
    expect(afterClose(CLOSE.stopped, '', 0, 0)).toEqual({ action: 'stop' })
  })

  it('does not fight another tab or a refusal', () => {
    expect(afterClose(CLOSE.takenOver, 'Streaming moved', 0, 0)).toEqual({
      action: 'fail',
      message: 'Streaming moved',
    })
    expect(afterClose(CLOSE.refused, '', 0, 0)).toEqual({ action: 'fail', message: null })
  })

  it('retries dropped connections with a growing delay', () => {
    const delays = [0, 1, 2, 3, 4, 9].map((attempt) => {
      const outcome = afterClose(1006, '', attempt, 0)
      return outcome.action === 'retry' ? outcome.delayMs : null
    })
    expect(delays).toEqual([1000, 2000, 4000, 8000, 15_000, 15_000])
  })

  it('rejoins the channel when the server no longer has a voice session', () => {
    expect(afterClose(CLOSE.noVoiceSession, '', 0, 0)).toMatchObject({
      action: 'retry',
      rejoin: true,
    })
    expect(afterClose(1006, '', 0, 0)).toMatchObject({ action: 'retry', rejoin: false })
  })

  it('gives up after two minutes', () => {
    expect(afterClose(1006, '', 8, GIVE_UP_AFTER_MS)).toMatchObject({ action: 'fail' })
  })
})
