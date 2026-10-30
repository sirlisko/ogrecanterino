import { randomBytes } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import fastifyStatic from '@fastify/static'
import { sceneInput } from '@ogre/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Db } from '../db/client.ts'
import { scenes } from '../db/schema.ts'
import { authed, canEdit, httpError } from '../http/auth.ts'
import { parseBody } from '../http/body.ts'
import { importBardicScenes } from './importBardic.ts'
import { getVisibleScene, listScenes, ownerName, toScene } from './repo.ts'

const EXPORT_FORMAT = 'ogre-scene/v1'
const BANNER_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

const importBody = z.union([
  z.object({ format: z.literal(EXPORT_FORMAT), scene: sceneInput }),
  z.array(z.unknown()).min(1),
])

type Params = { Params: { id: string } }

export async function sceneRoutes(
  app: FastifyInstance,
  { db, bannerDir }: { db: Db; bannerDir: string },
) {
  await mkdir(bannerDir, { recursive: true })
  await app.register(fastifyStatic, {
    root: bannerDir,
    prefix: '/banners/',
    decorateReply: false,
    immutable: true,
    maxAge: '365d',
  })

  const editable = (req: Parameters<typeof authed>[0], id: string) => {
    const user = authed(req)
    const row = getVisibleScene(db, user, id)
    if (!canEdit(user, row.ownerId)) throw httpError(403, 'Only the owner can change this scene')
    return row
  }

  const insert = (ownerId: string, input: z.infer<typeof sceneInput>) => {
    const row = db
      .insert(scenes)
      .values({ ...input, ownerId })
      .returning()
      .get()
    return toScene(row, ownerName(db, ownerId))
  }

  app.get('/api/scenes', async (req) => listScenes(db, authed(req)))

  app.get<Params>('/api/scenes/:id', async (req) => {
    const row = getVisibleScene(db, authed(req), req.params.id)
    return toScene(row, ownerName(db, row.ownerId))
  })

  app.post('/api/scenes', async (req, reply) => {
    const user = authed(req)
    return reply.code(201).send(insert(user.id, parseBody(sceneInput, req.body)))
  })

  app.put<Params>('/api/scenes/:id', async (req) => {
    const row = editable(req, req.params.id)
    const input = parseBody(sceneInput, req.body)
    const updated = db
      .update(scenes)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(scenes.id, row.id))
      .returning()
      .get()
    return toScene(updated, ownerName(db, updated.ownerId))
  })

  app.delete<Params>('/api/scenes/:id', async (req, reply) => {
    const row = editable(req, req.params.id)
    db.delete(scenes).where(eq(scenes.id, row.id)).run()
    if (row.bannerPath) await rm(join(bannerDir, row.bannerPath), { force: true })
    return reply.code(204).send()
  })

  app.post<Params>('/api/scenes/:id/duplicate', async (req, reply) => {
    const user = authed(req)
    const { name, tags, combatSceneId, data } = getVisibleScene(db, user, req.params.id)
    const copy = insert(user.id, {
      name: `${name} (copy)`,
      tags,
      combatSceneId,
      data,
      visibility: 'private',
    })
    return reply.code(201).send(copy)
  })

  app.get<Params>('/api/scenes/:id/export', async (req, reply) => {
    const { name, tags, combatSceneId, data, visibility } = getVisibleScene(
      db,
      authed(req),
      req.params.id,
    )
    const filename = `${name.replace(/[^\w -]/g, '').trim() || 'scene'}.json`
    reply.header('content-disposition', `attachment; filename="${filename}"`)
    return { format: EXPORT_FORMAT, scene: { name, tags, combatSceneId, data, visibility } }
  })

  app.post('/api/scenes/import', async (req, reply) => {
    const user = authed(req)
    const body = parseBody(importBody, req.body)
    if (Array.isArray(body)) {
      const report = importBardicScenes(db, body, user.id, 'private')
      return reply.code(201).send(report)
    }
    const created = insert(user.id, { ...body.scene, visibility: 'private', combatSceneId: null })
    return reply.code(201).send({ imported: [created.name], missing: [] })
  })

  app.post<Params>('/api/scenes/:id/banner', async (req) => {
    const row = editable(req, req.params.id)
    const file = await req.file()
    const ext = extname(file?.filename ?? '').toLowerCase()
    if (!file || !BANNER_EXTS.has(ext))
      throw httpError(415, 'Banner must be a jpg, png, webp or avif image')
    const filename = `${row.id}_${randomBytes(4).toString('hex')}${ext}`
    await pipeline(file.file, createWriteStream(join(bannerDir, filename)))
    if (file.file.truncated) {
      await rm(join(bannerDir, filename))
      throw httpError(413, 'Image too large')
    }
    if (row.bannerPath) await rm(join(bannerDir, row.bannerPath), { force: true })
    const updated = db
      .update(scenes)
      .set({ bannerPath: filename })
      .where(eq(scenes.id, row.id))
      .returning()
      .get()
    return toScene(updated, ownerName(db, updated.ownerId))
  })
}
