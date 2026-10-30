import { randomBytes } from 'node:crypto'
import { buildApp } from './app.ts'
import { config } from './config.ts'
import { openDb } from './db/client.ts'
import { DiscordBot } from './discord/bot.ts'
import { discordRoutes } from './discord/routes.ts'
import { VoiceSessions } from './discord/voiceSessions.ts'

const sessionSecret = config.SESSION_SECRET ?? randomBytes(32).toString('hex')
if (!config.SESSION_SECRET) console.warn('SESSION_SECRET not set: sessions will reset on restart')

const db = openDb(config.dbPath)

const bot = config.DISCORD_BOT_TOKEN ? new DiscordBot(config.ALLOWED_GUILD_IDS) : null
const sessions = bot ? new VoiceSessions(bot) : null
if (bot && config.DISCORD_BOT_TOKEN) {
  await bot
    .login(config.DISCORD_BOT_TOKEN)
    .catch((e) => console.error('Discord bot login failed:', e))
}

const app = await buildApp({
  db,
  audioDir: config.audioDir,
  bannerDir: config.bannerDir,
  sessionSecret,
  webDist: config.WEB_DIST,
  extraRoutes: discordRoutes(bot, sessions),
  logger: true,
})
await app.listen({ port: config.PORT, host: config.HOST })

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    sessions?.destroyAll()
    await bot?.destroy()
    await app.close()
    process.exit(0)
  })
}
