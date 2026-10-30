import { rampTo, toGain } from './volume.ts'

export type BusName = 'music' | 'ambience' | 'effect'

/**
 * Global audio graph: buses → master → (monitor → speakers) and → a MediaStream that
 * the Discord bridge records, so remote players hear exactly the local mix.
 */
export class Mixer {
  readonly ctx = new AudioContext({ latencyHint: 'playback' })
  readonly master = this.ctx.createGain()
  readonly monitor = this.ctx.createGain()
  readonly stream = this.ctx.createMediaStreamDestination()
  readonly buses: Record<BusName, GainNode>

  constructor() {
    this.master.connect(this.monitor).connect(this.ctx.destination)
    this.master.connect(this.stream)
    this.buses = {
      music: this.bus(),
      ambience: this.bus(),
      effect: this.bus(),
    }
  }

  private bus() {
    const g = this.ctx.createGain()
    g.connect(this.master)
    return g
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
