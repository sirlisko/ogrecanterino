import { randomBytes } from 'node:crypto'
import { eq, lt } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Db } from '../db/client.ts'
import { sessions, users } from '../db/schema.ts'

export const SESSION_COOKIE = 'ogre_sid'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type User = typeof users.$inferSelect

export function createSession(db: Db, userId: string): string {
  const id = randomBytes(32).toString('base64url')
  db.delete(sessions).where(lt(sessions.expiresAt, Date.now())).run()
  db.insert(sessions)
    .values({ id, userId, expiresAt: Date.now() + SESSION_TTL_MS })
    .run()
  return id
}

export function deleteSession(db: Db, id: string) {
  db.delete(sessions).where(eq(sessions.id, id)).run()
}

export function userForSession(db: Db, id: string): User | null {
  const row = db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .get()
  return row && row.expiresAt > Date.now() ? row.user : null
}

export function setSessionCookie(reply: FastifyReply, id: string, secure: boolean) {
  reply.setCookie(SESSION_COOKIE, id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    signed: true,
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function sessionIdFrom(request: FastifyRequest): string | null {
  const raw = request.cookies[SESSION_COOKIE]
  if (!raw) return null
  const unsigned = request.unsignCookie(raw)
  return unsigned.valid ? unsigned.value : null
}
