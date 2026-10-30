import { collectionInput } from '@ogre/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { Db } from '../db/client.ts'
import { collections } from '../db/schema.ts'
import { authed, canEdit, httpError } from '../http/auth.ts'
import { parseBody } from '../http/body.ts'
import { getCollection, listCollections, saveCollection } from './repo.ts'

type Params = { Params: { id: string } }

export async function collectionRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const editable = (req: Parameters<typeof authed>[0], id: string) => {
    const user = authed(req)
    const existing = getCollection(db, user, id)
    if (!canEdit(user, existing.ownerId))
      throw httpError(403, 'Only the owner can change this collection')
    return { user, existing }
  }

  app.get('/api/collections', async (req) => listCollections(db, authed(req)))

  app.get<Params>('/api/collections/:id', async (req) =>
    getCollection(db, authed(req), req.params.id),
  )

  app.post('/api/collections', async (req, reply) => {
    const user = authed(req)
    const id = saveCollection(db, parseBody(collectionInput, req.body), { ownerId: user.id })
    return reply.code(201).send(getCollection(db, user, id))
  })

  app.put<Params>('/api/collections/:id', async (req) => {
    const { user, existing } = editable(req, req.params.id)
    saveCollection(db, parseBody(collectionInput, req.body), { id: existing.id })
    return getCollection(db, user, existing.id)
  })

  app.delete<Params>('/api/collections/:id', async (req, reply) => {
    const { existing } = editable(req, req.params.id)
    db.delete(collections).where(eq(collections.id, existing.id)).run()
    return reply.code(204).send()
  })
}
