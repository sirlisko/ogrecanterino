import type { Card } from '@ogre/shared'
import { randomInRange, randomIntInRange, retryDelayMs } from './schedule.ts'
import { createVoice, type SoundLookup, type VoiceFactory } from './sources.ts'
import type { Voice } from './voice.ts'

export interface AmbienceCardState {
  sounding: boolean
  /** Epoch ms of the next interval trigger, when waiting. */
  nextAt: number | null
  /** How long the current wait lasts in total, so it can be drawn as progress. */
  waitMs: number
}

const LOOP_FADE_IN = 2

/** Runs one ambience card: a constant loop, or a one-shot repeated at random intervals. */
class AmbienceTrack {
  private voices = new Set<Voice>()
  private timer: number | null = null
  private nextAt: number | null = null
  private waitMs = 0
  private running = false

  constructor(
    private card: Card,
    private factory: VoiceFactory,
    private output: AudioNode,
    private lookup: SoundLookup,
    private onChange: () => void,
  ) {}

  get state(): AmbienceCardState {
    return { sounding: this.voices.size > 0, nextAt: this.nextAt, waitMs: this.waitMs }
  }

  get id() {
    return this.card.id
  }

  update(card: Card) {
    const restart = card.mode !== this.card.mode || card.soundId !== this.card.soundId
    this.card = card
    for (const v of this.voices) v.setVolume(card.volume)
    if (!card.enabled) this.stop(1.5)
    else if (restart || !this.running) {
      this.stop(1)
      this.start()
    }
  }

  start() {
    if (!this.card.enabled || this.running) return
    this.running = true
    if (this.card.mode === 'interval') this.scheduleNext()
    else void this.playLoop()
  }

  /** Fires an interval sound immediately and restarts its countdown. */
  triggerNow() {
    this.clearTimer()
    void this.playBurst()
  }

  stop(fadeSeconds = 0) {
    this.running = false
    this.clearTimer()
    for (const v of this.voices) void v.stop(fadeSeconds)
    this.onChange()
  }

  private scheduleNext() {
    const [min, max] = this.card.intervalMs ?? [30_000, 60_000]
    const delay = randomInRange([min, max])
    this.nextAt = Date.now() + delay
    this.waitMs = delay
    this.timer = window.setTimeout(() => void this.playBurst(), delay)
    this.onChange()
  }

  private async playBurst() {
    this.nextAt = null
    const count = randomIntInRange(this.card.times ?? [1, 1])
    for (let i = 0; i < count && this.running; i++) await this.playOnce(false, 0)
    if (this.running) this.scheduleNext()
  }

  /** A loop only ends early if it couldn't be played, so keep trying until it can. */
  private async playLoop(failures = 0) {
    const played = await this.playOnce(true, LOOP_FADE_IN)
    if (played || !this.running) return
    this.timer = window.setTimeout(() => void this.playLoop(failures + 1), retryDelayMs(failures))
  }

  /** Resolves when the sound ends: false if it couldn't be loaded or played. */
  private async playOnce(loop: boolean, fadeIn: number): Promise<boolean> {
    const sound = this.card.soundId ? this.lookup(this.card.soundId) : undefined
    if (!sound) return true
    let voice: Voice
    try {
      voice = await createVoice(this.factory, sound, this.output, {
        volume: this.card.volume,
        loop,
        fadeIn,
      })
    } catch {
      return false
    }
    if (!this.running) {
      void voice.stop()
      return true
    }
    this.voices.add(voice)
    this.onChange()
    return new Promise<boolean>((resolve) =>
      voice.onEnded(() => {
        this.voices.delete(voice)
        this.onChange()
        resolve(!voice.failed)
      }),
    )
  }

  private clearTimer() {
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
    this.nextAt = null
  }
}

export class AmbienceLayer {
  private tracks = new Map<string, AmbienceTrack>()
  private started = false

  constructor(
    private factory: VoiceFactory,
    private output: AudioNode,
    private lookup: SoundLookup,
    private onChange: (state: Record<string, AmbienceCardState>) => void,
  ) {}

  setCards(cards: Card[]) {
    const ids = new Set(cards.map((c) => c.id))
    for (const [id, track] of this.tracks) {
      if (!ids.has(id)) {
        track.stop(1)
        this.tracks.delete(id)
      }
    }
    for (const card of cards) {
      const track = this.tracks.get(card.id)
      if (track) {
        if (this.started) track.update(card)
        continue
      }
      const created = new AmbienceTrack(card, this.factory, this.output, this.lookup, () =>
        this.emit(),
      )
      this.tracks.set(card.id, created)
      if (this.started) created.start()
    }
    this.emit()
  }

  start() {
    this.started = true
    for (const t of this.tracks.values()) t.start()
  }

  trigger(cardId: string) {
    this.tracks.get(cardId)?.triggerNow()
  }

  stop(fadeSeconds = 0) {
    this.started = false
    for (const t of this.tracks.values()) t.stop(fadeSeconds)
  }

  private emit() {
    this.onChange(Object.fromEntries([...this.tracks].map(([id, t]) => [id, t.state])))
  }
}
