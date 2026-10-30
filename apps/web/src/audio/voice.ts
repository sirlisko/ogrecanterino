import { rampTo, toGain } from './volume.ts'

/** One playing sound with its own gain, regardless of whether it's buffered or streamed. */
export interface Voice {
  readonly gain: GainNode
  setVolume(volume: number, seconds?: number): void
  stop(fadeSeconds?: number): Promise<void>
  onEnded(cb: () => void): void
  /** Seconds played / total; streamed voices only. */
  position(): { current: number; duration: number } | null
}

abstract class BaseVoice implements Voice {
  readonly gain: GainNode
  protected endedCbs: (() => void)[] = []
  protected stopped = false

  constructor(
    protected ctx: AudioContext,
    output: AudioNode,
    volume: number,
    fadeIn: number,
  ) {
    this.gain = ctx.createGain()
    this.gain.gain.value = 0
    this.gain.connect(output)
    rampTo(this.gain.gain, toGain(volume), fadeIn, ctx)
  }

  setVolume(volume: number, seconds = 0.05) {
    if (!this.stopped) rampTo(this.gain.gain, toGain(volume), seconds, this.ctx)
  }

  onEnded(cb: () => void) {
    this.endedCbs.push(cb)
  }

  protected ended() {
    if (this.stopped) return
    this.stopped = true
    this.dispose()
    for (const cb of this.endedCbs) cb()
  }

  async stop(fadeSeconds = 0) {
    if (this.stopped) return
    rampTo(this.gain.gain, 0, fadeSeconds, this.ctx)
    if (fadeSeconds > 0) await new Promise((r) => setTimeout(r, fadeSeconds * 1000))
    this.ended()
  }

  abstract position(): { current: number; duration: number } | null
  protected abstract dispose(): void
}

export class BufferVoice extends BaseVoice {
  private source: AudioBufferSourceNode

  constructor(
    ctx: AudioContext,
    output: AudioNode,
    buffer: AudioBuffer,
    opts: { volume: number; loop?: boolean; fadeIn?: number },
  ) {
    super(ctx, output, opts.volume, opts.fadeIn ?? 0)
    this.source = ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = opts.loop ?? false
    this.source.connect(this.gain)
    this.source.onended = () => this.ended()
    this.source.start()
  }

  position() {
    return null
  }

  protected dispose() {
    this.source.onended = null
    try {
      this.source.stop()
    } catch {
      // already stopped
    }
    this.source.disconnect()
    this.gain.disconnect()
  }
}

/** Streams long files through a media element so they don't have to be fully decoded in memory. */
export class ElementVoice extends BaseVoice {
  private el: HTMLAudioElement
  private node: MediaElementAudioSourceNode

  constructor(
    ctx: AudioContext,
    output: AudioNode,
    url: string,
    opts: { volume: number; loop?: boolean; fadeIn?: number },
  ) {
    super(ctx, output, opts.volume, opts.fadeIn ?? 0)
    this.el = new Audio()
    this.el.preload = 'auto'
    this.el.loop = opts.loop ?? false
    this.el.src = url
    this.node = ctx.createMediaElementSource(this.el)
    this.node.connect(this.gain)
    this.el.onended = () => this.ended()
    this.el.onerror = () => this.ended()
    void this.el.play().catch(() => this.ended())
  }

  get element() {
    return this.el
  }

  position() {
    const duration = this.el.duration
    return { current: this.el.currentTime, duration: Number.isFinite(duration) ? duration : 0 }
  }

  seek(seconds: number) {
    this.el.currentTime = seconds
  }

  get paused() {
    return this.el.paused
  }

  pause() {
    this.el.pause()
  }

  resume() {
    void this.el.play().catch(() => this.ended())
  }

  protected dispose() {
    this.el.onended = null
    this.el.onerror = null
    this.el.pause()
    this.el.removeAttribute('src')
    this.el.load()
    this.node.disconnect()
    this.gain.disconnect()
  }
}
