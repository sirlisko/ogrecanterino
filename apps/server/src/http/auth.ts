import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { Db } from '../db/client.ts'
import { sessionIdFrom, userForSession, type User } from '../auth/session.ts'

declare module 'fastify' {
  interface FastifyRequest {
    user: User | null
  }
}

export function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode })
}

export function authed(req: FastifyRequest): User {
  if (!req.user) throw httpError(401, 'Not logged in')
  return req.user
}

/** Resolves the session user on every request; scopes call `requireUser` to gate access. */
export function registerUserResolver(app: FastifyInstance, db: Db) {
  app.decorateRequest('user', null)
  app.addHook('onRequest', async (req) => {
    const id = sessionIdFrom(req)
    req.user = id ? userForSession(db, id) : null
  })
}

export async function requireUser(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) return reply.code(401).send({ error: 'Not logged in' })
}

export function canEdit(user: User, ownerId: string | null) {
  return user.role === 'admin' || user.id === ownerId
}
