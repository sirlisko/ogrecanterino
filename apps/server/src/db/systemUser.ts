import { eq } from 'drizzle-orm'
import type { Db } from './client.ts'
import { users } from './schema.ts'

const SYSTEM_DISCORD_ID = 'system'

/** Owner of the shared template scenes, so they survive any real GM leaving. */
export function ensureSystemUser(db: Db): string {
  const existing = db.select().from(users).where(eq(users.discordId, SYSTEM_DISCORD_ID)).get()
  if (existing) return existing.id
  return db
    .insert(users)
    .values({ discordId: SYSTEM_DISCORD_ID, name: 'Templates', role: 'admin' })
    .returning()
    .get().id
}
