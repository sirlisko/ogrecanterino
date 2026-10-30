import { rampTo, toGain } from './volume.ts'

export type BusName = 'music' | 'ambience' | 'effect'

/** About -10 dB: music stays audible under a speaking voice. */
const DUCK_GAIN = 0.3

/**
 * Global audio graph: buses → master → (monitor → speakers) and → a MediaStream that
 * the Discord bridge records, so remote players hear exactly the local mix.
 * Previews skip master so auditioning never reaches the table or Discord.
 */
export class Mixer {
  readonly ctx = new AudioContext({ latencyHint: 'playback' })
  readonly master = this.ctx.createGain()
  readonly monitor = this.ctx.createGain()
  readonly stream = this.ctx.createMediaStreamDestination()
  readonly preview = this.ctx.createGain()
  readonly buses: Record<BusName, GainNode>
  /** Sits after the music bus so narration can pull music down without touching its volume. */
  private readonly duck = this.ctx.createGain()

  constructor() {
    this.master.connect(this.monitor).connect(this.ctx.destination)
    this.master.connect(this.stream)
    this.preview.connect(this.ctx.destination)
    this.duck.connect(this.master)
    this.buses = {
      music: this.bus(this.duck),
      ambience: this.bus(),
      effect: this.bus(),
    }
  }

  private bus(output: AudioNode = this.master) {
    const g = this.ctx.createGain()
    g.connect(output)
    return g
  }

  setDucked(on: boolean) {
    rampTo(this.duck.gain, on ? DUCK_GAIN : 1, on ? 0.3 : 0.8, this.ctx)
  }

  setBusVolume(bus: BusName, volume: number) {
    rampTo(this.buses[bus].gain, toGain(volume), 0.05, this.ctx)
  }

  setMasterVolume(volume: number, seconds = 0.05) {
    rampTo(this.master.gain, toGain(volume), seconds, this.ctx)
  }

  setMonitor(on: boolean) {
    rampTo(this.monitor.gain, on ? 1 : 0, 0.1, this.ctx)
  }

  async resume() {
    if (this.ctx.state !== 'running') await this.ctx.resume()
  }
}
