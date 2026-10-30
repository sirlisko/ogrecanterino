import type { Card, Scene, Sound } from '@ogre/shared'
import { BufferCache } from './buffers.ts'
import { EffectBoard } from './effects.ts'
import { Mixer, type BusName } from './mixer.ts'
import { ScenePlayback } from './scenePlayback.ts'
import { saveVolumes, usePlayer } from './store.ts'
import type { Voice } from './voice.ts'

const FADE_ALL_SECONDS = 1.5

/** Single entry point the UI talks to; owns the audio graph and the active scene. */
class Engine {
  private mixer: Mixer | null = null
  private buffers: BufferCache | null = null
  private sounds = new Map<string, Sound>()
  private playback: ScenePlayback | null = null
  private pads: EffectBoard | null = null
  private previewVoice: Voice | null = null

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

  updateScene(scene: Scene) {
    if (this.playback?.sceneId !== scene.id) return
    this.playback.update(scene)
    usePlayer.setState({ scene })
  }

  async stopScene(fadeSeconds = FADE_ALL_SECONDS) {
    const playback = this.playback
    this.playback = null
    usePlayer.setState({
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

  fireEffect(card: Card) {
    this.playback?.fireEffect(card)
  }

  async firePad(soundId: string) {
    await this.unlock()
    const sound = this.lookup(soundId)
    if (sound) void this.pads?.fire(sound, 100)
  }

  /** Plays one sound at a time for auditioning; resolves when it finishes or is replaced. */
  async preview(soundId: string): Promise<void> {
    await this.unlock()
    await this.previewVoice?.stop(0.15)
    const sound = this.lookup(soundId)
    if (!sound || !this.pads) return
    const voice = await this.pads.fire(sound, 80)
    this.previewVoice = voice
    await new Promise<void>((resolve) => voice.onEnded(resolve))
  }

  stopPreview() {
    void this.previewVoice?.stop(0.15)
    this.previewVoice = null
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

  setCrossfade(seconds: number) {
    usePlayer.setState({ crossfadeSeconds: seconds })
  }
}

export const engine = new Engine()
