import type { Card, Scene } from '@ogre/shared'
import { AmbienceLayer, type AmbienceCardState } from './ambience.ts'
import { EffectBoard } from './effects.ts'
import type { Mixer } from './mixer.ts'
import { MusicDeck, type MusicState } from './music.ts'
import { preload, type SoundLookup, type VoiceFactory } from './sources.ts'
import { rampTo, toGain } from './volume.ts'

export interface PlaybackListener {
  music(state: MusicState): void
  ambience(state: Record<string, AmbienceCardState>): void
}

const MUSIC_CROSSFADE_SECONDS = 4

/** Everything one scene is playing, behind per-scene gains so whole scenes can crossfade. */
export class ScenePlayback {
  readonly music: MusicDeck
  readonly ambience: AmbienceLayer
  readonly effects: EffectBoard
  private gains: GainNode[]
  private savedMusic: Card[] | null = null
  private scene: Scene

  constructor(
    scene: Scene,
    private mixer: Mixer,
    private factory: VoiceFactory,
    private lookup: SoundLookup,
    listener: PlaybackListener,
  ) {
    this.scene = scene
    const gain = (bus: AudioNode) => {
      const g = mixer.ctx.createGain()
      g.gain.value = 0
      g.connect(bus)
      return g
    }
    const [music, amb, fx] = [
      gain(mixer.buses.music),
      gain(mixer.buses.ambience),
      gain(mixer.buses.effect),
    ]
    this.gains = [music, amb, fx]
    this.music = new MusicDeck(factory, music, lookup, musicOptions(scene), listener.music)
    this.ambience = new AmbienceLayer(factory, amb, lookup, listener.ambience)
    this.effects = new EffectBoard(factory, fx)
    this.update(scene)
  }

  get sceneId() {
    return this.scene.id
  }

  get combatActive() {
    return this.savedMusic !== null
  }

  update(scene: Scene) {
    this.scene = scene
    if (!this.savedMusic) this.music.setCards(scene.data.music)
    this.music.setOptions(musicOptions(scene))
    this.ambience.setCards(scene.data.ambiences)
    for (const card of scene.data.effects) {
      const sound = card.soundId ? this.lookup(card.soundId) : undefined
      if (sound) preload(this.factory, sound)
    }
    for (const g of this.gains) rampTo(g.gain, toGain(scene.data.globalVolume), 0.1, this.mixer.ctx)
  }

  start(fadeSeconds: number) {
    for (const g of this.gains) {
      g.gain.value = 0
      rampTo(g.gain, toGain(this.scene.data.globalVolume), fadeSeconds, this.mixer.ctx)
    }
    this.ambience.start()
    if (this.scene.data.settings.autoStartMusic) this.music.play()
  }

  async stop(fadeSeconds: number) {
    for (const g of this.gains) rampTo(g.gain, 0, fadeSeconds, this.mixer.ctx)
    await new Promise((r) => setTimeout(r, fadeSeconds * 1000))
    this.ambience.stop()
    this.effects.stopAll(0)
    await this.music.stop()
    for (const g of this.gains) g.disconnect()
  }

  fireEffect(card: Card) {
    const sound = card.soundId ? this.lookup(card.soundId) : undefined
    return sound && card.enabled ? this.effects.fire(sound, card.volume) : undefined
  }

  /** Crossfades the music to another scene's playlist; call again with null to return. */
  swapMusic(cards: Card[] | null) {
    if (cards && !this.savedMusic) this.savedMusic = this.scene.data.music
    const next = cards ?? this.savedMusic ?? this.scene.data.music
    if (!cards) this.savedMusic = null
    this.music.setCards(next)
    const first = next.find((c) => c.enabled && c.soundId)
    if (first) this.music.playCard(first.id, 2)
  }
}

function musicOptions(scene: Scene) {
  const s = scene.data.settings
  return {
    crossfadeSeconds: s.musicCrossfade ? MUSIC_CROSSFADE_SECONDS : 0.3,
    mode: s.shuffle ? ('shuffle' as const) : ('sequential' as const),
    autoAdvance: s.musicIsPlaylist,
  }
}
