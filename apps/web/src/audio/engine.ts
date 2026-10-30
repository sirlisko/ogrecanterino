import type { Card, Scene, SceneSection, Sound } from '@ogre/shared'
import { BufferCache } from './buffers.ts'
import { EffectBoard } from './effects.ts'
import { Mixer, type BusName } from './mixer.ts'
import { ScenePlayback } from './scenePlayback.ts'
import { createVoice } from './sources.ts'
import { saveVolumes, usePlayer } from './store.ts'
import type { Voice } from './voice.ts'

const FADE_ALL_SECONDS = 1.5
/** Effects at least this long stop when triggered again instead of layering. */
export const LONG_EFFECT_MS = 8000
const LIBRARY_PREVIEW_VOLUME = 80

/** Where a preview would play in a scene, so auditioning matches playback loudness. */
export interface PreviewLevel {
  bus: BusName
  volume: number
}

const SECTION_BUS: Record<SceneSection, BusName> = {
  music: 'music',
  ambiences: 'ambience',
  effects: 'effect',
}

export function previewLevel(card: Card, section: SceneSection, sceneVolume = 100): PreviewLevel {
  // Gains are squared, so multiplying the 0–100 volumes multiplies the gains too.
  return { bus: SECTION_BUS[section], volume: (card.volume * sceneVolume) / 100 }
}

/** Single entry point the UI talks to; owns the audio graph and the active scene. */
class Engine {
  private mixer: Mixer | null = null
  private buffers: BufferCache | null = null
  private sounds = new Map<string, Sound>()
  private playback: ScenePlayback | null = null
  private pads: EffectBoard | null = null
  private previewVoice: Voice | null = null
  private effectVoices = new Map<string, { voices: Set<Voice>; startedAt: number }>()

  readonly lookup = (id: string) => this.sounds.get(id)

  setSounds(sounds: Sound[]) {
    this.sounds = new Map(sounds.map((s) => [s.id, s]))
  }

  /** Must run inside a user gesture the first time (browser autoplay policy). */
  async unlock(): Promise<Mixer> {
    if (!this.mixer) {
      this.mixer = new Mixer()
      this.buffers = new BufferCache(this.mixer.ctx)
      this.pads = new EffectBoard(this.factory(), this.mixer.buses.effect)
      const { volumes, monitor } = usePlayer.getState()
      this.mixer.setMasterVolume(volumes.master, 0)
      for (const bus of ['music', 'ambience', 'effect'] as const)
        this.mixer.setBusVolume(bus, volumes[bus])
      this.mixer.setMonitor(monitor)
    }
    await this.mixer.resume()
    usePlayer.setState({ unlocked: true })
    return this.mixer
  }

  get outputStream(): MediaStream | null {
    return this.mixer?.stream.stream ?? null
  }

  private factory() {
    if (!this.mixer || !this.buffers) throw new Error('Audio engine not unlocked')
    return { ctx: this.mixer.ctx, buffers: this.buffers }
  }

  async playScene(scene: Scene) {
    const mixer = await this.unlock()
    if (this.playback?.sceneId === scene.id) return
    this.stopPreview()
    usePlayer.setState({ faded: null })
    const fade = usePlayer.getState().crossfadeSeconds
    const previous = this.playback
    // Declared first because the playback emits state while it's still being constructed.
    let playback: ScenePlayback | undefined
    playback = new ScenePlayback(scene, mixer, this.factory(), this.lookup, {
      music: (music) => this.playback === playback && usePlayer.setState({ music }),
      ambience: (ambience) => this.playback === playback && usePlayer.setState({ ambience }),
    })
    this.playback = playback
    usePlayer.setState({ sceneId: scene.id, scene, combat: false, ambience: {} })
    playback.start(previous ? fade : 1)
    await previous?.stop(fade)
  }

  async resumeFaded() {
    const faded = usePlayer.getState().faded
    if (!faded) return
    await this.playScene(faded.scene)
    if (faded.cardId) this.music?.playCard(faded.cardId, 1)
  }

  dismissFaded() {
    usePlayer.setState({ faded: null })
  }

  updateScene(scene: Scene) {
    if (this.playback?.sceneId !== scene.id) return
    this.playback.update(scene)
    usePlayer.setState({ scene })
  }

