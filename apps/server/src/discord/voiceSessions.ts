import { PassThrough } from 'node:stream'
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  type AudioPlayer,
  type VoiceConnection,
} from '@discordjs/voice'
import prism from 'prism-media'
import { httpError } from '../http/auth.ts'
import type { DiscordBot } from './bot.ts'
import { createLiveBuffer } from './liveBuffer.ts'
import { createOpusRepacketizer } from './opusSplit.ts'

// 300 ms: absorbs the browser's 100 ms chunk bursts plus network jitter.
const MAX_BUFFERED_FRAMES = 15

interface VoiceSession {
  guildId: string
  channelId: string
  channelName: string
  ownerId: string
  connection: VoiceConnection
  player: AudioPlayer
  input: PassThrough | null
}

export interface SessionInfo {
  guildId: string
  channelId: string
  channelName: string
  streaming: boolean
}

/** One voice connection per Discord server (a bot can only be in one channel per server). */
export class VoiceSessions {
  private sessions = new Map<string, VoiceSession>()

  constructor(private bot: DiscordBot) {}

  forUser(userId: string): SessionInfo | null {
    for (const s of this.sessions.values()) {
      if (s.ownerId === userId) {
        return {
          guildId: s.guildId,
          channelId: s.channelId,
          channelName: s.channelName,
          streaming: !!s.input,
        }
      }
    }
    return null
  }

  async connect(userId: string, guildId: string, channelId: string): Promise<SessionInfo> {
    const guild = this.bot.guild(guildId)
    const channel = guild?.channels.cache.get(channelId)
    if (!guild || !channel?.isVoiceBased()) throw httpError(404, 'Voice channel not found')
    const existing = this.sessions.get(guildId)
    if (existing && existing.ownerId !== userId)
      throw httpError(409, 'Another GM is already using the bot in this server')
    const mine = this.forUser(userId)
    if (mine && mine.guildId !== guildId) this.disconnect(userId)

    const connection = joinVoiceChannel({
      guildId,
      channelId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    })
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000)
    } catch {
      connection.destroy()
      throw httpError(
        504,
        'Could not join the voice channel. Check the bot has Connect and Speak permissions.',
      )
    }
    const player =
      existing?.player ??
      createAudioPlayer({
        // A live stream briefly runs dry between chunks; play silence rather than stopping.
        behaviors: { noSubscriber: NoSubscriberBehavior.Play, maxMissedFrames: Infinity },
      })
    connection.subscribe(player)
    connection.on(VoiceConnectionStatus.Disconnected, () => {
      // Recover from channel moves; give up if the bot was kicked.
      Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]).catch(() => this.cleanup(guildId, connection))
    })
    this.sessions.set(guildId, {
      guildId,
      channelId,
      channelName: channel.name,
      ownerId: userId,
      connection,
      player,
      input: existing?.input ?? null,
    })
    return this.forUser(userId) as SessionInfo
  }

  disconnect(userId: string) {
    for (const s of this.sessions.values())
      if (s.ownerId === userId) this.cleanup(s.guildId, s.connection)
  }

  /** Starts a fresh WebM/Opus stream from the browser; returns a writer for incoming chunks. */
  openStream(userId: string) {
    const session = [...this.sessions.values()].find((s) => s.ownerId === userId)
    if (!session) throw httpError(409, 'Connect to a voice channel first')
    session.input?.end()
    const input = new PassThrough()
    session.input = input
    // The browser already sends Opus: demux the WebM and re-pack it into 20 ms packets, no re-encoding.
    const packets = input
      .pipe(new prism.opus.WebmDemuxer())
      .pipe(createOpusRepacketizer())
      .pipe(createLiveBuffer(MAX_BUFFERED_FRAMES))
    session.player.play(createAudioResource(packets, { inputType: StreamType.Opus }))
    return {
      write: (chunk: Buffer) => input.write(chunk),
      close: () => {
        input.end()
        if (session.input === input) {
          session.input = null
          if (session.player.state.status !== AudioPlayerStatus.Idle) session.player.stop()
        }
      },
    }
  }

  destroyAll() {
    for (const s of this.sessions.values()) this.cleanup(s.guildId, s.connection)
  }

  private cleanup(guildId: string, connection: VoiceConnection) {
    const s = this.sessions.get(guildId)
    if (s?.connection !== connection) return
    s.input?.end()
    s.player.stop()
    if (connection.state.status !== VoiceConnectionStatus.Destroyed) connection.destroy()
    this.sessions.delete(guildId)
  }
}
