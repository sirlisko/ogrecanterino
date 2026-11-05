import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildApp } from '../app.ts'
import { openDb } from '../db/client.ts'
import type { DiscordBot } from './bot.ts'
import { discordRoutes } from './routes.ts'
import type { VoiceSessions } from './voiceSessions.ts'

async function setup(sessions: VoiceSessions) {
  const bot = { isReady: true, inviteUrl: null } as unknown as DiscordBot
  const dir = mkdtempSync(join(tmpdir(), 'ogre-'))
  const app = await buildApp({
    db: openDb(':memory:'),
    audioDir: join(dir, 'audio'),
    bannerDir: join(dir, 'banners'),
    sessionSecret: 'x'.repeat(32),
    extraRoutes: discordRoutes(bot, sessions),
  })
  await app.ready()
  const login = await app.inject({ method: 'POST', url: '/auth/dev-login' })
  const cookie = String(login.headers['set-cookie']).split(';')[0] ?? ''
  return { app, cookie }
}

describe('discord stream route', () => {
  it('forwards binary chunks from the browser into the voice session', async () => {
    const received: Buffer[] = []
    let closed: boolean | null = null
    const sessions = {
      forUser: () => null,
      openStream: () => ({
        write: (b: Buffer) => received.push(b),
        close: (abandoned: boolean) => (closed = abandoned),
      }),
    } as unknown as VoiceSessions
    const { app, cookie } = await setup(sessions)

    expect(
      (await app.inject({ url: '/api/discord/status', headers: { cookie } })).json(),
    ).toMatchObject({
      configured: true,
      ready: true,
    })

    const ws = await app.injectWS('/api/discord/stream', { headers: { cookie } })
    ws.send(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    ws.send(Buffer.from([1, 2, 3]))
    await new Promise((r) => setTimeout(r, 50))
    ws.terminate()
    await new Promise((r) => setTimeout(r, 50))

    expect(Buffer.concat(received)).toEqual(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3]))
    expect(closed).toBe(true) // terminated without a 1000 close
    await app.close()
  })

  it('closes the socket with a reason when another tab takes the stream over', async () => {
    let evict: (() => void) | null = null
    const sessions = {
      forUser: () => null,
      openStream: (_: string, onEvict: () => void) => {
        evict = onEvict
        return { write: () => undefined, close: () => undefined }
      },
    } as unknown as VoiceSessions
    const { app, cookie } = await setup(sessions)

    const ws = await app.injectWS('/api/discord/stream', { headers: { cookie } })
    const closed = new Promise<[number, string]>((r) =>
      ws.on('close', (code, reason) => r([code, reason.toString()])),
    )
    evict!()

    expect(await closed).toEqual([4000, 'Streaming moved to another tab or device'])
    await app.close()
  })

  it('closes with its own code when the bot is no longer in a channel, so the browser can rejoin', async () => {
    const sessions = {
      forUser: () => null,
      openStream: () => {
        throw Object.assign(new Error('Connect to a voice channel first'), { statusCode: 409 })
      },
    } as unknown as VoiceSessions
    const { app, cookie } = await setup(sessions)

    const ws = await app.injectWS('/api/discord/stream', { headers: { cookie } })
    const closed = new Promise<[number, string]>((r) =>
      ws.on('close', (code, reason) => r([code, reason.toString()])),
    )

    expect(await closed).toEqual([4001, 'Connect to a voice channel first'])
    await app.close()
  })
})
