import { rampTo, toGain } from './volume.ts'

export type BusName = 'music' | 'ambience' | 'effect'
export type MeterName = BusName | 'master'

/** About -10 dB: music stays audible under a speaking voice. */
const DUCK_GAIN = 0.3

/**
 * Global audio graph: buses → master → (monitor → speakers) and → a MediaStream that
 * the Discord bridge records, so remote players hear exactly the local mix.
 * Previews mirror the master and bus volumes on a parallel path that skips the stream,
 * so auditioning sounds as loud as playback but never reaches Discord.
 */
export class Mixer {
  readonly ctx = new AudioContext({ latencyHint: 'playback' })
  readonly master = this.ctx.createGain()
  readonly monitor = this.ctx.createGain()
  readonly stream = this.ctx.createMediaStreamDestination()
  readonly preview = this.ctx.createGain()
  readonly buses: Record<BusName, GainNode>
  readonly previewBuses: Record<BusName, GainNode>
  /** Sits after the music bus so narration can pull music down without touching its volume. */
  private readonly duck = this.ctx.createGain()
  private readonly meters: Record<MeterName, AnalyserNode>
  private readonly samples = new Float32Array(1024)

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
    this.previewBuses = {
      music: this.bus(this.preview),
      ambience: this.bus(this.preview),
      effect: this.bus(this.preview),
    }
    // Music is metered after the duck, so the meter shows what actually reaches master.
    this.meters = {
      master: this.meter(this.master),
      music: this.meter(this.duck),
      ambience: this.meter(this.buses.ambience),
      effect: this.meter(this.buses.effect),
    }
  }

  private meter(source: AudioNode) {
    const analyser = this.ctx.createAnalyser()
    analyser.fftSize = this.samples.length
    source.connect(analyser)
    return analyser
  }

  /** Current peak of a channel, as linear amplitude. */
  peak(name: MeterName): number {
    this.meters[name].getFloatTimeDomainData(this.samples)
    let max = 0
    for (const s of this.samples) max = Math.max(max, Math.abs(s))
    return max
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
    rampTo(this.previewBuses[bus].gain, toGain(volume), 0.05, this.ctx)
  }

  setMasterVolume(volume: number, seconds = 0.05) {
    rampTo(this.master.gain, toGain(volume), seconds, this.ctx)
    rampTo(this.preview.gain, toGain(volume), seconds, this.ctx)
  }

  setMonitor(on: boolean) {
    rampTo(this.monitor.gain, on ? 1 : 0, 0.1, this.ctx)
  }

  async resume() {
    if (this.ctx.state !== 'running') await this.ctx.resume()
  }
}
