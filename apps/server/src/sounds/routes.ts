import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import fastifyStatic from '@fastify/static'
import { soundUpload } from '@ogre/shared'
import { asc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { Db } from '../db/client.ts'
import { sounds } from '../db/schema.ts'
import { authed, canEdit, httpError } from '../http/auth.ts'
import { parseBody } from '../http/body.ts'
import { toSound } from './repo.ts'
import { storeAudioUpload } from './upload.ts'
import { soundUsage } from './usage.ts'

const soundPatch = soundUpload.partial()

function fieldValue(field: unknown): string | undefined {
  const f = Array.isArray(field) ? field[0] : field
  return f && typeof f === 'object' && 'value' in f && typeof f.value === 'string'
    ? f.value
    : undefined
}

export async function soundRoutes(
  app: FastifyInstance,
  { db, audioDir }: { db: Db; audioDir: string },
) {
  await app.register(fastifyStatic, {
    root: audioDir,
    prefix: '/audio/',
    decorateReply: false,
    // Stored filenames are unique per upload, so the content behind a URL never changes.
    immutable: true,
    maxAge: '365d',
  })

  app.get('/api/sounds', async () =>
    db.select().from(sounds).orderBy(asc(sounds.title)).all().map(toSound),
  )

  app.post('/api/sounds', async (req, reply) => {
    const user = authed(req)
    const file = await req.file()
    if (!file) throw httpError(400, 'Missing file')
    const meta = parseBody(soundUpload, {
      title: fieldValue(file.fields.title),
      artist: fieldValue(file.fields.artist),
      tags: (fieldValue(file.fields.tags) ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      category: fieldValue(file.fields.category),
    })
    const stored = await storeAudioUpload(file, audioDir)
    const row = db
      .insert(sounds)
      .values({ ...meta, ...stored, uploadedBy: user.id })
      .returning()
      .get()
    return reply.code(201).send(toSound(row))
  })

  app.patch<{ Params: { id: string } }>('/api/sounds/:id', async (req) => {
    const user = authed(req)
    const existing = db.select().from(sounds).where(eq(sounds.id, req.params.id)).get()
    if (!existing) throw httpError(404, 'Sound not found')
    if (!canEdit(user, existing.uploadedBy)) throw httpError(403, 'Not your sound')
    const patch = parseBody(soundPatch, req.body)
    return toSound(db.update(sounds).set(patch).where(eq(sounds.id, existing.id)).returning().get())
  })

  app.get<{ Params: { id: string } }>('/api/sounds/:id/usage', async (req) =>
    soundUsage(db, authed(req), req.params.id),
  )

  app.delete<{ Params: { id: string } }>('/api/sounds/:id', async (req, reply) => {
    const user = authed(req)
    const existing = db.select().from(sounds).where(eq(sounds.id, req.params.id)).get()
    if (!existing) throw httpError(404, 'Sound not found')
    if (!canEdit(user, existing.uploadedBy)) throw httpError(403, 'Not your sound')
    db.delete(sounds).where(eq(sounds.id, existing.id)).run()
    await rm(join(audioDir, existing.filename), { force: true })
    return reply.code(204).send()
  })
}