  async stopScene(fadeSeconds = FADE_ALL_SECONDS) {
    const playback = this.playback
    this.playback = null
    const { scene, music, combat } = usePlayer.getState()
    usePlayer.setState({
      faded: scene ? { scene, cardId: combat ? null : music.cardId } : null,
      sceneId: null,
      scene: null,
      combat: false,
      ambience: {},
      music: { playing: false, cardId: null, current: 0, duration: 0 },
    })
    this.pads?.stopAll(fadeSeconds)
    await playback?.stop(fadeSeconds)
  }

  get music() {
    return this.playback?.music ?? null
  }

  triggerAmbience(cardId: string) {
    this.playback?.ambience.trigger(cardId)
  }

  isLongEffect(card: Card) {
    const ms = card.soundId ? this.lookup(card.soundId)?.durationMs : null
    return !!ms && ms >= LONG_EFFECT_MS
  }

  /** Fires an effect, or stops it if it's a long one that's still playing. */
  async triggerEffect(card: Card) {
    const playing = this.effectVoices.get(card.id)
    if (playing && this.isLongEffect(card)) {
      for (const v of playing.voices) void v.stop(0.3)
      return
    }
    const voice = await this.playback?.fireEffect(card)
    if (!voice) return
    const entry = this.effectVoices.get(card.id) ?? { voices: new Set<Voice>(), startedAt: 0 }
    entry.voices.add(voice)
    entry.startedAt = Date.now()
    this.effectVoices.set(card.id, entry)
    this.publishEffects()
    voice.onEnded(() => {
      entry.voices.delete(voice)
      if (!entry.voices.size && this.effectVoices.get(card.id) === entry)
        this.effectVoices.delete(card.id)
      this.publishEffects()
    })
  }

  private publishEffects() {
    usePlayer.setState({
      effects: Object.fromEntries([...this.effectVoices].map(([id, e]) => [id, e.startedAt])),
    })
  }

  async firePad(soundId: string) {
    await this.unlock()
    const sound = this.lookup(soundId)
    if (sound) void this.pads?.fire(sound, 100)
  }

  /** Plays one sound at a time on this device only; resolves when it finishes or is replaced. */
  async preview(soundId: string, level?: PreviewLevel): Promise<void> {
    const mixer = await this.unlock()
    await this.previewVoice?.stop(0.15)
    const sound = this.lookup(soundId)
    if (!sound) return
    usePlayer.setState({ previewId: soundId })
    const output = level ? mixer.previewBuses[level.bus] : mixer.preview
    const volume = level?.volume ?? LIBRARY_PREVIEW_VOLUME
    const voice = await createVoice(this.factory(), sound, output, { volume })
    this.previewVoice = voice
    await new Promise<void>((resolve) => voice.onEnded(resolve))
    if (this.previewVoice === voice) {
      this.previewVoice = null
      usePlayer.setState({ previewId: null })
    }
  }

  togglePreview(soundId: string, level?: PreviewLevel) {
    if (usePlayer.getState().previewId === soundId) this.stopPreview()
    else void this.preview(soundId, level)
  }

  /** Follows a card's fader while it previews; ignored if another sound took over. */
  setPreviewVolume(soundId: string, level: PreviewLevel) {
    if (usePlayer.getState().previewId === soundId) this.previewVoice?.setVolume(level.volume)
  }

  stopPreview() {
    void this.previewVoice?.stop(0.15)
    this.previewVoice = null
    usePlayer.setState({ previewId: null })
  }

  toggleCombat(combat: Scene | null) {
    if (!this.playback) return
    const active = !this.playback.combatActive
    if (active && !combat) return
    this.playback.swapMusic(active && combat ? combat.data.music : null)
    usePlayer.setState({ combat: active })
  }

  setVolume(bus: BusName | 'master', volume: number) {
    const volumes = { ...usePlayer.getState().volumes, [bus]: volume }
    usePlayer.setState({ volumes })
    saveVolumes(volumes)
    if (bus === 'master') this.mixer?.setMasterVolume(volume)
    else this.mixer?.setBusVolume(bus, volume)
  }

  setMonitor(on: boolean) {
    usePlayer.setState({ monitor: on })
    this.mixer?.setMonitor(on)
  }

  setDucked(on: boolean) {
    if (usePlayer.getState().ducked === on) return
    usePlayer.setState({ ducked: on })
    this.mixer?.setDucked(on)
  }

  setCrossfade(seconds: number) {
    usePlayer.setState({ crossfadeSeconds: seconds })
  }
}

export const engine = new Engine()
