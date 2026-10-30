import type { Card } from '@ogre/shared'
import { nextTrackIndex, previousTrackIndex, type PlaylistMode } from './schedule.ts'
import { soundUrl, type SoundLookup, type VoiceFactory } from './sources.ts'
import { ElementVoice } from './voice.ts'

export interface MusicState {
  playing: boolean
  cardId: string | null
  current: number
  duration: number
}

export interface MusicOptions {
  crossfadeSeconds: number
  mode: PlaylistMode
  /** When false, the current track loops instead of advancing. */
  autoAdvance: boolean
}

/** Two-deck playlist player: the outgoing track fades out while the next fades in. */
export class MusicDeck {
  private cards: Card[] = []
  private index = -1
  private voice: ElementVoice | null = null
  private ticker: number | null = null
  private advancing = false

  constructor(
    private factory: VoiceFactory,
    private output: AudioNode,
    private lookup: SoundLookup,
    private opts: MusicOptions,
    private onChange: (s: MusicState) => void,
  ) {}

  setCards(cards: Card[]) {
    const currentId = this.cards[this.index]?.id
    this.cards = cards.filter((c) => c.enabled && c.soundId && this.lookup(c.soundId))
    this.index = this.cards.findIndex((c) => c.id === currentId)
    const playing = this.cards[this.index]
    if (playing) this.voice?.setVolume(playing.volume)
    this.emit()
  }

  setOptions(opts: Partial<MusicOptions>) {
    this.opts = { ...this.opts, ...opts }
  }

  get state(): MusicState {
    const pos = this.voice?.position()
    return {
      playing: !!this.voice && !this.voice.paused,
      cardId: this.cards[this.index]?.id ?? null,
      current: pos?.current ?? 0,
      duration: pos?.duration ?? 0,
    }
  }

  playCard(cardId: string, fadeSeconds = this.opts.crossfadeSeconds) {
    const i = this.cards.findIndex((c) => c.id === cardId)
    if (i >= 0) this.playIndex(i, fadeSeconds)
  }

  play() {
    if (this.voice?.paused) {
      this.voice.resume()
      this.emit()
    } else if (!this.voice) {
      this.playIndex(Math.max(0, this.index), 1)
    }
  }

  pause() {
    this.voice?.pause()
    this.emit()
  }

  toggle() {
    if (this.state.playing) this.pause()
    else this.play()
  }

  next() {
    this.playIndex(
      nextTrackIndex(
        this.index,
        this.cards.length,
        this.opts.mode === 'repeat-one' ? 'sequential' : this.opts.mode,
      ),
    )
  }

  previous() {
    this.playIndex(previousTrackIndex(this.index, this.cards.length))
  }

  seek(seconds: number) {
    this.voice?.seek(seconds)
  }

  async stop(fadeSeconds = 0) {
    this.stopTicker()
    const voice = this.voice
    this.voice = null
    this.emit()
    await voice?.stop(fadeSeconds)
  }

  private playIndex(i: number, fadeSeconds = this.opts.crossfadeSeconds) {
    const card = this.cards[i]
    const sound = card?.soundId ? this.lookup(card.soundId) : undefined
    if (!card || !sound) return
    const previous = this.voice
    const fade = previous ? fadeSeconds : Math.min(fadeSeconds, 1)
    this.index = i
    this.advancing = false
    void previous?.stop(fade)
    const voice = new ElementVoice(this.factory.ctx, this.output, soundUrl(sound), {
      volume: card.volume,
      fadeIn: fade,
      trimDb: sound.gainDb ?? 0,
      loop: !this.opts.autoAdvance || this.opts.mode === 'repeat-one',
    })
    voice.onEnded(() => {
      if (this.voice === voice) this.advance()
    })
    this.voice = voice
    this.startTicker()
    this.emit()
  }

  private advance() {
    if (this.advancing) return
    this.advancing = true
    const next = nextTrackIndex(this.index, this.cards.length, this.opts.mode)
    if (next < 0) void this.stop()
    else this.playIndex(next)
  }

  private startTicker() {
    if (this.ticker !== null) return
    this.ticker = window.setInterval(() => {
      const pos = this.voice?.position()
      if (pos && this.opts.autoAdvance && this.opts.mode !== 'repeat-one' && pos.duration > 0) {
        const remaining = pos.duration - pos.current
        if (remaining < this.opts.crossfadeSeconds && !this.voice?.paused) this.advance()
      }
      this.emit()
    }, 500)
  }

  private stopTicker() {
    if (this.ticker !== null) window.clearInterval(this.ticker)
    this.ticker = null
  }

  private emit() {
    this.onChange(this.state)
  }
}
