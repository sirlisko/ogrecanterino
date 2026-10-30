import type { Scene } from '@ogre/shared'
import { eq, or } from 'drizzle-orm'
import type { User } from '../auth/session.ts'
import type { Db } from '../db/client.ts'
import { scenes, users } from '../db/schema.ts'
import { httpError } from '../http/auth.ts'

type Row = typeof scenes.$inferSelect

export function toScene(row: Row, ownerName: string): Scene {
  return { ...row, ownerName }
}

const visibleTo = (user: User) => or(eq(scenes.ownerId, user.id), eq(scenes.visibility, 'group'))

export function listScenes(db: Db, user: User): Scene[] {
  return db
    .select({ scene: scenes, ownerName: users.name })
    .from(scenes)
    .innerJoin(users, eq(users.id, scenes.ownerId))
    .where(visibleTo(user))
    .orderBy(scenes.name)
    .all()
    .map((r) => toScene(r.scene, r.ownerName))
}

export function getVisibleScene(db: Db, user: User, id: string): Row {
  const row = db.select().from(scenes).where(eq(scenes.id, id)).get()
  if (!row || (row.ownerId !== user.id && row.visibility !== 'group'))
    throw httpError(404, 'Scene not found')
  return row
}

export function ownerName(db: Db, ownerId: string): string {
  return db.select({ name: users.name }).from(users).where(eq(users.id, ownerId)).get()?.name ?? ''
}
