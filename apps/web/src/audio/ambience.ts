import type { Card } from '@ogre/shared'
import { randomInRange, randomIntInRange } from './schedule.ts'
import { createVoice, type SoundLookup, type VoiceFactory } from './sources.ts'
import type { Voice } from './voice.ts'

export interface AmbienceCardState {
  sounding: boolean
  /** Epoch ms of the next interval trigger, when waiting. */
  nextAt: number | null
}

const LOOP_FADE_IN = 2

/** Runs one ambience card: a constant loop, or a one-shot repeated at random intervals. */
class AmbienceTrack {
  private voices = new Set<Voice>()
  private timer: number | null = null
  private nextAt: number | null = null
  private running = false

  constructor(
    private card: Card,
    private factory: VoiceFactory,
    private output: AudioNode,
    private lookup: SoundLookup,
    private onChange: () => void,
  ) {}

  get state(): AmbienceCardState {
    return { sounding: this.voices.size > 0, nextAt: this.nextAt }
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
    else void this.playOnce(true, LOOP_FADE_IN)
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
    this.timer = window.setTimeout(() => void this.playBurst(), delay)
    this.onChange()
  }

  private async playBurst() {
    this.nextAt = null
    const count = randomIntInRange(this.card.times ?? [1, 1])
    for (let i = 0; i < count && this.running; i++) await this.playOnce(false, 0)
    if (this.running) this.scheduleNext()
  }

  private async playOnce(loop: boolean, fadeIn: number) {
    const sound = this.card.soundId ? this.lookup(this.card.soundId) : undefined
    if (!sound) return
    const voice = await createVoice(this.factory, sound, this.output, {
      volume: this.card.volume,
      loop,
      fadeIn,
    })
    if (!this.running) return void voice.stop()
    this.voices.add(voice)
    this.onChange()
    await new Promise<void>((resolve) =>
      voice.onEnded(() => {
        this.voices.delete(voice)
        this.onChange()
        resolve()
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
