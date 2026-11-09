import type { Card } from '@ogre/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AmbienceLayer } from './ambience.ts'
import { createVoice, type VoiceFactory } from './sources.ts'

vi.mock('./sources.ts', () => ({ createVoice: vi.fn() }))
const create = vi.mocked(createVoice)

const voice = () =>
  ({ failed: false, onEnded: vi.fn(), stop: vi.fn(), setVolume: vi.fn() }) as never

const layer = (card: Partial<Card>) => {
  const l = new AmbienceLayer(
    {} as VoiceFactory,
    {} as AudioNode,
    () => ({ id: 's' }) as never,
    () => undefined,
  )
  l.setCards([
    { id: 'c', label: 'c', soundId: 's', volume: 100, enabled: true, mode: 'loop', ...card },
  ])
  l.start()
  return l
}

const flush = () => vi.advanceTimersByTimeAsync(0)

describe('AmbienceLayer when a sound fails to load', () => {
  beforeEach(() => {
    create.mockReset()
    vi.useFakeTimers()
    vi.stubGlobal('window', globalThis)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('keeps an interval sound on its schedule after a failed load', async () => {
    create.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(voice())
    layer({ mode: 'interval', intervalMs: [1000, 1000], times: [1, 1] })

    await vi.advanceTimersByTimeAsync(1000)
    expect(create).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('retries a loop that failed to load, with a growing delay', async () => {
    create.mockRejectedValue(new Error('offline'))
    layer({ mode: 'loop' })
    await flush()
    expect(create).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1000)
    expect(create).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1999)
    expect(create).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(create).toHaveBeenCalledTimes(3)
  })

  it('stops retrying once the layer stops', async () => {
    create.mockRejectedValue(new Error('offline'))
    const l = layer({ mode: 'loop' })
    await flush()
    l.stop()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(create).toHaveBeenCalledTimes(1)
  })
})
