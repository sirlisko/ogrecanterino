import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import fastifyCookie from '@fastify/cookie'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import Fastify, { type FastifyInstance } from 'fastify'
import { authRoutes } from './auth/routes.ts'
import type { Db } from './db/client.ts'
import { registerUserResolver, requireUser } from './http/auth.ts'
import { meRoutes } from './me/routes.ts'
import { sceneRoutes } from './scenes/routes.ts'
import { soundRoutes } from './sounds/routes.ts'

export interface AppOptions {
  db: Db
  audioDir: string
  bannerDir: string
  sessionSecret: string
  webDist?: string
  /** Protected routes registered by optional features (e.g. the Discord bridge). */
  extraRoutes?: (app: FastifyInstance) => Promise<void>
  logger?: boolean
}

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

export async function buildApp(opts: AppOptions) {
  const app = Fastify({ logger: opts.logger ?? false, trustProxy: true })
  await app.register(fastifyCookie, { secret: opts.sessionSecret })
  await app.register(fastifyMultipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } })
  await app.register(fastifyWebsocket)
  registerUserResolver(app, opts.db)

  await app.register(authRoutes, { db: opts.db })
  await app.register(async (scope) => {
    scope.addHook('onRequest', requireUser)
    await scope.register(meRoutes, { db: opts.db })
    await scope.register(soundRoutes, { db: opts.db, audioDir: opts.audioDir })
    await scope.register(sceneRoutes, { db: opts.db, bannerDir: opts.bannerDir })
    if (opts.extraRoutes) await opts.extraRoutes(scope)
  })

  if (opts.webDist && existsSync(opts.webDist)) {
    const root = resolve(opts.webDist)
    await app.register(fastifyStatic, { root, wildcard: false })
    app.setNotFoundHandler((req, reply) => {
      const isApi = /^\/(api|audio|banners|auth)\//.test(req.url)
      return isApi
        ? reply.code(404).send({ error: 'Not found' })
        : reply.sendFile('index.html', root)
    })
  }
  return app
}
