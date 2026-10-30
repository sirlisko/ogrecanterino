import { pad } from '@ogre/shared'
import { and, desc, eq, notInArray } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Db } from '../db/client.ts'
import { favourites, pads, plays } from '../db/schema.ts'
import { authed } from '../http/auth.ts'
import { parseBody } from '../http/body.ts'

const RECENT_LIMIT = 30

type SoundParams = { Params: { soundId: string } }

export async function meRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get('/api/me', async (req) => {
    const { id, name, avatarUrl, role } = authed(req)
    return { id, name, avatarUrl, role }
  })

  app.get('/api/me/favourites', async (req) => {
    const user = authed(req)
    return db
      .select({ soundId: favourites.soundId })
      .from(favourites)
      .where(eq(favourites.userId, user.id))
      .all()
      .map((f) => f.soundId)
  })

  app.put<SoundParams>('/api/me/favourites/:soundId', async (req, reply) => {
    const user = authed(req)
    db.insert(favourites)
      .values({ userId: user.id, soundId: req.params.soundId })
      .onConflictDoNothing()
      .run()
    return reply.code(204).send()
  })

  app.delete<SoundParams>('/api/me/favourites/:soundId', async (req, reply) => {
    const user = authed(req)
    db.delete(favourites)
      .where(and(eq(favourites.userId, user.id), eq(favourites.soundId, req.params.soundId)))
      .run()
    return reply.code(204).send()
  })

  app.get('/api/me/pads', async (req) => {
    const user = authed(req)
    return db
      .select({ slot: pads.slot, soundId: pads.soundId, label: pads.label })
      .from(pads)
      .where(eq(pads.userId, user.id))
      .orderBy(pads.slot)
      .all()
  })

  app.put('/api/me/pads', async (req) => {
    const user = authed(req)
    const next = parseBody(z.array(pad).max(9), req.body)
    db.transaction((tx) => {
      tx.delete(pads).where(eq(pads.userId, user.id)).run()
      if (next.length)
        tx.insert(pads)
          .values(next.map((p) => ({ ...p, userId: user.id })))
          .run()
    })
    return next
  })

  app.get('/api/me/recent', async (req) => {
    const user = authed(req)
    return db
      .select({ soundId: plays.soundId })
      .from(plays)
      .where(eq(plays.userId, user.id))
      .orderBy(desc(plays.playedAt))
      .limit(RECENT_LIMIT)
      .all()
      .map((p) => p.soundId)
  })

  app.post<SoundParams>('/api/me/recent/:soundId', async (req, reply) => {
    const user = authed(req)
    db.transaction((tx) => {
      tx.insert(plays)
        .values({ userId: user.id, soundId: req.params.soundId, playedAt: Date.now() })
        .onConflictDoUpdate({
          target: [plays.userId, plays.soundId],
          set: { playedAt: Date.now() },
        })
        .run()
      const keep = tx
        .select({ soundId: plays.soundId })
        .from(plays)
        .where(eq(plays.userId, user.id))
        .orderBy(desc(plays.playedAt))
        .limit(RECENT_LIMIT)
        .all()
        .map((p) => p.soundId)
      tx.delete(plays)
        .where(and(eq(plays.userId, user.id), notInArray(plays.soundId, keep)))
        .run()
    })
    return reply.code(204).send()
  })
}
