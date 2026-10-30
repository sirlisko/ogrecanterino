import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildApp } from '../app.ts'
import { openDb } from '../db/client.ts'
import type { DiscordBot } from './bot.ts'
import { discordRoutes } from './routes.ts'
import type { VoiceSessions } from './voiceSessions.ts'

describe('discord stream route', () => {
  it('forwards binary chunks from the browser into the voice session', async () => {
    const received: Buffer[] = []
    let closed = false
    const sessions = {
      forUser: () => null,
      openStream: () => ({ write: (b: Buffer) => received.push(b), close: () => (closed = true) }),
    } as unknown as VoiceSessions
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
    expect(closed).toBe(true)
    await app.close()
  })
})
