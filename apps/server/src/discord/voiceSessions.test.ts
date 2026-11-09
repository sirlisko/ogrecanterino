import { EventEmitter } from 'node:events'
import type { Readable } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiscordBot } from './bot.ts'
import { VoiceSessions } from './voiceSessions.ts'

class FakeConnection extends EventEmitter {
  state = { status: 'ready' }
  subscribe = vi.fn()
  destroy = vi.fn(() => {
    this.state = { status: 'destroyed' }
  })
}

class FakePlayer extends EventEmitter {
  state = { status: 'idle' }
  play = vi.fn()
  stop = vi.fn()
}

const voice = vi.hoisted(() => ({
  connection: null as unknown,
  player: null as unknown,
  played: null as unknown,
}))

vi.mock('@discordjs/voice', () => ({
  AudioPlayerStatus: { Idle: 'idle' },
  NoSubscriberBehavior: { Play: 'play' },
  StreamType: { Opus: 'opus' },
  VoiceConnectionStatus: {
    Ready: 'ready',
    Destroyed: 'destroyed',
    Disconnected: 'disconnected',
    Signalling: 'signalling',
    Connecting: 'connecting',
  },
  joinVoiceChannel: () => voice.connection,
  createAudioPlayer: () => voice.player,
  entersState: () => Promise.resolve(),
  createAudioResource: (stream: Readable) => {
    voice.played = stream
    stream.resume()
    return {}
  },
}))

const GUILD = 'guild'
const USER = 'gm'
const tick = () => new Promise((r) => setTimeout(r, 20))

function setup() {
  const client = Object.assign(new EventEmitter(), { user: { id: 'bot' } })
  const channel = { isVoiceBased: () => true, name: 'tavern' }
  const guild = {
    channels: { cache: new Map([['channel', channel]]) },
    voiceAdapterCreator: () => ({}),
  }
  const bot = { client, guild: () => guild } as unknown as DiscordBot
  return new VoiceSessions(bot)
}

describe('VoiceSessions', () => {
  let connection: FakeConnection
  let player: FakePlayer

  beforeEach(() => {
    connection = new FakeConnection()
    player = new FakePlayer()
    voice.connection = connection
    voice.player = player
  })

  it('survives errors from the voice connection and the player', async () => {
    await setup().connect(USER, GUILD, 'channel')
    expect(() => connection.emit('error', new Error('udp socket closed'))).not.toThrow()
    expect(() => player.emit('error', new Error('stream broke'))).not.toThrow()
  })

  it('closes the socket instead of crashing when the browser sends something unreadable', async () => {
    const sessions = setup()
    await sessions.connect(USER, GUILD, 'channel')
    const closeSocket = vi.fn()
    const stream = sessions.openStream(USER, closeSocket)

    stream.write(Buffer.from('this is definitely not a webm stream'))
    await tick()

    expect(closeSocket).toHaveBeenCalledWith(1008, expect.stringContaining('Could not read'))
    expect(() => stream.write(Buffer.from('a late chunk'))).not.toThrow()
  })

  it('tells the old tab when another one takes the stream over', async () => {
    const sessions = setup()
    await sessions.connect(USER, GUILD, 'channel')
    const first = vi.fn()
    sessions.openStream(USER, first)
    sessions.openStream(USER, vi.fn())
    expect(first).toHaveBeenCalledWith(4000, 'Streaming moved to another tab or device')
  })
})
