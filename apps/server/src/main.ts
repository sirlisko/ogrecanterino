import { randomBytes } from 'node:crypto'
import { buildApp } from './app.ts'
import { config } from './config.ts'
import { openDb } from './db/client.ts'

const sessionSecret = config.SESSION_SECRET ?? randomBytes(32).toString('hex')
if (!config.SESSION_SECRET) console.warn('SESSION_SECRET not set: sessions will reset on restart')

const db = openDb(config.dbPath)
const app = await buildApp({
  db,
  audioDir: config.audioDir,
  bannerDir: config.bannerDir,
  sessionSecret,
  webDist: config.WEB_DIST,
  logger: true,
})
await app.listen({ port: config.PORT, host: config.HOST })
