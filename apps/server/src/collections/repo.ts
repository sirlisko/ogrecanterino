import type { Collection, CollectionInput } from '@ogre/shared'
import { asc, eq, inArray, or } from 'drizzle-orm'
import type { User } from '../auth/session.ts'
import type { Db } from '../db/client.ts'
import { collectionScenes, collections, scenes, users } from '../db/schema.ts'
import { httpError } from '../http/auth.ts'

type Row = typeof collections.$inferSelect

const visibleTo = (user: User) =>
  or(eq(collections.ownerId, user.id), eq(collections.visibility, 'group'))

function sceneIdsByCollection(db: Db, ids: string[]) {
  const byId = new Map<string, string[]>(ids.map((id) => [id, []]))
  if (!ids.length) return byId
  const rows = db
    .select()
    .from(collectionScenes)
    .where(inArray(collectionScenes.collectionId, ids))
    .orderBy(asc(collectionScenes.position))
    .all()
  for (const r of rows) byId.get(r.collectionId)?.push(r.sceneId)
  return byId
}

function toCollection({ createdAt: _, ...row }: Row, ownerName: string, sceneIds: string[]) {
  return { ...row, ownerName, sceneIds } satisfies Collection
}

export function listCollections(db: Db, user: User): Collection[] {
  const rows = db
    .select({ collection: collections, ownerName: users.name })
    .from(collections)
    .innerJoin(users, eq(users.id, collections.ownerId))
    .where(visibleTo(user))
    .orderBy(collections.name)
    .all()
  const sceneIds = sceneIdsByCollection(
    db,
    rows.map((r) => r.collection.id),
  )
  return rows.map((r) =>
    toCollection(r.collection, r.ownerName, sceneIds.get(r.collection.id) ?? []),
  )
}

export function getCollection(db: Db, user: User, id: string): Collection {
  const row = db
    .select({ collection: collections, ownerName: users.name })
    .from(collections)
    .innerJoin(users, eq(users.id, collections.ownerId))
    .where(eq(collections.id, id))
    .get()
  if (!row || (row.collection.ownerId !== user.id && row.collection.visibility !== 'group'))
    throw httpError(404, 'Collection not found')
  return toCollection(row.collection, row.ownerName, sceneIdsByCollection(db, [id]).get(id) ?? [])
}

/** Writes the collection and its ordered scenes, skipping scene ids that don't exist. */
export function saveCollection(
  db: Db,
  input: CollectionInput,
  target: { id: string } | { ownerId: string },
): string {
  const { sceneIds, ...fields } = input
  const unique = [...new Set(sceneIds)]
  return db.transaction((tx) => {
    const id =
      'id' in target
        ? tx.update(collections).set(fields).where(eq(collections.id, target.id)).returning().get()
            .id
        : tx
            .insert(collections)
            .values({ ...fields, ownerId: target.ownerId })
            .returning()
            .get().id
    const existing = new Set(
      unique.length
        ? tx
            .select({ id: scenes.id })
            .from(scenes)
            .where(inArray(scenes.id, unique))
            .all()
            .map((s) => s.id)
        : [],
    )
    tx.delete(collectionScenes).where(eq(collectionScenes.collectionId, id)).run()
    const rows = unique
      .filter((s) => existing.has(s))
      .map((sceneId, position) => ({ collectionId: id, sceneId, position }))
    if (rows.length) tx.insert(collectionScenes).values(rows).run()
    return id
  })
}
