import type { FastifyStaticOptions } from '@fastify/static'

/**
 * For files behind the login whose names never change. `private` because a shared cache or CDN
 * would otherwise be allowed to serve them to people who aren't logged in.
 */
export const privateImmutableFiles = {
  cacheControl: false,
  setHeaders: (reply) => reply.header('cache-control', 'private, max-age=31536000, immutable'),
} satisfies Partial<FastifyStaticOptions>
