import type { Card } from '@ogre/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MusicDeck, type MusicState } from './music.ts'
import type { VoiceFactory } from './sources.ts'

const { made, FakeVoice } = vi.hoisted(() => {
  const made: InstanceType<typeof FakeVoice>[] = []
  class FakeVoice {
    failed = false
    paused = false
    now = 0
    private cb = () => {}
    constructor() {
      made.push(this)
    }
    onEnded(cb: () => void) {
      this.cb = cb
    }
    position() {
      return { current: this.now, duration: 300 }
    }
    setLoop() {}
    setVolume() {}
    stop = () => Promise.resolve()
    fail() {
      this.failed = true
      this.cb()
    }
  }
  return { made, FakeVoice }
})

vi.mock('./voice.ts', () => ({ ElementVoice: FakeVoice }))

const card = (id: string) =>
  ({ id, label: id, soundId: id, volume: 100, enabled: true, mode: 'oneshot' }) as Card

function deck() {
  let state: MusicState | null = null
  const d = new MusicDeck(
    {} as VoiceFactory,
    {} as AudioNode,
    (id) => ({ id, filename: `${id}.mp3`, gainDb: 0 }) as never,
    { crossfadeSeconds: 0.3, mode: 'sequential', autoAdvance: true },
    (s) => (state = s),
  )
  d.setCards([card('a'), card('b'), card('c')])
  return { d, state: () => state as MusicState | null }
}

describe('MusicDeck when tracks fail to load', () => {
  beforeEach(() => {
    made.length = 0
    vi.useFakeTimers()
    vi.stubGlobal('window', globalThis)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('waits longer between each attempt instead of spinning through the playlist', () => {
    const { d, state } = deck()
    d.play()
    expect(made).toHaveLength(1)

    made[0]?.fail()
    expect(state()?.failing).toBe(true)
    expect(made).toHaveLength(1)
    vi.advanceTimersByTime(999)
    expect(made).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(made).toHaveLength(2)

    made[1]?.fail()
    vi.advanceTimersByTime(1999)
    expect(made).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(made).toHaveLength(3)
  })

  it('clears the warning once a track is really playing', () => {
    const { d, state } = deck()
    d.play()
    made[0]?.fail()
    vi.advanceTimersByTime(1000)
    expect(state()?.failing).toBe(true)

    made[1]!.now = 1
    vi.advanceTimersByTime(500)
    expect(state()?.failing).toBe(false)
    void d.stop()
  })

  it('stops retrying when the scene stops', () => {
    const { d, state } = deck()
    d.play()
    made[0]?.fail()
    void d.stop()
    vi.advanceTimersByTime(60_000)
    expect(made).toHaveLength(1)
    expect(state()?.failing).toBe(false)
  })
})
