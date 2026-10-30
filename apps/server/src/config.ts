import { resolve } from 'node:path'
import { z } from 'zod'

const csv = z
  .string()
  .default('')
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  )

const env = z
  .object({
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    PUBLIC_URL: z.string().url().default('http://localhost:5173'),
    DATA_DIR: z.string().default('../../data'),
    SESSION_SECRET: z.string().min(32).optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    DISCORD_BOT_TOKEN: z.string().optional(),
    ALLOWED_GUILD_IDS: csv,
    ADMIN_DISCORD_IDS: csv,
    DEV_LOGIN: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    WEB_DIST: z.string().optional(),
  })
  .parse(process.env)

const dataDir = resolve(env.DATA_DIR)

export const config = {
  ...env,
  dataDir,
  dbPath: resolve(dataDir, 'app.db'),
  audioDir: resolve(dataDir, 'audio'),
  bannerDir: resolve(dataDir, 'banners'),
  secure: env.PUBLIC_URL.startsWith('https://'),
}
