import type { Sound } from '@ogre/shared'
import type { BufferCache } from './buffers.ts'
import { BufferVoice, ElementVoice, type Voice } from './voice.ts'

/** Below this length a sound is decoded up front: gapless loops and instant effects. */
const BUFFER_MAX_MS = 90_000

export type SoundLookup = (id: string) => Sound | undefined

export function soundUrl(sound: Pick<Sound, 'filename'>) {
  return `/audio/${encodeURIComponent(sound.filename)}`
}

export function shouldBuffer(sound: Sound) {
  return sound.durationMs !== null && sound.durationMs < BUFFER_MAX_MS
}

export interface VoiceFactory {
  ctx: AudioContext
  buffers: BufferCache
}

export async function createVoice(
  { ctx, buffers }: VoiceFactory,
  sound: Sound,
  output: AudioNode,
  opts: { volume: number; loop?: boolean; fadeIn?: number },
): Promise<Voice> {
  if (shouldBuffer(sound))
    return new BufferVoice(ctx, output, await buffers.get(soundUrl(sound)), opts)
  return new ElementVoice(ctx, output, soundUrl(sound), opts)
}

export function preload({ buffers }: VoiceFactory, sound: Sound) {
  if (shouldBuffer(sound)) void buffers.get(soundUrl(sound)).catch(() => undefined)
}
