import type { Sound } from '@ogre/shared'
import { createVoice, type VoiceFactory } from './sources.ts'
import type { Voice } from './voice.ts'

/** Polyphonic one-shots; the same pad can be fired repeatedly over itself. */
export class EffectBoard {
  private voices = new Set<Voice>()

  constructor(
    private factory: VoiceFactory,
    private output: AudioNode,
  ) {}

  async fire(sound: Sound, volume: number): Promise<Voice> {
    const voice = await createVoice(this.factory, sound, this.output, { volume })
    this.voices.add(voice)
    voice.onEnded(() => this.voices.delete(voice))
    return voice
  }

  stopAll(fadeSeconds = 0.3) {
    for (const v of this.voices) void v.stop(fadeSeconds)
  }
}
